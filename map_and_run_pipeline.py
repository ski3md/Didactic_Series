#!/usr/bin/env python3
"""
Commercial Grade Pathology Image Annotation Pipeline
---------------------------------------------------
A comprehensive, production-ready solution for pathology image processing with:
- iCloud Drive integration and synchronization
- Robust image validation and repair
- Async batch processing with OpenAI integration
- Checkpoint-based recovery system
- Email notifications
- Comprehensive reporting
- Resource monitoring
- Security scanning
- Auto-restart capabilities

Author: Askia K. Dunnon
Version: 5.0 (Commercial Grade - Fixed)
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
import shutil
import psutil
import backoff
import urllib.parse
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
from dataclasses import dataclass, asdict
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from collections import defaultdict
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from PIL import Image
from tqdm.asyncio import tqdm
from openai import AsyncOpenAI, OpenAI, OpenAIError, RateLimitError

# Optional imports with graceful fallback
try:
    import yaml
    YAML_AVAILABLE = True
except ImportError:
    YAML_AVAILABLE = False
    print("Warning: PyYAML not installed. YAML configuration files won't be supported.")
    print("To install, run: pip install PyYAML")

try:
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
    GOOGLE_OAUTH_AVAILABLE = True
except ImportError:
    GOOGLE_OAUTH_AVAILABLE = False
    Credentials = Request = InstalledAppFlow = build = HttpError = None
    print("Warning: Google Gmail OAuth libraries not installed. Email notifications won't be available.")
    print("To install, run: pip install google-auth google-auth-oauthlib google-api-python-client")

try:
    from prometheus_client import start_http_server, Counter as PROM_COUNTER, Histogram as PROM_HISTOGRAM, Gauge as PROM_GAUGE
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    class DummyMetric:
        def inc(self, *args, **kwargs): pass
        def set(self, *args, **kwargs): pass
        def observe(self, *args, **kwargs): pass
        def labels(self, *args, **kwargs): return self
    PROM_COUNTER = PROM_HISTOGRAM = PROM_GAUGE = DummyMetric
    print("⚠️  prometheus_client not installed — metrics disabled.")

try:
    import sentry_sdk
    SENTRY_AVAILABLE = True
except ImportError:
    SENTRY_AVAILABLE = False
    print("Warning: sentry-sdk not installed. Error tracking won't be available.")
    print("To install, run: pip install sentry-sdk")

# Prometheus metrics
PROCESSED_IMAGES = PROM_COUNTER('processed_images_total', 'Total processed images', ['status'])
PROCESSING_TIME = PROM_HISTOGRAM('image_processing_seconds', 'Time spent processing images')
ACTIVE_PROCESSES = PROM_GAUGE('active_processes', 'Number of active processes')
MEMORY_USAGE = PROM_GAUGE('memory_usage_bytes', 'Current memory usage in bytes')

# Set up Sentry for error tracking if available
SENTRY_DSN = os.environ.get('SENTRY_DSN')
if SENTRY_DSN and SENTRY_AVAILABLE:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.1,
    )

# ---------------------------------------------------------------------
# CONFIGURATION MANAGEMENT
# ---------------------------------------------------------------------
@dataclass
class Config:
    """Configuration class with default values and environment variable support."""
    root_dir: str = "/Users/skim4/Documents/GitHub/FellowshipWorkflows/Didactic_Series/assets/images"
    output_dir: str = "annotated_images"
    log_dir: str = "logs"
    captions_file: str = "captions.csv"
    map_path: Optional[str] = None
    checkpoint_file: str = "checkpoint.json"
    max_concurrent: int = 4
    retry_limit: int = 3
    valid_extensions: set = None
    api_key: Optional[str] = None
    api_base: Optional[str] = None
    model_annotation: str = "gpt-image-1"
    model_classification: str = "gpt-4.1-mini"
    model_caption: str = "gpt-4.1-mini"
    adaptive_throttling: bool = True
    max_memory_mb: int = 4096
    image_size_limit: int = 10 * 1024 * 1024
    enable_checksum: bool = True
    enable_backup: bool = True
    enable_security_scan: bool = True
    log_level: str = "INFO"
    enable_monitoring: bool = True
    monitoring_port: int = 8000
    checkpoint_interval: int = 10
    output_versioning: bool = False
    email_recipient: str = "askiatablet@gmail.com"
    email_sender: str = "pathology.pipeline@local"
    auto_resume: bool = True
    max_restart_attempts: int = 3
    icloud_sync_timeout: int = 60
    enable_icloud_sync: bool = True
    repair_corrupt_images: bool = True
    gmail_app_password: Optional[str] = None
    gmail_oauth_client_secrets_file: Optional[str] = None
    gmail_oauth_token_file: Optional[str] = None
    gmail_oauth_scopes: Optional[List[str]] = None
    gmail_oauth_auto_authorize: bool = False

    def __post_init__(self):
        if self.valid_extensions is None:
            self.valid_extensions = {".jpg", ".jpeg", ".png"}
        if self.map_path is None:
            self.map_path = os.path.join(self.root_dir, "image_map.json")
        
        # Load from environment variables
        self.root_dir = os.environ.get("ROOT_DIR", self.root_dir)
        self.output_dir = os.environ.get("OUTPUT_DIR", self.output_dir)
        self.log_dir = os.environ.get("LOG_DIR", self.log_dir)
        self.api_key = os.environ.get("OPENAI_API_KEY", self.api_key)
        self.api_base = os.environ.get("OPENAI_API_BASE", self.api_base)
        self.log_level = os.environ.get("LOG_LEVEL", self.log_level)
        self.max_concurrent = int(os.environ.get("MAX_CONCURRENT", self.max_concurrent))
        self.retry_limit = int(os.environ.get("RETRY_LIMIT", self.retry_limit))
        self.email_recipient = os.environ.get("EMAIL_RECIPIENT", self.email_recipient)
        self.email_sender = os.environ.get("GMAIL_SENDER_EMAIL", os.environ.get("EMAIL_SENDER", self.email_sender))
        self.auto_resume = os.environ.get("AUTO_RESUME", "true").lower() == "true"
        self.max_restart_attempts = int(os.environ.get("MAX_RESTART_ATTEMPTS", self.max_restart_attempts))
        self.icloud_sync_timeout = int(os.environ.get("ICLOUD_SYNC_TIMEOUT", self.icloud_sync_timeout))
        self.enable_icloud_sync = os.environ.get("ENABLE_ICLOUD_SYNC", "true").lower() == "true"
        self.repair_corrupt_images = os.environ.get("REPAIR_CORRUPT_IMAGES", "true").lower() == "true"
        self.gmail_app_password = os.environ.get("GMAIL_APP_PASSWORD", self.gmail_app_password)
        self.gmail_oauth_client_secrets_file = os.environ.get("GMAIL_OAUTH_CLIENT_SECRETS_FILE", self.gmail_oauth_client_secrets_file)
        self.gmail_oauth_token_file = os.environ.get("GMAIL_OAUTH_TOKEN_FILE", self.gmail_oauth_token_file)
        scopes_env = os.environ.get("GMAIL_OAUTH_SCOPES")
        if scopes_env:
            self.gmail_oauth_scopes = [scope.strip() for scope in scopes_env.split(",") if scope.strip()]
        elif self.gmail_oauth_scopes is None:
            self.gmail_oauth_scopes = ["https://www.googleapis.com/auth/gmail.send"]
        self.gmail_oauth_auto_authorize = os.environ.get("GMAIL_OAUTH_AUTO_AUTHORIZE", "false").lower() == "true"
        
        # Load from config file if exists
        config_file = os.environ.get("CONFIG_FILE")
        if config_file and os.path.exists(config_file):
            self.load_from_file(config_file)
    
    def load_from_file(self, config_file: str):
        """Load configuration from YAML or JSON file."""
        try:
            if config_file.endswith(('.yaml', '.yml')):
                if not YAML_AVAILABLE:
                    print(f"Warning: Cannot load YAML config file {config_file} because PyYAML is not installed.")
                    return
                
                with open(config_file, 'r') as f:
                    config_data = yaml.safe_load(f)
            else:  # Assume JSON
                with open(config_file, 'r') as f:
                    config_data = json.load(f)
            
            for key, value in config_data.items():
                if hasattr(self, key):
                    setattr(self, key, value)
        except Exception as e:
            print(f"Warning: Failed to load config from {config_file}: {e}")

# ---------------------------------------------------------------------
# LOGGING SETUP
# ---------------------------------------------------------------------
def setup_logging(log_level: str, log_file: Optional[str] = None):
    """Set up structured logging with file and console handlers."""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, log_level.upper(), logging.INFO),
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
        ]
    )
    
    # Add file handler if log_file is specified
    if log_file:
        # Ensure the directory for the log file exists
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)
            
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(logging.Formatter(log_format))
        logging.getLogger().addHandler(file_handler)
    
    return logging.getLogger("pathology_pipeline")

# ---------------------------------------------------------------------
# DATA MODELS
# ---------------------------------------------------------------------
@dataclass
class ImageInfo:
    """Data model for image information."""
    entity: str
    path: str
    description: str
    labels: List[str]
    processed: bool = False
    error: Optional[str] = None
    annotation_path: Optional[str] = None
    caption_path: Optional[str] = None
    checksum: Optional[str] = None
    file_size: Optional[int] = None
    dimensions: Optional[Tuple[int, int]] = None
    last_modified: Optional[float] = None
    is_icloud_placeholder: bool = False

@dataclass
class ProcessingStats:
    """Data model for processing statistics."""
    total_images: int = 0
    processed_images: int = 0
    failed_images: int = 0
    deleted_nonhistologic: int = 0
    entity_counts: Dict[str, int] = None
    start_time: float = 0
    end_time: float = 0
    restart_attempts: int = 0
    icloud_sync_time: float = 0
    repaired_images: int = 0
    
    def __post_init__(self):
        if self.entity_counts is None:
            self.entity_counts = defaultdict(int)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        result = asdict(self)
        result["entity_counts"] = dict(self.entity_counts)
        return result

# ---------------------------------------------------------------------
# EMAIL NOTIFIER
# ---------------------------------------------------------------------
GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send"


class GmailOAuthClient:
    """Send Gmail notifications through the Gmail API using OAuth credentials."""

    def __init__(
        self,
        sender: str,
        recipient: str,
        client_secrets_file: Optional[str],
        token_file: Optional[str],
        scopes: Optional[List[str]] = None,
        auto_authorize: bool = False,
    ):
        self.sender = sender
        self.recipient = recipient
        self.client_secrets_file = client_secrets_file
        self.token_file = token_file
        if isinstance(scopes, str):
            scopes = [scope.strip() for scope in scopes.split(",") if scope.strip()]
        self.scopes = scopes or [GMAIL_SEND_SCOPE]
        self.auto_authorize = auto_authorize
        self.creds = None
        self.service = None
        self.enabled = False
        self._initialize()

    def _initialize(self):
        if not GOOGLE_OAUTH_AVAILABLE:
            logging.warning("Gmail OAuth libraries are not installed; email notifications disabled.")
            return

        self.creds = self._load_credentials()
        if not self.creds:
            return

        try:
            self.service = build("gmail", "v1", credentials=self.creds, cache_discovery=False)
            self.enabled = True
        except Exception as e:
            self.service = None
            self.enabled = False
            logging.warning(f"Gmail API client initialization failed: {e}")

    def _resolved_token_file(self) -> Optional[Path]:
        if self.token_file:
            return Path(self.token_file).expanduser()
        if self.client_secrets_file:
            return Path(self.client_secrets_file).expanduser().with_name("gmail_oauth_token.json")
        return None

    def _save_credentials(self, creds) -> None:
        token_path = self._resolved_token_file()
        if not token_path:
            return
        try:
            token_path.parent.mkdir(parents=True, exist_ok=True)
            token_path.write_text(creds.to_json(), encoding="utf-8")
        except Exception as e:
            logging.warning(f"Failed to persist Gmail OAuth token: {e}")

    def _refresh_credentials_if_needed(self, creds):
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            self._save_credentials(creds)
        return creds

    def _authorize_interactively(self):
        if not self.client_secrets_file or not os.path.exists(self.client_secrets_file):
            return None
        if not self.auto_authorize:
            logging.warning(
                "Gmail OAuth token is missing or invalid; set GMAIL_OAUTH_AUTO_AUTHORIZE=true "
                "or pass --gmail-oauth-auto-authorize to bootstrap locally."
            )
            return None
        try:
            flow = InstalledAppFlow.from_client_secrets_file(self.client_secrets_file, self.scopes)
            if sys.stdin.isatty() and sys.stdout.isatty():
                creds = flow.run_local_server(port=0)
            else:
                creds = flow.run_console()
            self._save_credentials(creds)
            return creds
        except Exception as e:
            logging.warning(f"Interactive Gmail OAuth bootstrap failed: {e}")
            return None

    def _load_credentials(self):
        token_path = self._resolved_token_file()
        creds = None

        if token_path and token_path.exists():
            try:
                creds = Credentials.from_authorized_user_file(str(token_path), self.scopes)
            except Exception as e:
                logging.warning(f"Failed to load Gmail OAuth token from {token_path}: {e}")

        if creds:
            try:
                creds = self._refresh_credentials_if_needed(creds)
            except Exception as e:
                logging.warning(f"Failed to refresh Gmail OAuth token: {e}")
                creds = None

        if creds is None and self.auto_authorize:
            creds = self._authorize_interactively()

        return creds

    def _build_message(self, subject: str, body: str, attachments: Optional[List[str]] = None) -> MIMEMultipart:
        message = MIMEMultipart()
        message["From"] = self.sender
        message["To"] = self.recipient
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain", "utf-8"))

        for file_path in attachments or []:
            if not os.path.exists(file_path):
                logging.warning(f"Skipping missing email attachment: {file_path}")
                continue
            with open(file_path, "rb") as handle:
                part = MIMEApplication(handle.read(), Name=os.path.basename(file_path))
            part["Content-Disposition"] = f'attachment; filename="{os.path.basename(file_path)}"'
            message.attach(part)

        return message

    def send_message(self, subject: str, body: str, attachments: Optional[List[str]] = None) -> bool:
        if not self.enabled or self.service is None:
            return False

        try:
            self.creds = self._refresh_credentials_if_needed(self.creds)
            if self.creds is not None:
                self.service = build("gmail", "v1", credentials=self.creds, cache_discovery=False)
        except Exception as e:
            logging.warning(f"Failed to refresh Gmail OAuth credentials before send: {e}")
            return False

        try:
            message = self._build_message(subject, body, attachments)
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode("utf-8")
            self.service.users().messages().send(userId="me", body={"raw": raw_message}).execute()
            logging.info(f"📧 Email notification sent via Gmail API to {self.recipient}")
            return True
        except HttpError as e:
            logging.warning(f"Failed to send email via Gmail API: {e}")
        except Exception as e:
            logging.warning(f"Failed to send email via Gmail API: {e}")
        return False


class EmailNotifier:
    """Send email notifications upon completion or failure."""

    def __init__(self, config: Config):
        self.recipient = config.email_recipient
        self.sender = config.email_sender
        self.gmail_app_password = config.gmail_app_password
        self.client = None

        if self.gmail_app_password:
            logging.warning("GMAIL_APP_PASSWORD is deprecated and ignored; Gmail OAuth is now required.")
        if not self.sender or "@" not in self.sender:
            logging.warning("EMAIL_SENDER must be set to the Gmail address authorized for notification sending.")
            return

        self.client = GmailOAuthClient(
            sender=self.sender,
            recipient=self.recipient,
            client_secrets_file=config.gmail_oauth_client_secrets_file,
            token_file=config.gmail_oauth_token_file,
            scopes=config.gmail_oauth_scopes,
            auto_authorize=config.gmail_oauth_auto_authorize,
        )

        if not self.client.enabled:
            logging.warning("Email notifications disabled: Gmail OAuth is not configured or could not be initialized.")

    def send_notification(self, subject: str, body: str, attachments: Optional[List[str]] = None):
        """Send an email if Gmail OAuth credentials are configured."""
        if not self.client or not self.client.enabled:
            logging.warning("Email notification disabled: no valid Gmail OAuth configuration")
            return False
        return self.client.send_message(subject, body, attachments)

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
    def ensure_downloaded(path: Path, timeout: int = 60, logger=None) -> bool:
        """Force download of iCloud placeholder file."""
        try:
            if not path.exists():
                return False
            if not ICloudSyncManager.is_placeholder(path):
                return True
            
            if logger:
                logger.info(f"☁️  Triggering iCloud download for {path.name}")
            
            subprocess.run(["brctl", "download", str(path)], check=False)
            start = time.time()
            
            while time.time() - start < timeout:
                if path.exists() and not ICloudSyncManager.is_placeholder(path):
                    return True
                time.sleep(2)
            
            if logger:
                logger.warning(f"⌛ Timed out waiting for iCloud: {path.name}")
            return False
        except Exception as e:
            if logger:
                logger.warning(f"⚠️ iCloud sync failed for {path}: {e}")
            return False

    @staticmethod
    def preload_icloud_folder(root: Path, logger, max_workers: int = 8):
        """Pre-sync all image files before processing."""
        logger.info("☁️  Preloading iCloud assets ...")
        files = list(root.rglob("*.[pj][pn]g"))
        if not files:
            logger.info("No image files found for iCloud sync.")
            return 0
        
        start_time = time.time()
        with ThreadPoolExecutor(max_workers=max_workers) as pool:
            results = list(pool.map(ICloudSyncManager.ensure_downloaded, files))
        
        success_count = sum(results)
        sync_time = time.time() - start_time
        logger.info(f"✅ iCloud pre-sync complete: {success_count}/{len(files)} files downloaded in {sync_time:.1f}s")
        return sync_time

# ---------------------------------------------------------------------
# IMAGE VALIDATOR WITH REPAIR
# ---------------------------------------------------------------------
class ImageValidator:
    """Validate and repair images with iCloud awareness."""

    @staticmethod
    def is_valid_image(img_path: Path, config: Config, logger=None) -> bool:
        """Ensure image is valid and downloaded."""
        if img_path.suffix.lower() not in config.valid_extensions or not img_path.exists():
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
            size = img_path.stat().st_size
            if size == 0 or size > config.image_size_limit:
                if logger:
                    logger.warning(f"⚠️  Invalid size: {img_path.name}")
                return False
            
            with Image.open(img_path) as im:
                im.verify()
            return True
        except Exception as e:
            if logger:
                logger.warning(f"⚠️  Image validation failed for {img_path.name}: {e}")
            
            # Try to repair the image if enabled
            if config.repair_corrupt_images:
                return ImageValidator.repair_image(img_path, logger)
            return False

    @staticmethod
    def repair_image(img_path: Path, logger=None) -> bool:
        """Attempt to repair a corrupt image."""
        try:
            with Image.open(img_path) as im:
                # Convert to RGB to fix potential color mode issues
                rgb_im = im.convert("RGB")
                fixed_path = img_path.with_suffix(".fixed.jpg")
                rgb_im.save(fixed_path, "JPEG", quality=95)
                
                # Replace the original with the fixed version
                shutil.move(str(fixed_path), str(img_path))
                
                if logger:
                    logger.info(f"🔧 Repaired corrupt image: {img_path.name}")
                return True
        except Exception as e2:
            if logger:
                logger.warning(f"❌ Unrecoverable image {img_path.name}: {e2}")
            return False

    @staticmethod
    def calculate_checksum(img_path: Path) -> str:
        """Calculate SHA-256 checksum of image file."""
        sha256_hash = hashlib.sha256()
        with open(img_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        return sha256_hash.hexdigest()
    
    @staticmethod
    def get_image_metadata(img_path: Path) -> Tuple[int, Tuple[int, int], float]:
        """Get image metadata: size, dimensions, last modified."""
        try:
            stat = img_path.stat()
            file_size = stat.st_size
            last_modified = stat.st_mtime
            
            with Image.open(img_path) as img:
                dimensions = img.size
            
            return file_size, dimensions, last_modified
        except Exception as e:
            logging.warning(f"Failed to get metadata for {img_path}: {e}")
            return 0, (0, 0), 0

# ---------------------------------------------------------------------
# RESOURCE MONITOR
# ---------------------------------------------------------------------
class ResourceMonitor:
    """Monitor system resources and adapt processing accordingly."""
    
    def __init__(self, limit_mb: int = 4096):
        self.limit = limit_mb
        self.active = False
        self.memory_history = []
        self.cpu_history = []
    
    async def start(self):
        """Start resource monitoring in background."""
        self.active = True
        asyncio.create_task(self._loop())
    
    async def _loop(self):
        """Background monitoring loop."""
        while self.active:
            try:
                mem = psutil.virtual_memory().used / (1024 * 1024)
                cpu = psutil.cpu_percent()
                
                self.memory_history.append(mem)
                self.cpu_history.append(cpu)
                
                # Keep only last 100 measurements
                if len(self.memory_history) > 100:
                    self.memory_history.pop(0)
                if len(self.cpu_history) > 100:
                    self.cpu_history.pop(0)
                
                MEMORY_USAGE.set(mem * 1024 * 1024)
            except Exception:
                pass
            await asyncio.sleep(2)
    
    def stop(self):
        """Stop resource monitoring."""
        self.active = False
    
    def is_over_limit(self):
        """Check if memory usage exceeds limit."""
        try:
            return psutil.virtual_memory().used / (1024 * 1024) > self.limit
        except Exception:
            return False
    
    def get_average_memory_usage(self) -> float:
        """Get average memory usage from history."""
        if not self.memory_history:
            return 0
        return sum(self.memory_history) / len(self.memory_history)
    
    def get_average_cpu_usage(self) -> float:
        """Get average CPU usage from history."""
        if not self.cpu_history:
            return 0
        return sum(self.cpu_history) / len(self.cpu_history)

# ---------------------------------------------------------------------
# CHECKPOINT MANAGER
# ---------------------------------------------------------------------
class CheckpointManager:
    """Manage processing checkpoints for resumption."""
    
    def __init__(self, checkpoint_file: str):
        self.checkpoint_file = checkpoint_file
    
    def save_checkpoint(self, image_map: List[ImageInfo], stats: ProcessingStats):
        """Save current processing state."""
        try:
            checkpoint_data = {
                "timestamp": time.time(),
                "stats": stats.to_dict(),
                "images": [asdict(img) for img in image_map]
            }
            
            with open(self.checkpoint_file, 'w') as f:
                json.dump(checkpoint_data, f, indent=2)
            
            logging.info(f"Checkpoint saved to {self.checkpoint_file}")
        except Exception as e:
            logging.error(f"Failed to save checkpoint: {e}")
    
    def load_checkpoint(self) -> Tuple[List[ImageInfo], ProcessingStats]:
        """Load processing state from checkpoint."""
        if not os.path.exists(self.checkpoint_file):
            return [], ProcessingStats()
        
        try:
            with open(self.checkpoint_file, 'r') as f:
                checkpoint_data = json.load(f)
            
            images = [ImageInfo(**img_data) for img_data in checkpoint_data["images"]]
            stats = ProcessingStats(**checkpoint_data["stats"])
            
            logging.info(f"Loaded checkpoint from {self.checkpoint_file}")
            return images, stats
        except Exception as e:
            logging.error(f"Failed to load checkpoint: {e}")
            return [], ProcessingStats()

# ---------------------------------------------------------------------
# SECURITY SCANNER
# ---------------------------------------------------------------------
class SecurityScanner:
    """Basic security scanning for image files."""
    
    @staticmethod
    def scan_for_malware(img_path: Path) -> bool:
        """Basic malware scan (placeholder for actual implementation)."""
        try:
            # Check for suspicious patterns in filename
            suspicious_patterns = [".exe", ".bat", ".cmd", ".scr", ".pif", ".com"]
            for pattern in suspicious_patterns:
                if pattern in img_path.name.lower():
                    logging.warning(f"Suspicious file pattern detected in {img_path}")
                    return False
            
            # Check for suspicious content in file (basic check)
            with open(img_path, "rb") as f:
                header = f.read(10)
                # Check for executable headers
                if header.startswith(b'MZ') or header.startswith(b'PE'):
                    logging.warning(f"Executable header detected in {img_path}")
                    return False
            
            return True
        except Exception as e:
            logging.warning(f"Security scan failed for {img_path}: {e}")
            return False

# ---------------------------------------------------------------------
# AUTO-RESTART MANAGER
# ---------------------------------------------------------------------
class AutoRestartManager:
    """Manages automatic restarts after crashes."""
    
    def __init__(self, max_attempts: int = 3):
        self.max_attempts = max_attempts
        self.restart_count = 0
        self.lock_file = "pipeline_restart.lock"
    
    def should_restart(self) -> bool:
        """Check if we should restart after a crash."""
        self.restart_count += 1
        return self.restart_count <= self.max_attempts
    
    def reset(self):
        """Reset the restart counter."""
        self.restart_count = 0
        if os.path.exists(self.lock_file):
            os.remove(self.lock_file)
    
    def save_state(self):
        """Save current restart state."""
        try:
            with open(self.lock_file, "w") as f:
                f.write(str(self.restart_count))
        except Exception:
            pass
    
    def load_state(self):
        """Load previous restart state."""
        try:
            if os.path.exists(self.lock_file):
                with open(self.lock_file, "r") as f:
                    self.restart_count = int(f.read().strip())
        except Exception:
            self.restart_count = 0

# ---------------------------------------------------------------------
# DIRECTORY MAPPING
# ---------------------------------------------------------------------
async def map_directory(config: Config, logger) -> List[ImageInfo]:
    """Recursively map all images with comprehensive metadata."""
    logger.info("🗺️  Scanning for images...")
    root = Path(config.root_dir)
    image_map = []
    
    for path in root.rglob("*"):
        if path.suffix.lower() in config.valid_extensions:
            # Validate image
            if not ImageValidator.is_valid_image(path, config, logger):
                continue
            
            # Security scan if enabled
            if config.enable_security_scan and not SecurityScanner.scan_for_malware(path):
                logger.warning(f"Security scan failed for {path}, skipping")
                continue
            
            entity = path.parent.name
            desc_path = path.parent / "description.txt"
            description = entity.replace("_", " ").capitalize()
            labels = []
            
            if desc_path.exists():
                try:
                    content = desc_path.read_text().strip()
                    if "Labels:" in content:
                        description, labels_str = content.split("Labels:", 1)
                        labels = [lbl.strip() for lbl in labels_str.split(",")]
                    else:
                        description = content
                except Exception as e:
                    logger.warning(f"Could not read {desc_path}: {e}")
            
            # Get image metadata
            file_size, dimensions, last_modified = ImageValidator.get_image_metadata(path)
            
            # Calculate checksum if enabled
            checksum = None
            if config.enable_checksum:
                checksum = ImageValidator.calculate_checksum(path)
            
            # Check if it's an iCloud placeholder
            is_icloud_placeholder = False
            if config.enable_icloud_sync:
                is_icloud_placeholder = ICloudSyncManager.is_placeholder(path)
            
            image_map.append(ImageInfo(
                entity=entity,
                path=str(path),
                description=description,
                labels=labels,
                checksum=checksum,
                file_size=file_size,
                dimensions=dimensions,
                last_modified=last_modified,
                is_icloud_placeholder=is_icloud_placeholder
            ))
    
    if not image_map:
        logger.error("❌ No valid images found.")
    else:
        logger.info(f"✅ Found {len(image_map)} images across {len(set(i.entity for i in image_map))} entities.")
        
        # Create output directory if it doesn't exist
        os.makedirs(config.output_dir, exist_ok=True)
        
        # Save image map
        with open(config.map_path, "w") as f:
            json.dump([asdict(i) for i in image_map], f, indent=2)
        logger.info(f"📄 Image map saved → {config.map_path}")
    
    return image_map

# ---------------------------------------------------------------------
# HISTOLOGIC CLASSIFICATION
# ---------------------------------------------------------------------
@backoff.on_exception(backoff.expo, (OpenAIError, RateLimitError), max_tries=3, jitter=None)
async def is_histologic(img_path: Path, config: Config, logger) -> bool:
    """Determine if an image is histologic with retry logic."""
    try:
        if imghdr.what(img_path) not in ["jpeg", "png"]:
            return False
        
        client = OpenAI(api_key=config.api_key, base_url=config.api_base)
        
        # Convert file path to proper URL format
        file_url = f"file://{urllib.parse.quote(str(img_path))}"
        
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
        if "histologic" in verdict:
            return True
        else:
            img_path.unlink(missing_ok=True)
            logger.info(f"🗑️  Deleted non-histologic: {img_path.name}")
            return False
    except Exception as e:
        logger.warning(f"⚠️  Screening failed for {img_path.name}: {e}")
        return False

# ---------------------------------------------------------------------
# ANNOTATION PROMPT
# ---------------------------------------------------------------------
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

# ---------------------------------------------------------------------
# ANNOTATION FUNCTION
# ---------------------------------------------------------------------
@backoff.on_exception(backoff.expo, (OpenAIError, RateLimitError), max_tries=3, jitter=None)
async def annotate_image(item: ImageInfo, config: Config, logger, resource_monitor: ResourceMonitor, sem: asyncio.Semaphore) -> ImageInfo:
    """Annotate a single image with comprehensive error handling."""
    async with sem:
        if item.processed:
            return item
        
        if config.adaptive_throttling and resource_monitor.is_over_limit():
            await asyncio.sleep(3)
        
        start_time = time.time()
        img_path = Path(item.path)
        
        try:
            client = AsyncOpenAI(api_key=config.api_key, base_url=config.api_base)
            loop = asyncio.get_event_loop()
            img_bytes = await loop.run_in_executor(None, img_path.read_bytes)
            
            output_dir = Path(config.output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate output filename with optional versioning
            version_suffix = f"_{datetime.now().strftime('%Y%m%d_%H%M%S')}" if config.output_versioning else ""
            img_out = output_dir / f"{item.entity}_{img_path.stem}_annotated{version_suffix}.png"

            # Generate annotated image
            r = await client.images.generate(
                model=config.model_annotation,
                prompt=make_prompt(item.entity, item.description, item.labels),
                image=img_bytes,
                size="1024x1024"
            )
            
            async with aiofiles.open(img_out, "wb") as f:
                await f.write(base64.b64decode(r.data[0].b64_json))

            # Generate caption
            t = await client.chat.completions.create(
                model=config.model_caption, 
                messages=[{"role": "user", "content": f"Describe microscopic features of {item.entity}."}]
            )
            caption = t.choices[0].message.content.strip()

            # Save caption
            caption_path = output_dir / f"{item.entity}_{img_path.stem}_desc{version_suffix}.txt"
            async with aiofiles.open(caption_path, "w") as f:
                await f.write(caption)

            # Update CSV
            csv_path = output_dir / config.captions_file
            async with aiofiles.open(csv_path, "a") as f:
                await f.write(f"{img_path.name},{item.entity},{';'.join(item.labels)},{caption}\n")

            # Update item with processing info
            item.annotation_path = str(img_out)
            item.caption_path = str(caption_path)
            item.processed = True
            
            logger.info(f"✅ Annotated: {img_path.name}")
            PROCESSED_IMAGES.labels(status="success").inc()
            
        except Exception as e:
            item.error = str(e)
            logger.error(f"⚠️ Failed {img_path.name}: {e}")
            PROCESSED_IMAGES.labels(status="error").inc()
        
        return item

# ---------------------------------------------------------------------
# BATCH PROCESSING WITH EFFICIENT ASYNC
# ---------------------------------------------------------------------
async def process_batch(batch: List[ImageInfo], config: Config, logger, resource_monitor: ResourceMonitor, stats: ProcessingStats):
    """Process a batch of images using efficient async processing."""
    sem = asyncio.Semaphore(config.max_concurrent)
    ACTIVE_PROCESSES.set(config.max_concurrent)
    
    # Create tasks for all images in the batch
    tasks = [annotate_image(item, config, logger, resource_monitor, sem) for item in batch]
    
    # Process with progress bar using asyncio.as_completed for better efficiency
    results = []
    for coro in tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="Processing images"):
        result = await coro
        results.append(result)
    
    # Update statistics
    for result in results:
        stats.total_images += 1
        if result.processed:
            stats.processed_images += 1
            stats.entity_counts[result.entity] += 1
        elif result.error:
            stats.failed_images += 1
    
    return results

# ---------------------------------------------------------------------
# BACKUP UTILITIES
# ---------------------------------------------------------------------
def backup_outputs(output_dir: Path, logger: logging.Logger):
    """Create a backup of output files."""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = output_dir.parent / f"backup_{timestamp}"
        
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
        
        shutil.copytree(output_dir, backup_dir)
        logger.info(f"Created backup at {backup_dir}")
    except Exception as e:
        logger.error(f"Failed to create backup: {e}")

# ---------------------------------------------------------------------
# REPORT GENERATION
# ---------------------------------------------------------------------
def generate_summary_report(stats: ProcessingStats, output_dir: Path, resource_monitor: ResourceMonitor, logger: logging.Logger):
    """Generate a comprehensive summary report."""
    report_file = output_dir / "processing_report.json"
    
    try:
        # Prepare report data
        report_data = stats.to_dict()
        report_data.update({
            "average_memory_usage_mb": resource_monitor.get_average_memory_usage(),
            "average_cpu_usage_percent": resource_monitor.get_average_cpu_usage(),
            "processing_duration_seconds": stats.end_time - stats.start_time if stats.end_time > stats.start_time else 0
        })
        
        # Save JSON report
        with open(report_file, "w") as f:
            json.dump(report_data, f, indent=2)
        
        # Generate human-readable report
        text_report_file = output_dir / "processing_report.txt"
        with open(text_report_file, "w") as f:
            f.write("====== PROCESSING SUMMARY ======\n")
            f.write(f"Start time: {datetime.fromtimestamp(stats.start_time)}\n")
            f.write(f"End time: {datetime.fromtimestamp(stats.end_time)}\n")
            f.write(f"Total duration: {stats.end_time - stats.start_time:.2f} seconds\n")
            f.write(f"Total images: {stats.total_images}\n")
            f.write(f"Processed images: {stats.processed_images}\n")
            f.write(f"Failed images: {stats.failed_images}\n")
            f.write(f"Deleted non-histologic: {stats.deleted_nonhistologic}\n")
            f.write(f"Entities represented: {len(stats.entity_counts)}\n")
            f.write(f"Average memory usage: {resource_monitor.get_average_memory_usage():.2f} MB\n")
            f.write(f"Average CPU usage: {resource_monitor.get_average_cpu_usage():.2f}%\n")
            f.write(f"Restart attempts: {stats.restart_attempts}\n")
            f.write(f"iCloud sync time: {stats.icloud_sync_time:.2f} seconds\n")
            f.write(f"Repaired images: {stats.repaired_images}\n")
            
            f.write("\nEntity breakdown:\n")
            for entity, count in stats.entity_counts.items():
                f.write(f"  - {entity}: {count}\n")
            
            f.write("===============================\n")
        
        logger.info(f"Generated summary reports at {report_file} and {text_report_file}")
    except Exception as e:
        logger.error(f"Failed to generate summary report: {e}")

# ---------------------------------------------------------------------
# MAIN PROCESS
# ---------------------------------------------------------------------
async def process_all(image_map: List[ImageInfo], config: Config, logger, checkpoint_manager: CheckpointManager):
    """Main processing function with checkpointing, monitoring, auto-resume, and notifications."""
    stats = ProcessingStats()
    stats.start_time = time.time()

    # Initialize email notifier
    notifier = EmailNotifier(config)

    # Initialize resource monitor
    resource_monitor = ResourceMonitor(config.max_memory_mb)
    if config.enable_monitoring:
        await resource_monitor.start()
        if PROMETHEUS_AVAILABLE:
            start_http_server(config.monitoring_port)
            logger.info(f"Started monitoring server on port {config.monitoring_port}")
        else:
            logger.warning("Prometheus monitoring not available. Install prometheus_client to enable.")

    # Initialize captions file
    captions_file = Path(config.output_dir) / config.captions_file
    os.makedirs(config.output_dir, exist_ok=True)
    async with aiofiles.open(captions_file, "w") as f:
        await f.write("Filename,Entity,Labels,Description\n")

    # Auto-resume from checkpoint if available
    if config.auto_resume and os.path.exists(checkpoint_manager.checkpoint_file):
        logger.info(f"🔄 Auto-resume detected: {checkpoint_manager.checkpoint_file}")
        image_map, stats = checkpoint_manager.load_checkpoint()
        if not image_map:
            logger.warning("Checkpoint invalid; starting from fresh mapping.")

    # Filter valid histologic images
    valid_images = []
    for item in image_map:
        if await is_histologic(Path(item.path), config, logger):
            valid_images.append(item)
        else:
            stats.deleted_nonhistologic += 1

    logger.info(f"📸 Valid histologic: {len(valid_images)} / {len(image_map)}")

    if not valid_images:
        msg = "No histologic images detected."
        logger.warning(msg)
        notifier.send_notification("⚠️ Pathology Pipeline – No Valid Images", msg)
        return

    # Process images in batches with checkpointing
    batch_size = config.checkpoint_interval
    completed_batches = 0
    try:
        for i in range(0, len(valid_images), batch_size):
            batch = valid_images[i:i + batch_size]
            logger.info(f"Processing batch {i // batch_size + 1}/{(len(valid_images) - 1) // batch_size + 1}")

            processed_batch = await process_batch(batch, config, logger, resource_monitor, stats)

            # Update image map with processed batch
            for j, item in enumerate(processed_batch):
                image_map[i + j] = item

            checkpoint_manager.save_checkpoint(image_map, stats)
            completed_batches += 1

            if config.enable_backup and completed_batches % 5 == 0:
                backup_outputs(Path(config.output_dir), logger)

    except Exception as e:
        logger.error(f"💥 Crash occurred: {e}")
        traceback.print_exc()
        checkpoint_manager.save_checkpoint(image_map, stats)
        notifier.send_notification(
            "❌ Pathology Pipeline Crash",
            f"The pipeline crashed:\n\n{traceback.format_exc()}",
            attachments=[checkpoint_manager.checkpoint_file]
        )
        raise

    finally:
        resource_monitor.stop()

    # Finalize statistics
    stats.end_time = time.time()

    # Generate summary report
    generate_summary_report(stats, Path(config.output_dir), resource_monitor, logger)

    # Email completion report
    try:
        report_txt = Path(config.output_dir) / "processing_report.txt"
        report_json = Path(config.output_dir) / "processing_report.json"
        notifier.send_notification(
            "✅ Pathology Pipeline Completed Successfully",
            f"Processing complete.\n\nProcessed: {stats.processed_images}\nFailed: {stats.failed_images}\nDeleted non-histologic: {stats.deleted_nonhistologic}\nEntities: {len(stats.entity_counts)}",
            attachments=[str(report_txt), str(report_json)]
        )
    except Exception as e:
        logger.warning(f"Failed to send completion email: {e}")

# ---------------------------------------------------------------------
# SIGNAL HANDLING
# ---------------------------------------------------------------------
def setup_signal_handlers(checkpoint_manager: CheckpointManager, image_map: List[ImageInfo], stats: ProcessingStats):
    """Set up signal handlers for graceful shutdown."""
    def handle_signal(signum, frame):
        logging.info(f"Received signal {signum}, saving checkpoint before exit...")
        try:
            checkpoint_manager.save_checkpoint(image_map, stats)
        except Exception as e:
            logging.error(f"Failed to save checkpoint: {e}")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

# ---------------------------------------------------------------------
# COMMAND LINE INTERFACE
# ---------------------------------------------------------------------
def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Commercial Grade Pathology Image Processing Pipeline")
    parser.add_argument("--config", help="Path to configuration file")
    parser.add_argument("--root-dir", help="Root directory containing images")
    parser.add_argument("--output-dir", help="Output directory for processed images")
    parser.add_argument("--log-dir", help="Directory for log files")
    parser.add_argument("--resume", action="store_true", help="Resume from last checkpoint")
    parser.add_argument("--log-level", choices=["DEBUG", "INFO", "WARNING", "ERROR"], help="Logging level")
    parser.add_argument("--max-concurrent", type=int, help="Maximum concurrent processing")
    parser.add_argument("--disable-backup", action="store_true", help="Disable backup functionality")
    parser.add_argument("--disable-security", action="store_true", help="Disable security scanning")
    parser.add_argument("--disable-auto-resume", action="store_true", help="Disable auto-resume on crash")
    parser.add_argument("--disable-icloud-sync", action="store_true", help="Disable iCloud sync")
    parser.add_argument("--disable-image-repair", action="store_true", help="Disable corrupt image repair")
    parser.add_argument("--email-recipient", help="Email address for notifications")
    parser.add_argument("--email-sender", help="Gmail sender address for OAuth notifications")
    parser.add_argument("--gmail-oauth-client-secrets", help="Path to Gmail OAuth client secrets JSON")
    parser.add_argument("--gmail-oauth-token-file", help="Path to cached Gmail OAuth token JSON")
    parser.add_argument("--gmail-oauth-auto-authorize", action="store_true", help="Run interactive Gmail OAuth authorization if no valid token is available")
    parser.add_argument("--gmail-app-password", help="Deprecated: ignored; use Gmail OAuth instead")
    return parser.parse_args()

# ---------------------------------------------------------------------
# MAIN EXECUTION
# ---------------------------------------------------------------------
def main():
    """Main execution function with auto-restart capability."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Load configuration
    config = Config()
    if args.config:
        config.load_from_file(args.config)
    if args.root_dir:
        config.root_dir = args.root_dir
    if args.output_dir:
        config.output_dir = args.output_dir
    if args.log_dir:
        config.log_dir = args.log_dir
    if args.log_level:
        config.log_level = args.log_level
    if args.max_concurrent:
        config.max_concurrent = args.max_concurrent
    if args.disable_backup:
        config.enable_backup = False
    if args.disable_security:
        config.enable_security_scan = False
    if args.disable_auto_resume:
        config.auto_resume = False
    if args.disable_icloud_sync:
        config.enable_icloud_sync = False
    if args.disable_image_repair:
        config.repair_corrupt_images = False
    if args.email_recipient:
        config.email_recipient = args.email_recipient
    if args.email_sender:
        config.email_sender = args.email_sender
    if args.gmail_oauth_client_secrets:
        config.gmail_oauth_client_secrets_file = args.gmail_oauth_client_secrets
    if args.gmail_oauth_token_file:
        config.gmail_oauth_token_file = args.gmail_oauth_token_file
    if args.gmail_oauth_auto_authorize:
        config.gmail_oauth_auto_authorize = True
    if args.gmail_app_password:
        config.gmail_app_password = args.gmail_app_password
    
    # Create necessary directories
    os.makedirs(config.log_dir, exist_ok=True)
    os.makedirs(config.output_dir, exist_ok=True)
    
    # Set up logging
    log_file = os.path.join(config.log_dir, f"pipeline_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")
    logger = setup_logging(config.log_level, log_file)
    
    logger.info("🚀 Starting Commercial Grade Pathology Image Pipeline")
    logger.info(f"Configuration: {asdict(config)}")
    
    # Initialize checkpoint manager
    checkpoint_manager = CheckpointManager(os.path.join(config.output_dir, config.checkpoint_file))
    
    # Initialize auto-restart manager
    restart_manager = AutoRestartManager(config.max_restart_attempts)
    restart_manager.load_state()
    
    # Main processing loop with auto-restart
    while True:
        try:
            # Pre-sync iCloud files if enabled
            if config.enable_icloud_sync:
                icloud_sync_time = ICloudSyncManager.preload_icloud_folder(
                    Path(config.root_dir), logger
                )
            else:
                icloud_sync_time = 0
            
            # Map directory or load from checkpoint
            if args.resume or (config.auto_resume and restart_manager.restart_count > 0):
                logger.info("Resuming from checkpoint...")
                image_map, stats = checkpoint_manager.load_checkpoint()
                if not image_map:
                    logger.warning("No valid checkpoint found, starting fresh...")
                    image_map = asyncio.run(map_directory(config, logger))
            else:
                image_map = asyncio.run(map_directory(config, logger))
            
            if not image_map:
                logger.error("❌ No images detected. Exiting.")
                return
            
            # Set up signal handlers
            setup_signal_handlers(checkpoint_manager, image_map, ProcessingStats())
            
            # Update stats with iCloud sync time
            stats = ProcessingStats()
            stats.icloud_sync_time = icloud_sync_time
            stats.restart_attempts = restart_manager.restart_count
            
            # Process images
            asyncio.run(process_all(image_map, config, logger, checkpoint_manager))
            logger.info("✅ Pipeline completed successfully")
            
            # Reset restart state on successful completion
            restart_manager.reset()
            break
            
        except KeyboardInterrupt:
            logger.warning("Interrupted by user.")
            break
        except Exception as e:
            logger.exception(f"Fatal error: {e}")
            
            # Check if we should restart
            if restart_manager.should_restart():
                wait_time = min(60, 5 * (2 ** (restart_manager.restart_count - 1)))  # Exponential backoff, max 60s
                logger.warning(f"Restarting in {wait_time} seconds (attempt {restart_manager.restart_count}/{config.max_restart_attempts})...")
                restart_manager.save_state()
                time.sleep(wait_time)
                continue
            else:
                logger.error(f"Maximum restart attempts ({config.max_restart_attempts}) reached. Exiting.")
                sys.exit(1)

if __name__ == "__main__":
    main()
