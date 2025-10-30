#!/bin/bash

# Base directory to map
BASE_DIR="/Users/skim4/Documents/GitHub/FellowshipWorkflows/Didactic_Series/"

# Check if directory exists
if [ ! -d "$BASE_DIR" ]; then
  echo "Directory does not exist: $BASE_DIR"
  exit 1
fi

echo "📁 Directory Map for: $BASE_DIR"
echo "------------------------------------"

# Recursive directory listing function
print_tree() {
  local directory=$1
  local prefix=$2

  # List all items
  local items=("$directory"/*)
  for item in "${items[@]}"; do
    if [ -d "$item" ]; then
      echo "${prefix}📂 $(basename "$item")/"
      print_tree "$item" "$prefix    "
    elif [ -f "$item" ]; then
      echo "${prefix}📄 $(basename "$item")"
    fi
  done
}

# Start tree print
print_tree "$BASE_DIR" ""
