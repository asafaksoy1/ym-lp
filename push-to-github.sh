#!/usr/bin/env bash
# Pushes the COMPLETE project to GitHub, replacing whatever is there now.
#
# Why you need this: the files uploaded through the GitHub web page only included
# the 4 root files. Folders (mx/, br/, assets/, api/) were left behind, which is
# why /mx and /br return 404. Dragging folders into GitHub's web uploader does not
# work reliably — this pushes everything properly over git.
#
#   1. Make a token:  https://github.com/settings/tokens/new
#      Tick ONLY the "repo" scope. 7 days expiry is plenty.
#   2. Run:           ./push-to-github.sh
#   3. Paste the token when asked (hidden, never leaves this machine).
#
# Vercel is already connected to the repo, so it redeploys by itself within a
# minute of the push. No Vercel settings to change.

set -euo pipefail

REPO_NAME="${1:-ym-lp}"
cd "$(dirname "$0")"

if [ -n "${GITHUB_TOKEN:-}" ]; then
  TOKEN="$GITHUB_TOKEN"
else
  printf 'GitHub token (input hidden): '
  read -rs TOKEN
  printf '\n'
fi

[ -n "$TOKEN" ] || { echo "No token given. Aborting." >&2; exit 1; }

api() { curl -fsS -H "Authorization: token $TOKEN" -H "Accept: application/vnd.github+json" "$@"; }

echo "→ Checking the token…"
USER_LOGIN=$(api https://api.github.com/user | sed -n 's/.*"login"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -1)
[ -n "$USER_LOGIN" ] || { echo "Token rejected. Does it have the 'repo' scope?" >&2; exit 1; }
echo "  authenticated as: $USER_LOGIN"

echo "→ Repository '$REPO_NAME'…"
if api "https://api.github.com/repos/$USER_LOGIN/$REPO_NAME" >/dev/null 2>&1; then
  echo "  exists — its current contents will be replaced by this folder"
else
  api -X POST https://api.github.com/user/repos \
    -d "{\"name\":\"$REPO_NAME\",\"private\":false,\"description\":\"Young Master Challenge — Meta Ads landing pages for Mexico (es-MX) and Brazil (pt-BR)\"}" \
    >/dev/null
  echo "  created"
fi

echo "→ Pushing $(git ls-files | wc -l | tr -d ' ') files…"
git remote remove origin 2>/dev/null || true
git remote add origin "https://${USER_LOGIN}:${TOKEN}@github.com/${USER_LOGIN}/${REPO_NAME}.git"
git branch -M main
# The web upload created an unrelated commit; this replaces it with the real tree.
git push -u origin main --force --quiet

git remote set-url origin "https://github.com/${USER_LOGIN}/${REPO_NAME}.git"

echo "→ Verifying what landed on GitHub…"
sleep 2
COUNT=$(curl -fsS "https://api.github.com/repos/$USER_LOGIN/$REPO_NAME/git/trees/main?recursive=1" \
  | grep -c '"path"' || echo 0)
echo "  $COUNT entries now in the repo"
for want in mx/index.html br/index.html assets/css/site.css api/lead.js; do
  if curl -fsS -o /dev/null "https://api.github.com/repos/$USER_LOGIN/$REPO_NAME/contents/$want?ref=main"; then
    echo "  ok      $want"
  else
    echo "  MISSING $want"
  fi
done

echo
echo "Done. Vercel redeploys automatically in about a minute:"
echo "  https://ym-lp.vercel.app/mx"
echo "  https://ym-lp.vercel.app/br"
