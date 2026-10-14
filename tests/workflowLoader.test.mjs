import { createHash } from "node:crypto";
import { jest } from "@jest/globals";
import { loadWorkflow } from "../src/workflowLoader.mjs";
import { githubContentsResponse } from "../test-fixtures/githubContents.mjs";

const commit = "a".repeat(40);
const files = {
  ".knit/deploy.yaml":
    'version: 1\non:\n  push:\n    deployments: []\n  tags:\n    "v*":\n      deployments: []',
  "package.json": '{"description":"app","keywords":["test"]}',
};
test("fetches only pinned workflow and package metadata", async () => {
  const fetchFn = jest.fn((url) =>
    new URL(url).pathname.endsWith("package.json")
      ? githubContentsResponse("package.json", files["package.json"])
      : githubContentsResponse(".knit/deploy.yaml", files[".knit/deploy.yaml"]),
  );
  await expect(
    loadWorkflow({ repository: "eliware/app", commit, token: "token", fetchFn }),
  ).resolves.toMatchObject({ commit, packageJson: { description: "app" } });
  expect(fetchFn).toHaveBeenCalledTimes(2);
  expect(fetchFn.mock.calls[0][0]).toContain(`ref=${commit}`);
  expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe("Bearer token");
});

test.each([
  [{ repository: "bad", commit }, "Invalid repository"],
  [{ repository: "eliware/app", commit: "bad" }, "Webhook commit SHA is required"],
  [{ repository: "eliware/app" }, "Webhook commit SHA is required"],
])("rejects invalid input", async (options, message) => {
  await expect(loadWorkflow(options)).rejects.toThrow(message);
});

test("allows package.json to be absent", async () => {
  const fetchFn = jest.fn((url) =>
    new URL(url).pathname.endsWith("package.json")
      ? { ok: false, status: 404 }
      : githubContentsResponse(".knit/deploy.yaml", files[".knit/deploy.yaml"]),
  );
  await expect(loadWorkflow({ repository: "eliware/app", commit, fetchFn })).resolves.toMatchObject(
    { packageJson: undefined },
  );
});

test("rejects unavailable fetch and invalid package metadata", async () => {
  await expect(loadWorkflow({ repository: "eliware/app", commit, fetchFn: null })).rejects.toThrow(
    "Fetch is unavailable",
  );
  const invalidContent = "{bad";
  const invalidBody = Buffer.from(invalidContent);
  const invalidSha = createHash("sha1")
    .update(`blob ${invalidBody.length}\0`)
    .update(invalidBody)
    .digest("hex");
  const invalidPackage = jest.fn((url) =>
    url.includes("package.json")
      ? {
          ok: true,
          status: 200,
          json: async () => ({
            path: "package.json",
            type: "file",
            content: invalidBody.toString("base64"),
            sha: invalidSha,
          }),
        }
      : githubContentsResponse(".knit/deploy.yaml", files[".knit/deploy.yaml"]),
  );
  await expect(
    loadWorkflow({ repository: "eliware/app", commit, fetchFn: invalidPackage }),
  ).rejects.toThrow("Invalid package.json");
});
test("rejects missing workflow inputs", async () => {
  await expect(loadWorkflow()).rejects.toThrow("Invalid repository");
});
