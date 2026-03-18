#!/usr/bin/env python3
"""
Unified Asynchronous AI Annotation Pipeline for Pathology Images
----------------------------------------------------------------
• Works in both 'flat' and 'entity folder' structures
• Optional: reads description.txt and label metadata when present
• Automatically removes non-histologic images (cartoons, diagrams, etc.)
• Annotates histologic images (CAP/WHO style)
• Generates educational captions and captions.csv
• Prints detailed summary statistics
Author: Askia K. Dunnon
"""

import os, csv, asyncio, aiofiles, base64, imghdr
from collections import Counter
from pathlib import Path
from PIL import Image
from tqdm.asyncio import tqdm
from openai import AsyncOpenAI, OpenAI, OpenAIError

# === CONFIGURATION ===
DATASET_DIR = Path("/Users/skim4/Documents/GitHub/FellowshipWorkflows/Didactic_Series/assets/images")
OUTPUT_DIR = DATASET_DIR / "annotated_images"
CAPTION_CSV = OUTPUT_DIR / "captions.csv"

MAX_CONCURRENT = 4
RETRY_LIMIT = 3

os.makedirs(OUTPUT_DIR, exist_ok=True)

client = AsyncOpenAI()
sync_client = OpenAI()
stats = Counter()

# === HELPERS ===

async def is_histologic_image(image_path: Path) -> bool:
    """Use AI to classify an image as histologic vs non-histologic."""
    try:
        if imghdr.what(image_path) not in ["jpeg", "png"]:
            stats["invalid"] += 1
            return False
        with Image.open(image_path) as img:
            img.verify()

        resp = sync_client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text",
                         "text": (
                             "Determine if this image is a histopathology micrograph "
                             "(H&E, PAS, GMS, or similar) or a non-histologic image "
                             "(diagram, cartoon, schematic, label). Reply with 'histologic' or 'non-histologic'."
                         )},
                        {"type": "input_image", "image_url": image_path.as_uri()},
                    ],
                }
            ],
            max_output_tokens=10,
        )
        verdict = resp.output_text.strip().lower()
        if "histologic" in verdict:
            return True
        else:
            stats["deleted_nonhistologic"] += 1
            image_path.unlink(missing_ok=True)
            print(f"🗑️ Deleted non-histologic: {image_path.name}")
            return False
    except Exception as e:
        print(f"⚠️ Screening failed for {image_path.name}: {e}")
        stats["failed_screen"] += 1
        return False


async def read_description(entity_dir: Path):
    """Read description.txt and labels if present, else default to entity name."""
    desc_path = entity_dir / "description.txt"
    if desc_path.exists():
        async with aiofiles.open(desc_path, "r") as f:
            content = (await f.read()).strip()
        if "Labels:" in content:
            desc, labels_str = content.split("Labels:", 1)
            labels = [lbl.strip() for lbl in labels_str.split(",")]
        else:
            desc, labels = content, []
    else:
        desc = entity_dir.name.replace("_", " ").capitalize()
        labels = []
    return desc.strip(), labels


def make_prompt(entity, description, labels):
    """Create dual-purpose annotation and caption prompt."""
    label_str = f"Labels: {', '.join(labels)}." if labels else ""
    return f"""
You are a pathology imaging expert creating an educational atlas image.

1️⃣ Annotate the uploaded histopathology image using CAP/WHO atlas standards:
   - Clear arrowed lines
   - ALL CAPS bold labels
   - Minimalist academic style

2️⃣ Generate a concise (2–3 sentence) educational description of the microscopic findings.

Entity: {entity}
Context: {description}
{label_str}
"""


async def annotate_image(img_path, entity, description, labels, sem):
    """Annotate one image and generate its description + CSV record."""
    async with sem:
        prompt = make_prompt(entity, description, labels)
        img_bytes = img_path.read_bytes()

        for attempt in range(1, RETRY_LIMIT + 1):
            try:
                stats["attempted"] += 1

                # Annotated image
                response = await client.images.generate(
                    model="gpt-image-1",
                    prompt=prompt,
                    image=img_bytes,
                    size="1024x1024"
                )
                annotated_path = OUTPUT_DIR / f"{entity}_{img_path.stem}_annotated.png"
                async with aiofiles.open(annotated_path, "wb") as f:
                    await f.write(base64.b64decode(response.data[0].b64_json))

                # Description text
                caption_prompt = (
                    f"Provide a concise educational pathology caption describing "
                    f"the histologic features of {entity}. Focus on diagnostic clues."
                )
                caption = await client.responses.create(
                    model="gpt-4.1-mini",
                    input=caption_prompt
                )
                desc_text = caption.output_text.strip()
                txt_path = OUTPUT_DIR / f"{entity}_{img_path.stem}_description.txt"
                async with aiofiles.open(txt_path, "w") as f:
                    await f.write(desc_text)

                # Append to captions.csv
                async with aiofiles.open(CAPTION_CSV, "a") as csvf:
                    await csvf.write(f"{img_path.name},{entity},{';'.join(labels)},{desc_text}\n")

                stats["annotated"] += 1
                stats[f"entity_{entity}"] += 1
                print(f"✅ Annotated + described: {img_path.name}")
                return
            except OpenAIError as e:
                print(f"⚠️ Error on {img_path.name} (Attempt {attempt}/{RETRY_LIMIT}): {e}")
                await asyncio.sleep(3 * attempt)
        stats["failed_annotation"] += 1


async def map_directory():
    """Map all valid images from flat or hierarchical structure."""
    mapping = []

    # Detect whether folder is organized into subfolders (entities)
    has_subfolders = any(p.is_dir() for p in DATASET_DIR.iterdir())
    print(f"🔍 Detected folder mode: {'Entity-based' if has_subfolders else 'Flat'}")

    if has_subfolders:
        for entity_dir in DATASET_DIR.iterdir():
            if not entity_dir.is_dir():
                continue
            description, labels = await read_description(entity_dir)
            for img in entity_dir.glob("*.[pj][pn]g"):
                if await is_histologic_image(img):
                    mapping.append((entity_dir.name, img, description, labels))
    else:
        # Flat mode
        for img in DATASET_DIR.glob("*.[pj][pn]g"):
            if await is_histologic_image(img):
                mapping.append(("General", img, "Histopathologic image", []))

    return mapping


def summarize():
    """Print final summary statistics."""
    total_entities = [k for k in stats if k.startswith("entity_")]
    print("\n====== SUMMARY STATISTICS ======")
    print(f"Total histologic images processed : {stats['annotated']}")
    print(f"Deleted non-histologic images     : {stats['deleted_nonhistologic']}")
    print(f"Failed screening                  : {stats['failed_screen']}")
    print(f"Annotation failures               : {stats['failed_annotation']}")
    print(f"Entities represented              : {len(total_entities)}")
    for k in total_entities:
        print(f"  - {k.replace('entity_', '').capitalize()}: {stats[k]}")
    print(f"\nOutput directory: {OUTPUT_DIR}")
    print(f"Captions file   : {CAPTION_CSV}")
    print("================================\n")


async def main():
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    mapping = await map_directory()

    async with aiofiles.open(CAPTION_CSV, "w") as f:
        await f.write("Filename,Entity,Labels,Description\n")

    print(f"📂 Found {len(mapping)} valid histologic candidates.")
    await tqdm.gather(*[annotate_image(p, e, d, l, sem) for e, p, d, l in mapping])

    summarize()


if __name__ == "__main__":
    asyncio.run(main())
