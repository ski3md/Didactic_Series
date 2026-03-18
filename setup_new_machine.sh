#!/bin/bash
# ------------------------------------------------------------
# setup_new_machine.sh
# Auto-setup script for ski3md/Didactic_Series
# ------------------------------------------------------------

set -e  # Exit immediately on error

# === CONFIG ===
GITHUB_USER="ski3md"
REPO_NAME="Didactic_Series"
BASE_DIR="$HOME/Documents/GitHub/FellowshipWorkflows"
TARGET_DIR="$BASE_DIR/$REPO_NAME"

echo "🧭 Setting up environment for $GITHUB_USER/$REPO_NAME..."
mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

# --- Verify dependencies ---
if ! command -v git >/dev/null 2>&1; then
  echo "❌ Git not installed. Please install Git first."; exit 1;
fi
if ! command -v gh >/dev/null 2>&1; then
  echo "❌ GitHub CLI (gh) not installed. Please install with: brew install gh"; exit 1;
fi
if ! command -v npm >/dev/null 2>&1; then
  echo "❌ Node/NPM not found. Install Node.js first."; exit 1;
fi

# --- GitHub login ---
echo "🔐 Checking GitHub authentication..."
if ! gh auth status >/dev/null 2>&1; then
  echo "Logging into GitHub..."
  gh auth login
else
  echo "✓ Already authenticated as $(gh api user | jq -r .login 2>/dev/null || echo "$GITHUB_USER")"
fi

# --- Backup old repo if exists ---
if [ -d "$TARGET_DIR" ]; then
  BACKUP_DIR="${TARGET_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
  echo "⚠️ Existing repo found at $TARGET_DIR"
  echo "📦 Moving it to $BACKUP_DIR"
  mv "$TARGET_DIR" "$BACKUP_DIR"
fi

# --- Clone fresh repo ---
echo "⬇️ Cloning latest $GITHUB_USER/$REPO_NAME..."
gh repo clone "$GITHUB_USER/$REPO_NAME" "$TARGET_DIR"
cd "$TARGET_DIR"

# --- Install dependencies ---
echo "📦 Installing npm dependencies..."
npm install

# --- Verify setup ---
echo "✅ Repo cloned successfully!"
git remote -v

echo ""
echo "🚀 To start development server:"
echo "cd $TARGET_DIR"
echo "npm run dev"
echo ""
echo "🧩 Local URL: http://localhost:5173"
echo "✨ Done!"
