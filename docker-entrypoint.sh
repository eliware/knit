#!/bin/sh
set -eu

app_url="${KNIT_APP_REPO_URL:-https://github.com/eliware/knit.git}"
app_ref="${KNIT_APP_REPO_REF:-main}"
app_path="${KNIT_APP_REPO_PATH:-/opt/knit}"
repo_url="${KNIT_CONFIG_REPO_URL:?KNIT_CONFIG_REPO_URL is required}"
repo_ref="${KNIT_CONFIG_REPO_REF:-main}"
repo_path="${KNIT_CONFIG_REPO_PATH:-/opt/knit/repos}"
key_file="${KNIT_CONFIG_DEPLOY_KEY_FILE:-/run/secrets/knit_configs_deploy_key}"
hosts_file="${KNIT_CONFIG_KNOWN_HOSTS_FILE:-/run/secrets/knit_known_hosts}"
age_identity="${KNIT_AGE_IDENTITY_FILE:-/run/secrets/knit_configs_age_key}"

[ -r "$key_file" ] || { echo "missing config repository deploy key: $key_file" >&2; exit 1; }
[ -r "$hosts_file" ] || { echo "missing SSH known_hosts file: $hosts_file" >&2; exit 1; }
[ -r "$age_identity" ] || { echo "missing age identity file: $age_identity" >&2; exit 1; }

clone_or_update() {
  url="$1"; ref="$2"; path="$3"
  if [ -d "$path/.git" ]; then
    git -C "$path" fetch origin "$ref"
    git -C "$path" reset --hard "origin/$ref"
  else
    rm -rf "$path"
    git clone --branch "$ref" --single-branch "$url" "$path"
  fi
}

install -d -m 0700 "$(dirname "$app_path")" "$(dirname "$repo_path")"
clone_or_update "$app_url" "$app_ref" "$app_path"

cd "$app_path"
npm install --silent

export GIT_SSH_COMMAND="ssh -i $key_file -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$hosts_file"
clone_or_update "$repo_url" "$repo_ref" "$repo_path"

# Materialize encrypted SSH support files only in the local runtime checkout.
find "$repo_path" -type f -name '*.age' -path '*/ssh/*' -print0 | while IFS= read -r -d '' encrypted; do
  plaintext="${encrypted%.age}"
  temporary="${plaintext}.tmp.$$"
  age --decrypt --identity "$age_identity" "$encrypted" > "$temporary"
  chmod 0600 "$temporary"
  mv -f "$temporary" "$plaintext"
done

exec node "$app_path/knit.mjs"
