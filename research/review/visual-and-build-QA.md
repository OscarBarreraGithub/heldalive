# Final visual and build verification

Date: 2026-09-15. Checked after all manuscript corrections from the two reviewer rounds.

- Full manuscript: **21 pages**; short manuscript: **4 pages**, including title, abstract and references.
- Every final page rendered with Poppler and inspected on contact sheets; larger views used for reference pages and the short final page. Tables, equations, plots, captions, page numbering and reference links are readable and within margins. No overlap or clipping found.
- Both final LaTeX logs have no `Overfull`, `undefined`, or `Warning` matches. All 24 bibliography keys cited by the full manuscript and all 18 cited by the short manuscript resolve.
- `pdffonts` confirms embedded fonts; generated plots use embedded fonts.
- Each source ZIP was extracted into its own directory and compiled independently using only included source files and ordinary installed TeX Live packages. Resulting page counts are 21 and 4. Machine-readable results: `archive-validation.json`.
- Numerical validation is recorded in `../calculations/results.json` and was independently rerun by the reviewer. No malware or model weights were used.
- Final sources/PDFs and ZIP contents were also checked by the second reviewer. The complete research package was refreshed after adding final review records.

These checks establish document integrity and reproducibility for the stated models. They do not supply empirical resource or propagation coefficients absent from the reviewed evidence.
