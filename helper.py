#!/usr/bin/env python3
"""
Research-Grade Pathology Image Annotation Pipeline (Final Fixed)
---------------------------------------------------------------
Author: Askia K. Dunnon

Fixes:
• Uses data:image/jpeg;base64 URIs for local files (no file:// errors)
• Raises max_output_tokens to 32 (no “integer below minimum value”)
• iCloud/NAS sync safe with placeholder check
• Auto-resume from last checkpoint
• Downscales oversize images to ≤10 MB
• Asynchronous annotation & caption generation
"""

import os, io, json, time, base64, asyncio, aiofiles, imghdr, shutil, subprocess
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime
from PIL import Image, UnidentifiedImageError
from openai import AsyncOpenAI, OpenAI, OpenAIError, RateLimitError
from tqdm.asyncio import tqdm
import backoff

# -------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------
@dataclass
class Config:
    root_dir: str = "/Users/skim4/Downloads/Didactic_Series/assets/images"
    output_dir: str = "/Users/skim4/Downloads/Didactic_Series/assets/images/annotated_images"
    captions_csv: str = "captions.csv"
    checkpoint_file: str = "checkpoint.json"
    model_annotate: str = "gpt-image-1"
    model_classify: str = "gpt-4.1-mini"
    model_caption: str = "gpt-4.1-mini"
    max_concurrent: int = 4
    icloud_sync: bool = True
    icloud_timeout: int = 60
    max_image_mb: int = 10
    downscale_px: int = 2048
    checkpoint_interval: int = 10
    api_key: str = os.getenv("OPENAI_API_KEY")

def log(msg: str): print(f"{datetime.now():%Y-%m-%d %H:%M:%S} | {msg}")
def ensure_dir(p: Path): p.mkdir(parents=True, exist_ok=True)

# -------------------------------------------------------------
# ICLOUD / NAS SYNC
# -------------------------------------------------------------
class ICloudSync:
    @staticmethod
    def is_placeholder(path: Path) -> bool:
        try:
            res = subprocess.run(["xattr", "-p", "com.apple.iCloud", str(path)],
                                 capture_output=True, text=True)
            return res.returncode == 0
        except Exception:
            return False

    @staticmethod
    def ensure_downloaded(path: Path, timeout: int = 60) -> bool:
        if not path.exists(): return False
        if not ICloudSync.is_placeholder(path): return True
        log(f"☁️  Downloading from iCloud/NAS: {path.name}")
        subprocess.run(["brctl", "download", str(path)], check=False)
        start, last_size = time.time(), -1
        while time.time() - start < timeout:
            try:
                size = path.stat().st_size
                if not ICloudSync.is_placeholder(path) and size == last_size:
                    return True
                last_size = size
            except Exception:
                pass
            time.sleep(2)
        log(f"⌛ Timeout waiting for iCloud: {path.name}")
        return False

# -------------------------------------------------------------
# IMAGE VALIDATION & PREP
# -------------------------------------------------------------
def validate_and_prepare(img_path: Path, cfg: Config) -> bool:
    try:
        if cfg.icloud_sync:
            ICloudSync.ensure_downloaded(img_path, cfg.icloud_timeout)
        if img_path.stat().st_size == 0:
            log(f"⚠️ Empty file skipped: {img_path.name}")
            return False
        if img_path.stat().st_size > cfg.max_image_mb * 1024 * 1024:
            log(f"📉 Downscaling oversize image: {img_path.name}")
            with Image.open(img_path) as im:
                im.thumbnail((cfg.downscale_px, cfg.downscale_px))
                tmp = img_path.with_suffix(".tmp.jpg")
                im.convert("RGB").save(tmp, "JPEG", quality=90)
                shutil.move(tmp, img_path)
        with Image.open(img_path) as im: im.verify()
        return True
    except UnidentifiedImageError:
        log(f"⚠️ Unreadable image skipped: {img_path.name}")
        return False
    except Exception as e:
        log(f"⚠️ Validation error {img_path.name}: {e}")
        return False

# -------------------------------------------------------------
# HISTOLOGIC CLASSIFICATION
# -------------------------------------------------------------
@backoff.on_exception(backoff.expo, (OpenAIError, RateLimitError), max_tries=3)
async def is_histologic(img: Path, cfg: Config) -> bool:
    try:
        with open(img, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        data_uri = f"data:image/jpeg;base64,{b64}"

        client = OpenAI(api_key=cfg.api_key)
        resp = client.responses.create(
            model=cfg.model_classify,
            input=[{
                "role": "user",
                "content": [
                    {"type": "input_text",
                     "text": "Classify whether this image is histologic "
                             "(H&E, PAS, GMS, etc.) or non-histologic "
                             "(diagram/cartoon). Reply only 'histologic' or 'non-histologic'."},
                    {"type": "input_image", "image_url": data_uri}
                ]
            }],
            max_output_tokens=32   # ✅ minimum required ≥16
        )
        verdict = resp.output_text.strip().lower()
        if "histologic" in verdict:
            log(f"🧬 Histologic confirmed: {img.name}")
            return True
        img.unlink(missing_ok=True)
        log(f"🗑️ Non-histologic removed: {img.name}")
        return False
    except Exception as e:
        log(f"⚠️ Classification failed for {img.name}: {e}")
        return False

# -------------------------------------------------------------
# ANNOTATION + CAPTION
# -------------------------------------------------------------
csv_lock = asyncio.Lock()

@backoff.on_exception(backoff.expo, (OpenAIError, RateLimitError), max_tries=3)
async def annotate_and_caption(img: Path, entity: str, cfg: Config):
    try:
        async with aiofiles.open(img, "rb") as f:
            b64 = base64.b64encode(await f.read()).decode("utf-8")

        client = AsyncOpenAI(api_key=cfg.api_key)
        prompt = (f"Annotate this histopathology image of {entity} using CAP/WHO standards. "
                  "Use arrowed callouts for diagnostic features and concise all-caps labels. "
                  "Maintain clear visibility of tissue morphology.")

        res = await client.images.generate(
            model=cfg.model_annotate,
            prompt=prompt,
            image=b64,
            size="1024x1024",
            response_format="b64_json"
        )

        out_dir = Path(cfg.output_dir)
        annotated_path = out_dir / f"{entity}_{img.stem}_annotated.jpg"
        async with aiofiles.open(annotated_path, "wb") as out:
            await out.write(base64.b64decode(res.data[0].b64_json))

        desc_prompt = f"Summarize key microscopic findings seen in {entity}."
        desc = await client.responses.create(model=cfg.model_caption, input=desc_prompt)
        caption = desc.output_text.strip()

        caption_path = out_dir / f"{entity}_{img.stem}_caption.txt"
        async with aiofiles.open(caption_path, "w") as f:
            await f.write(caption)

        async with csv_lock:
            async with aiofiles.open(out_dir / cfg.captions_csv, "a") as csv:
                await csv.write(f"{img.name},{entity},{caption}\n")

        log(f"✅ Annotated {img.name}")
    except Exception as e:
        log(f"❌ Failed {img.name}: {e}")

# -------------------------------------------------------------
# PIPELINE
# -------------------------------------------------------------
async def process_all(cfg: Config):
    ensure_dir(Path(cfg.output_dir))
    captions_path = Path(cfg.output_dir) / cfg.captions_csv
    async with aiofiles.open(captions_path, "w") as f:
        await f.write("Filename,Entity,Description\n")

    imgs = [p for p in Path(cfg.root_dir).rglob("*.[pj][pn]g")]
    valid = [p for p in imgs if validate_and_prepare(p, cfg)]
    log(f"📂 Validated {len(valid)} images")

    # resume support
    cp_path = Path(cfg.output_dir) / cfg.checkpoint_file
    processed_names = set()
    if cp_path.exists():
        try:
            data = json.loads(cp_path.read_text())
            processed_names = set(data.get("processed_files", []))
            log(f"🔄 Resuming from checkpoint ({len(processed_names)} completed)")
        except Exception:
            pass

    histologic = []
    for p in valid:
        if p.name in processed_names: continue
        if await is_histologic(p, cfg):
            histologic.append(p)

    sem = asyncio.Semaphore(cfg.max_concurrent)

    async def worker(p):
        async with sem:
            await annotate_and_caption(p, p.parent.name, cfg)
            processed_names.add(p.name)
            async with aiofiles.open(cp_path, "w") as f:
                await f.write(json.dumps({"processed_files": list(processed_names),
                                          "timestamp": time.time()}))

    for i in range(0, len(histologic), cfg.checkpoint_interval):
        batch = histologic[i:i+cfg.checkpoint_interval]
        await tqdm.gather(*[worker(b) for b in batch])
        log(f"💾 Checkpoint saved ({len(processed_names)}/{len(valid)})")

    log("🏁 Processing complete.")

# -------------------------------------------------------------
# MAIN
# -------------------------------------------------------------
def main():
    cfg = Config()
    log("🚀 Starting Research-Grade Pipeline (Local/iCloud/NAS Compatible)")
    log(f"Root directory: {cfg.root_dir}")
    asyncio.run(process_all(cfg))
    log("✅ All done.")

if __name__ == "__main__":
    main()
