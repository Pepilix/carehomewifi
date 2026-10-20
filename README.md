# CareHomeWiFi.com

Website for CareHomeWiFi.com, the care home network division of Inspire Audio Visual.
GitHub Pages builds it automatically with Jekyll whenever `main` changes. There's nothing to install.

## Common updates

All of these can be done in the GitHub web interface (**Add file → Create new file**, or edit with the pencil icon).

### Add a project / case study
Copy `_projects/roche-care-homes.md` to a new file in `_projects/`, e.g. `_projects/oak-house.md`.
Edit the details between the `---` lines (title, client, summary, image, facts) and the text below them.
The new project appears automatically on the homepage, the Projects page and at `/projects/oak-house/`.
`order:` controls the position (lower numbers come first).

### Add an Insights article
Copy any file in `_insights/` to a new file, change the front matter (title, description, topic, date) and write the article in Markdown.

### Add photos
Upload JPEGs to `assets/img/`, ideally no more than 1800px on the long edge.
Refer to them as `/assets/img/your-photo.jpg` and always add descriptive alt text.

### Change phone, email, address or where enquiries go
Edit `_config.yml`. The form destination is `form_endpoint`.

### Change the menu
Edit `_data/navigation.yml`.

## Structure

| Path | What it is |
|---|---|
| `_config.yml` | Site settings, contact details, form destination |
| `_data/navigation.yml` | Main menu |
| `_layouts/` | Page templates (default, project case study, insight article) |
| `_includes/` | Shared parts: header, footer, enquiry form, network diagram, FAQ, call-to-action band |
| `_projects/`, `_insights/` | Case studies and articles (Markdown) |
| `assets/css/site.css` | Design system: colour, type, spacing and component styles |
| `assets/js/site.js` | Menu, dropdown, gentle reveals and the enquiry form |
| `CONTENT-CHECKLIST.md` | Facts and photos to confirm before launch |

## Design tokens
Colours, type sizes, spacing and borders are CSS variables at the top of `assets/css/site.css`:
ivory `#F7F6F2`, navy `#172B3A`, slate `#586B77`, teal `#467B78`, soft grey `#E8ECEB`.
`--teal-ink` (`#3A6966`) is a darker teal used only for teal text on light backgrounds, to meet WCAG AA contrast.
Fonts are Manrope (headings) and Inter (body), self-hosted in `assets/fonts/`.

## Redirects
Old URLs are redirected with `redirect_from:` in the front matter of the page that replaced them (the jekyll-redirect-from plugin).
GitHub Pages can't send true server-side 301s, so these are instant meta-refresh redirects with a canonical tag. Google treats them as permanent.

## Unconfirmed facts
While `show_confirm_markers: true`, anything wrapped in `<mark class="confirm">` shows a dashed **Confirm** label.
Resolve everything in `CONTENT-CHECKLIST.md`, then set it to `false`.
