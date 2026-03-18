#!/usr/bin/env python3
"""
Asynchronous AI Annotation Pipeline for Pathology Images
Enhanced Version — Annotated Images + Descriptive Text Output + Non-Histologic Filtering
Author: Askia K. Dunnon
"""

import os
import csv
import asyncio
import aiofiles
import base64
import imghdr
from PIL import Image
from pathlib import Path
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

# === Helper Functions ===

async def is_histologic_image(image_path: Path) -> bool:
    """
    Uses AI to check if an image is histologic vs non-histologic (e.g. diagram, cartoon).
    Returns True if histologic, False if not.
    """
    try:
        # Lightweight validation
        if imghdr.what(image_path) not in ["jpeg", "png"]:
            return False

        # Sanity check: verify image integrity
        with Image.open(image_path) as img:
            img.verify()

        # Synchronous check — small, fast, one-off request
        sync_client = OpenAI()
        response = sync_client.responses.create(
            model="gpt-4.1-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Determine if this image is a histopathology micrograph "
                                "(H&E, PAS, GMS, or similar) or a non-histologic image "
                                "(diagram, cartoon, schematic, label). "
                                "Reply only with 'histologic' or 'non-histologic'."
                            ),
                        },
                        {"type": "input_image", "image_url": image_path.as_uri()},
                    ],
                }
            ],
            max_output_tokens=10,
        )
        result = response.output_text.strip().lower()
        return "histologic" in result

    except Exception as e:
        print(f"⚠️ Screening failed for {image_path.name}: {e}")
        return False


async def read_description(entity_dir: Path):
    """Reads description.txt if present, otherwise uses entity name as default."""
    desc_path = entity_dir / "description.txt"
    if desc_path.exists():
        async with aiofiles.open(desc_path, "r") as f:
            content = (await f.read()).strip()
        if "Labels:" in content:
            description, labels_str = content.split("Labels:")
            labels = [lbl.strip() for lbl in labels_str.split(",")]
        else:
            description, labels = content, []
    else:
        description = entity_dir.name.replace("_", " ").capitalize()
        labels = []
    return description.strip(), labels


def make_prompt(entity_name, description, labels):
    """Creates the dual-purpose annotation + descriptive prompt."""
    label_text = f"Labels: {', '.join(labels)}." if labels else ""
    return f"""
You are a pathology imaging expert creating an educational atlas image.

1️⃣ Annotate the uploaded histopathology image using CAP/WHO atlas standards:
- Clear arrowed lines
- ALL CAPS bold labels
- Minimalist academic style

2️⃣ Generate a short descriptive paragraph (2–3 sentences) explaining the microscopic findings.

Entity: {entity_name}
Context: {description}
{label_text}

Return both an annotated image and a description of what is seen.
"""


async def annotate_image(img_path: Path, entity_name, description, labels, sem):
    """Annotates a single image and generates a corresponding description file."""
    async with sem:
        prompt = make_prompt(entity_name, description, labels)
        img_bytes = img_path.read_bytes()

        for attempt in range(1, RETRY_LIMIT + 1):
            try:
                # --- Generate annotated image ---
                response = await client.images.generate(
                    model="gpt-image-1",
                    prompt=prompt,
                    image=img_bytes,
                    size="1024x1024",
                    n=1,
                )

                img_b64 = response.data[0].b64_json
                output_image = OUTPUT_DIR / f"{entity_name}_{img_path.stem}_annotated.png"
                async with aiofiles.open(output_image, "wb") as out_f:
                    await out_f.write(base64.b64decode(img_b64))

                # --- Generate descriptive paragraph ---
                desc_prompt = (
                    f"Provide a concise educational pathology caption describing the key "
                    f"microscopic features in this image of {entity_name}. "
                    f"Focus on histomorphology, inflammation type, and diagnostic clues."
                )
                text_response = await client.responses.create(
                    model="gpt-4.1-mini",
                    input=desc_prompt
                )

                description_text = text_response.output_text.strip()
                output_txt = OUTPUT_DIR / f"{entity_name}_{img_path.stem}_description.txt"
                async with aiofiles.open(output_txt, "w") as txt_f:
                    await txt_f.write(description_text)

                # --- Append to captions.csv ---
                async with aiofiles.open(CAPTION_CSV, "a") as csv_f:
                    await csv_f.write(
                        f"{img_path.name},{entity_name},{';'.join(labels)},{description_text}\n"
                    )

                print(f"✅ Annotated + described: {img_path.name}")
                return True

            except OpenAIError as e:
                print(f"⚠️ Error on {img_path.name} (Attempt {attempt}/{RETRY_LIMIT}): {e}")
                await asyncio.sleep(3 * attempt)
        print(f"❌ Failed to annotate {img_path.name} after {RETRY_LIMIT} attempts.")
        return False


async def map_directory():
    """Finds all images recursively, treating subfolders as entities."""
    mapping = []

    # --- Entity folders ---
    for entity_dir in DATASET_DIR.iterdir():
        if entity_dir.is_dir():
            description, labels = await read_description(entity_dir)
            for img_file in entity_dir.glob("*.[pj][pn]g"):
                if await is_histologic_image(img_file):
                    mapping.append((entity_dir.name, img_file, description, labels))
                else:
                    print(f"🗑️ Skipped non-histologic image: {img_file.name}")
                    img_file.unlink(missing_ok=True)

    # --- Loose images in root ---
    for img_file in DATASET_DIR.glob("*.[pj][pn]g"):
        if await is_histologic_image(img_file):
            mapping.append(("General", img_file, "Unlabeled histopathologic image", []))
        else:
            print(f"🗑️ Skipped non-histologic image: {img_file.name}")
            img_file.unlink(missing_ok=True)

    return mapping


async def main():
    sem = asyncio.Semaphore(MAX_CONCURRENT)
    mapping = await map_directory()

    print(f"📂 Found {len(mapping)} images across {len(set(m[0] for m in mapping))} entities.")
    print(f"🧩 Output directory: {OUTPUT_DIR}")
    print("🚀 Starting annotation and description generation...")

    async with aiofiles.open(CAPTION_CSV, "w") as f:
        await f.write("Filename,Entity,Labels,Description\n")

    tasks = [
        annotate_image(img_path, entity_name, description, labels, sem)
        for (entity_name, img_path, description, labels) in mapping
    ]

    await tqdm.gather(*tasks)

    print("✅ All images processed.")
    print(f"🧾 Captions file saved at: {CAPTION_CSV}")
    print("📦 Annotated images + descriptions ready for dashboard import.")


if __name__ == "__main__":
    asyncio.run(main())
