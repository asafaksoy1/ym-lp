#!/usr/bin/env bash
# Creates the GitHub repo and pushes this project to it.
#
#   1. Make a token:  https://github.com/settings/tokens/new
#      Tick ONLY the "repo" scope. Expiry 7 days is plenty.
#   2. Run:           ./push-to-github.sh
#   3. Paste the token when asked (it is not echoed, and never leaves this machine).
#
# Then import the repo at https://vercel.com/new — Vercel needs no settings,
# the project is zero-config.

set -euo pipefail

REPO_NAME="${1:-youngmaster-latam}"
cd "$(dirname "$0")"

if [ -n "${GITHUB_TOKEN:-}" ]; then
  TOKEN="$GITHUB_TOKEN"
else
  printf 'GitHub token (input hidden): '
  read -rs TOKEN
  printf '\n'
fi

if [ -z "$TOKEN" ]; then
  echo "No token given. Aborting." >&2
  exit 1
fi

api() { curl -fsS -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" "$@"; }

echo "→ Checking the token…"
USER_LOGIN=$(api https://api.github.com/user | sed -n 's/.*"login"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
if [ -z "$USER_LOGIN" ]; then
  echo "Token rejected by GitHub. Check that it has the 'repo' scope." >&2
  exit 1
fi
echo "  authenticated as: $USER_LOGIN"

echo "→ Creating repository '$REPO_NAME'…"
if api "https://api.github.com/repos/$USER_LOGIN/$REPO_NAME" >/dev/null 2>&1; then
  echo "  already exists — reusing it"
else
  api -X POST https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"private\":true,\"description\":\"Young Master Challenge — Meta Ads landing pages for Mexico (es-MX) and Brazil (pt-BR)\"}" \
    >/dev/null
  echo "  created (private)"
fi

echo "→ Pushing…"
git remote remove origin 2>/dev/null || true
git remote add origin "https://${USER_LOGIN}:${TOKEN}@github.com/${USER_LOGIN}/${REPO_NAME}.git"
git branch -M main
git push -u origin main --quiet

# Don't leave the token sitting in .git/config
git remote set-url origin "https://github.com/${USER_LOGIN}/${REPO_NAME}.git"

echo
echo "Done."
echo "  Repo:   https://github.com/${USER_LOGIN}/${REPO_NAME}"
echo "  Deploy: https://vercel.com/new  → Import Git Repository → pick ${REPO_NAME} → Deploy"
echo
echo "Vercel needs no build settings. After it deploys you get /mx and /br."
