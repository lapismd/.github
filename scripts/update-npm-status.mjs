import { readFile, writeFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

export async function packageStatus(name, request = fetch) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(name)}`;
  let response;
  for (let attempt = 0; attempt < 3; attempt++) {
    response = await request(url, {
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "application/vnd.npm.install-v1+json" },
    });
    if (response.status !== 429 && response.status < 500) break;
    if (attempt < 2) await setTimeout(250 * (attempt + 1));
  }
  if (response.status === 404) return { published: false };
  if (!response.ok) throw new Error(`${name}: npm returned ${response.status}`);
  const metadata = await response.json();
  if (metadata.name !== name || !Object.keys(metadata.versions ?? {}).length) {
    throw new Error(`${name}: invalid npm package metadata`);
  }
  const version = metadata["dist-tags"]?.latest;
  if (version === undefined) return { published: true, version: null };
  if (
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version) ||
    metadata.versions[version]?.version !== version
  ) {
    throw new Error(`${name}: invalid npm latest version`);
  }
  return { published: true, version };
}

function formatTables(markdown) {
  const lines = markdown.split("\n");
  for (let start = 0; start < lines.length; start++) {
    if (!lines[start].startsWith("|")) continue;
    let end = start;
    while (lines[end]?.startsWith("|")) end++;
    const rows = lines.slice(start, end).map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
    const widths = rows[0].map((_, column) =>
      Math.max(
        3,
        ...rows.filter((_, row) => row !== 1).map((row) => row[column].length),
      ),
    );
    const formatted = rows.map(
      (row, index) =>
        `| ${row.map((cell, column) => (index === 1 ? "-".repeat(widths[column]) : cell.padEnd(widths[column]))).join(" | ")} |`,
    );
    lines.splice(start, end - start, ...formatted);
    start = end - 1;
  }
  return lines.join("\n");
}

export function renderStatus(markdown, packages, statuses) {
  const seen = new Set();
  const updated = markdown
    .split("\n")
    .map((line) => {
      const cells = line.split("|");
      const repository = cells[1]?.match(
        /\]\(https:\/\/github\.com\/lapismd\/([^/)]+)\)/,
      )?.[1];
      if (!repository || !Object.hasOwn(packages, repository)) return line;
      if (seen.has(repository) || cells.length !== 5)
        throw new Error(`Invalid row: ${repository}`);
      seen.add(repository);
      cells[3] =
        " " +
        packages[repository]
          .map((name) => {
            const status = statuses.get(name);
            if (!status) throw new Error(`Missing npm status: ${name}`);
            if (!status.published) return `${name} — **Not published**`;
            const version = status.version
              ? `**v${status.version}**`
              : "**No latest tag**";
            return `Published: [${name}](https://www.npmjs.com/package/${name}) ${version}`;
          })
          .join("<br>") +
        " ";
      return cells.join("|");
    })
    .join("\n");
  for (const repository of Object.keys(packages)) {
    if (!seen.has(repository))
      throw new Error(`Missing repository row: ${repository}`);
  }
  return formatTables(updated);
}

async function main() {
  const root = new URL("../", import.meta.url);
  const packages = JSON.parse(
    await readFile(new URL("profile/packages.json", root), "utf8"),
  );
  const names = Object.values(packages).flat();
  if (
    new Set(names).size !== names.length ||
    names.some((name) => !/^(?:@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name))
  ) {
    throw new Error(
      "Invalid or duplicate package names in profile/packages.json",
    );
  }
  const statuses = new Map();
  let next = 0;
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < names.length) {
        const name = names[next++];
        statuses.set(name, await packageStatus(name));
      }
    }),
  );
  const path = new URL("profile/README.md", root);
  const before = await readFile(path, "utf8");
  const after = renderStatus(before, packages, statuses);
  if (after !== before) await writeFile(path, after);
  console.log(
    `Checked ${names.length} npm packages; profile ${after === before ? "unchanged" : "updated"}.`,
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
