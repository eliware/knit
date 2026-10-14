import { collectPushChanges, pushChangeFields } from "../../src/notifier/pushChanges.mjs";

test("deduplicates changed paths and gives modified paths precedence", () => {
  const changes = collectPushChanges({
    commits: [
      { added: ["new", "shared"], removed: ["gone", "shared"], modified: ["changed"] },
      { added: ["new"], modified: ["shared"] },
    ],
    head_commit: { added: ["head"], removed: ["gone"], modified: ["changed"] },
  });
  expect([...changes.added]).toEqual(["new", "head"]);
  expect([...changes.removed]).toEqual(["gone"]);
  expect([...changes.modified]).toEqual(["changed", "shared"]);
});

test("ignores malformed change lists", () => {
  const changes = collectPushChanges({
    commits: [{ added: "bad", removed: [], modified: ["valid"] }],
    head_commit: { added: [], removed: "bad", modified: null },
  });
  expect([...changes.added]).toEqual([]);
  expect([...changes.removed]).toEqual([]);
  expect([...changes.modified]).toEqual(["valid"]);
});

test("formats collected changes as Discord embed fields", () => {
  expect(
    pushChangeFields({
      commits: [{ added: ["new"], removed: ["gone"], modified: ["same", "edited"] }],
      head_commit: { added: ["same"] },
    }),
  ).toEqual([
    { name: "New (1)", value: "new", inline: false },
    { name: "Deleted (1)", value: "gone", inline: false },
    { name: "Modified (2)", value: "same\nedited", inline: false },
  ]);
});
