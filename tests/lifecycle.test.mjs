import {
  requestGracefulRestart,
  resetLifecycleState,
  takeGracefulRestartRequest,
} from '../src/lifecycle.mjs';

describe('lifecycle.mjs', () => {
  afterEach(() => {
    resetLifecycleState();
  });

  it('returns false when no graceful restart was requested', () => {
    expect(takeGracefulRestartRequest()).toBe(false);
  });

  it('records and consumes a graceful restart request', () => {
    requestGracefulRestart();

    expect(takeGracefulRestartRequest()).toBe(true);
    expect(takeGracefulRestartRequest()).toBe(false);
  });

  it('clears a pending graceful restart request', () => {
    requestGracefulRestart();
    resetLifecycleState();

    expect(takeGracefulRestartRequest()).toBe(false);
  });
});
