import { createHash } from "node:crypto";

export function githubContentsResponse(path, content) {
  const body = Buffer.from(content);
  return {
    ok: true,
    status: 200,
    json: async () => ({
      path,
      type: "file",
      content: body.toString("base64"),
      sha: createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex"),
    }),
  };
}
