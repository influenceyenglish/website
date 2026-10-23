# Website color guidelines

The shared palette lives in `src/styles/tokens.css`. Change `--brand-blue` and `--brand-red` there; their light and dark variants are derived automatically using `color-mix()`.

| Role                | Token                                               | Usage                                                        |
| ------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Logo blue           | `--primary` / `--brand-blue`                        | #01408f; primary buttons, links, interactive controls        |
| Dark blue           | `--primary-dark`                                    | Dark sections, headings, footer, pricing panel               |
| Light blue          | `--primary-light`                                   | Focus rings                                                  |
| Soft blue           | `--accent` / `--primary-soft`                       | Highlight cards, secondary buttons, badges, selection        |
| Near-white blue     | `--paper` / `--background-tint`                     | Quiet page and section backgrounds                           |
| Logo red            | `--secondary` / `--brand-red`                       | #e50110; small quotation details, stars, required indicators |
| Pale red / dark red | `--error-background` / `--error-ink`                | Readable validation messages                                 |
| Supporting text     | `--muted` / `--on-dark-muted`                       | Use the appropriate token for light or dark backgrounds      |
| Borders             | `--border` / `--border-strong` / `--border-on-dark` | Cards, inputs, dividers, controls                            |

Keep large areas white, pale blue, or navy. Reserve red for small details. Avoid using secondary red as a section background or default button fill. Use semantic variables in CSS instead of adding literal brand shades.

The Razorpay overlay reads `--brand-blue` from the computed stylesheet. The SVG logo at `public/images/influencey-english.svg` uses literal brand fills because external SVG images cannot inherit page CSS variables; update its two fills if the logo changes again.
