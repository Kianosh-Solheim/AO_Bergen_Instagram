# Instagram Malbygger – Arkitekturopprør

Et moderne og fleksibelt verktøy for å designe, tilpasse og eksportere Instagram-karuseller (1080 × 1350 px, 4:5 format) i tråd med den visuelle profilen til Arkitekturopprøret.

---

## 🚀 Publisering til GitHub Pages

Dette prosjektet er klargjort for publisering til **GitHub Pages** på to enkle måter:

### Metode 1: Automatisk med GitHub Actions (Anbefalt)

1. Last opp / push koden til ditt GitHub-repository (på `main`-grenen).
2. Gå til repositoriet ditt på GitHub.
3. Klikk på **Settings** (Innstillinger) ⚙️ øverst.
4. Velg **Pages** i venstremenyen.
5. Under **Build and deployment** -> **Source**, velg **GitHub Actions**.
6. Hver gang du pusher til `main`, vil workflowen `.github/workflows/deploy.yml` automatisk bygge og publisere siden din til `https://<brukernavn>.github.io/<repository-navn>/`!

---

### Metode 2: Manuell publisering med `npm run deploy`

Dersom du ønsker å publisere manuelt fra terminalen:

```bash
# 1. Installer avhengigheter
npm install

# 2. Bygg og publiser til gh-pages-grenen automatisk
npm run deploy
```

Dette vil bygge prosjektet til `dist/` og pushe innholdet direkte til en `gh-pages`-gren på ditt GitHub-repository.

---

## 💻 Lokal utvikling

```bash
# Start lokal utviklingsserver
npm run dev

# Test statisk produksjonsbygg lokalt
npm run build:spa
npm run preview
```

---

## 🎨 Funksjonalitet
- **1080 × 1350 Canvas:** Perfekt 4:5-format for Instagram-karuseller med lilla sikkerhetssone.
- **Interaktivt zoom & panoreringssystem:** Zoom inn/ut med rullehjul eller snarveier, hold inne mellomrom for å panorere fritt.
- **Mal- og oppskriftsbibliotek:** Hook/forside, Fra dette/Til dette, Flerbilde, Sitat & Tekstslide, Prislapp og Tull & Tøys/Meme.
- **Eksportering:** Last ned alle slides som høyoppløselige PNG-filer samlet i en ZIP-fil eller kopier til utklippstavlen.
