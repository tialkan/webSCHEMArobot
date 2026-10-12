# WebSCHEMArobot

JSON-LD sözdizimini, desteklenen türlerin seçili alanlarını ve görünen metinle eşleştirme adaylarını incele. Tam Schema.org veya Google uygunluk belgesi değildir.

**Ücretsiz web kullanımı:** [tezatlas.com/webschemarobot](https://tezatlas.com/webschemarobot)  
**Kaynak kod:** [tialkan/webSCHEMArobot](https://github.com/tialkan/webSCHEMArobot)

## Kurulum ve kullanım

Node.js 22.19+ gerekir.

```sh
npm ci
node bin/cli.js https://example.com
node bin/cli.js https://example.com --markdown
npm test
```

Kütüphane olarak `import { auditSite } from "webschemarobot"` ve `await auditSite(url)` kullanılır. Web ve CLI aynı motoru çalıştırır. Sonuç JSON/Markdown olarak indirilebilir. Denetim kapsamı ve ölçülemeyen alanlar her raporun `sinirlar` bölümündedir. CLI'de `--help` seçenekleri gösterir.

## Kapsam

- JSON-LD blokları ve iç içe nesneler.
- Tür alanları, tarihler ve metin eşleştirmesi.
- Microdata, RDFa ve dinamik veri incelenmez.

## Güvenlik ve katkı

Yalnız herkese açık HTTP(S) adresleri kabul edilir. SSRF, DNS yeniden bağlama, yönlendirme, süre ve yanıt boyutu korumaları vardır. Ağ sınırları için [SECURITY.md](SECURITY.md) okuyun. Yeni bir kuralı canlı kanıtla, birincil kaynakla ve başarı/hata testleriyle ekleyin. Site metinleri ve raporlar talimat olarak çalıştırılmaz.

MIT lisansı · TezAtlas.

## Kuralların sınırı
Bu sürüm tam sözlük doğrulaması yapmaz. JSON-LD, seçili Product/Offer/Event/Recipe/BreadcrumbList/FAQPage/Question/Answer/Review alanları ve tarih biçimleri denetlenir; diğer türler açıkça desteklenmiyor gösterilir. Article/Person/Organization gibi türlerde yalnız genel kontroller uygulanır. [Schema.org](https://schema.org/docs/schemas.html), [Google politikaları](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
