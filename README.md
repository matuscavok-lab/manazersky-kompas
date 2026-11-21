# Manažérsky Kompas v0.9

Interaktívny metodický a vizualizačný systém pre vysokoškolské záverečné práce, manažérske analýzy a firemné audity (100 % Offline • Zero-CDN PWA).

## Čo obsahuje tento balík (`github-publikacia`)

- `index.html` – kompletná skompilovaná aplikácia **Manažérsky Kompas v0.9** (39 metód, Smart Frame, vizualizácie, účty a cenník)
- `sw.js` & `manifest.json` – podpora PWA inštalácie a offline režimu
- `.nojekyll` – zapnutie čistého servovania statických súborov na GitHub Pages
- `vercel.json` & `netlify.toml` – produkčná konfigurácia hlavičiek pre Vercel a Netlify
- `downloads/` – inštalačné balíky (`ManazerskyKompas-EDU.exe`, `ManazerskyKompas-PRO.exe`, `ManazerskyKompas-Setup.exe`, `ManazerskyKompas.apk`)

## Publikovanie na GitHub Pages / Vercel / Netlify

1. Vytvorte nový repozitár na GitHube (napr. `manazersky-kompas`) a nahrajte doň celý obsah tohto priečinka (alebo spustite skript `../nahrat-na-github.ps1`).
2. Na GitHube prejdite do **Settings → Pages → Deploy from a branch (`main` / `/(root)`)** – aplikácia bude dostupná zadarmo cez HTTPS na `https://<vaše-meno>.github.io/manazersky-kompas/`.
3. Alternatívne prepojte repozitár s **Vercel** alebo **Netlify** pre okamžité automatické nasadenie.
