#!/bin/bash
# Recursively walk backward through git history
# Auto-starts Vite/npm dev server for visual inspection

set -e

if [ ! -d .git ]; then
  echo "❌ Run this from your project's root directory (where .git exists)."
  exit 1
fi

# --- CONFIG ---
APP_URL="http://localhost:5173"        # Change if using a different dev port
START_CMD="npm run dev"                # Or "vite", "yarn dev", etc.
BRANCH_TO_RETURN="main"                # Where to return after quitting
# ---------------

echo "🔍 Starting visual Git history explorer..."
echo "Each step will check out the previous commit, start your app, and open the browser."
echo "You can visually confirm when you’ve reached the right version."
echo

TOTAL=$(git rev-list --count HEAD)
CURRENT=1

# Keep track of server process ID
SERVER_PID=0

while [ "$CURRENT" -le "$TOTAL" ]; do
  COMMIT=$(git rev-list HEAD -n 1 --skip=$((CURRENT-1)))
  MSG=$(git log -1 --pretty=format:"%h - %s" $COMMIT)

  echo
  echo "------------------------------------------------------------"
  echo "🔁 Checking out commit $CURRENT/$TOTAL: $MSG"
  echo "------------------------------------------------------------"

  git checkout $COMMIT --quiet

  # Kill any existing dev server
  if [ "$SERVER_PID" -ne 0 ] && ps -p $SERVER_PID > /dev/null 2>&1; then
    echo "🛑 Stopping previous dev server (PID: $SERVER_PID)..."
    kill $SERVER_PID 2>/dev/null || true
    sleep 1
  fi

  # Start the dev server in background
  echo "🚀 Starting dev server..."
  ($START_CMD > /dev/null 2>&1 &) 
  SERVER_PID=$!

  # Wait a few seconds for it to start
  echo "⏳ Waiting for server to initialize..."
  sleep 5

  # Open browser automatically
  echo "🌐 Opening browser to $APP_URL"
  open "$APP_URL" 2>/dev/null || xdg-open "$APP_URL" 2>/dev/null || true

  echo
  echo "✅ Repo is now at $MSG"
  echo "Visually inspect the app (it’s running at $APP_URL)."
  echo
  read -p "Enter [k]eep / [b]ack one more / [q]uit: " ANSWER

  case $ANSWER in
    k|K)
      echo "✨ Keeping this version."
      read -p "Enter new branch name (default: restore-found-version): " BRANCH
      BRANCH=${BRANCH:-restore-found-version}
      git switch -c "$BRANCH"
      echo "✅ Created branch '$BRANCH' at $MSG."
      [ "$SERVER_PID" -ne 0 ] && kill $SERVER_PID 2>/dev/null || true
      exit 0
      ;;
    b|B)
      echo "🔙 Moving one commit further back..."
      ((CURRENT++))
      ;;
    q|Q)
      echo "🚪 Exiting and returning to $BRANCH_TO_RETURN..."
      git switch "$BRANCH_TO_RETURN" --quiet
      [ "$SERVER_PID" -ne 0 ] && kill $SERVER_PID 2>/dev/null || true
      exit 0
      ;;
    *)
      echo "Invalid input. Type k, b, or q."
      ;;
  esac
done

echo "🏁 Reached the beginning of history."
git switch "$BRANCH_TO_RETURN" --quiet
[ "$SERVER_PID" -ne 0 ] && kill $SERVER_PID 2>/dev/null || true
