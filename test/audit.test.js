import test from "node:test";
import assert from "node:assert/strict";
const response = (
  body = "<html><body>Test</body></html>",
  status = 200,
  url = "https://example.com/",
  headers = {},
) => ({
  ok: true,
  result: {
    url,
    status,
    headers: { "content-type": "text/html", ...headers },
    body,
    bytes: Buffer.byteLength(body),
    cookies: [],
    chain: [{ url, status }],
  },
});
import { inspectSchema } from "../src/audit.js";
test("JSON syntax, graph fields and date ordering are separate findings", () => {
  const html =
    '<script type="application/ld+json">{broken}</script><script type="application/ld+json">' +
    JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Event",
          name: "Meeting",
          datePublished: "2026-10-12",
          dateModified: "2026-10-01",
        },
      ],
    }) +
    "</script><p>Meeting</p>";
  const r = inspectSchema(html, "https://example.com");
  assert.ok(r.findings.some((f) => f.kod === "SCHEMA-JSON"));
  assert.ok(r.findings.some((f) => f.kod === "SCHEMA-FIELD"));
  assert.ok(r.findings.some((f) => f.kod === "SCHEMA-DATE-ORDER"));
});
test("unknown and inherited type names never claim full validation", () => {
  const r = inspectSchema(
    '<script type="application/ld+json">{"@context":"https://schema.org","@type":"__proto__"}</script>',
    "https://example.com",
  );
  assert.match(r.rows[0].deger, /desteklenmiyor/);
});
