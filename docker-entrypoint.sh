#!/bin/sh
set -eu

repo_url="${KNIT_CONFIG_REPO_URL:?KNIT_CONFIG_REPO_URL is required}"
repo_ref="${KNIT_CONFIG_REPO_REF:-main}"
repo_path="${KNIT_CONFIG_REPO_PATH:-./repos}"
key_file="${KNIT_CONFIG_DEPLOY_KEY_FILE:-/run/secrets/knit_configs_deploy_key}"
hosts_file="${KNIT_CONFIG_KNOWN_HOSTS_FILE:-/run/secrets/knit_known_hosts}"
age_identity="${KNIT_AGE_IDENTITY_FILE:-/run/secrets/knit_configs_age_key}"

[ -r "$key_file" ] || { echo "missing config repository deploy key: $key_file" >&2; exit 1; }
[ -r "$hosts_file" ] || { echo "missing SSH known_hosts file: $hosts_file" >&2; exit 1; }
[ -r "$age_identity" ] || { echo "missing age identity file: $age_identity" >&2; exit 1; }

install -d -m 0700 "$(dirname "$repo_path")"
export GIT_SSH_COMMAND="ssh -i $key_file -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$hosts_file"

if [ -d "$repo_path/.git" ]; then
  git -C "$repo_path" fetch origin "$repo_ref"
  git -C "$repo_path" reset --hard "origin/$repo_ref"
else
  rm -rf "$repo_path"
  git clone --branch "$repo_ref" --single-branch "$repo_url" "$repo_path"
fi

# Materialize encrypted SSH support files only in the local runtime checkout.
find "$repo_path" -type f -name '*.age' -path '*/ssh/*' -print0 | while IFS= read -r -d '' encrypted; do
  plaintext="${encrypted%.age}"
  temporary="${plaintext}.tmp.$$"
  age --decrypt --identity "$age_identity" "$encrypted" > "$temporary"
  chmod 0600 "$temporary"
  mv -f "$temporary" "$plaintext"
done


exec node /opt/knit/knit.mjs
