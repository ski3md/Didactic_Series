#!/usr/bin/env python3
"""
Research Pipeline for Pathology Image Annotation
-----------------------------------------------
A research-grade pipeline for processing pathology images with:
- Original files preservation
- iCloud Drive synchronization
- Image validation and compression
- OpenAI annotation and captioning
- Research provenance outputs

Author: Askia K. Dunnon
Version: Research 1.0
"""

import os
import json
import csv
import asyncio
import aiofiles
import base64
import hashlib
import logging
import time
import signal
import sys
import argparse
import imghdr
import traceback
import subprocess
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from PIL import Image, ImageStat
from tqdm.asyncio import tqdm
from openai import AsyncOpenAI, OpenAI, OpenAIError, RateLimitError
import backoff

# ---------------------------------------------------------------------
# CONFIGURATION
# ---------------------------------------------------------------------
@dataclass
class Config:
    """Configuration settings for the research pipeline."""
    root_dir: str = "/Users/skim4/Documents/GitHub/FellowshipWorkflows/Didactic_Series/assets/images"
    output_dir: str = "annotated_images"
    captions_file: str = "captions.csv"
    manifest_file: str = "manifest.json"
    report_file: str = "processing_report.json"
    checkpoint_file: str = "checkpoint.json"
    max_concurrent: int = 4
    retry_limit: int = 3
    valid_extensions: set = None
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model_annotation: str = "gpt-image-1"
    model_classification: str = "gpt-4.1-mini"
    model_caption: str = "gpt-4.1-mini"
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    target_size: Tuple[int, int] = (1024, 1024)  # Target dimensions
    min_file_size: int = 1024  # 1KB minimum
    icloud_sync_timeout: int = 120
    checkpoint_interval: int = 10
    log_level: str = "INFO"
    enable_icloud_sync: bool = True

    def __post_init__(self):
        if self.valid_extensions is None:
            self.valid_extensions = {".jpg", ".jpeg", ".png"}
        
        # Load from environment variables
        self.root_dir = os.environ.get("ROOT_DIR", self.root_dir)
        self.output_dir = os.environ.get("OUTPUT_DIR", self.output_dir)
        self.api_key = os.environ.get("OPENAI_API_KEY", self.api_key)
        self.api_base = os.environ.get("OPENAI_API_BASE", self.api_base)
        self.log_level = os.environ.get("LOG_LEVEL", self.log_level)
        self.max_concurrent = int(os.environ.get("MAX_CONCURRENT", self.max_concurrent))
        self.retry_limit = int(os.environ.get("RETRY_LIMIT", self.retry_limit))

# ---------------------------------------------------------------------
# LOGGER
# ---------------------------------------------------------------------
def setup_logging(log_level: str, log_file: Optional[str] = None):
    """Set up structured logging with file and console handlers."""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    
    if log_file:
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
            
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(log_format))
        logging.getLogger().addHandler(file_handler)
    
    return logging.getLogger("research_pipeline")

# ---------------------------------------------------------------------
# ICLOUD SYNC MANAGER
# ---------------------------------------------------------------------
class ICloudSyncManager:
    """Ensure iCloud Drive files are downloaded before processing."""
    
    @staticmethod
    def is_placeholder(path: Path) -> bool:
        """Check if a file is an iCloud placeholder."""
        try:
            res = subprocess.run(
                ["xattr", "-p", "com.apple.iCloud", str(path)],
                capture_output=True, text=True
            )
            return res.returncode == 0
        except Exception:
            return False

    @staticmethod
    def ensure_downloaded(path: Path, timeout: int = 120, logger=None) -> bool:
        """Force download of iCloud placeholder file."""
        try:
            if not path.exists():
                if logger:
                    logger.warning(f"File does not exist: {path}")
                return False
            
            if not ICloudSyncManager.is_placeholder(path):
                size = path.stat().st_size
                if size > 0:
                    return True
                else:
                    if logger:
                        logger.warning(f"File exists but is empty: {path}")
                    return False
            
            if logger:
                logger.info(f"☁️  Triggering iCloud download for {path.name}")
            
            subprocess.run(["brctl", "download", str(path)], check=False)
            
            start = time.time()
            check_interval = 2
            last_size = 0
            stable_count = 0
            
            while time.time() - start < timeout:
                if path.exists():
                    current_size = path.stat().st_size
                    
                    if current_size > last_size:
                        last_size = current_size
                        stable_count = 0
                    elif current_size == last_size and current_size > 0:
                        stable_count += 1
                        if stable_count >= 3:
                            if not ICloudSyncManager.is_placeholder(path):
                                if logger:
                                    logger.info(f"✅ iCloud download complete: {path.name} ({current_size} bytes)")
                                return True
                    elif current_size == 0:
                        pass
                
                time.sleep(check_interval)
            
            if path.exists() and not ICloudSyncManager.is_placeholder(path) and path.stat().st_size > 0:
                if logger:
                    logger.info(f"✅ iCloud download complete: {path.name} ({path.stat().st_size} bytes)")
                return True
            else:
                if logger:
                    logger.warning(f"⌛ Timed out waiting for iCloud: {path.name}")
                return False
                
        except Exception as e:
            if logger:
                logger.warning(f"⚠️ iCloud sync failed for {path}: {e}")
            return False

    @staticmethod
    def preload_icloud_folder(root: Path, logger, max_workers: int = 4):
        """Pre-sync all image files before processing."""
        logger.info("☁️  Preloading iCloud assets ...")
        files = list(root.rglob("*.[pj][pn]g"))
        if not files:
            logger.info("No image files found for iCloud sync.")
            return 0
        
        start_time = time.time()
        success_count = 0
        failed_count = 0
        
        for file_path in files:
            if ICloudSyncManager.ensure_downloaded(file_path, logger=logger):
                success_count += 1
            else:
                failed_count += 1
        
        sync_time = time.time() - start_time
        logger.info(f"✅ iCloud pre-sync complete: {success_count}/{len(files)} files downloaded, {failed_count} failed in {sync_time:.1f}s")
        return sync_time

# ---------------------------------------------------------------------
# IMAGE VALIDATOR
# ---------------------------------------------------------------------
class ImageValidator:
    """Validate and process images for research use."""
    
    @staticmethod
    def is_valid_image(img_path: Path, config: Config, logger=None) -> bool:
        """Validate image and ensure it meets research requirements."""
        if img_path.suffix.lower() not in config.valid_extensions or not img_path.exists():
            return False
        
        try:
            size = img_path.stat().st_size
            if size < config.min_file_size:
                if logger:
                    logger.warning(f"⚠️  File too small: {img_path.name} ({size} bytes)")
                return False
            if size > config.max_file_size:
                if logger:
                    logger.warning(f"⚠️  File too large: {img_path.name} ({size} bytes)")
                return False
        except Exception as e:
            if logger:
                logger.warning(f"⚠️  Failed to check size of {img_path.name}: {e}")
            return False
        
        # Check if it's an iCloud placeholder and wait for download
        if config.enable_icloud_sync:
            start = time.time()
            while ICloudSyncManager.is_placeholder(img_path):
                if logger:
                    logger.info(f"☁️  Waiting for iCloud: {img_path.name}")
                ICloudSyncManager.ensure_downloaded(img_path, config.icloud_sync_timeout, logger)
                time.sleep(2)
                if time.time() - start > config.icloud_sync_timeout:
                    if logger:
                        logger.warning(f"⌛ Timed out waiting for {img_path.name}")
                    return False
        
        try:
            with Image.open(img_path) as im:
                im.verify()
            return True
        except Exception as e:
            if logger:
                logger.warning(f"⚠️  Image validation failed for {img_path.name}: {e}")
            return False

    @staticmethod
    def process_image(img_path: Path, config: Config, logger=None) -> Optional[Path]:
        """Process image: resize, convert to RGB, and save as new file."""
        try:
            with Image.open(img_path) as img:
                # Convert to RGB if needed
                if img.mode != "RGB":
                    img = img.convert("RGB")
                
                # Resize if needed
                if img.size != config.target_size:
                    img = img.resize(config.target_size, Image.LANCZOS)
                
                # Create output path
                output_dir = Path(config.output_dir)
                output_dir.mkdir(parents=True, exist_ok=True)
                
                # Create new filename
                entity = img_path.parent.name
                stem = img_path.stem
                output_path = output_dir / f"{entity}_{stem}_annotated.jpg"
                
                # Save processed image
                img.save(output_path, "JPEG", quality=95)
                
                if logger:
                    logger.info(f"✅ Processed image: {img_path.name} -> {output_path.name}")
                
                return output_path
        except Exception as e:
            if logger:
                logger.error(f"❌ Failed to process {img_path.name}: {e}")
            return None

    @staticmethod
    def calculate_checksum(img_path: Path) -> str:
        """Calculate SHA-256 checksum of image file."""
        sha256_hash = hashlib.sha256()
        with open(img_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()

# ---------------------------------------------------------------------
# MAPPER
# ---------------------------------------------------------------------
class Mapper:
    """Map and validate all images in the directory structure."""
    
    @staticmethod
    def read_description(entity_dir: Path):
        """Read description and labels from entity directory."""
        desc_path = entity_dir / "description.txt"
        if desc_path.exists():
            try:
                content = desc_path.read_text().strip()
                if "Labels:" in content:
                    description, labels_str = content.split("Labels:", 1)
                    labels = [lbl.strip() for lbl in labels_str.split(",")]
                else:
                    description = content
                    labels = []
            except Exception:
                description = entity_dir.name.replace("_", " ").capitalize()
                labels = []
        else:
            description = entity_dir.name.replace("_", " ").capitalize()
            labels = []
        
        return description, labels

    @staticmethod
    def map_directory(config: Config, logger) -> List[Dict[str, Any]]:
        """Map all valid images with their metadata."""
        logger.info("🗺️  Scanning for images...")
        root = Path(config.root_dir)
        image_map = []
        
        for path in root.rglob("*"):
            if path.suffix.lower() in config.valid_extensions:
                if ImageValidator.is_valid_image(path, config, logger):
                    entity = path.parent.name
                    description, labels = Mapper.read_description(path.parent)
                    
                    # Calculate checksum
                    checksum = ImageValidator.calculate_checksum(path)
                    
                    image_map.append({
                        "entity": entity,
                        "path": str(path),
                        "description": description,
                        "labels": labels,
                        "checksum": checksum,
                        "processed": False
                    })
        
        if not image_map:
            logger.error("❌ No valid images found.")
        else:
            logger.info(f"✅ Found {len(image_map)} images across {len(set(i['entity'] for i in image_map))} entities.")
        
        return image_map

# ---------------------------------------------------------------------
# ANNOTATOR
# ---------------------------------------------------------------------
class Annotator:
    """Handle OpenAI API calls for image annotation and captioning."""
    
    @staticmethod
    def make_prompt(entity, desc, labels):
        """Create a detailed prompt for image annotation."""
        label_text = f"Labels: {', '.join(labels)}." if labels else ""
        return f"""
Annotate this histopathology image using CAP/WHO standards:
- Clear arrowed lines pointing to specific features
- ALL CAPS bold labels for each feature
- Minimalist professional appearance
- Ensure annotations don't obscure important features

Entity: {entity}
Context: {desc}
{label_text}
"""

    @staticmethod
    @backoff.on_exception(backoff.expo, (OpenAIError, RateLimitError), max_tries=3, jitter=None)
    async def is_histologic(img_path: Path, config: Config, logger) -> bool:
        """Determine if an image is histologic with retry logic."""
        try:
            if imghdr.what(img_path) not in ["jpeg", "png"]:
                return False
            
            client = OpenAI(api_key=config.api_key, base_url=config.api_base)
            
            # Convert file path to proper URL format
            file_url = f"file://{img_path.as_uri()}"
            
            resp = client.chat.completions.create(
                model=config.model_classification,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": (
                                "Determine if this image is histologic (H&E, PAS, GMS, etc.) "
                                "or non-histologic (diagram, cartoon, schematic). Reply with 'histologic' or 'non-histologic'."
                            )},
                            {"type": "image_url", "image_url": {"url": file_url}}
                        ]
                    }
                ],
                max_tokens=10
            )
            
            verdict = resp.choices[0].message.content.strip().lower()
            return "histologic" in verdict
        except Exception as e:
            if logger:
                logger.warning(f"⚠️  Screening failed for {img_path.name}: {e}")
            return False

    @staticmethod
    @backoff.on_exception(backoff.expo, (OpenAIError, RateLimitError), max_tries=3, jitter=None)
    async def annotate_image(item: Dict[str, Any], config: Config, logger, sem: asyncio.Semaphore) -> Dict[str, Any]:
        """Annotate a single image with comprehensive error handling."""
        async with sem:
            if item.get("processed"):
                return item
            
            img_path = Path(item["path"])
            entity = item["entity"]
            desc = item["description"]
            labels = item["labels"]
            
            try:
                client = AsyncOpenAI(api_key=config.api_key, base_url=config.api_base)
                
                # Process image to ensure it meets requirements
                processed_path = ImageValidator.process_image(img_path, config, logger)
                if not processed_path:
                    item["error"] = "Failed to process image"
                    return item
                
                # Read processed image bytes
                with open(processed_path, "rb") as f:
                    img_bytes = f.read()
                
                # Generate annotated image
                prompt = Annotator.make_prompt(entity, desc, labels)
                
                r = await client.images.generate(
                    model=config.model_annotation,
                    prompt=prompt,
                    image=img_bytes,
                    size="1024x1024"
                )
                
                # Save annotated image
                output_dir = Path(config.output_dir)
                annotated_path = output_dir / f"{entity}_{img_path.stem}_annotated.png"
                
                with open(annotated_path, "wb") as f:
                    f.write(base64.b64decode(r.data[0].b64_json))
                
                # Generate caption
                t = await client.chat.completions.create(
                    model=config.model_caption,
                    messages=[{"role": "user", "content": f"Describe microscopic features of {entity}."}]
                )
                caption = t.choices[0].message.content.strip()
                
                # Save caption
                caption_path = output_dir / f"{entity}_{img_path.stem}_desc.txt"
                with open(caption_path, "w") as f:
                    f.write(caption)
                
                # Update item with processing info
                item["processed"] = True
                item["annotated_path"] = str(annotated_path)
                item["caption_path"] = str(caption_path)
                item["caption"] = caption
                
                if logger:
                    logger.info(f"✅ Annotated: {img_path.name}")
                
                return item
                
            except Exception as e:
                item["error"] = str(e)
                if logger:
                    logger.error(f"⚠️ Failed {img_path.name}: {e}")
                return item

# ---------------------------------------------------------------------
# REPORTER
# ---------------------------------------------------------------------
class Reporter:
    """Generate research provenance outputs."""
    
    @staticmethod
    def generate_manifest(image_map: List[Dict[str, Any]], output_dir: Path, logger):
        """Generate manifest.json with provenance information."""
        manifest = {
            "generated_at": datetime.now().isoformat(),
            "total_images": len(image_map),
            "images": []
        }
        
        for item in image_map:
            manifest["images"].append({
                "entity": item["entity"],
                "original_path": item["path"],
                "description": item["description"],
                "labels": item["labels"],
                "checksum": item["checksum"],
                "processed": item.get("processed", False),
                "annotated_path": item.get("annotated_path"),
                "caption_path": item.get("caption_path"),
                "caption": item.get("caption"),
                "error": item.get("error")
            })
        
        manifest_path = output_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(manifest, f, indent=2)
        
        logger.info(f"📄 Manifest saved to {manifest_path}")
    
    @staticmethod
    def generate_report(stats: Dict[str, Any], output_dir: Path, logger):
        """Generate processing report."""
        report_path = output_dir / "processing_report.json"
        with open(report_path, "w") as f:
            json.dump(stats, f, indent=2)
        
        logger.info(f"📄 Report saved to {report_path}")

# ---------------------------------------------------------------------
# CHECKPOINT MANAGER
# ---------------------------------------------------------------------
class CheckpointManager:
    """Manage processing checkpoints for resumption."""
    
    def __init__(self, checkpoint_file: str):
        self.checkpoint_file = checkpoint_file
    
    def save_checkpoint(self, image_map: List[Dict[str, Any]], stats: Dict[str, Any]):
        """Save current processing state."""
        try:
            checkpoint_data = {
                "timestamp": time.time(),
                "stats": stats,
                "images": image_map
            }
            
            with open(self.checkpoint_file, 'w') as f:
                json.dump(checkpoint_data, f, indent=2)
            
            logging.info(f"Checkpoint saved to {self.checkpoint_file}")
        except Exception as e:
            logging.error(f"Failed to save checkpoint: {e}")
    
    def load_checkpoint(self) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Load processing state from checkpoint."""
        if not os.path.exists(self.checkpoint_file):
            return [], {}
        
        try:
            with open(self.checkpoint_file, 'r') as f:
                checkpoint_data = json.load(f)
            
            return checkpoint_data.get("images", []), checkpoint_data.get("stats", {})
        except Exception as e:
            logging.error(f"Failed to load checkpoint: {e}")
            return [], {}

# ---------------------------------------------------------------------
# RUNNER
# ---------------------------------------------------------------------
class Runner:
    """Main execution controller."""
    
    def __init__(self, config: Config):
        self.config = config
        self.logger = setup_logging(config.log_level)
        self.checkpoint_manager = CheckpointManager(os.path.join(config.output_dir, config.checkpoint_file))
        self.stats = {
            "total_images": 0,
            "processed_images": 0,
            "failed_images": 0,
            "deleted_nonhistologic": 0,
            "start_time": 0,
            "end_time": 0
        }
    
    async def process_batch(self, batch: List[Dict[str, Any]], sem: asyncio.Semaphore):
        """Process a batch of images."""
        tasks = [Annotator.annotate_image(item, self.config, self.logger, sem) for item in batch]
        
        results = []
        for coro in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="Processing images"):
            result = await coro
            results.append(result)
        
        # Update statistics
        for result in results:
            self.stats["total_images"] += 1
            if result.get("processed"):
                self.stats["processed_images"] += 1
            elif result.get("error"):
                self.stats["failed_images"] += 1
        
        return results
    
    async def process_all(self, image_map: List[Dict[str, Any]]):
        """Process all images with checkpointing and progress tracking."""
        self.stats["start_time"] = time.time()
        
        # Initialize captions file
        captions_file = Path(self.config.output_dir) / self.config.captions_file
        os.makedirs(self.config.output_dir, exist_ok=True)
        
        async with aiofiles.open(captions_file, "w") as f:
            await f.write("Filename,Entity,Labels,Description\n")
        
        # Filter valid histologic images
        valid_images = []
        for item in image_map:
            if await Annotator.is_histologic(Path(item["path"]), self.config, self.logger):
                valid_images.append(item)
            else:
                self.stats["deleted_nonhistologic"] += 1
        
        self.logger.info(f"📸 Valid histologic: {len(valid_images)} / {len(image_map)}")
        
        if not valid_images:
            self.logger.warning("No histologic images detected.")
            return
        
        # Process images in batches with checkpointing
        batch_size = self.config.checkpoint_interval
        completed_batches = 0
        
        try:
            for i in range(0, len(valid_images), batch_size):
                batch = valid_images[i:i + batch_size]
                self.logger.info(f"Processing batch {i // batch_size + 1}/{(len(valid_images) - 1) // batch_size + 1}")
                
                sem = asyncio.Semaphore(self.config.max_concurrent)
                processed_batch = await self.process_batch(batch, sem)
                
                # Update image map with processed batch
                for j, item in enumerate(processed_batch):
                    valid_images[i + j] = item
                
                # Save checkpoint
                self.checkpoint_manager.save_checkpoint(valid_images, self.stats)
                completed_batches += 1
        
        finally:
            self.stats["end_time"] = time.time()
            
            # Generate reports
            Reporter.generate_manifest(valid_images, Path(self.config.output_dir), self.logger)
            Reporter.generate_report(self.stats, Path(self.config.output_dir), self.logger)
            
            # Update captions CSV
            async with aiofiles.open(captions_file, "a") as f:
                for item in valid_images:
                    if item.get("processed"):
                        path = Path(item["path"])
                        await f.write(f"{path.name},{item['entity']},{';'.join(item['labels'])},{item.get('caption', '')}\n")
            
            self.logger.info(f"✅ Pipeline completed successfully")

# ---------------------------------------------------------------------
# COMMAND LINE INTERFACE
# ---------------------------------------------------------------------
def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Research Pipeline for Pathology Image Annotation")
    parser.add_argument("--root-dir", help="Root directory containing images")
    parser.add_argument("--output-dir", help="Output directory for processed images")
    parser.add_argument("--resume", action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--log-level", choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="Logging level")
    parser.add_argument("--max-concurrent", type=int, help="Maximum concurrent processing")
    return parser.parse_args()

# ---------------------------------------------------------------------
# MAIN EXECUTION
# ---------------------------------------------------------------------
def main():
    """Main execution function."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Load configuration
    config = Config()
    if args.root_dir:
        config.root_dir = args.root_dir
    if args.output_dir:
        config.output_dir = args.output_dir
    if args.log_level:
        config.log_level = args.log_level
    if args.max_concurrent:
        config.max_concurrent = args.max_concurrent
    
    # Create output directory
    os.makedirs(config.output_dir, exist_ok=True)
    
    # Set up logging
    log_file = os.path.join(config.output_dir, f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    logger = setup_logging(config.log_level, log_file)
    
    logger.info("🚀 Starting Research Pipeline for Pathology Image Annotation")
    
    # Initialize runner
    runner = Runner(config)
    
    # Pre-sync iCloud files
    icloud_sync_time = ICloudSyncManager.preload_icloud_folder(
        Path(config.root_dir), logger
    )
    
    # Map directory or load from checkpoint
    if args.resume:
        logger.info("Resuming from checkpoint...")
        image_map, stats = runner.checkpoint_manager.load_checkpoint()
        if not image_map:
            logger.warning("No valid checkpoint found, starting fresh...")
            image_map = Mapper.map_directory(config, logger)
    else:
        image_map = Mapper.map_directory(config, logger)
    
    if not image_map:
        logger.error("❌ No images detected. Exiting.")
        return
    
    # Process images
    try:
        asyncio.run(runner.process_all(image_map))
    except KeyboardInterrupt:
        logger.warning("Interrupted by user.")
    except Exception as e:
        logger.exception(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()