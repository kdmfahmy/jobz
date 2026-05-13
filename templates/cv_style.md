# CV Generation Style Guide

## LaTeX Engine
Use `tectonic` to compile. The document must compile with a single run (no bibtex/bibliography).

## Document Class & Packages
Use the following preamble exactly:

```latex
\documentclass[10pt, letterpaper]{article}
\usepackage[top=0.55in, bottom=0.55in, left=0.7in, right=0.7in]{geometry}
\usepackage{hyperref}
\usepackage{fontawesome5}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage[T1]{fontenc}
\usepackage{lmodern}

% Tight list spacing — critical for 1-page fit
\setlist[itemize]{noitemsep, topsep=2pt, parsep=0pt, leftmargin=1.2em}

% Tight section spacing
\titlespacing*{\section}{0pt}{6pt}{3pt}
```

Do NOT use the `parskip` package — it adds unwanted paragraph gaps.

## Page Constraint — HARD LIMIT
**The CV must fit on exactly 1 page. This is non-negotiable.**

If the content does not fit, cut it. Prioritize ruthlessly:
1. Cut older roles first (keep the last 2–3 jobs max)
2. Reduce bullets to the minimum that tell the story (see limits below)
3. Shorten the summary
4. Remove certifications unless directly required by the JD
5. Drop any project not in the top 2 most relevant

Never reduce font size below 10pt. Never reduce margins beyond the values above.

## Visual Style
- Clean, minimal, ATS-friendly (no tables, no columns, no fancy graphics)
- Accent color: `#0066CC` (blue) for section headers and links
- Font size: 10pt body, 14pt name header, 11pt section titles

## Structure Order
1. Header (Name, contact line with icons)
2. Professional Summary (2 lines max — tight)
3. Work Experience (reverse chronological, last 2–3 roles only)
4. Skills (one line per category, 3 categories max)
5. Education (degree, institution, year — 1 line)
6. Projects (2 max, 1 bullet each)

Omit Certifications/Awards unless they are explicitly required by the JD.

## Content Volume Limits (enforce strictly)

| Section | Limit |
|---|---|
| Summary | 2 lines max |
| Work Experience | 2–3 roles max |
| Bullets per most recent role | 3–4 max |
| Bullets per older role | 2 max |
| Skills categories | 3 max, single line each |
| Education | 1 line (no GPA, no coursework) |
| Projects | 2 max, 1 bullet each |

## Content Rules
- **Tailor aggressively**: reorder bullets to surface what matches the JD first
- **Mirror JD language**: use exact keywords from the job description
- **Quantify everything possible**: "improved performance" → "reduced latency by 35%"
- **Action verbs**: start every bullet with a strong past-tense verb
- **No filler**: cut anything that doesn't directly support this application
- **No first-person pronouns in bullets**

## Output
Generate a complete, compilable `.tex` file. Every field must be filled from the base profile and tailored to the job. No placeholder text.
