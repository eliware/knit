#!/bin/sh
set -eu

repo_url="${KNIT_CONFIG_REPO_URL:?KNIT_CONFIG_REPO_URL is required}"
repo_ref="${KNIT_CONFIG_REPO_REF:-main}"
repo_path="${KNIT_CONFIG_REPO_PATH:-./repos}"
key_file="${KNIT_CONFIG_DEPLOY_KEY_FILE:-/root/.ssh/knit-configs-deploy}"
hosts_file="${KNIT_CONFIG_KNOWN_HOSTS_FILE:-/root/.ssh/known_hosts}"

[ -r "$key_file" ] || { echo "missing config repository deploy key: $key_file" >&2; exit 1; }
[ -r "$hosts_file" ] || { echo "missing SSH known_hosts file: $hosts_file" >&2; exit 1; }

install -d -m 0700 "$(dirname "$repo_path")"
export GIT_SSH_COMMAND="ssh -i $key_file -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$hosts_file"

if [ -d "$repo_path/.git" ]; then
  if [ "$(git -C "$repo_path" rev-parse --is-shallow-repository 2>/dev/null || echo false)" = true ]; then
    git -C "$repo_path" fetch --unshallow origin "$repo_ref"
  else
    git -C "$repo_path" fetch origin "$repo_ref"
  fi
  git -C "$repo_path" reset --hard "origin/$repo_ref"
else
  rm -rf "$repo_path"
  git clone --branch "$repo_ref" --single-branch "$repo_url" "$repo_path"
fi
