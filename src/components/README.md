capitovo components
===================

This folder contains simple static HTML snippets and a tiny loader to insert them into pages at runtime. Use these to keep the top header and bottom legal footer consistent across pages.

Files
-----
- `capitovo-header.html` — header markup (logo + menu toggle)
- `capitovo-footer.html` — footer with legal links
- `insert_components.js` — small script that replaces placeholders with the snippet HTML via `fetch`

Usage
-----
1) Add placeholders in your page where you want the header/footer. Example (top of the `<body>`):

   <div data-include="header"></div>

   ... your page content ...

   <div data-include="footer"></div>

2) Include the loader script before `</body>`:

   <script src="/src/components/insert_components.js"></script>

Notes
-----
- The loader uses `fetch` to load `/src/components/capitovo-header.html` and `/src/components/capitovo-footer.html`.
- On GitHub Pages the files are served under the repository root — the absolute paths used above should work. If you serve pages from a subpath, adjust the paths accordingly.
- This is a client‑side include; pages will still work without JS but won't show the header/footer until the script runs.
