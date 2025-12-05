# STIL-REGELWERK — capitovo

Dieses Dokument fasst die visuellen und strukturellen Regeln für das Projekt `capitovo` zusammen. Ziel: konsistente Header/Footer, Typografie, Karten, Abstände, Widgets und Entwickler-Workflows.

## Ziel und Geltungsbereich
- Gilt für alle HTML-Seiten unter `/Abonenten` und die öffentliche Startseite.
- Regeln sind bewusst knapp, direkt anwendbar und auf die vorhandene Codebasis (`style.css`, `src/components`) abgestimmt.

## 1. Header & Footer

- Container: Verwende einen zentralen Content-Container für Header/Footer: `max-width: 72rem; margin: 0 auto; padding: 0 24px; box-sizing: border-box;` (in CSS als `.header-content` bzw. `.footer-inner`).
- Header-Layout: Logo links, Menü-Button rechts innerhalb desselben Containers. Logo und Menü-Button sollen bündig mit dem Content sein.
- Logo: Höhe `80px`, `width: auto`; Linkziel in Mitgliederseiten: `./abonenten.html`.
- Header-Position:
  - Öffentliche Seiten (z. B. `index.html`): `position: sticky; top: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);`
  - Mitgliederseiten (z. B. `abonenten.html`): nicht-sticky, `box-shadow: none`, `border-bottom: 1px solid #e0e0e0`.
- Menü-Button: sichtbare Rahmenfarbe `#1a1a1a`, `border-radius:4px`; Focus: `box-shadow: 0 0 0 4px rgba(59,130,246,0.12)`.
- Footer: `.footer-inner` nutzt dieselben Werte wie `.header-content`. Externe Links: `target="_blank" rel="noopener noreferrer"`.

## 2. Globale Container & Breiten

- Standard-Wrapper für Content: `main`, `.header-content`, `.footer-inner`, `.alle-layout` verwenden:
  - `max-width: 72rem; margin: 0 auto; padding: 0 24px;`
- Dadurch sind linke/rechte Kanten von Header, Inhalt und Footer identisch und Elemente (Logo, Menü) innerhalb der Breite ausgerichtet.

## 3. Typografie

- Primärfont: Webfont oder System-Fallback, z. B. `Inter, Roboto, sans-serif`.
- Grundgrößen (empfohlen):
  - Body: `16px` (1rem), `line-height: 1.6`.
  - H1: `clamp(1.8rem, 3.5vw, 2.6rem)` — fett.
  - H2: `clamp(1.4rem, 2.8vw, 1.8rem)` — semibold.
  - H3: `1.1rem–1.25rem` — 600.
  - Paragraph: `0.95rem–1rem`, Farbe `#4a4a4a` / `#6b7280` für Meta.
- Links: `color: var(--color-accent-blue)`; Hover: `--color-accent-blue-dark`.

## 4. Karten / Boxen (Kästchen)

- Hintergrund: `#ffffff`.
- Rand: `1px solid rgba(15,23,42,0.04)` oder `#e5e7eb`.
- Radius: `10–12px`.
- Schatten: `0 6px 20px rgba(2,6,23,0.06)`; Hover: `0 20px 40px rgba(2,6,23,0.12)`.
- Padding: `1rem–1.5rem`.
- Bilder/Media: feste Höhe (z. B. `height: 220px`) + `object-fit: cover`.

## 5. Abstände / Spacing

- Globaler Rhythmus:
  - Section-Top/Bottom: `1.5rem–2rem` (24–32px) für Standard-Sections; Hero/Feature: 48–80px.
  - Grid-Gap: `1rem` (16px).
  - Karten-Padding: `1rem–1.5rem`.
- Form Controls: Höhe `40px`, `border-radius: 8px`.
- Wichtiger Punkt: Linke und rechte Kante des Contents müssen mit den Außenkanten von Logo und Menü-Button übereinstimmen.

## 6. Buttons / CTAs

- Primary `.cta-button`: `background: var(--color-accent-blue); color: #fff; padding: 10–15px; border-radius: 6–8px; font-weight:700;`.
- Secondary: outlined, color `--color-accent-blue`.
- Disabled: graue Schattierung + `cursor: not-allowed`.

## 7. Sidebar / Navigation (Mitgliederbereich)

- Slide-in vom rechten Rand: Standard mit `transform: translateX(100%)` wenn geschlossen.
- Nav-Items: vertikale Liste, `padding: 10px 0`, Icon links, `font-size: 1.05em–1.1em`.
- Logout/Contact: am unteren Bereich optisch gruppiert, `.logout-bottom` verwenden; opt. `border-top` zur visuellen Trennung.

## 8. Formulare & Inputs

- Inputs: `height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid rgba(15,23,42,0.08)`.
- Labels: semibold; falls Floating-Labels verwendet werden, dann konsistent auf allen Seiten.

## 9. Bilder & Medien

- Logos: Höhe `80px`.
- Vorschaubilder: `object-fit: cover`, gleiche Höhe in Karten.
- Widgets: Keine großen Inline-JSON-Snippets im HTML (Editor/Linter-Probleme). Verwende programmatic insertion (IIFE) oder externe Includes.

## 10. Farben

- Primär: `--color-primary-blue: #24354b`.
- Akzent: `--color-accent-blue: #007bff` (oder `#0091d6`).
- Text: `#0f172a` / Meta `#6b7280`.

## 11. Responsivität

- Breakpoints (Empfehlung): `640px`, `1024px`, `1200px`.
- Grid: `repeat(auto-fit, minmax(300px, 1fr))` für Karten.

## 12. Accessibility (A11y)

- Alle interaktiven Elemente müssen `aria-*` Attribute und sichtbare Fokus-Indikatoren haben.
- Farbkontrast: mindestens WCAG AA (4.5:1 für Text).
- Dynamische Inhalte: `aria-live` oder role/label für screenreader.

## 13. CSS-Konventionen & Struktur

- Semantische Klassen: `.header-content`, `.footer-inner`, `.main-content`, `.alle-layout`, `.member-card`, `.filter-bar`.
- Vermeide Inline-Styles. Page-specific overrides nur wenn notwendig und im Kopf der jeweiligen Seite dokumentiert.
- Komponenten in `/src/components/` ablegen und via `insert_components.js` einbinden.

## 14. Developer-Workflow

- Embeds: programmatic insertion, keine inline JSON-Blöcke.
- Tests nach optischen Änderungen: Hard-Reload + DevTools-Console-Check.
- Commit-Messages: `type(scope): short description` (z. B. `fix(css): align header container`).

## 15. Beispiele (schnelle Snippets)

Header-Container:
```css
header .header-content {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 24px;
}
```

Card-Beispiel:
```css
.member-card {
  background: #fff;
  border: 1px solid rgba(15,23,42,0.04);
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 6px 20px rgba(2,6,23,0.06);
}
```

## 16. Weiteres
- Wenn du möchtest, erstelle ich daraus ein kürzeres „Design-Checklist“-Template (z. B. `docs/DESIGN-CHECKLIST.md`) für PR-Reviewer.

---
Datum: 2025-12-05
