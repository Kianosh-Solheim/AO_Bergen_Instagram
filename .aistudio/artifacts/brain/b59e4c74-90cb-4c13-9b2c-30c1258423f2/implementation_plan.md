# Automatisk bildeoptimalisering + Nye maler for Folk/Panel og Program

Denne oppdateringen innfører en automatisk størrelses- og komprimeringssjekk for alle bilder før de lagres i `project.slides`, samt to nye skreddersydde maler for arrangementer og debatter: **Folk / Panel & Roller** (med sirkulære portretter som skalerer etter antall) og **Program & Tidsskjema** (med to-kolonners tidslinje og både enkeltfelter og råtekst-redigering).

## User Review & Critical Decisions

> [!IMPORTANT]
> Basert på dine svar er følgende designvalg lagt til grunn for gjennomføringen:

- **Bekreftet valg 1 (Folk / Panel-mal)**: Deltakerne vises med **sirkulære portretter med navn og rolle/tittel under** som standard. Størrelsen på portrettene, skriftstørrelsen og antall kolonner skalerer seg automatisk opp og ned basert på hvor mange personer som legges til (fra 1 stort portrett til 2, 3, 4, 6 eller 8+ personer).
- **Bekreftet valg 2 (Program-mal visuell stil)**: Programmet vises i **to kolonner med en fet klokkeslett-kolonne til venstre** (med fast bredde og tabulære tall) og **programbeskrivelse til høyre**, samt automatisk innrykk for mellomlinjer uten klokkeslett (som *«Deretter paneldebatt»*).
- **Bekreftet valg 3 (Redigering av programposter)**: Sidepanelet får **både strukturerte enkeltfelter per programpost** (klokkeslett + tekst + legg til/slett/flytt) **og en råtekst-modus** hvor man kan lime inn hele programmet i ett tekstfelt med toveis synkronisering.

---

## 1. Oversikt & Kjernefunksjonalitet

- **Hva løsningen gjør**:
  1. **Automatisk bildekomprimering og sikkerhetssjekk**: Alle bildeopplastinger (via bilde-modalen, direkte opplasting fra PC på lerret/sidepanel, lim inn fra utklippstavle, logo-opplasting og personportretter) passerer gjennom en felles størrelses- og dimensjonssjekk (`compressImageFile` / `ensureSlideImagesOptimized` / `optimizeProjectImagesForStorage`) før de lagres i `project.slides`, IndexedDB og Firestore.
  2. **Ny mal — «Folk / Panel & Roller» (`personer`)**: Lar brukeren legge til 1 til 8+ personer med bilde, navn og rolle/tittel. Portrettene vises som sirkulære bilder med navn og rolle under, og skalerer seg automatisk ned når flere legges til (og opp når det er få).
  3. **Ny mal — «Program & Tidsskjema» (`program`)**: Lar brukeren sette opp et komplett arrangementsprogram (som debattkvelder for Arkitekturopprøret) med fet klokkeslett-kolonne, tydelige skillelinjer, automatisk innrykk for underpunkter uten klokkeslett, og valgfri utheving av nøkkelord.

---

## 2. Brukeropplevelse & Visuelt Design

- **Nøkkelflyter**:
  - **Bildeopplasting med automatisk komprimering**: Når brukeren slipper en stor bildefil (f.eks. 8–15 MB fra kamera/Mac) inn i en bildeplass eller et personportrett, nedskaleres bildet automatisk til optimale dimensjoner (`1350px` for hovedbilder, `800px` for portretter) og komprimeres til kompakt JPEG/WebP før det legges i `project.slides`.
  - **Folk / Panel & Roller**:
    - Brukeren velger malen *«Folk / Panel & Roller»* i sidepanelet.
    - På lerretet vises personene med sirkulære portretter sentrert over navn (fet overskriftsfont) og rolle/tittel under.
    - Brukeren kan klikke direkte på den sirkulære portrettplassen på lerretet eller i sidepanelet for å laste opp bilde, justere zoom/utsnitt per person, og legge til eller fjerne personer.
  - **Program & Tidsskjema**:
    - Brukeren velger malen *«Program & Tidsskjema»*.
    - I sidepanelet kan brukeren veksle sømløst mellom **«Enkeltfelter»** (egen boks for klokkeslett f.eks. `1830` og beskrivelse f.eks. `Dørene åpner`, samt knapp for å legge til rad eller mellomlinje) og **«Lim inn råtekst»** (for rask innliming av hele programmet på én gang).
- **Visuell identitet & typografi**:
  - Følger Arkitekturopprørets pastellpalett (`#fff3d1` lysegul, `#e2f6e5` lysegrønn, `#ebe4f7` lyselilla) og valgt profilfont (`Agrandir` / `Syne` / `Serif`).
  - Klokkeslett-kolonnen i Program-malen bruker `tabular-nums` og ekstra fet vekt (`font-extrabold`) slik at alle klokkeslett står snorrett under hverandre.

---

## 3. Viktige Produktvalg & Avveininger

- **Valg 1: Toveis synkronisering mellom enkeltfelter og råtekst i Program-malen**
  - *Valgt løsning*: Programpostene lagres slik at endringer i enkeltfeltene (klokkeslett + tekst) oppdaterer programteksten umiddelbart, og innliming i råtekst-feltet automatisk parser linjene (`1830 - Dørene åpner` vs. `Deretter paneldebatt`) tilbake til enkeltfelter.
  - *Hvorfor*: Gir både rask kopiering/innliming fra e-post eller arrangementsbeskrivelser og presis redigering av enkeltpunkter uten at brukeren mister formatering.
- **Valg 2: To-trinns bildebudsjett (per bilde + totalt prosjektbudsjett)**
  - *Valgt løsning*: Hvert bilde komprimeres ved selve opplastingen, og i tillegg kjøres en helhetlig prosjektsjekk (`optimizeProjectImagesForStorage`) ved lagring og oppstart som tilpasser bildebudsjettet etter totalt antall bilder i karusellen.
  - *Hvorfor*: Forhindrer at prosjekter med mange slides eller mange portrettbilder overskrider dokumentgrensen i Firestore (1 MiB) eller `localStorage`.

---

## 4. Teknisk Arkitektur & Datastrategi

### Arkitektur- og Komponentdiagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        App State (project.slides)                        │
│   • Automatisk sjekk ved oppdatering, lagring (IndexedDB + Firestore)    │
└───────────────────┬──────────────────────────────────┬───────────────────┘
                    │                                  │
                    ▼                                  ▼
┌──────────────────────────────────────┐  ┌────────────────────────────────┐
│          EditorSidebar.tsx           │  │        CanvasSlide.tsx         │
│ • Malvelger (bevarer eksist. tekst)  │  │ • Preset 'personer':           │
│ • Folk/Panel-editor:                 │  │   Sirkulære portretter med     │
│   - Legg til/slett person            │  │   navn & rolle under,          │
│   - Bildeopplasting + Zoom/ X / Y    │  │   auto-grid (1 til 8+ folk)    │
│ • Program-editor:                    │  │ • Preset 'program':            │
│   - Modus 1: Enkeltfelter (Tid+Tekst)│  │   To kolonner (fet tid +       │
│   - Modus 2: Lim inn råtekst         │  │   beskrivelse) + mellomlinjer  │
└───────────────────┬──────────────────┘  └────────────────┬───────────────┘
                    │                                      │
                    └──────────────────┬───────────────────┘
                                       ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                     imageUtils.ts (Bildeoptimalisering)                  │
│ • compressImageFile(): Nedskalerer & komprimerer ved opplasting          │
│ • ensureSlideImagesOptimized(): Sjekker både slide.images & slide.people │
│ • optimizeProjectImagesForStorage(): Sikrer totalbudsjett under 700 KB   │
└──────────────────────────────────────────────────────────────────────────┘
```

### Datamodell og Tilstandshåndtering

- **`PersonCard` (`slide.people`)**: Inneholder `id`, `name`, `role`, `org`, `imageUrl`, `zoom`, `positionX` og `positionY`. Standard bildeform (`personImageShape`) settes til `'circle'` (med mulighet til å veksle til avrundet firkant ved behov).
- **`ProgramEntry` og `programText`**: Hver linje støtter enten klokkeslett + beskrivelse (`time` + `title`) eller kun beskrivelse for mellomlinjer uten klokkeslett (som *«Deretter paneldebatt»*).
- **Sjekk ved alle opplastingspunkter**: Både `ImageUploaderModal`, direkte filslipp på lerretet (`CanvasSlide`), opplasting i sidepanelet (`EditorSidebar`), og prosjektinnlasting i `App.tsx` validerer og komprimerer base64-bilder før de lagres i `project.slides`.
