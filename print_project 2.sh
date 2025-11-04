#!/bin/bash
# ------------------------------------------------------------------
# Script: print_project_dir.sh
# Purpose: Print the current project directory and metadata
# Usage: ./print_project_dir.sh
# ------------------------------------------------------------------

# Resolve the absolute path of the script, even if symlinked
SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"

# Get the directory the script is in
PROJECT_DIR="$(dirname "$SCRIPT_PATH")"

# Get just the project folder name
PROJECT_NAME="$(basename "$PROJECT_DIR")"

# Get the parent directory
PARENT_DIR="$(dirname "$PROJECT_DIR")"

echo "----------------------------------------------------------"
echo "📂 Project Directory Information"
echo "----------------------------------------------------------"
echo "📘 Project Name:     $PROJECT_NAME"
echo "📁 Project Path:     $PROJECT_DIR"
echo "⬆️  Parent Directory: $PARENT_DIR"
echo "👤 User:             $(whoami)"
echo "🕒 Timestamp:        $(date)"
echo "----------------------------------------------------------"