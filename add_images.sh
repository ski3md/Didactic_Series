#!/usr/bin/env bash
# Script to add images to the granulomas directory

set -euo pipefail

# Define colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Target directory
TARGET_DIR="src/assets/images/granulomas"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Display help
show_help() {
    echo "Usage: $0 [OPTION]... [SOURCE]..."
    echo "Add images to the granulomas directory for manifest generation."
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -d, --directory DIR Add all images from directory DIR"
    echo "  -r, --recursive     When used with -d, copy directories recursively"
    echo "  -f, --file FILE     Add specific image file FILE"
    echo "  -l, --list          List current images in granulomas directory"
    echo "  -c, --clear         Clear all images from granulomas directory"
    echo ""
    echo "Examples:"
    echo "  $0 -d /path/to/images               # Add all images from a directory"
    echo "  $0 -d /path/to/images -r            # Add all images recursively"
    echo "  $0 -f /path/to/image.jpg            # Add a specific image"
    echo "  $0 -f img1.jpg -f img2.png          # Add multiple specific images"
    echo "  $0 -l                               # List current images"
    echo "  $0 -c                               # Clear all images"
}

# List current images
list_images() {
    print_info "Current images in $TARGET_DIR:"
    
    if [ ! -d "$TARGET_DIR" ] || [ -z "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
        print_warning "No images found in $TARGET_DIR"
        return
    fi
    
    find "$TARGET_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.tif" -o -name "*.tiff" -o -name "*.svs" \) | sort | while read -r img; do
        echo "  $(basename "$img")"
    done
    
    # Count images
    local count
    count=$(find "$TARGET_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.tif" -o -name "*.tiff" -o -name "*.svs" \) | wc -l)
    echo ""
    print_info "Total: $count image(s)"
}

# Clear all images
clear_images() {
    if [ ! -d "$TARGET_DIR" ] || [ -z "$(ls -A "$TARGET_DIR" 2>/dev/null)" ]; then
        print_warning "No images found in $TARGET_DIR"
        return
    fi
    
    read -p "Are you sure you want to delete all images in $TARGET_DIR? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Operation cancelled."
        return
    fi
    
    find "$TARGET_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.tif" -o -name "*.tiff" -o -name "*.svs" \) -delete
    print_success "All images cleared from $TARGET_DIR"
}

# Add images from directory
add_from_directory() {
    local dir="$1"
    local recursive="$2"
    
    if [ ! -d "$dir" ]; then
        print_error "Directory not found: $dir"
        return 1
    fi
    
    local count=0
    local find_cmd="find \"$dir\" -type f \( -name \"*.jpg\" -o -name \"*.jpeg\" -o -name \"*.png\" -o -name \"*.tif\" -o -name \"*.tiff\" -o -name \"*.svs\" \)"
    
    if [ "$recursive" = "true" ]; then
        find_cmd="$find_cmd"
    else
        find_cmd="$find_cmd -maxdepth 1"
    fi
    
    print_info "Copying images from $dir to $TARGET_DIR..."
    
    while IFS= read -r -d '' img; do
        local filename
        filename=$(basename "$img")
        cp "$img" "$TARGET_DIR/"
        echo "  Added: $filename"
        ((count++))
    done < <(eval "$find_cmd -print0")
    
    if [ "$count" -gt 0 ]; then
        print_success "Copied $count image(s) to $TARGET_DIR"
    else
        print_warning "No images found in $dir"
    fi
}

# Add specific file
add_file() {
    local file="$1"
    
    if [ ! -f "$file" ]; then
        print_error "File not found: $file"
        return 1
    fi
    
    local filename
    filename=$(basename "$file")
    local ext="${filename##*.}"
    local ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    
    # Check if file is an image
    if [[ ! "$ext_lower" =~ ^(jpg|jpeg|png|tif|tiff|svs)$ ]]; then
        print_error "Not a supported image format: $file"
        return 1
    fi
    
    cp "$file" "$TARGET_DIR/"
    print_success "Added: $filename"
}

# Main script
main() {
    # If no arguments, show help
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # Parse arguments
    local action=""
    local sources=()
    local recursive=false
    
    while [ $# -gt 0 ]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--directory)
                action="directory"
                sources+=("$2")
                shift 2
                ;;
            -r|--recursive)
                recursive=true
                shift
                ;;
            -f|--file)
                action="file"
                sources+=("$2")
                shift 2
                ;;
            -l|--list)
                list_images
                exit 0
                ;;
            -c|--clear)
                clear_images
                exit 0
                ;;
            *)
                # If it's a file or directory, add it to sources
                if [ -f "$1" ] || [ -d "$1" ]; then
                    sources+=("$1")
                else
                    print_error "Invalid option or file not found: $1"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    # If no action specified but sources provided, try to determine action
    if [ -z "$action" ] && [ ${#sources[@]} -gt 0 ]; then
        if [ -f "${sources[0]}" ]; then
            action="file"
        elif [ -d "${sources[0]}" ]; then
            action="directory"
        fi
    fi
    
    # Process sources based on action
    case "$action" in
        "directory")
            for src in "${sources[@]}"; do
                add_from_directory "$src" "$recursive"
            done
            ;;
        "file")
            for src in "${sources[@]}"; do
                add_file "$src"
            done
            ;;
        *)
            print_error "No valid action specified"
            show_help
            exit 1
            ;;
    esac
    
    # List final result
    echo ""
    list_images
}

# Run main function with all arguments
main "$@"