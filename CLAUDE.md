# VigilRadar

Bağlayıcı tek uygulama şartnamesi `VIGIL_V2_SPEC.md` dosyasıdır. `VIGIL.md` (v1) arşivdir; `docs/archive/` içindeki eski SPEC ve README yalnızca geçmiş içindir, oradaki kararlar geçersizdir.

- Kısım A bağlamdır, bir kez oku.
- Kısım B bağlayıcıdır. Bölüm 0'daki kurallara uy, Bölüm 6.2'deki faz sırasıyla ilerle.
- Soru sorma. Belgenin cevaplamadığı ayrıntıda en basit seçeneği uygula ve `docs/DECISIONS.md`'ye bir satır yaz.
- Her fazın sonunda `npx next typegen`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` yeşil olmadan sonraki faza geçme.
- Bu Next.js sürümü (16.x) eğitim verindekinden farklı: kod yazmadan önce `AGENTS.md`'yi oku.
- Yeni npm paketi ekleme (VIGIL_V2_SPEC.md Bölüm 0, kural 2).
