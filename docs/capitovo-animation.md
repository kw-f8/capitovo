# capitovo Button‑Animation (Glow)

Kurzbeschreibung
- Subtiler Leuchteffekt (Glow) beim Hover und Keyboard-Focus für Aktions-Buttons.
- Genutzt z.B. in `Abonenten/vorlage.html` auf den Buttons oben (Zurück, Favorit).

Wozu
- Einheitliches, dezentes Hover-/Focus-Verhalten für Buttons und interaktive Elemente.

Kern-Implementierung (CSS)
```css
.back-btn-glow {
  box-shadow: none;
  transition: box-shadow 0.18s cubic-bezier(0.65,0,0.35,1), background-color 0.14s;
}
.back-btn-glow:hover,
.back-btn-glow:focus-visible {
  box-shadow: 0 0 0 2px rgba(0,145,214,0.10), 0 0 4px 1px rgba(0,145,214,0.08);
}
/* Reduced-motion fallback */
@media (prefers-reduced-motion: reduce) {
  .back-btn-glow { transition: none; }
  .back-btn-glow:hover, .back-btn-glow:focus-visible { box-shadow: none; }
}
```

Hinweise zur Anwendung
- Klasse: einfach `.back-btn-glow` an einem Button/Link hinzufügen.
- `:focus-visible` stellt sicher, dass die sichtbare Fokusanzeige nur für Tastaturnutzer erscheint.
- Farben/Intensität: passe die `rgba(...)`-Werte an `--color-accent-blue` an, falls du die Akzentfarbe zentral nutzen willst.

Icon / SVG-Toggle (Favorit)
- Das Favoriten-Icon wechselt zusätzlich `fill`/Farbe. Beispiel aus der Seite:
```html
<button class="back-btn-glow" aria-pressed="false">
  <svg class="w-5 h-5 text-gray-400" ...>
    <!-- Pfad -->
  </svg>
</button>
```
- JS ändert `svg`-`fill` auf `currentColor` und toggelt Utility-Klassen (`text-yellow-400` / `text-gray-400`).
- Empfehlung: SVGs ebenfalls Übergänge geben (z.B. `transition: color 0.18s, fill 0.18s;`).

Beispiel HTML (wiederverwendbar)
```html
<a href="#" class="back-btn-glow inline-flex items-center px-3 py-2 rounded-md" role="button">← Zurück</a>

<button class="back-btn-glow inline-flex items-center justify-center w-10 h-10 rounded-md" aria-pressed="false" title="Favorit">
  <!-- SVG hier -->
</button>
```

Accessibility & Best Practices
- Immer `:focus-visible` nutzen statt `:focus` für ästhetische Fokusanzeigen.
- `aria-pressed`, `title` und aussagekräftige `aria-label`s für Zustands-Buttons (Favorit) verwenden.
- Für Nutzer mit reduziertem Bewegungsbedarf die Übergänge ausschalten (siehe `prefers-reduced-motion`).

Wo ablegen
- Datei: `docs/capitovo-animation.md` (dieses Dokument).
- Empfohlen: die CSS-Regel in `style.css` unter einer gemeinsam genutzten Sektion ablegen, dann überall die Klasse verwenden.

Beispiel-Verbesserung (optional)
- Wenn du die Akzentfarbe als RGB-Variable pflegst, kannst du die Glow-Farbe über `rgba(var(--accent-rgb), 0.10)` steuern.

-- Ende --
