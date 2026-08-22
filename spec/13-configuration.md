# Configuration UX

Show effective validated YAML-derived configuration without exposing secrets.

Display:

- source file/path
- source revision
- repository and git ref
- targets and execution policy
- notify key metadata, never URL/value
- validation errors/warnings

Current runtime configs are mounted and source-controlled. They are loaded once per process; GitOps content-hashed ConfigMap changes roll the pod so the next process reads the new files. Do not offer direct save. Future edits must create a reviewed source-controlled proposal with a rendered diff and validation result.
