# Knit configuration guide for coding agents

This guide is for an AI coding agent adding or reviewing a repository's Knit workflow. Knit is a signed GitHub webhook service: it fetches `.knit/deploy.yaml` at the webhook commit, selects an action, and runs that action over SSH on a trusted target. The repository owns workflow behavior; GitOps owns target connection details, credentials, host verification, and authorization.

## Fast path

1. Confirm the repository has a supported target in GitOps and an absolute working directory within that target's allowed root.
2. Add `.knit/deploy.yaml` with `version: 1`, a `push` action, and one or more deployments.
3. Keep commands deterministic, non-interactive, idempotent, and safe to retry.
4. Run all validation in a reviewed repository script when the command set becomes more than a few simple commands.
5. Test locally, inspect the command output, and document any required target tools.

## Minimal workflow

```yaml
version: 1
on:
  push:
    deployments:
      - target: dev
        cwd: /opt/example
        commands:
          - git pull --ff-only
          - npm ci
          - npm test
```

Required fields are `version: 1`, `on.push.deployments`, `target`, absolute `cwd`, and a non-empty `commands` list. Deployments run in declaration order. The target name must exist in the trusted GitOps inventory, and restricted targets must authorize the repository.

Use a separate tag action when release behavior differs:

```yaml
on:
  push:
    deployments:
      - target: dev
        cwd: /opt/example
        commands: [.knit/ci.sh]
  tags:
    "v*":
      deployments:
        - target: dev
          cwd: /opt/example
          commands: [.knit/release.sh]
```

Tags do not fall back to the push action. A matching tag action is selected only for the supported `v*` patterns.

## Discord activity during runs

Knit displays `🧶 knit v<version>` while idle. For an active webhook it shows:

- `⏳ knitting <repository>` while processing
- `✅ <repository> success` after successful completion
- `❌ <repository> failure` when validation, routing, deployment, or notification handling fails
- `ℹ️ <repository> ignored` when an unmatched tag is intentionally skipped

Presence updates are throttled to Discord's five updates per 20 seconds presence limit. Knit waits for capacity rather than discarding the webhook start or terminal result. Terminal updates are correlated to the active delivery, so a stale completion cannot replace a newer delivery's state. The version activity is restored after ten minutes with no active work. Workflow scripts must not depend on presence transitions; deployment results and Discord notifications remain authoritative.

## Command execution

Knit sends the command list to `@eliware/ssh-client`. Each command is executed sequentially through the remote user's shell, with the deployment cwd prepended. Shell features such as pipes, redirection, command substitution, temporary files, and multiline syntax are available. Quote data supplied by a webhook or repository file before using it in shell commands.

The SSH client collects stdout/stderr and exit codes. A nonzero result makes the deployment fail. Knit preserves its existing retry behavior for failed webhook processing, and `stopOnError` controls whether later targets run. Commands within one deployment should explicitly short-circuit when needed, for example:

```yaml
commands:
  - set -eu; .knit/validate.sh
```

Prefer a committed script for complex logic. Use `set -eu`, quote variables, install cleanup traps, avoid interactive prompts, and return nonzero for every validation failure.

## Webhook metadata

Every SSH command receives these environment variables. Knit passes them as SSH environment values and also safely exports them in the remote shell because target `sshd` configurations may reject arbitrary `AcceptEnv` values. No arbitrary environment variables or secrets are interpolated:

| Variable | Meaning |
|---|---|
| `KNIT_COMMIT_SHA` | Exact 40-character GitHub webhook `after` SHA; empty if absent or malformed |
| `KNIT_REPOSITORY` | Full name such as `eliware/gitops-k8s` |
| `KNIT_REF` | Ref such as `refs/heads/main` |
| `KNIT_EVENT` | GitHub event type, normally `push` |
| `KNIT_DELIVERY_ID` | Webhook correlation ID; never source identity |

The SHA is not the current branch tip and must not be replaced with the result of `git pull`. For exact-commit validation, fetch and use the SHA in a temporary worktree:

```bash
#!/usr/bin/env bash
set -eu
: "${KNIT_COMMIT_SHA:?KNIT_COMMIT_SHA is required}"
if [ "${#KNIT_COMMIT_SHA}" -ne 40 ] || [[ "$KNIT_COMMIT_SHA" =~ [^0123456789abcdefABCDEF] ]]; then
  echo 'invalid KNIT_COMMIT_SHA' >&2; exit 2
fi
workdir="$(mktemp -d)"
cleanup() { git worktree remove --force "$workdir" >/dev/null 2>&1 || true; rm -rf "$workdir"; }
trap cleanup EXIT
git fetch --no-tags origin "$KNIT_COMMIT_SHA"
git worktree add --detach "$workdir" "$KNIT_COMMIT_SHA"
"$workdir/.knit/validate-gitops-at-commit.sh"
```

The example intentionally validates the commit before running repository code. A production script should use a robust SHA length check (40 hexadecimal characters), avoid printing tokens, and set its own deadline.

## Timeouts

Set `timeoutMs` on a deployment to bound each remote command:

```yaml
deployments:
  - target: dev
    cwd: /opt/example
    timeoutMs: 300000
    commands: [.knit/validate.sh]
```

The allowed range is 1–300000 milliseconds. The timeout applies to each command, not the entire deployment, so a script should also enforce one overall deadline when it polls Argo. A timeout fails the deployment and follows normal retry handling.

## GitOps/Kubernetes validation scripts

For GitOps repositories, keep the YAML workflow small and put reviewed logic in `.knit/validate-gitops.sh`. Use an explicit trusted application-to-path map committed in GitOps. Do not infer arbitrary Argo ownership from repository layout.

A safe validation script should:

- operate on the exact `KNIT_COMMIT_SHA` in a disposable worktree;
- identify only changed paths and map them to affected Applications;
- render affected Kustomize paths;
- run `kubectl apply --dry-run=server` only;
- poll only affected Argo Applications until `Synced` and `Healthy`;
- enforce a bounded deadline and clean up temporary worktrees;
- never run live `kubectl apply`, bootstrap, recovery, or destructive commands;
- return nonzero for render, API validation, polling, permission, or convergence failures.

On the current `dev` target, useful tools include Bash, Node.js 26, Python 3.12, Git, `kubectl`, Kustomize, Helm, Argo CD CLI, `jq`, `curl`, `rsync`, and standard Unix utilities. Tool availability is a target property and can change; scripts should check required commands early and fail with a clear message. `yq` is not installed on the current target.

## Secrets and safety

Never commit tokens, private keys, kubeconfigs, webhook secrets, or Discord credentials. These belong in runtime Secrets or trusted GitOps configuration. Do not put secrets in workflow environment variables or command arguments. Do not echo the process environment.

Knit truncates output to fit Discord limits, but repository scripts must avoid printing secrets. Centralized output redaction should not be assumed. Keep diagnostics useful but sanitized, especially on timeout and failure paths.

Treat every workflow as retryable: use `git pull --ff-only`, avoid destructive operations, use atomic writes, and make repeated execution safe. Do not use `git reset --hard`, live Kubernetes apply, broad deletion, or unbounded polling.

## Review checklist

- [ ] `.knit/deploy.yaml` uses only the current schema; no legacy central config is required.
- [ ] Every deployment names a trusted target and absolute permitted cwd.
- [ ] Push and tag actions are intentionally separate.
- [ ] Complex behavior lives in reviewed scripts with `set -eu` and cleanup traps.
- [ ] Exact-commit behavior uses `KNIT_COMMIT_SHA`, not branch state.
- [ ] Required target tools are checked before work begins.
- [ ] Validation is read-only/server-side and scoped to affected Applications.
- [ ] Scripts have bounded deadlines and return meaningful exit codes.
- [ ] No secrets appear in files, arguments, environment output, logs, or Discord messages.
- [ ] Local tests and relevant target-side smoke tests pass.

For service internals, see the repository [README](../README.md). For target inventories and Kubernetes-owned connection configuration, consult the GitOps repository rather than adding those values to `.knit/deploy.yaml`.
