/**
 * What "the suite" is, in one place.
 *
 * Three things need the same answer to "which evals exist, and what is their
 * identity": the runbook an outside model follows, the scorer that turns its
 * grades into a card, and the dashboard that publishes the board. When they
 * disagree, a card scores against a suite nobody else ran and the disagreement is
 * invisible -- every number still looks like a number. So discovery, identity and
 * the manifest hash live here, and everything else imports them.
 *
 * Identity is qualified: twenty skills number their evals 1, 2, 3, so a bare id
 * collides across skills. `object-model/1` does not.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

/** The four pillars and which skill belongs to each, from pillars.json. */
export function loadPillars(repo = REPO) {
  const file = join(repo, "walrusevals", "pillars.json");
  const data = JSON.parse(readFileSync(file, "utf8"));
  const of = Object.fromEntries(
    data.pillars.flatMap((p) => p.skills.map((s) => [s, p.id])),
  );
  return { pillars: data.pillars, pillarOf: of, ids: data.pillars.map((p) => p.id) };
}

/**
 * Every eval in the suite.
 *
 * Discovery is one level deep -- `<skill>/evals/evals.json` -- which is what the
 * board reads and what the eval pipeline runs. A skill nesting its evals a level
 * further is reported as `nested` rather than quietly folded in: adding it changes
 * the manifest, which invalidates every card already submitted, and that is a
 * decision to take deliberately. No skill in this repository does so today, and
 * suite.test.js asserts it stays that way.
 *
 * `template` is the scaffold a new skill is copied from, not a skill. Its two
 * placeholder evals are left out here as the eval pipeline leaves them out of
 * every run, so a card never has to answer "your-skill-basic".
 */
export const NOT_A_SKILL = new Set(["template"]);

export function discover(repo = REPO) {
  const evals = [];
  const skills = [];
  const nested = [];
  const { pillarOf } = loadPillars(repo);
  const unmapped = new Set();

  for (const entry of readdirSync(repo).sort()) {
    const dir = join(repo, entry);
    if (entry.startsWith(".") || entry === "node_modules" || NOT_A_SKILL.has(entry)) continue;
    let isDir = false;
    try { isDir = statSync(dir).isDirectory(); } catch { continue; }
    if (!isDir) continue;

    const file = join(dir, "evals", "evals.json");
    if (!existsSync(file)) {
      // One level further down, so the omission can be named.
      try {
        for (const sub of readdirSync(dir).sort()) {
          if (existsSync(join(dir, sub, "evals", "evals.json"))) nested.push(`${entry}/${sub}`);
        }
      } catch { /* not readable, nothing to report */ }
      continue;
    }

    let parsed;
    try { parsed = JSON.parse(readFileSync(file, "utf8")); }
    catch (err) { throw new Error(`${entry}/evals/evals.json is not valid JSON: ${err.message}`); }

    // Two shapes are in use: a bare array, and {skill_name, evals:[...]}.
    const list = Array.isArray(parsed) ? parsed : parsed.evals ?? [];
    if (!list.length) continue;
    skills.push(entry);

    const pillar = pillarOf[entry];
    if (!pillar) unmapped.add(entry);

    list.forEach((e, i) => {
      const localId = String(e.id ?? i + 1);
      const expectations = e.subjective_expectations ?? e.expectations ?? [];
      evals.push({
        id: `${entry}/${localId}`,
        skill: entry,
        localId,
        pillar: pillar ?? "unmapped",
        name: e.name ?? null,
        prompt: String(e.prompt ?? ""),
        expectations,
        count: expectations.length,
        graders: e.graders ?? null,
        sources: e.sources ?? [],
      });
    });
  }

  return { evals, skills, nested, unmapped: [...unmapped] };
}

/**
 * The suite's fingerprint: which evals exist and how many expectations each holds.
 *
 * A card records it so a run made against an older suite is marked rather than
 * silently ranked beside a current one. Changing the wording of an expectation
 * does not change it; adding, removing or re-splitting one does.
 *
 * This exact expression is also in the dashboard that publishes the board, and
 * walrusevals/tests/manifest.test.js pins the value, so the two cannot drift apart
 * without a test going red.
 */
export function manifest(evals) {
  return createHash("sha256")
    .update(evals.map((e) => `${e.id}:${e.count}`).sort().join("\n"))
    .digest("hex")
    .slice(0, 12);
}

/** Per-pillar and overall totals from a map of id -> boolean[]. */
export function tally(evals, grades, pillarIds) {
  const pillars = Object.fromEntries(pillarIds.map((p) => [p, { pass: 0, total: 0 }]));
  const perEval = [];
  let pass = 0, total = 0;

  for (const e of evals) {
    const g = grades[e.id];
    if (!g) continue;
    const got = g.filter(Boolean).length;
    perEval.push({ id: e.id, skill: e.skill, pillar: e.pillar, pass: got, of: g.length });
    pass += got;
    total += g.length;
    if (pillars[e.pillar]) {
      pillars[e.pillar].pass += got;
      pillars[e.pillar].total += g.length;
    }
  }

  return { pillars, perEval, total: { pass, total } };
}

/**
 * A run's score: the mean of the four pillar scores, not the pooled pass rate.
 *
 * Pooling lets the biggest pillar decide the number. Building holds 20 of the 42
 * evals and Fundamentals 6, so a model strong at the SDK and weak on what storage
 * costs would score well and the suite would say the opposite of what it means to
 * say. Averaging makes each pillar worth a quarter however many evals it holds.
 */
export function score(pillars, pillarIds) {
  const rates = pillarIds
    .map((p) => pillars[p])
    .filter((p) => p && p.total)
    .map((p) => p.pass / p.total);
  if (!rates.length) return 0;
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}
