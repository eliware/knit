import { jest } from "@jest/globals";
import { fetchGitHubContentsFile } from "../src/githubContentsFile.mjs";
import { githubContentsResponse } from "../test-fixtures/githubContents.mjs";

const values = {
  repository: "eliware/app",
  path: ".knit/deploy.yaml",
  commit: "a".repeat(40),
  token: "read-token",
};
const content = "version: 1";

test("encodes path parts and sends the commit and token", async () => {
  const fetchFn = jest.fn().mockResolvedValue(githubContentsResponse(values.path, content));
  await expect(
    fetchGitHubContentsFile({ ...values, repository: "eliware/app#archive", fetchFn }),
  ).resolves.toBe(content);
  expect(fetchFn.mock.calls[0][0]).toContain("/eliware/app%23archive/contents/");
  expect(fetchFn.mock.calls[0][0]).toContain(`ref=${values.commit}`);
  expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe("Bearer read-token");
});

test("retries transient GitHub failures", async () => {
  const fetchFn = jest
    .fn()
    .mockResolvedValueOnce({ ok: false, status: 503 })
    .mockResolvedValueOnce(githubContentsResponse(values.path, content));
  await expect(fetchGitHubContentsFile({ ...values, fetchFn })).resolves.toBe(content);
  expect(fetchFn).toHaveBeenCalledTimes(2);
});

test("returns undefined for an optional missing file", async () => {
  const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(
    fetchGitHubContentsFile({ ...values, required: false, fetchFn }),
  ).resolves.toBeUndefined();
});

test("rejects an invalid response path and a SHA mismatch", async () => {
  const wrongPath = jest.fn().mockResolvedValue(githubContentsResponse("wrong", content));
  await expect(fetchGitHubContentsFile({ ...values, fetchFn: wrongPath })).rejects.toThrow(
    "Invalid GitHub Contents response",
  );
  const mismatch = jest.fn().mockResolvedValue({
    ...githubContentsResponse(values.path, content),
    json: async () => ({
      path: values.path,
      type: "file",
      content: Buffer.from(content).toString("base64"),
      sha: "bad",
    }),
  });
  await expect(fetchGitHubContentsFile({ ...values, fetchFn: mismatch })).rejects.toThrow(
    "SHA mismatch",
  );
});

test("rejects a non-transient request error and a required missing file", async () => {
  const forbidden = jest.fn().mockResolvedValue({ ok: false, status: 403 });
  await expect(fetchGitHubContentsFile({ ...values, fetchFn: forbidden })).rejects.toThrow(
    "HTTP 403",
  );
  const missing = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(
    fetchGitHubContentsFile({ ...values, required: true, fetchFn: missing }),
  ).rejects.toThrow("HTTP 404");
});
