# CV Generation Style Guide

## LaTeX Engine
Use `tectonic` to compile. The document must compile with a single run (no bibtex/bibliography).

## Document Class & Packages
Use the following preamble:

```latex
\documentclass[10pt, letterpaper]{article}
\usepackage[margin=0.75in]{geometry}
\usepackage{hyperref}
\usepackage{fontawesome5}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{parskip}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
```

## Visual Style
- Clean, minimal, ATS-friendly (no tables, no columns, no fancy graphics)
- Accent color: `#0066CC` (Apple-style blue) for section headers and links
- Font size: 10pt body, 14pt name header, 11pt section titles
- Consistent spacing: tight but readable, fits on 1 page for CV (2 max)

## Structure Order
1. Header (Name, contact line with icons)
2. Professional Summary (3 lines max, tailored to role)
3. Work Experience (reverse chronological)
4. Skills (condensed, grouped by category)
5. Education
6. Projects (only include 2–3 most relevant to this role)
7. Certifications/Awards (if relevant)

## Content Rules
- **Tailor aggressively**: reorder bullet points to surface what matches the JD first
- **Mirror JD language**: use the exact keywords from the job description (ATS optimization)
- **Quantify everything possible**: "improved performance" → "reduced latency by 35%"
- **Action verbs**: start every bullet with a strong past-tense verb (Built, Led, Designed, Reduced, Shipped, etc.)
- **No filler**: cut anything that doesn't directly support the application
- **Apple context**: emphasize scale, user impact, polish, cross-functional work, and "making a dent in the universe"-style outcomes when the data supports it

## Output
Generate a complete, compilable `.tex` file. Do not include placeholder text — every field must be filled from the base profile and tailored to the job.
