# Brand assets: where the final logo and icons go

The site is ready for the commissioned logo and favicon. Upload each file to the
location below, then update the matching line in `_config.yml` under `brand:`
(or keep the same filename and path, and no config change is needed).
Until then the current logo and favicon stay in use.

| Asset | Upload to | Format and size | `_config.yml` key |
|---|---|---|---|
| Main logo (header, light backgrounds) | `assets/brand/logo.svg` | SVG; wide wordmark recommended, displayed up to about 200 × 48px | `brand.logo` (also set `logo_width` / `logo_height` to the SVG's viewBox width and height) |
| Reverse logo (footer, navy background) | `assets/brand/logo-reverse.svg` | SVG; light version for dark backgrounds, displayed up to about 210 × 64px | `brand.logo_reverse` |
| Favicon (modern browsers) | `assets/brand/favicon.svg` | SVG, square | `brand.favicon_svg` |
| Favicon (fallback) | `favicon.ico` (site root) | ICO containing 32×32 (and ideally 16×16) | `brand.favicon_ico: "/favicon.ico"` |
| Apple touch icon | `apple-touch-icon.png` (site root) | PNG, 180×180, no transparency | `brand.apple_touch_icon: "/apple-touch-icon.png"` |
| Web app icon, small | `assets/brand/icon-192.png` | PNG, 192×192 | `brand.icon_192` (switches on the web manifest) |
| Web app icon, large | `assets/brand/icon-512.png` | PNG, 512×512 | `brand.icon_512` |
| Social sharing image | `assets/brand/og-default.jpg` | JPG, exactly 1200×630, under about 300 KB, with key content kept away from the edges | `brand.og_image` (then set `og_image_width: 1200`, `og_image_height: 630` and `og_image_alt`) |

Notes
- The header and footer constrain the logo's height, so a squarer logo won't break the layout. Check the header on a phone after uploading.
- `favicon.ico` and `apple-touch-icon.png` belong in the **site root**, because browsers and iOS request those addresses automatically even without a link tag. Until they exist, those requests return 404, which is harmless but shows in some audits.
- The structured data uses `brand.logo` as the business logo, so Google will pick up the new logo too. Google prefers a logo at least 112×112px. An SVG or a PNG of the mark at that size works.
- Project and article pages already use their own photo for social sharing (the `image:` line in each file). The default image is used everywhere else.
