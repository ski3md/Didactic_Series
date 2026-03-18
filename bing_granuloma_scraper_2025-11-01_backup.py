#!/usr/bin/env python3
"""
Bing Granuloma Histopathology Image Scraper (Enhanced with Pathology Synonyms)
Downloads histopathology images for granulomatous lung diseases from multiple sources
with robust error handling, deduplication, CLI controls, and pathology-specific query expansion.
"""

import os
import json
import time
import random
import re
import requests
import hashlib
import argparse
import sys
from urllib.parse import quote, urlparse
from bs4 import BeautifulSoup
from pathlib import Path
from datetime import datetime
import logging
import shutil
from PIL import Image
from io import BytesIO

# Configuration
BASE_DIR = Path.cwd()
OUTPUT_DIR = BASE_DIR / "src" / "assets" / "images" / "granulomas"
LOG_DIR = OUTPUT_DIR / "scraper_logs"
CITATION_FILE = OUTPUT_DIR / "image_sources.json"
HASH_FILE = OUTPUT_DIR / "image_hashes.json"
URL_CACHE_FILE = OUTPUT_DIR / "scraped_urls.json"

# Create directories if they don't exist
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# Domain blocklist - these domains typically block scrapers
DOMAIN_BLOCKLIST = [
    'elsevier.com', 'sciencedirect.com', 'researchgate.net', 
    'springer.com', 'wiley.com', 'nature.com', 'cell.com',
    'jamanetwork.com', 'nejm.org', 'thelancet.com'
]

# Minimum image dimensions (to filter out thumbnails/garbage)
MIN_IMAGE_WIDTH = 400
MIN_IMAGE_HEIGHT = 300

# Supported image extensions
VALID_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'}

# Diseases with expanded pathology-specific query variations
DISEASES = {
    "sarcoidosis": [
        # Core queries
        "sarcoidosis noncaseating granulomas lung biopsy H&E",
        "sarcoidosis lung histology",
        "sarcoidosis granulomatous inflammation biopsy",
        "pulmonary sarcoidosis pathology",
        
        # Pathology-specific synonyms
        "sarcoidosis nonnecrotizing granulomas lung",
        "sarcoidosis Schaumann bodies lung",
        "sarcoidosis asteroid bodies lung biopsy",
        "pulmonary sarcoidosis naked granulomas",
        "sarcoidosis peribronchiolar granulomas",
        "sarcoidosis hilar lymph nodes granulomas",
        "noncaseating granulomas lung H&E",
        "pulmonary nonnecrotizing granulomas"
    ],
    "tuberculosis": [
        # Core queries
        "tuberculosis caseating necrosis granulomas lung H&E",
        "tb lung histology",
        "tuberculosis granulomas Ziehl-Neelsen",
        "pulmonary tuberculosis pathology",
        
        # Pathology-specific synonyms
        "tuberculosis caseating necrosis lung",
        "tuberculosis Langhans giant cells lung",
        "tuberculosis AFB granulomas lung",
        "pulmonary TB caseous necrosis",
        "tuberculosis Ghon focus lung",
        "tuberculosis granulomatous inflammation lung",
        "mycobacterial granulomas lung",
        "TB granulomas with caseation"
    ],
    "histoplasmosis": [
        # Core queries
        "histoplasma granulomas lung GMS",
        "histoplasmosis lung histology",
        "pulmonary histoplasmosis pathology",
        "histoplasma yeast forms in lung",
        
        # Pathology-specific synonyms
        "histoplasmosis intracellular yeasts lung",
        "histoplasmosis Ohio River Valley fungus lung",
        "histoplasma capsulatum granulomas lung",
        "pulmonary histoplasmosis yeast cells",
        "histoplasmosis granulomatous inflammation lung",
        "histoplasma macrophages lung",
        "histoplasmosis calcified granulomas lung"
    ],
    "blastomycosis": [
        # Core queries
        "blastomycosis broad-based budding granulomas",
        "blastomyces lung histology",
        "pulmonary blastomycosis pathology",
        
        # Pathology-specific synonyms
        "blastomycosis broad-based budding yeast lung",
        "blastomyces dermatitidis granulomas lung",
        "pulmonary blastomycosis yeast forms",
        "blastomycosis pyogranulomatous inflammation lung",
        "blastomycosis pseudoepitheliomatous hyperplasia lung"
    ],
    "coccidioidomycosis": [
        # Core queries
        "coccidioidomycosis spherules granulomatous inflammation",
        "coccidioides lung histology",
        "pulmonary coccidioidomycosis pathology",
        
        # Pathology-specific synonyms
        "coccidioidomycosis endospores spherules lung",
        "coccidioides immitis granulomas lung",
        "pulmonary coccidioidomycosis spherules",
        "coccidioidomycosis Valley Fever lung",
        "coccidioides fungal granulomas lung"
    ],
    "cryptococcosis": [
        # Core queries
        "cryptococcus mucicarmine capsule granulomas",
        "cryptococcosis lung histology",
        "pulmonary cryptococcosis pathology",
        
        # Pathology-specific synonyms
        "cryptococcosis encapsulated yeasts lung",
        "cryptococcus neoformans granulomas lung",
        "pulmonary cryptococcosis yeast forms",
        "cryptococcosis soap bubble appearance lung",
        "cryptococcal granulomatous inflammation lung"
    ],
    "gpa": [
        # Core queries
        "gpa necrotizing granulomas vasculitis",
        "granulomatosis with polyangiitis lung pathology",
        "wegener's granulomatosis lung histology",
        
        # Pathology-specific synonyms
        "gpa necrotizing vasculitis lung",
        "gpa geographic necrosis lung",
        "gpa lung capillaritis",
        "gpa PR3-ANCA granulomas lung",
        "granulomatosis with polyangiitis palisading granulomas",
        "gpa microabscesses lung",
        "wegener's granulomatosis giant cells lung"
    ],
    "hypersensitivity_pneumonitis": [
        # Core queries
        "hypersensitivity pneumonitis poorly formed granulomas",
        "hp bronchiolocentric granulomas",
        "hypersensitivity pneumonitis lung pathology",
        
        # Pathology-specific synonyms
        "hypersensitivity pneumonitis bronchiolocentric inflammation",
        "hp giant cells lung",
        "hypersensitivity pneumonitis lymphocytic infiltration",
        "hp bird fancier lung granulomas",
        "hypersensitivity pneumonitis farmer's lung",
        "hp organizing pneumonia lung",
        "hypersensitivity pneumonitis interstitial inflammation"
    ],
    "berylliosis": [
        # Core queries
        "berylliosis noncaseating granulomas lung",
        "chronic beryllium disease pathology",
        "beryllium lung granulomas",
        
        # Pathology-specific synonyms
        "berylliosis sarcoid-like granulomas lung",
        "chronic beryllium disease noncaseating granulomas",
        "beryllium sensitization lung pathology",
        "berylliosis hard metal lung",
        "beryllium-induced granulomatous disease lung"
    ],
    "foreign_body": [
        # Core queries
        "foreign body giant cells granuloma lung",
        "foreign body reaction lung pathology",
        "pulmonary foreign body granulomatous reaction",
        
        # Pathology-specific synonyms
        "foreign body granulomatous inflammation lung",
        "pulmonary foreign body giant cells",
        "lung aspiration foreign body reaction",
        "foreign body granuloma with polarizable material",
        "pulmonary granulomatous reaction to inhaled material"
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

def parse_arguments():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Download histopathology images for granulomatous lung diseases')
    parser.add_argument('--diseases', nargs='+', choices=list(DISEASES.keys()), 
                        help='Specific diseases to process (default: all)')
    parser.add_argument('--max-images', type=int, default=100, 
                        help='Maximum images per disease (default: 100)')
    parser.add_argument('--no-backup', action='store_true', 
                        help='Skip creating backup of the script')
    parser.add_argument('--min-resolution', type=int, nargs=2, metavar=('WIDTH', 'HEIGHT'),
                        default=[MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT],
                        help='Minimum image resolution (default: 400 300)')
    parser.add_argument('--verbose', action='store_true', 
                        help='Enable verbose logging')
    parser.add_argument('--query-expansion', action='store_true', default=True,
                        help='Use pathology-specific query expansion (default: enabled)')
    return parser.parse_args()

def setup_logging(verbose=False):
    """Set up logging configuration"""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(LOG_DIR / f"scraper_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"),
            logging.StreamHandler()
        ]
    )

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

def is_domain_blocked(url):
    """Check if URL domain is in blocklist"""
    try:
        domain = urlparse(url).netloc.lower()
        return any(blocked in domain for blocked in DOMAIN_BLOCKLIST)
    except:
        return True

def sanitize_filename(filename):
    """Sanitize filename and ensure valid extension"""
    # Remove invalid characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    
    # Ensure it has a valid extension
    name, ext = os.path.splitext(filename.lower())
    if ext not in VALID_EXTENSIONS:
        filename = name + '.jpg'  # Default to jpg
    
    return filename

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
        if "noncaseating" in image_title.lower() or "nonnecrotizing" in image_title.lower():
            features.append("noncaseating")
        if "epithelioid" in image_title.lower():
            features.append("epithelioid")
        if "granulomas" in image_title.lower():
            features.append("granulomas")
        if "schaumann" in image_title.lower():
            features.append("schaumann_bodies")
        if "asteroid" in image_title.lower():
            features.append("asteroid_bodies")
    elif disease == "tuberculosis":
        if "caseating" in image_title.lower():
            features.append("caseating")
        if "necrosis" in image_title.lower():
            features.append("necrosis")
        if "langhans" in image_title.lower() or "giant" in image_title.lower():
            features.append("giant_cells")
        if "afb" in image_title.lower():
            features.append("afb_positive")
    elif disease == "gpa":
        if "necrotizing" in image_title.lower():
            features.append("necrotizing")
        if "vasculitis" in image_title.lower():
            features.append("vasculitis")
        if "geographic" in image_title.lower():
            features.append("geographic_necrosis")
        if "capillaritis" in image_title.lower():
            features.append("capillaritis")
    elif disease == "histoplasmosis":
        if "yeast" in image_title.lower():
            features.append("yeast_forms")
        if "intracellular" in image_title.lower():
            features.append("intracellular")
    elif disease == "cryptococcosis":
        if "capsule" in image_title.lower():
            features.append("capsule")
        if "soap" in image_title.lower():
            features.append("soap_bubble")
    elif disease == "blastomycosis":
        if "broad-based" in image_title.lower():
            features.append("broad_based_budding")
    elif disease == "coccidioidomycosis":
        if "spherules" in image_title.lower():
            features.append("spherules")
    elif disease == "hypersensitivity_pneumonitis":
        if "bronchiolocentric" in image_title.lower():
            features.append("bronchiolocentric")
        if "giant" in image_title.lower():
            features.append("giant_cells")
    elif disease == "berylliosis":
        if "noncaseating" in image_title.lower():
            features.append("noncaseating")
        if "sarcoid" in image_title.lower():
            features.append("sarcoid_like")
    elif disease == "foreign_body":
        if "giant" in image_title.lower():
            features.append("giant_cells")
        if "polarizable" in image_title.lower():
            features.append("polarizable_material")
    
    # Default to disease name if no features found
    if not features:
        features = [disease]
    
    # Format filename
    feature_str = "_".join(features)
    filename = f"{disease}_{feature_str}_{str(index).zfill(2)}.jpg"
    
    return sanitize_filename(filename)

def calculate_file_hash(filepath):
    """Calculate SHA256 hash of a file"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def load_json_file(filepath, default_value=None):
    """Load JSON file with error handling"""
    if filepath.exists():
        try:
            with open(filepath, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logging.warning(f"Could not load {filepath}: {e}")
    
    return default_value or {}

def save_json_file(filepath, data):
    """Save data to JSON file with error handling"""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except IOError as e:
        logging.error(f"Failed to save {filepath}: {e}")
        return False

def is_duplicate_image(filepath, existing_hashes):
    """Check if a file is a duplicate based on its hash"""
    if not filepath.exists():
        return False
    
    file_hash = calculate_file_hash(filepath)
    
    for existing_path, existing_hash in existing_hashes.items():
        if file_hash == existing_hash and Path(existing_path) != filepath:
            logging.info(f"Duplicate detected: {filepath} is the same as {existing_path}")
            return True
    
    return False

def validate_image(image_data, min_width, min_height):
    """Validate image resolution and format"""
    try:
        with Image.open(BytesIO(image_data)) as img:
            width, height = img.size
            if width < min_width or height < min_height:
                logging.debug(f"Image too small: {width}x{height} (minimum: {min_width}x{min_height})")
                return False
            return True
    except Exception as e:
        logging.debug(f"Invalid image format: {e}")
        return False

def get_bing_image_urls(query, max_images=100):
    """Scrape Bing Images for image URLs"""
    image_urls = []
    page = 1
    
    while len(image_urls) < max_images:
        search_url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2&first={page*50}"
        
        try:
            response = requests.get(search_url, headers=get_random_headers(), timeout=15)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            thumbnails = soup.find_all('a', class_='iusc')
            
            if not thumbnails:
                logging.warning(f"No more results found for query: {query}")
                break
            
            for thumb in thumbnails:
                if len(image_urls) >= max_images:
                    break
                
                try:
                    m = thumb.get('m')
                    if not m:
                        continue
                    
                    metadata = json.loads(m)
                    image_url = metadata.get('murl')
                    image_title = metadata.get('t', '')
                    
                    if image_url and image_url.startswith(('http', 'https')):
                        if not is_domain_blocked(image_url):
                            image_urls.append((image_url, image_title))
                except (json.JSONDecodeError, KeyError, AttributeError):
                    continue
            
            page += 1
            time.sleep(random.uniform(3.0, 6.0))
            
        except requests.RequestException as e:
            logging.error(f"Error fetching results for query '{query}': {e}")
            time.sleep(random.uniform(5.0, 8.0))
            continue
    
    return image_urls[:max_images]

def get_google_image_urls(query, max_images=100):
    """Fallback: Scrape Google Images for image URLs"""
    image_urls = []
    
    search_url = f"https://www.google.com/search?q={quote(query)}&tbm=isch"
    
    try:
        response = requests.get(search_url, headers=get_random_headers(), timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find image thumbnails (Google's structure is different)
        thumbnails = soup.find_all('img')
        
        for thumb in thumbnails:
            if len(image_urls) >= max_images:
                break
            
            try:
                image_url = thumb.get('src')
                if image_url and image_url.startswith(('http', 'https', 'data:image')):
                    if not is_domain_blocked(image_url):
                        image_urls.append((image_url, ''))
            except AttributeError:
                continue
        
        time.sleep(random.uniform(3.0, 6.0))
        
    except requests.RequestException as e:
        logging.error(f"Error fetching Google results for query '{query}': {e}")
    
    return image_urls[:max_images]

def download_image(url, filepath, min_width, min_height, max_retries=3):
    """Download an image from URL with validation and retry logic"""
    for attempt in range(max_retries):
        try:
            response = requests.get(url, headers=get_random_headers(), stream=True, timeout=15)
            response.raise_for_status()
            
            # Check content type
            content_type = response.headers.get('content-type', '')
            if not content_type.startswith('image/'):
                logging.warning(f"Skipping non-image content: {url} (Content-Type: {content_type})")
                return False
            
            # Get image data for validation
            image_data = b''
            for chunk in response.iter_content(1024):
                image_data += chunk
            
            # Validate image
            if not validate_image(image_data, min_width, min_height):
                return False
            
            # Save image
            with open(filepath, 'wb') as f:
                f.write(image_data)
            
            return True
            
        except requests.RequestException as e:
            if attempt < max_retries - 1:
                logging.warning(f"Retry {attempt + 1}/{max_retries} for {url}: {e}")
                time.sleep(random.uniform(4.0, 7.0))
            else:
                logging.error(f"Failed to download {url} after {max_retries} attempts: {e}")
                return False

def create_backup():
    """Create a backup of the existing script"""
    current_script = Path(__file__)
    backup_name = f"bing_granuloma_scraper_{datetime.now().strftime('%Y-%m-%d')}_backup.py"
    backup_path = BASE_DIR / backup_name
    
    try:
        shutil.copy2(current_script, backup_path)
        logging.info(f"Created backup: {backup_path}")
        return True
    except Exception as e:
        logging.error(f"Failed to create backup: {e}")
        return False

def main():
    """Main function to orchestrate the scraping process"""
    # Parse command line arguments
    args = parse_arguments()
    
    # Setup logging
    setup_logging(args.verbose)
    
    logging.info("Starting Enhanced Bing Granuloma Histopathology Image Scraper with Pathology Synonyms")
    
    # Create backup if not disabled
    if not args.no_backup:
        create_backup()
    
    # Load existing data
    citations = load_json_file(CITATION_FILE, {})
    existing_hashes = load_json_file(HASH_FILE, {})
    scraped_urls = load_json_file(URL_CACHE_FILE, {})
    
    # Filter diseases if specified
    diseases_to_process = args.diseases if args.diseases else list(DISEASES.keys())
    
    # Track statistics
    total_images = 0
    total_skipped = 0
    total_duplicates = 0
    total_blocked = 0
    
    # Process each disease
    for disease in diseases_to_process:
        if disease not in DISEASES:
            logging.warning(f"Unknown disease: {disease}")
            continue
        
        logging.info(f"Processing disease: {disease}")
        
        # Create directories
        disease_dir = OUTPUT_DIR / disease
        disease_dir.mkdir(exist_ok=True)
        
        for stain in list(STAIN_PATTERNS.keys()) + ["Unclassified"]:
            (disease_dir / stain).mkdir(exist_ok=True)
        
        # Track disease statistics
        disease_images = 0
        disease_skipped = 0
        disease_duplicates = 0
        disease_blocked = 0
        
        # Get queries for this disease
        queries = DISEASES[disease]
        
        # If query expansion is disabled, only use the first 4 core queries
        if not args.query_expansion:
            queries = queries[:4]
            logging.info(f"Query expansion disabled, using {len(queries)} core queries for {disease}")
        else:
            logging.info(f"Using {len(queries)} expanded queries for {disease}")
        
        # Process each query
        for query in queries:
            logging.info(f"Searching for: {query}")
            
            # Try Bing first, then Google as fallback
            image_urls = get_bing_image_urls(query, args.max_images)
            
            if len(image_urls) < args.max_images // 2:
                logging.info(f"Bing returned few results, trying Google as fallback")
                google_urls = get_google_image_urls(query, args.max_images - len(image_urls))
                image_urls.extend(google_urls)
            
            logging.info(f"Found {len(image_urls)} potential images for query: {query}")
            
            # Download images
            for i, (url, title) in enumerate(image_urls):
                # Skip if URL already scraped
                if url in scraped_urls:
                    logging.debug(f"Skipping already scraped URL: {url}")
                    continue
                
                # Check domain blocklist
                if is_domain_blocked(url):
                    logging.debug(f"Skipping blocked domain: {url}")
                    disease_blocked += 1
                    total_blocked += 1
                    continue
                
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
                    scraped_urls[url] = datetime.now().isoformat()
                    continue
                
                # Download image
                if download_image(url, filepath, args.min_resolution[0], args.min_resolution[1]):
                    # Check for duplicates
                    if is_duplicate_image(filepath, existing_hashes):
                        filepath.unlink()
                        disease_duplicates += 1
                        total_duplicates += 1
                        continue
                    
                    # Store hash and citation
                    file_hash = calculate_file_hash(filepath)
                    existing_hashes[str(filepath)] = file_hash
                    scraped_urls[url] = datetime.now().isoformat()
                    
                    citations[str(filepath)] = {
                        "filename": filename,
                        "disease": disease,
                        "stain": stain,
                        "source_url": url,
                        "title": title,
                        "query": query,
                        "download_date": datetime.now().isoformat(),
                        "file_hash": file_hash
                    }
                    
                    logging.info(f"Downloaded: {filename}")
                    disease_images += 1
                    total_images += 1
                else:
                    disease_skipped += 1
                    total_skipped += 1
                
                # Random delay
                time.sleep(random.uniform(1.5, 3.0))
            
            # Delay between queries
            time.sleep(random.uniform(5.0, 8.0))
        
        logging.info(f"Completed {disease}: {disease_images} downloaded, {disease_skipped} skipped, {disease_duplicates} duplicates, {disease_blocked} blocked")
        
        # Save progress
        save_json_file(CITATION_FILE, citations)
        save_json_file(HASH_FILE, existing_hashes)
        save_json_file(URL_CACHE_FILE, scraped_urls)
        
        # Delay between diseases
        time.sleep(random.uniform(8.0, 12.0))
    
    # Final save
    save_json_file(CITATION_FILE, citations)
    save_json_file(HASH_FILE, existing_hashes)
    save_json_file(URL_CACHE_FILE, scraped_urls)
    
    logging.info(f"Scraping complete: {total_images} downloaded, {total_skipped} skipped, {total_duplicates} duplicates, {total_blocked} blocked")
    logging.info(f"Images saved to: {OUTPUT_DIR}")
    logging.info(f"Citations saved to: {CITATION_FILE}")

if __name__ == "__main__":
    main()
