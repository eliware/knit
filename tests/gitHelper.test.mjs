import "../test-fixtures/silenceConsole.mjs";
import { jest } from "@jest/globals";
const realExec = jest.fn();
jest.unstable_mockModule("child_process", () => ({ execFile: realExec }));
const gitHelper = await import("../src/gitHelper.mjs");

describe("gitHelper.mjs", () => {
  const log = { error: jest.fn(), info: jest.fn() };
  let exec;

  beforeEach(() => {
    jest.clearAllMocks();
    exec = jest.fn();
  });

  it("add: resolves stdout and logs success", async () => {
    exec.mockImplementation((file, args, cb) => {
      expect(file).toBe("git");
      expect(args).toEqual(["add", "--", "foo; $(echo injected)"]);
      cb(null, "ok", "");
    });

    const filePath = "foo; $(echo injected)";
    await expect(gitHelper.add({ filePath, log, execFile: exec })).resolves.toBe("ok");
    expect(log.info).toHaveBeenCalledWith(`git add success: ${filePath}`);
  });

  it("add: rejects and logs stderr on error", async () => {
    exec.mockImplementation((file, args, cb) => cb(new Error("fail"), "", "fail"));

    await expect(gitHelper.add({ filePath: "foo", log, execFile: exec })).rejects.toThrow(
      "git add error: fail",
    );
    expect(log.error).toHaveBeenCalledWith("git add error: fail");
  });

  it("add: uses the default logger when omitted", async () => {
    exec.mockImplementation((file, args, cb) => cb(null, "ok", ""));

    await expect(gitHelper.add({ filePath: "foo", execFile: exec })).resolves.toBe("ok");
  });

  it("commit: passes the message as an argument without shell parsing", async () => {
    const message = 'say "hi"; $(echo injected)';
    exec.mockImplementation((file, args, cb) => {
      expect(file).toBe("git");
      expect(args).toEqual(["commit", "--quiet", "-m", message]);
      cb(null, "ok", "");
    });

    await expect(gitHelper.commit({ message, log, execFile: exec })).resolves.toBe("ok");
    expect(log.info).toHaveBeenCalledWith("git commit success");
  });

  it("commit: rejects and logs stderr on error", async () => {
    exec.mockImplementation((file, args, cb) => cb(new Error("fail"), "", "fail"));

    await expect(gitHelper.commit({ message: "msg", log, execFile: exec })).rejects.toThrow(
      "git commit error: fail",
    );
    expect(log.error).toHaveBeenCalledWith("git commit error: fail");
  });

  it("commit: uses the default logger when omitted", async () => {
    exec.mockImplementation((file, args, cb) => cb(null, "ok", ""));

    await expect(gitHelper.commit({ message: "msg", execFile: exec })).resolves.toBe("ok");
  });

  it("push: resolves stdout", async () => {
    exec.mockImplementation((file, args, cb) => {
      expect(file).toBe("git");
      expect(args).toEqual(["push", "--quiet"]);
      cb(null, "ok", "");
    });

    await expect(gitHelper.push({ execFile: exec })).resolves.toBe("ok");
  });

  it("push: rejects and includes stderr on error", async () => {
    exec.mockImplementation((file, args, cb) => cb(new Error("fail"), "", "fail"));

    await expect(gitHelper.push({ execFile: exec })).rejects.toThrow("git push error: fail");
  });

  it("uses the default exec when omitted", async () => {
    realExec.mockImplementation((file, args, cb) => cb(null, "ok", ""));

    await expect(gitHelper.add({ filePath: "foo" })).resolves.toBe("ok");
    await expect(gitHelper.commit({ message: "msg" })).resolves.toBe("ok");
    await expect(gitHelper.push()).resolves.toBe("ok");
    expect(realExec).toHaveBeenCalledTimes(3);
  });
});
