import assert from "node:assert/strict";
import test from "node:test";
import { packageStatus, renderStatus } from "./update-npm-status.mjs";

const name = "@lapismd/example";
const metadata = {
  name,
  "dist-tags": { latest: "1.2.3" },
  versions: {
    "1.2.3": { version: "1.2.3" },
    "2.0.0-next.1": { version: "2.0.0-next.1" },
  },
};

test("reports the registry latest tag, including scoped package URLs", async () => {
  const result = await packageStatus(name, async (url) => {
    assert.equal(url, "https://registry.npmjs.org/%40lapismd%2Fexample");
    return Response.json(metadata);
  });
  assert.deepEqual(result, { published: true, version: "1.2.3" });
});

test("only a registry 404 means not published", async () => {
  assert.deepEqual(
    await packageStatus(name, async () => new Response(null, { status: 404 })),
    { published: false },
  );
  await assert.rejects(
    packageStatus(name, async () => new Response(null, { status: 403 })),
    /npm returned 403/,
  );
});

test("temporary server failures retry; persistent failures reject", async () => {
  let calls = 0;
  const recovered = await packageStatus(name, async () =>
    ++calls === 1
      ? new Response(null, { status: 503 })
      : Response.json(metadata),
  );
  assert.equal(calls, 2);
  assert.equal(recovered.version, "1.2.3");
  await assert.rejects(
    packageStatus(name, async () => new Response(null, { status: 503 })),
    /npm returned 503/,
  );
});

test("network errors reject rather than marking packages unpublished", async () => {
  await assert.rejects(
    packageStatus(name, async () => {
      throw new Error("network offline");
    }),
    /network offline/,
  );
});

test("published packages without a latest tag remain published", async () => {
  assert.deepEqual(
    await packageStatus(name, async () =>
      Response.json({ ...metadata, "dist-tags": {} }),
    ),
    { published: true, version: null },
  );
});

test("malformed or mismatched registry metadata rejects", async () => {
  for (const invalid of [
    { ...metadata, name: "wrong" },
    { ...metadata, versions: {} },
    { ...metadata, "dist-tags": { latest: "9.9.9" } },
  ]) {
    await assert.rejects(
      packageStatus(name, async () => Response.json(invalid)),
      /invalid npm/,
    );
  }
});

const markdown = `### Example\n\n| Repository | Build | npm |\n| --- | --- | --- |\n| [example](https://github.com/lapismd/example) | ![CI](https://github.com/lapismd/example/actions/workflows/ci.yml/badge.svg) | old |\n`;

test("renders publication changes and versions while preserving workflow badges and sections", () => {
  const packages = { example: [name, "@lapismd/unpublished"] };
  const statuses = new Map([
    [name, { published: true, version: "1.2.3" }],
    ["@lapismd/unpublished", { published: false }],
  ]);
  const output = renderStatus(markdown, packages, statuses);
  assert.match(output, /Published: \[@lapismd\/example\].*\*\*v1\.2\.3\*\*/);
  assert.match(output, /@lapismd\/unpublished — \*\*Not published\*\*/);
  assert.ok(output.includes("### Example"));
  assert.ok(
    output.includes(
      "![CI](https://github.com/lapismd/example/actions/workflows/ci.yml/badge.svg)",
    ),
  );
  assert.equal(renderStatus(output, packages, statuses), output);
  assert.throws(
    () => renderStatus(markdown, { missing: [name] }, statuses),
    /Missing repository row/,
  );
  assert.throws(
    () => renderStatus(markdown, packages, new Map()),
    /Missing npm status/,
  );
});
