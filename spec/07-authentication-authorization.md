# Authentication and Authorization

## Authentication

Integrate EliD using OIDC Authorization Code + PKCE.

Validate issuer, audience, state, nonce, code, token signature/key rotation, exp, and nbf.

Prefer a backend-for-frontend with server-side session cookies:

- HttpOnly
- Secure
- SameSite=Lax or Strict
- idle and absolute expiry
- CSRF protection
- no tokens in localStorage

## Roles

- Viewer: inspect permitted repositories, deployments, logs, and config metadata.
- Operator: retry deployments, replay deliveries, test notifications.
- Administrator: manage access/system/config proposals.

Map roles from EliD claims/groups. Fail closed on missing or ambiguous claims.

## Scoping

Support repository and environment scopes. Production actions may require step-up authentication or approval.

## Enforcement

Authorization is checked server-side on every route, API action, SSE subscription, download, retry, replay, and notification test. Frontend hiding is not security.

Show effective permissions and denial reasons where useful.
