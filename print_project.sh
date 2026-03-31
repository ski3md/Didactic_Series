#!/bin/bash
# ------------------------------------------------------------------
# Script: print_project_dir.sh
# Purpose: Print project directory info with Git metadata
# Usage: ./print_project_dir.sh
# ------------------------------------------------------------------

# Resolve absolute path of the script (works on macOS & Linux)
SCRIPT_PATH="$(readlink -f "$0" 2>/dev/null || realpath "$0" 2>/dev/null || echo "$0")"

# Get the directory the script is in
PROJECT_DIR="$(dirname "$SCRIPT_PATH")"
PROJECT_NAME="$(basename "$PROJECT_DIR")"
PARENT_DIR="$(dirname "$PROJECT_DIR")"

# ------------------------------------------------------------------
# Gather Git information if this is a Git repository
# ------------------------------------------------------------------
if git -C "$PROJECT_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  GIT_BRANCH="$(git -C "$PROJECT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null)"
  GIT_REMOTE="$(git -C "$PROJECT_DIR" config --get remote.origin.url 2>/dev/null)"
  GIT_STATUS="$(git -C "$PROJECT_DIR" status --porcelain 2>/dev/null)"
  if [[ -n "$GIT_STATUS" ]]; then
    GIT_DIRTY_STATE="⚠️  Uncommitted changes"
  else
    GIT_DIRTY_STATE="✅ Clean working tree"
  fi
else
  GIT_BRANCH="(not a Git repository)"
  GIT_REMOTE="N/A"
  GIT_DIRTY_STATE="N/A"
fi

# ------------------------------------------------------------------
# Print results
# ------------------------------------------------------------------
echo "----------------------------------------------------------"
echo "📂 Project Directory Information"
echo "----------------------------------------------------------"
echo "📘 Project Name:       $PROJECT_NAME"
echo "📁 Project Path:       $PROJECT_DIR"
echo "⬆️  Parent Directory:   $PARENT_DIR"
echo "👤 User:               $(whoami)"
echo "🕒 Timestamp:          $(date)"
echo "----------------------------------------------------------"
echo "🔧 Git Information"
echo "----------------------------------------------------------"
echo "🌿 Current Branch:     $GIT_BRANCH"
echo "🌐 Remote Origin:      $GIT_REMOTE"
echo "📊 Repo Status:        $GIT_DIRTY_STATE"
echo "----------------------------------------------------------"