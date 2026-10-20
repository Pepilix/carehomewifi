# Keyword-to-page map

One primary search intent per page, so pages support each other instead of competing.
When adding content, put it on the page whose intent it serves and link to it from elsewhere.

| Page | URL | Primary intent / terms | Secondary terms | Visitor | Main CTA |
|---|---|---|---|---|---|
| Home | `/` | care home WiFi; care home network specialists | care home network infrastructure | All — routing and proof | Route to audience page; enquiry form |
| New Builds | `/new-build-care-home-networks/` | new-build care home network infrastructure | care home network specification; data point schedule; first fix | Developers, construction directors, main contractors | Discuss a New-Build Project |
| Existing Homes | `/care-home-wifi-problems/` | care home WiFi problems; care home WiFi upgrade | WiFi assessment; dead spots; dropouts | Owners, managers | Request a WiFi Assessment |
| Care groups | `/care-group-networks/` | multi-site care home networks; care group network standard | estate survey; standardisation | Care group directors, procurement | Discuss Your Care Home Portfolio |
| Services (hub) | `/services/` | care home network services; delivery process | design, install, commission, support | Comparing providers | Discuss a Project |
| Surveys & Design | `/care-home-wifi-survey/` | care home WiFi survey; care home network design | coverage heatmaps; diagnostic survey | Owners, IT teams, design teams | Request a WiFi Assessment |
| Installation | `/care-home-network-installation/` | care home WiFi installation; network cabling and infrastructure | fibre backbone; PoE switching; Fluke testing | Contractors, IT teams | Discuss a Project |
| Managed Support | `/managed-care-home-wifi/` | managed WiFi for care homes; care home network support | monitoring; troubleshooting; out-of-hours | Operators, IT teams | Discuss Support |
| Technology & Integration | `/care-technology-integration/` | care home technology connectivity | Sensio; Person Centred Software; nurse call; segmentation | IT directors, technology suppliers | Discuss a Technology Project |
| Projects | `/projects/` + case studies | care home network case studies | LNT; Roche; Bradshaw Lodge | All — proof | Sector-specific CTA on each case study |
| Insights | `/insights/…` | informational questions (why WiFi drops out, staff vs resident WiFi, design principles, new-build checklist) | — | Researchers early in the journey | Link to the matching service page |

## Rules applied
- One H1 per page, matching its primary intent in natural British English.
- The homepage summarises and routes; engineering detail lives on Technology & Integration, and the full delivery process on Services.
- No town or city keyword variants. The business is UK-wide from a single address.
- Old URLs redirect to the page that replaced them (see `redirect_from:` in each page's front matter), never to the homepage unless the homepage replaced the content.
