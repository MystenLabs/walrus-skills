/**
 * The four pillars of Walrus knowledge, and which skill's evals belong to each.
 *
 * The evals were written per skill and the pillars mapped onto them afterwards,
 * so the pillars are uneven, and the site shows the real count rather than
 * pretending otherwise. Evening them out means curating, not relabelling, which
 * is a decision for a human.
 *
 * A skill with no entry here is reported as unmapped by build.js rather than
 * silently dropped, so adding a skill cannot quietly shrink the suite. The same
 * table is in pillars.json for the scripts that read it as data.
 */

export const PILLARS = [
  {
    id: "fundamentals",
    name: "Fundamentals",
    desc:
      "What Walrus is and what it costs. Blobs, epochs, encoding, the WAL token, and the pricing a design decision rests on.",
    skills: ["walrus-overview", "walrus-storage-costs"],
  },
  {
    id: "storing",
    name: "Storing",
    desc:
      "Getting data in and keeping it there. The CLI, blob lifetimes and extension, deletable versus permanent blobs, and quilts for small files.",
    skills: ["walrus-cli", "walrus-blob-lifecycle", "walrus-quilts"],
  },
  {
    id: "building",
    name: "Building",
    desc:
      "Shipping something on it. The TypeScript SDK, the HTTP API, Walrus blobs from Move, Walrus Sites, and agent memory.",
    skills: ["walrus-ts-sdk", "walrus-http-api", "walrus-move-integration", "walrus-sites", "walrus-memory"],
  },
  {
    id: "operating",
    name: "Operating",
    desc:
      "What goes wrong and what stays private. Encrypting before storage, and the errors a developer meets and how to read them.",
    skills: ["walrus-data-security", "walrus-troubleshooting"],
  },
];

/** skill -> pillar id, built from the table above. */
export const PILLAR_OF = Object.fromEntries(
  PILLARS.flatMap((p) => p.skills.map((s) => [s, p.id])),
);

export const PILLAR_IDS = PILLARS.map((p) => p.id);
