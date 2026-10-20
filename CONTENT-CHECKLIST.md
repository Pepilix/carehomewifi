# Content, photography and facts to confirm

**Launched 20 October 2026 with every unconfirmed item removed from the live site.**
The figures, the CPS mention, support hours, reply-time promise, company number and photo placeholders
below are *not* on the site. Add each one back once it's confirmed.
To highlight new unconfirmed text while drafting, wrap it in `<mark class="confirm">` and set
`show_confirm_markers: true` in `_config.yml` on a branch, never on `main`.

Pages where the original wording lived: homepage stats strip, New Builds facts, LNT case study,
Technology & Integration, Managed WiFi & Support, Contact, About and Privacy.

## 1. Figures (must be verified and reconciled)

| Claim | Where it appears | Question |
|---|---|---|
| **130+** LNT homes delivered | Home stats, New Builds, LNT case study | Exact figure and as-of date? |
| **35+** homes scheduled for 2027 | Home stats, New Builds, LNT case study | Confirmed with LNT and OK to publish? |
| **7+** years | Home stats | Years in care home connectivity specifically? |
| **3,000+** devices installed and managed | Home stats | Still accurate? |
| ~~100+ care homes completed~~ | *Removed* | The old site said 100+ in total, but 130+ LNT homes alone exceeds that. Please give one reconciled total if you want a "total homes" figure. |

## 2. Clients, testimonials and partners

- [x] **Roche Care Homes** — permission confirmed for Patrick Roche's quote and the Roche logo (20 Oct 2026).
- [x] **LNT Care Developments** — permission confirmed to name LNT, use the logo, show Bradshaw Lodge photos and publish programme figures (20 Oct 2026). The figures themselves still need confirming in section 1.
- [ ] **Bradshaw Lodge** — town/location to add to the case study.
- [x] **"CPS"** — confirmed as **Person Centred Software**. Now named on the homepage, Technology & Integration and in the network explorer.
- [x] **Sensio** — confirmed: Sensio's monitoring is used in LNT care homes, on the networks we install. Worded that way on the homepage, Technology & Integration, the explorer and the LNT case study. No partnership is claimed.

## 3. Company and legal

- [x] Registered company: Inspire Audio Visual Ltd, 08332115, Unit 661c, Street 3, Thorp Arch Estate, Wetherby, LS23 7FF. Now in the footer, Privacy notice and structured data.
- [ ] **ICO fee:** Inspire AV isn't on the ICO register. Run the ICO's 3-minute self-assessment (ico.org.uk/for-organisations/data-protection-fee/self-assessment). If a fee is due, it's £52 a year for most small firms (tier 1). Once registered, send the ZA… number to add to the Privacy notice.
- [x] Email provider: Microsoft 365 (from inspire-av.com's mail records). Now named in the Privacy notice.
- [ ] **Retention period:** decide how long enquiries that don't lead to work are kept. 24 months is a common, defensible choice. The notice currently says "only as long as we need them".
- [ ] **Privacy notice review:** have whoever handles Inspire AV's data protection read `/privacy/` against the ICO's checklist (ico.org.uk/for-organisations/advice-for-small-organisations/privacy-notices-and-cookies).
- [ ] **hello@carehomewifi.com:** carehomewifi.com had no mail server at launch, so mail to hello@ bounced. The site shows jonathan.a@inspire-av.com until a mailbox or forward is set up; then change `email:` in `_config.yml` back to hello@carehomewifi.com.
- [x] Accreditations: SafeContractor approved; insured for construction-site and care-home work (About).

## 4. Service details

- [x] Support: office 8:30am–5:30pm, 24/7 out-of-hours support line, on-site attendance on request (Managed WiFi & Support). No response-time promise is stated.
- [x] Reply time: same working day (Contact).
- [x] Fluke-certified cable test results handed over at first fix (New Builds, timeline).
- [x] Survey output: coverage heatmaps in the initial design, plus a site test after installation (Surveys & Design, timeline).
- [x] Company history added to About (started 2021 via LNT's owner). Team size not given, so not stated.

## 5. Photography wanted

The site uses only real project photos. Placeholders are marked **Photo to follow**:

- [ ] Comms cabinet or access point installation at an LNT home (LNT case study)
- [ ] Example coverage plan or survey output, anonymised (Surveys & Design)
- [ ] Team photo, or the Thorp Arch office or workshop (About)
- [ ] More wanted generally: engineers surveying with equipment, cabling and containment at first fix, completed corridors and lounges showing access points, more completed developments.

## 6. Branding (after the design is signed off)

- [ ] Logo version for dark backgrounds: the orange "WiFi" in `logo-reverse.png` is hard to read on navy (footer).

## 7. Go-live tasks

- [ ] Activate FormSubmit: send one test enquiry from the live domain, then Jonathan clicks the confirmation email.
- [ ] Add the Google TXT record at GoDaddy (Search Console Domain property), then submit `https://carehomewifi.com/sitemap.xml` in Search Console.
- [x] **Enforce HTTPS**, switched on via the GitHub API at the second launch (20 Oct 2026).
