import {
  start,
  load,
  document,
  squeeze,
  finding,
  report,
  section,
  assertHtml,
} from "./common.js";
// Google gereklilikleri ile Schema.org sözdizimi farklıdır. Bu kurallar yalnız belirtilen türlerin seçili alanlarını inceler.
const RULES = {
  Product: ["name"],
  Offer: ["price", "priceCurrency"],
  Event: ["name", "startDate", "location"],
  Recipe: ["name", "image"],
  BreadcrumbList: ["itemListElement"],
  FAQPage: ["mainEntity"],
  Question: ["name", "acceptedAnswer"],
  Answer: ["text"],
  Review: ["itemReviewed", "reviewRating", "author"],
  Article: [],
  NewsArticle: [],
  BlogPosting: [],
  Person: [],
  Organization: [],
  WebSite: [],
  SoftwareApplication: [],
  HowTo: [],
};
const DATE_FIELDS = ["datePublished", "dateModified", "startDate", "endDate"];
export function inspectSchema(html, url) {
  const $ = load(html);
  const visible = document({ body: html }).text;
  const findings = [];
  const rows = [];
  let blocks = 0,
    nodes = 0;
  const types = new Set();
  function visit(value, path, depth = 0) {
    if (depth > 30) {
      findings.push(
        finding(
          "SCHEMA-DEPTH",
          "Yapı çok derin",
          url,
          path,
          "İç içe yapılandırılmış veriyi sadeleştirin.",
        ),
      );
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((v, i) => visit(v, `${path}[${i}]`, depth + 1));
      return;
    }
    if (!value || typeof value !== "object") return;
    if (value["@type"]) {
      nodes++;
      const list = Array.isArray(value["@type"])
        ? value["@type"]
        : [value["@type"]];
      for (const type of list) {
        types.add(String(type));
        rows.push({
          etiket: path,
          deger: `Tür: ${type} · ${Object.hasOwn(RULES, type) ? "seçili alan kuralları destekleniyor" : "tür kuralları bu sürümde desteklenmiyor"}`,
        });
        for (const field of Object.hasOwn(RULES, type) ? RULES[type] : [])
          if (
            value[field] === undefined ||
            value[field] === null ||
            value[field] === "" ||
            (Array.isArray(value[field]) && !value[field].length)
          )
            findings.push(
              finding(
                "SCHEMA-FIELD",
                `${type}: ${field} eksik`,
                url,
                path,
                "Türün Schema.org ve Google belgelerindeki alanlarını doğrulayın.",
              ),
            );
      }
      for (const key of ["name", "headline", "price"])
        if (typeof value[key] === "string" || typeof value[key] === "number") {
          const needle = squeeze(value[key]);
          if (
            needle &&
            !(needle.length < 3) &&
            !visible
              .toLocaleLowerCase("tr")
              .includes(needle.toLocaleLowerCase("tr"))
          )
            findings.push(
              finding(
                "SCHEMA-VISIBLE",
                `${key} görünen metinle eşleştirilemedi`,
                url,
                `${path}.${key}: ${needle}`,
                "Tarayıcıda gerçek görünür içerikle karşılaştırın; gizli içerik, biçim farkı veya dinamik metin nedeniyle insan doğrulaması gerekebilir.",
                "bilgi",
              ),
            );
        }
      for (const key of DATE_FIELDS)
        if (
          value[key] !== undefined &&
          (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(String(value[key])) ||
            Number.isNaN(Date.parse(value[key])))
        )
          findings.push(
            finding(
              "SCHEMA-DATE",
              `${key} tarih biçimi belirsiz`,
              url,
              `${path}.${key}: ${value[key]}`,
              "Geçerli ISO 8601 tarihi ve gerekiyorsa saat dilimi kullanın.",
            ),
          );
      if (
        value.datePublished &&
        value.dateModified &&
        Date.parse(value.dateModified) < Date.parse(value.datePublished)
      )
        findings.push(
          finding(
            "SCHEMA-DATE-ORDER",
            "Güncelleme tarihi yayın tarihinden önce",
            url,
            path,
            "Gerçek yayın ve güncelleme tarihlerini düzeltin.",
          ),
        );
    }
    for (const [key, val] of Object.entries(value))
      if (key !== "@context") visit(val, `${path}.${key}`, depth + 1);
  }
  $("script[type='application/ld+json']").each((i, el) => {
    blocks++;
    try {
      const data = JSON.parse($(el).html() ?? "");
      if (!data || typeof data !== "object")
        throw new Error("Nesne veya dizi bekleniyor");
      if (!Array.isArray(data) && !data["@context"])
        findings.push(
          finding(
            "SCHEMA-CONTEXT",
            "JSON-LD bağlamı bulunamadı",
            url,
            `blok ${i + 1}`,
            "Kök @context alanını ve JSON-LD bağlamını doğrulayın.",
          ),
        );
      visit(data, `blok ${i + 1}`);
    } catch (error) {
      findings.push(
        finding(
          "SCHEMA-JSON",
          "JSON-LD ayrıştırılamadı",
          url,
          `blok ${i + 1}: ${error.message}`,
          "JSON sözdizimini düzeltin.",
        ),
      );
    }
  });
  return { findings, rows, blocks, nodes, types: [...types] };
}
export async function auditSite(input, options = {}) {
  const { target, started, response } = await start(input, options);
  assertHtml(response);
  const x = inspectSchema(response.body, response.url);
  return report(
    "WebSCHEMArobot",
    target,
    started,
    x.findings,
    [
      section("Yapılandırılmış veri", [
        { etiket: "JSON-LD blok / nesne", deger: `${x.blocks} / ${x.nodes}` },
        ...x.rows,
      ]),
    ],
    [
      "Bu sürüm JSON-LD ve seçili tür kurallarını inceler; tam Schema.org/JSON-LD doğrulayıcısı değildir.",
      "Microdata, RDFa ve JavaScript ile eklenen veri incelenmez.",
      "HTML metni eşleştirmesi görünürlük veya anlam doğrulaması değildir; gizli metinleri ve dinamik içeriği tarayıcıda kontrol edin.",
      "Google zengin sonuç uygunluğu ve görünmesi garanti edilmez.",
    ],
  );
}
