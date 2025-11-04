#!/usr/bin/env python3
"""
Lung Granuloma Types Histopathology Image Scraper (Limited)
Downloads 3-5 histopathology images of different types of lung granulomas from multiple sources
with robust error handling, deduplication, and CLI controls.
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

# Granuloma types with histology-specific query variations
GRANULOMA_TYPES = {
    "noncaseating_granulomas": [
        # Core queries - focused on high-quality histology
        "noncaseating granulomas lung histology H&E",
        "noncaseating granulomas lung biopsy",
        "noncaseating granulomas lung pathology",
        "noncaseating granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "noncaseating granulomas lung epithelioid cells",
        "noncaseating granulomas lung giant cells",
        "noncaseating granulomas lung sarcoidosis",
        "noncaseating granulomas lung beryllium disease",
        "noncaseating granulomas lung H&E stain",
        "noncaseating granulomas lung histopathology",
        "noncaseating granulomas lung microscopic",
        "noncaseating granulomas lung tissue section"
    ],
    "caseating_granulomas": [
        # Core queries - focused on high-quality histology
        "caseating granulomas lung histology H&E",
        "caseating granulomas lung biopsy",
        "caseating granulomas lung pathology",
        "caseating granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "caseating granulomas lung tuberculosis",
        "caseating granulomas lung necrosis",
        "caseating granulomas lung AFB stain",
        "caseating granulomas lung Ziehl-Neelsen",
        "caseating granulomas lung histopathology",
        "caseating granulomas lung tissue section",
        "caseating granulomas lung microscopic",
        "caseating granulomas lung central necrosis"
    ],
    "necrotizing_granulomas": [
        # Core queries - focused on high-quality histology
        "necrotizing granulomas lung histology H&E",
        "necrotizing granulomas lung biopsy",
        "necrotizing granulomas lung pathology",
        "necrotizing granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "necrotizing granulomas lung GPA",
        "necrotizing granulomas lung Wegener's",
        "necrotizing granulomas lung vasculitis",
        "necrotizing granulomas lung geographic necrosis",
        "necrotizing granulomas lung histopathology",
        "necrotizing granulomas lung tissue section",
        "necrotizing granulomas lung microscopic",
        "necrotizing granulomas lung palisading"
    ],
    "foreign_body_granulomas": [
        # Core queries - focused on high-quality histology
        "foreign body granulomas lung histology H&E",
        "foreign body granulomas lung biopsy",
        "foreign body granulomas lung pathology",
        "foreign body granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "foreign body granulomas lung giant cells",
        "foreign body granulomas lung polarizable material",
        "foreign body granulomas lung aspiration",
        "foreign body granulomas lung inhaled material",
        "foreign body granulomas lung histopathology",
        "foreign body granulomas lung tissue section",
        "foreign body granulomas lung microscopic",
        "foreign body granulomas lung polarized light"
    ],
    "infectious_granulomas": [
        # Core queries - focused on high-quality histology
        "infectious granulomas lung histology H&E",
        "infectious granulomas lung biopsy",
        "infectious granulomas lung pathology",
        "infectious granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "infectious granulomas lung fungal",
        "infectious granulomas lung mycobacterial",
        "infectious granulomas lung histoplasmosis",
        "infectious granulomas lung blastomycosis",
        "infectious granulomas lung coccidioidomycosis",
        "infectious granulomas lung cryptococcosis",
        "infectious granulomas lung special stains",
        "infectious granulomas lung GMS stain"
    ],
    "immune_granulomas": [
        # Core queries - focused on high-quality histology
        "immune granulomas lung histology H&E",
        "immune granulomas lung biopsy",
        "immune granulomas lung pathology",
        "immune granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "immune granulomas lung hypersensitivity",
        "immune granulomas lung pneumonitis",
        "immune granulomas lung sarcoidosis",
        "immune granulomas lung berylliosis",
        "immune granulomas lung chronic beryllium disease",
        "immune granulomas lung histopathology",
        "immune granulomas lung tissue section",
        "immune granulomas lung microscopic"
    ],
    "calcified_granulomas": [
        # Core queries - focused on high-quality histology
        "calcified granulomas lung histology H&E",
        "calcified granulomas lung biopsy",
        "calcified granulomas lung pathology",
        "calcified granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "calcified granulomas lung healed TB",
        "calcified granulomas lung old histoplasmosis",
        "calcified granulomas lung dystrophic calcification",
        "calcified granulomas lung histopathology",
        "calcified granulomas lung tissue section",
        "calcified granulomas lung microscopic",
        "calcified granulomas lung calcium deposits",
        "calcified granulomas lung von Kossa stain"
    ],
    "silicotic_granulomas": [
        # Core queries - focused on high-quality histology
        "silicotic granulomas lung histology H&E",
        "silicotic granulomas lung biopsy",
        "silicotic granulomas lung pathology",
        "silicotic granulomas pulmonary histology",
        
        # Pathology-specific synonyms
        "silicotic granulomas lung silica exposure",
        "silicotic granulomas lung hard metal",
        "silicotic granulomas lung polarizable crystals",
        "silicotic granulomas lung concentric fibrosis",
        "silicotic granulomas lung histopathology",
        "silicotic granulomas lung tissue section",
        "silicotic granulomas lung microscopic",
        "silicotic granulomas lung birefringent particles"
    ]
}

# Stain patterns for classification
STAIN_PATTERNS = {
    "H&E": [r"h&e", r"hematoxylin.*eosin", r"h and e", r"he stain"],
    "AFB_Ziehl": [r"afb", r"ziehl.*neelsen", r"acid.*fast", r"mycobacteria"],
    "GMS": [r"gms", r"gomori.*methenamine", r"silver", r"fungal.*silver"],
    "PAS": [r"pas", r"periodic.*acid.*schiff", r"mucopolysaccharide"],
    "Mucicarmine": [r"mucicarmine", r"mucin", r"capsule.*stain"],
    "Trichrome": [r"trichrome", r"masson", r"collagen"],
    "Von_Kossa": [r"von kossa", r"calcium", r"calcification"],
    "Polarized": [r"polarized", r"polarizable", r"birefringent"]
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
    parser = argparse.ArgumentParser(description='Download 3-5 histopathology images of different types of lung granulomas')
    parser.add_argument('--types', nargs='+', choices=list(GRANULOMA_TYPES.keys()), 
                        help='Specific granuloma types to process (default: all)')
    parser.add_argument('--max-images', type=int, default=5, 
                        help='Maximum images per granuloma type (default: 5)')
    parser.add_argument('--min-images', type=int, default=3, 
                        help='Minimum images per granuloma type (default: 3)')
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

def is_histology_image(url, title):
    """Check if the image is likely a histology image based on URL and title"""
    text_to_check = f"{url} {title}".lower()
    
    # Keywords that suggest histology images
    histology_keywords = [
        "histology", "histopathology", "biopsy", "microscopic", "microscope",
        "h&e", "hematoxylin", "eosin", "gms", "pas", "afb", "ziehl",
        "mucicarmine", "trichrome", "stain", "slide", "tissue section",
        "pathology", "cytology", "cell", "nucleus", "cytoplasm"
    ]
    
    # Keywords that suggest non-histology images
    non_histology_keywords = [
        "x-ray", "ct", "mri", "radiology", "clinical", "patient",
        "gross", "macro", "autopsy", "surgical", "endoscopy"
    ]
    
    # Check for histology keywords
    has_histology = any(keyword in text_to_check for keyword in histology_keywords)
    
    # Check for non-histology keywords
    has_non_histology = any(keyword in text_to_check for keyword in non_histology_keywords)
    
    # Return True if it has histology keywords and no non-histology keywords
    return has_histology and not has_non_histology

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

def generate_expert_filename(granuloma_type, stain, image_title, index):
    """Generate expert descriptive filename"""
    # Extract key features from the title
    features = []
    
    # Granuloma type-specific features
    if granuloma_type == "noncaseating_granulomas":
        if "epithelioid" in image_title.lower():
            features.append("epithelioid")
        if "giant" in image_title.lower():
            features.append("giant_cells")
        if "sarcoid" in image_title.lower():
            features.append("sarcoid")
        if "beryllium" in image_title.lower():
            features.append("beryllium")
    elif granuloma_type == "caseating_granulomas":
        if "necrosis" in image_title.lower():
            features.append("necrosis")
        if "tuberculosis" in image_title.lower() or "tb" in image_title.lower():
            features.append("tb")
        if "afb" in image_title.lower():
            features.append("afb_positive")
        if "central" in image_title.lower():
            features.append("central_necrosis")
    elif granuloma_type == "necrotizing_granulomas":
        if "vasculitis" in image_title.lower():
            features.append("vasculitis")
        if "gpa" in image_title.lower() or "wegener" in image_title.lower():
            features.append("gpa")
        if "geographic" in image_title.lower():
            features.append("geographic_necrosis")
        if "palisading" in image_title.lower():
            features.append("palisading")
    elif granuloma_type == "foreign_body_granulomas":
        if "giant" in image_title.lower():
            features.append("giant_cells")
        if "polarizable" in image_title.lower():
            features.append("polarizable")
        if "aspiration" in image_title.lower():
            features.append("aspiration")
    elif granuloma_type == "infectious_granulomas":
        if "fungal" in image_title.lower():
            features.append("fungal")
        if "mycobacterial" in image_title.lower():
            features.append("mycobacterial")
        if "histoplasma" in image_title.lower():
            features.append("histoplasma")
        if "blastomyces" in image_title.lower():
            features.append("blastomyces")
        if "coccidioides" in image_title.lower():
            features.append("coccidioides")
        if "cryptococcus" in image_title.lower():
            features.append("cryptococcus")
    elif granuloma_type == "immune_granulomas":
        if "hypersensitivity" in image_title.lower():
            features.append("hypersensitivity")
        if "pneumonitis" in image_title.lower():
            features.append("pneumonitis")
        if "sarcoid" in image_title.lower():
            features.append("sarcoid")
        if "beryllium" in image_title.lower():
            features.append("beryllium")
    elif granuloma_type == "calcified_granulomas":
        if "calcium" in image_title.lower():
            features.append("calcium")
        if "healed" in image_title.lower():
            features.append("healed")
        if "dystrophic" in image_title.lower():
            features.append("dystrophic")
    elif granuloma_type == "silicotic_granulomas":
        if "silica" in image_title.lower():
            features.append("silica")
        if "hard" in image_title.lower() and "metal" in image_title.lower():
            features.append("hard_metal")
        if "concentric" in image_title.lower():
            features.append("concentric")
        if "birefringent" in image_title.lower():
            features.append("birefringent")
    
    # Default to granuloma type if no features found
    if not features:
        features = [granuloma_type.replace("_", "")]
    
    # Format filename
    feature_str = "_".join(features)
    filename = f"{granuloma_type}_{feature_str}_{str(index).zfill(2)}.jpg"
    
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

def get_bing_image_urls(query, max_images=5):
    """Scrape Bing Images for image URLs - limited to small number"""
    image_urls = []
    page = 1
    
    # Only get first page for small number of images
    search_url = f"https://www.bing.com/images/search?q={quote(query)}&form=HDRSC2&first={page*50}"
    
    try:
        response = requests.get(search_url, headers=get_random_headers(), timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        thumbnails = soup.find_all('a', class_='iusc')
        
        if not thumbnails:
            logging.warning(f"No results found for query: {query}")
            return []
        
        # Only get first few results
        for thumb in thumbnails[:max_images]:
            try:
                m = thumb.get('m')
                if not m:
                    continue
                
                metadata = json.loads(m)
                image_url = metadata.get('murl')
                image_title = metadata.get('t', '')
                
                if image_url and image_url.startswith(('http', 'https')):
                    if not is_domain_blocked(image_url):
                        # Filter for histology images only
                        if is_histology_image(image_url, image_title):
                            image_urls.append((image_url, image_title))
            except (json.JSONDecodeError, KeyError, AttributeError):
                continue
        
        # Short delay for small number of requests
        time.sleep(random.uniform(2.0, 4.0))
        
    except requests.RequestException as e:
        logging.error(f"Error fetching results for query '{query}': {e}")
        time.sleep(random.uniform(3.0, 5.0))
    
    return image_urls[:max_images]

def get_google_image_urls(query, max_images=5):
    """Fallback: Scrape Google Images for image URLs - limited to small number"""
    image_urls = []
    
    search_url = f"https://www.google.com/search?q={quote(query)}&tbm=isch"
    
    try:
        response = requests.get(search_url, headers=get_random_headers(), timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find image thumbnails (Google's structure is different)
        thumbnails = soup.find_all('img')
        
        # Only get first few results
        for thumb in thumbnails[:max_images]:
            try:
                image_url = thumb.get('src')
                if image_url and image_url.startswith(('http', 'https', 'data:image')):
                    if not is_domain_blocked(image_url):
                        # Filter for histology images only
                        if is_histology_image(image_url, ''):
                            image_urls.append((image_url, ''))
            except AttributeError:
                continue
        
        # Short delay for small number of requests
        time.sleep(random.uniform(2.0, 4.0))
        
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
                time.sleep(random.uniform(3.0, 5.0))
            else:
                logging.error(f"Failed to download {url} after {max_retries} attempts: {e}")
                return False

def create_backup():
    """Create a backup of the existing script"""
    current_script = Path(__file__)
    backup_name = f"lung_granuloma_scraper_{datetime.now().strftime('%Y-%m-%d')}_backup.py"
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
    
    # Validate image count
    if args.max_images < args.min_images:
        logging.error("Max images cannot be less than min images")
        sys.exit(1)
    
    # Setup logging
    setup_logging(args.verbose)
    
    logging.info(f"Starting Lung Granuloma Types Histopathology Image Scraper (3-{args.max_images} images per type)")
    
    # Create backup if not disabled
    if not args.no_backup:
        create_backup()
    
    # Load existing data
    citations = load_json_file(CITATION_FILE, {})
    existing_hashes = load_json_file(HASH_FILE, {})
    scraped_urls = load_json_file(URL_CACHE_FILE, {})
    
    # Filter granuloma types if specified
    types_to_process = args.types if args.types else list(GRANULOMA_TYPES.keys())
    
    # Track statistics
    total_images = 0
    total_skipped = 0
    total_duplicates = 0
    total_blocked = 0
    total_non_histology = 0
    
    # Process each granuloma type
    for granuloma_type in types_to_process:
        if granuloma_type not in GRANULOMA_TYPES:
            logging.warning(f"Unknown granuloma type: {granuloma_type}")
            continue
        
        logging.info(f"Processing granuloma type: {granuloma_type}")
        
        # Create directories
        type_dir = OUTPUT_DIR / granuloma_type
        type_dir.mkdir(exist_ok=True)
        
        for stain in list(STAIN_PATTERNS.keys()) + ["Unclassified"]:
            (type_dir / stain).mkdir(exist_ok=True)
        
        # Track type statistics
        type_images = 0
        type_skipped = 0
        type_duplicates = 0
        type_blocked = 0
        type_non_histology = 0
        
        # Get queries for this granuloma type
        queries = GRANULOMA_TYPES[granuloma_type]
        
        # If query expansion is disabled, only use the first 4 core queries
        if not args.query_expansion:
            queries = queries[:4]
            logging.info(f"Query expansion disabled, using {len(queries)} core queries for {granuloma_type}")
        else:
            logging.info(f"Using {len(queries)} expanded queries for {granuloma_type}")
        
        # Collect images from all queries first
        all_image_urls = []
        
        # Process each query to collect URLs
        for query in queries:
            if type_images >= args.max_images:
                break
                
            logging.info(f"Searching for: {query}")
            
            # Try Bing first, then Google as fallback
            image_urls = get_bing_image_urls(query, args.max_images - type_images)
            
            if len(image_urls) < 2 and type_images < args.min_images:
                logging.info(f"Bing returned few results, trying Google as fallback")
                google_urls = get_google_image_urls(query, args.max_images - type_images - len(image_urls))
                image_urls.extend(google_urls)
            
            # Add to collection if we haven't reached max
            for url, title in image_urls:
                if len(all_image_urls) < args.max_images:
                    all_image_urls.append((url, title))
            
            logging.info(f"Found {len(image_urls)} histology images for query: {query}")
            
            # Short delay between queries
            time.sleep(random.uniform(2.0, 4.0))
        
        # Now download the collected images
        for i, (url, title) in enumerate(all_image_urls):
            if type_images >= args.max_images:
                break
            
            # Skip if URL already scraped
            if url in scraped_urls:
                logging.debug(f"Skipping already scraped URL: {url}")
                continue
            
            # Check domain blocklist
            if is_domain_blocked(url):
                logging.debug(f"Skipping blocked domain: {url}")
                type_blocked += 1
                total_blocked += 1
                continue
            
            # Classify stain
            stain = classify_stain(url, title)
            
            # Generate filename
            filename = generate_expert_filename(granuloma_type, stain, title, i + 1)
            filepath = type_dir / stain / filename
            
            # Skip if file already exists
            if filepath.exists():
                logging.debug(f"Skipping existing file: {filename}")
                type_skipped += 1
                total_skipped += 1
                scraped_urls[url] = datetime.now().isoformat()
                continue
            
            # Download image
            if download_image(url, filepath, args.min_resolution[0], args.min_resolution[1]):
                # Check for duplicates
                if is_duplicate_image(filepath, existing_hashes):
                    filepath.unlink()
                    type_duplicates += 1
                    total_duplicates += 1
                    continue
                
                # Store hash and citation
                file_hash = calculate_file_hash(filepath)
                existing_hashes[str(filepath)] = file_hash
                scraped_urls[url] = datetime.now().isoformat()
                
                citations[str(filepath)] = {
                    "filename": filename,
                    "granuloma_type": granuloma_type,
                    "stain": stain,
                    "source_url": url,
                    "title": title,
                    "download_date": datetime.now().isoformat(),
                    "file_hash": file_hash
                }
                
                logging.info(f"Downloaded: {filename}")
                type_images += 1
                total_images += 1
                
                # Stop if we've reached minimum
                if type_images >= args.min_images:
                    logging.info(f"Reached minimum {args.min_images} images for {granuloma_type}")
            else:
                type_skipped += 1
                total_skipped += 1
            
            # Random delay
            time.sleep(random.uniform(1.0, 2.0))
        
        logging.info(f"Completed {granuloma_type}: {type_images} downloaded, {type_skipped} skipped, {type_duplicates} duplicates, {type_blocked} blocked")
        
        # Save progress
        save_json_file(CITATION_FILE, citations)
        save_json_file(HASH_FILE, existing_hashes)
        save_json_file(URL_CACHE_FILE, scraped_urls)
        
        # Short delay between granuloma types
        time.sleep(random.uniform(3.0, 5.0))
    
    # Final save
    save_json_file(CITATION_FILE, citations)
    save_json_file(HASH_FILE, existing_hashes)
    save_json_file(URL_CACHE_FILE, scraped_urls)
    
    logging.info(f"Scraping complete: {total_images} downloaded, {total_skipped} skipped, {total_duplicates} duplicates, {total_blocked} blocked")
    logging.info(f"Images saved to: {OUTPUT_DIR}")
    logging.info(f"Citations saved to: {CITATION_FILE}")

if __name__ == "__main__":
    main()