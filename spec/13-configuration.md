# Configuration UX

Show validated YAML settings in use. Do not expose secrets.

List these values:

- source file/path
- source revision
- repository and git ref
- targets and execution policy
- notification key details. Do not show the URL or value.
- validation errors/warnings

Keep runtime config files in source control. Load each file once when Knit starts. A content-hashed ConfigMap change in GitOps rolls the pod. The new process reads the changed files. Do not offer direct save. Require a reviewed source-controlled proposal with a diff and validation result for each edit.
