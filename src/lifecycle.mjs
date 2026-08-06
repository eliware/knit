let gracefulRestartRequested = false;

export function requestGracefulRestart() {
  gracefulRestartRequested = true;
}

export function takeGracefulRestartRequest() {
  const requested = gracefulRestartRequested;
  gracefulRestartRequested = false;
  return requested;
}

export function resetLifecycleState() {
  gracefulRestartRequested = false;
}
