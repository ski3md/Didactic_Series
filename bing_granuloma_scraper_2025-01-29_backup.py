#!/usr/bin/env python3
"""
Bing Granuloma Histopathology Image Scraper
Downloads histopathology images for granulomatous lung diseases from Bing Images
with automatic stain classification, expert filenames, and citation tracking.
"""

import os
import json
import time
import random
import re
import requests
from urllib.parse import quote, urlparse
from bs4 import BeautifulSoup
from pathlib import Path
from datetime import datetime
import logging

# Configuration
BASE_DIR = Path.cwd()
OUTPUT_DIR = BASE_DIR / "src" / "assets" / "images" / "granulomas"
LOG_DIR = OUTPUT_DIR / "scraper_logs"
CITATION_FILE = OUTPUT_DIR / "image_sources.json"

# Create directories if they don't exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_DIR / f"scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
        logging.StreamHandler()
    ]
)

# Diseases and their query variations
DISEASES = {
    "sarcoidosis": [
        "sarcoidosis noncaseating granulomas lung biopsy H&E",
        "sarcoidosis lung histology",
        "sarcoidosis granulomatous inflammation biopsy",
        "pulmonary sarcoidosis pathology"
    ],
    "tuberculosis": [
        "tuberculosis caseating necrosis granulomas lung H&E",
        "tb lung histology",
        "tuberculosis granulomas Ziehl-Neelsen",
        "pulmonary tuberculosis pathology"
    ],
    "histoplasmosis": [
        "histoplasma granulomas lung GMS",
        "histoplasmosis lung histology",
        "pulmonary histoplasmosis pathology",
        "histoplasma yeast forms in lung"
    ],
    "blastomycosis": [
        "blastomycosis broad-based budding granulomas",
        "blastomyces lung histology",
        "pulmonary blastomycosis pathology"
    ],
    "coccidioidomycosis": [
        "coccidioidomycosis spherules granulomatous inflammation",
        "coccidioides lung histology",
        "pulmonary coccidioidomycosis pathology"
    ],
    "cryptococcosis": [
        "cryptococcus mucicarmine capsule granulomas",
        "cryptococcosis lung histology",
        "pulmonary cryptococcosis pathology"
    ],
    "gpa": [
        "gpa necrotizing granulomas vasculitis",
        "granulomatosis with polyangiitis lung pathology",
        "wegener's granulomatosis lung histology"
    ],
    "hypersensitivity_pneumonitis": [
        "hypersensitivity pneumonitis poorly formed granulomas",
        "hp bronchiolocentric granulomas",
        "hypersensitivity pneumonitis lung pathology"
    ],
    "berylliosis": [
        "berylliosis noncaseating granulomas lung",
        "chronic beryllium disease pathology",
        "beryllium lung granulomas"
    ],
    "foreign_body": [
        "foreign body giant cells granuloma lung",
        "foreign body reaction lung pathology",
        "pulmonary foreign body granulomatous reaction"
    ]
}

# Stain patterns for classification
STAIN_PATTERNS = {
    "H&E": [r"h&e", r"hematoxylin.*eosin", r"h and e", r"he stain"],
    "AFB_Ziehl": [r"afb", r"ziehl.*neelsen", r"acid.*fast", r"mycobacteria"],
    "GMS": [r"gms", r"gomori.*methenamine", r"silver", r"fungal.*silver"],
    "PAS": [r"pas", r"periodic.*acid.*schiff", r"mucopolysaccharide"],
    "Mucicarmine": [r"mucicarmine", r"mucin", r"capsule.*stain"]
}

# User agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
]

def get_random_headers():
    """Generate random headers for each request"""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Referer": "https://www.bing.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
    }

def classify_stain(image_url, image_title):
    """Classify the stain type based on URL and title patterns"""
    text_to_check = f"{image_url} {image_title}".lower()
    
    for stain, patterns in STAIN_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_to_check, re.IGNORECASE):
                return stain
    
    return "Unclassified"

def generate_expert_filename(disease, stain, image_title, index):
    """Generate expert descriptive filename"""
    # Extract key features from the title
    features = []
    
    # Disease-specific features
    if disease == "sarcoidosis":
        if "noncaseating" in image_title.lower():
            features.append("noncaseating")
        if "epithelioid" in image_title.lower():
            features.append("epithelioid")
        if "granulomas" in image_title.lower():
            features.append("granulomas")
    elif disease == "tuberculosis":
        if "caseating" in image_title.lower():
            features.append("caseating")
        if "necrosis" in image_title.lower():
            features.append("necrosis")
        if "langhans" in image_title.lower() or "giant" in image_title.lower():
            features.append("giant_cells")
    elif disease == "gpa":
        if "necrotizing" in image_title.lower():
            features.append("necrotizing")
        if "vasculitis" in image_title.lower():
            features.append("vasculitis")
    elif disease == "histoplasmosis":
        if "yeast" in image_title.lower():
            features.append("yeast_forms")
    elif disease == "cryptococcosis":
        if "capsule" in image_title.lower():
            features.append("capsule")
    
    # Default to disease name if no features found
    if not features:
        features = [disease]
    
    # Format filename
    feature_str = "_".join(features)
    filename = f"{disease}_{feature_str}_{str(index).zfill(2)}.jpg"
    
    # Clean filename
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    
    return filename

def get_image_urls(query, max_images=100):
    """Scrape Bing Images for image URLs"""
    image_urls = []
    page = 1
    
    while len(image_urls) < max_images:
        # Format search URL
        search_url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2&first={page*50}"
        
        try:
            # Make request with random headers
            response = requests.get(search_url, headers=get_random_headers(), timeout=10)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find image thumbnails
            thumbnails = soup.find_all('a', class_='iusc')
            
            if not thumbnails:
                logging.warning(f"No more results found for query: {query}")
                break
            
            # Extract image URLs from thumbnails
            for thumb in thumbnails:
                if len(image_urls) >= max_images:
                    break
                
                try:
                    # Extract metadata
                    m = thumb.get('m')
                    if not m:
                        continue
                    
                    # Parse metadata JSON
                    metadata = json.loads(m)
                    image_url = metadata.get('murl')
                    image_title = metadata.get('t', '')
                    
                    if image_url and image_url.startswith(('http', 'https')):
                        image_urls.append((image_url, image_title))
                except (json.JSONDecodeError, KeyError, AttributeError):
                    continue
            
            # Move to next page
            page += 1
            
            # Random delay to avoid blocking
            delay = random.uniform(1.0, 3.0)
            time.sleep(delay)
            
        except requests.RequestException as e:
            logging.error(f"Error fetching results for query '{query}': {e}")
            time.sleep(random.uniform(3.0, 5.0))
            continue
    
    return image_urls[:max_images]

def download_image(url, filepath, max_retries=3):
    """Download an image from URL with retry logic"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=get_random_headers(), stream=True, timeout=10)
            response.raise_for_status()
            
            # Check if content type is an image
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logging.warning(f"Skipping non-image content: {url} (Content-Type: {content_type})")
                return False
            
            # Save image
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            
            return True
            
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                logging.warning(f"Retry {attempt + 1}/{max_retries} for {url}: {e}")
                time.sleep(random.uniform(2.0, 4.0))
            else:
                logging.error(f"Failed to download {url} after {max_retries} attempts: {e}")
                return False

def load_existing_citations():
    """Load existing citations if available"""
    if CITATION_FILE.exists():
        try:
            with open(CITATION_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            logging.warning("Could not load existing citations file, starting fresh")
    
    return {}

def save_citations(citations):
    """Save citations to JSON file"""
    try:
        with open(CITATION_FILE, 'w') as f:
            json.dump(citations, f, indent=2)
    except IOError as e:
        logging.error(f"Failed to save citations: {e}")

def main():
    """Main function to orchestrate the scraping process"""
    logging.info("Starting Bing Granuloma Histopathology Image Scraper")
    
    # Load existing citations
    citations = load_existing_citations()
    
    # Track overall statistics
    total_images = 0
    total_skipped = 0
    
    # Process each disease
    for disease, queries in DISEASES.items():
        logging.info(f"Processing disease: {disease}")
        
        # Create disease directory
        disease_dir = OUTPUT_DIR / disease
        disease_dir.mkdir(exist_ok=True)
        
        # Create stain directories
        for stain in STAIN_PATTERNS.keys():
            (disease_dir / stain).mkdir(exist_ok=True)
        (disease_dir / "Unclassified").mkdir(exist_ok=True)
        
        # Track images for this disease
        disease_images = 0
        disease_skipped = 0
        
        # Process each query variation
        for query in queries:
            logging.info(f"Searching for: {query}")
            
            # Get image URLs
            image_urls = get_image_urls(query, max_images=100)
            logging.info(f"Found {len(image_urls)} potential images for query: {query}")
            
            # Download images
            for i, (url, title) in enumerate(image_urls):
                # Classify stain
                stain = classify_stain(url, title)
                
                # Generate filename
                filename = generate_expert_filename(disease, stain, title, i + 1)
                filepath = disease_dir / stain / filename
                
                # Skip if file already exists
                if filepath.exists():
                    logging.debug(f"Skipping existing file: {filename}")
                    disease_skipped += 1
                    total_skipped += 1
                    continue
                
                # Download image
                if download_image(url, filepath):
                    logging.info(f"Downloaded: {filename}")
                    
                    # Add to citations
                    citations[str(filepath)] = {
                        "filename": filename,
                        "disease": disease,
                        "stain": stain,
                        "source_url": url,
                        "title": title,
                        "query": query,
                        "download_date": datetime.now().isoformat()
                    }
                    
                    disease_images += 1
                    total_images += 1
                else:
                    disease_skipped += 1
                    total_skipped += 1
                
                # Random delay between downloads
                time.sleep(random.uniform(0.5, 1.5))
            
            # Delay between different queries
            time.sleep(random.uniform(2.0, 4.0))
        
        logging.info(f"Completed {disease}: {disease_images} images downloaded, {disease_skipped} skipped")
        
        # Save citations after each disease
        save_citations(citations)
        
        # Delay between different diseases
        time.sleep(random.uniform(3.0, 5.0))
    
    # Final save of citations
    save_citations(citations)
    
    logging.info(f"Scraping complete: {total_images} images downloaded, {total_skipped} skipped")
    logging.info(f"Images saved to: {OUTPUT_DIR}")
    logging.info(f"Citations saved to: {CITATION_FILE}")

if __name__ == "__main__":
    main()