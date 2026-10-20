# Brand assets

The approved CareHomeWiFi logo and icons are installed. Paths are set in
`_config.yml` under `brand:`. To replace a file, keep the same filename and
path, and no config change is needed.

| Asset | File | Size | Used for |
|---|---|---|---|
| Horizontal logo | `assets/brand/carehomewifi-logo-horizontal.png` | 520×108, transparent | Site header (`brand.logo`) |
| Light logo | `assets/brand/carehomewifi-logo-light.png` | 520×108, transparent | Footer on navy (`brand.logo_reverse`) |
| Stacked logo | `assets/brand/carehomewifi-logo-stacked.png` | 600×375, transparent | Organization structured data (`brand.logo_schema`) |
| Monogram | `assets/brand/carehomewifi-monogram.png` | 512×512, transparent | Master for icons; available for other uses |
| Favicon | `favicon.ico` (site root) | 16, 32 and 48px | Browsers, Google search results |
| Favicon PNGs | `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` (site root) | as named | Browsers, Google search results |
| Apple touch icon | `apple-touch-icon.png` (site root) | 180×180, white background | iOS home screen |
| Android icons | `android-chrome-192x192.png`, `android-chrome-512x512.png` (site root) | as named, white background | `site.webmanifest` |
| Social sharing image | `assets/brand/og-default.jpg` | 1200×630 | Default Open Graph / X image (project photo + light logo) |

The PNGs are generated from the supplied artwork by `tools/brand-assets.ps1`
(not published with the site). Re-run it if the source artwork changes.

## Still needed

- **Vector (SVG) artwork.** Only raster artwork was supplied, so no SVG logo or
  SVG favicon is in use. When the designer supplies true vector files, add them
  to `assets/brand/` and set `brand.favicon_svg` (and the logo paths, with
  `logo_width` / `logo_height` set to the SVG's viewBox).
- **16px favicon.** Recognisable but soft at 16px. A simplified small-size
  version of the monogram from the designer would sharpen it.
