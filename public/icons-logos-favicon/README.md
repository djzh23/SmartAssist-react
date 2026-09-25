# PrivatePrep Icon-Paket

Konzept F4: P mit Haekchen in Amber (#d97706).

## Was ist drin

### SVG-Quelldateien

Diese Dateien bilden die Basis fuer alle anderen Groessen. Wenn du das Icon spaeter aendern willst, aendere hier.

- `logo-mark.svg` — das reine Icon ohne Hintergrund (fuer Verwendung in dunklen UI-Elementen wie Header und Footer)
- `logo-mark-padded.svg` — Icon mit Amber-Hintergrund und weisser Schleife (Grundlage aller PNG-Groessen)

### Generierte PNG-Dateien im Ordner `generated/`

- `favicon.ico` — Multi-Size (16, 32, 48 Pixel), fuer alle Browser
- `favicon-16x16.png` — moderne Browser
- `favicon-32x32.png` — moderne Browser
- `favicon-48x48.png` — Windows Task-Leiste
- `apple-touch-icon.png` — 180 Pixel, fuer iOS "Zum Home-Bildschirm hinzufuegen"
- `android-chrome-192x192.png` — Android Basis
- `android-chrome-512x512.png` — Android hochaufloesend
- `maskable-icon-512x512.png` — Android Adaptive Icons (Icon passt sich der Systemform an)
- `site.webmanifest` — PWA-Konfiguration fuer Android und Chrome

## Installation im privateprep-frontend Repo

### Schritt 1: Dateien nach public/ kopieren

Alle Dateien aus dem Ordner `generated/` kommen in den Ordner `public/` deines React-Repos.

Wenn dort schon alte Favicon-Dateien liegen (`favicon.ico`, `logo.svg` etc.), ersetzt du sie mit den neuen.

Ziel-Struktur:

```
privateprep-frontend/
  public/
    favicon.ico
    favicon-16x16.png
    favicon-32x32.png
    favicon-48x48.png
    apple-touch-icon.png
    android-chrome-192x192.png
    android-chrome-512x512.png
    maskable-icon-512x512.png
    site.webmanifest
```

Die SVG-Quelldateien (`logo-mark.svg` und `logo-mark-padded.svg`) kommen zusaetzlich in `src/assets/` oder wo auch immer deine Komponenten-Assets liegen. Diese verwendest du in React-Komponenten fuer Header und Footer.

### Schritt 2: HTML-Head-Tags in index.html eintragen

Oeffne `index.html` (im Root des privateprep-frontend Repos). Zwischen `<head>` und `</head>` sind vermutlich schon Favicon-Tags. Ersetz sie durch diese Version:

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

<!-- Apple Touch Icon (iOS Home Screen) -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

<!-- Android Chrome / PWA -->
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#d97706" />

<!-- Meta fuer Safari Pinned Tab -->
<meta name="apple-mobile-web-app-title" content="PrivatePrep" />
<meta name="application-name" content="PrivatePrep" />
```

Der wichtigste Tag ist `theme-color`, weil er die Statusleisten-Farbe in mobilen Browsern setzt. Amber (#d97706) passt zur Landing.

### Schritt 3: Logo im Header und Footer ersetzen

Aktuell verwendest du wahrscheinlich `public/logo.png` oder `public/logo-nav.webp` im Header. Ersetz diese Verwendungen mit dem neuen SVG.

Beispiel fuer Header (`src/components/layout/PublicSiteHeader.tsx` oder aehnlich):

```tsx
import LogoMark from "@/assets/logo-mark.svg?react";

// In der Header-Komponente:
<div className="flex items-center gap-2">
  <LogoMark className="w-8 h-8" />
  <span className="text-lg font-medium">PrivatePrep</span>
</div>
```

Wichtig: das `logo-mark.svg` (ohne Padding) verwendest du im Header und Footer weil das dunkle Layout selbst den Kontrast liefert. Das `logo-mark-padded.svg` verwendest du nur wo du ein "App-Icon-Feeling" auf hellem Hintergrund brauchst.

### Schritt 4: Alte Icon-Verwendungen aufraeumen

Suche im Repo nach `logo.png`, `logo-nav.webp` und aehnlichen alten Dateinamen. Ersetz alle Verwendungen. Loesch die alten Dateien aus `public/`.

### Schritt 5: Testen

Nach npm run dev:

1. Browser-Tab pruefen (Favicon sichtbar)
2. Header pruefen (neues Icon links vom PrivatePrep-Text)
3. Footer pruefen (kleines Icon in der Marke-Spalte)
4. Auf Mobile-Ansicht in DevTools pruefen (theme-color sichtbar)

Nach dem Deploy in Production:

1. `https://deine-domain.com/favicon.ico` direkt aufrufen und pruefen dass es laedt
2. In Chrome/Safari das Icon zum Home-Bildschirm hinzufuegen und pruefen dass das Apple-Touch-Icon korrekt geladen wird

## Farbwerte fuer Referenz

Falls du das Icon irgendwo in Code oder Design-Tools referenzieren willst:

- **Amber primaer**: `#d97706`
- **Weiss (Haekchen)**: `#ffffff`
- **Empfohlener Hintergrund fuer Icon-Rahmen**: `#faf7f2` (das warme Cream aus der Report-Ansicht)

## Wenn du das Icon spaeter neu generieren willst

Aendere `logo-mark-padded.svg`, dann fuehr `python3 generate_icons.py` aus. Alle PNG-Dateien werden neu erstellt.

Wenn du eine andere Farbe testen willst (zum Beispiel Dunkelbraun), ersetz in beiden SVG-Dateien alle `#d97706` durch `#1c1917` und generiere neu.
