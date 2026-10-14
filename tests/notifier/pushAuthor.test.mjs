import { createPushAuthor } from "../../src/notifier/pushAuthor.mjs";

test("uses pusher details and the repository owner avatar", () => {
  expect(
    createPushAuthor({
      pusher: { name: "bob" },
      repository: { owner: { avatar_url: "owner.png" } },
    }),
  ).toEqual({ name: "bob", icon_url: "owner.png", url: "https://github.com/bob" });
});

test("uses the sender avatar and a safe author name when pusher data is absent", () => {
  expect(createPushAuthor({ sender: { avatar_url: "sender.png" } })).toEqual({
    name: "unknown",
    icon_url: "sender.png",
  });
});

test("escapes the pusher name", () => {
  expect(createPushAuthor({ pusher: { name: "@everyone" } })).toEqual({
    name: "@\u200beveryone",
    url: "https://github.com/%40everyone",
  });
});

test("encodes path delimiters in the profile URL", () => {
  expect(createPushAuthor({ pusher: { name: "person/other?tab=code" } }).url).toBe(
    "https://github.com/person%2Fother%3Ftab%3Dcode",
  );
});
