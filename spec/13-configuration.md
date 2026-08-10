# Configuration UX

Show effective validated YAML-derived configuration without exposing secrets.

Display:

- source file/path
- source revision/freshness
- repository and git ref
- targets and execution policy
- notify key metadata, never URL/value
- validation errors/warnings

Current runtime configs are mounted and source-controlled. Do not offer direct save. Future edits must create a reviewed source-controlled proposal with a rendered diff and validation result.
