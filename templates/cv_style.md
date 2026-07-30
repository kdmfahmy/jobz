# CV Generation Style Guide

## LaTeX Engine
Use `tectonic` to compile. The document must compile with a single run (no bibtex/bibliography).

## Document Class & Packages
Use the following preamble exactly:

```latex
\documentclass[10pt, letterpaper]{article}
\usepackage[top=0.55in, bottom=0.55in, left=0.7in, right=0.7in]{geometry}
\usepackage{hyperref}
\usepackage{fontawesome}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage[T1]{fontenc}
\usepackage{lmodern}

% No paragraph indentation — prevents indent drift after itemize blocks
\setlength{\parindent}{0pt}
\setlength{\parskip}{0pt}

% Tight list spacing — critical for 1-page fit
\setlist[itemize]{noitemsep, topsep=2pt, parsep=0pt, leftmargin=1.2em}

% Tight section spacing
\titlespacing*{\section}{0pt}{6pt}{3pt}

\definecolor{accent}{HTML}{111111}

\hypersetup{hidelinks}

\titleformat{\section}{\normalfont\fontsize{11}{13}\selectfont\bfseries}{}{0em}{\MakeUppercase}[\titlerule]
```

After `\begin{document}`, add `\raggedright` to use left-aligned text throughout — avoids the uneven word spacing that full justification produces.

## Header — Name, Headline, Contact Line (use exactly this)

```latex
{\fontsize{14}{16}\selectfont\textbf{Khaled Afifi}}\\[2pt]
{\fontsize{10.5}{12}\selectfont\textit{Forward-Deployed Software Engineer --- Enterprise Client Delivery}}\\[3pt]
\faEnvelope\ \href{mailto:kdmfahmy@gmail.com}{kdmfahmy@gmail.com} \quad
\faPhone\ +971 566 292 118 \quad
\faLinkedinSquare\ \href{https://linkedin.com/in/khaled-afifi-9469221aa}{linkedin.com/in/khaled-afifi-9469221aa} \quad
\faMapMarker\ Dubai, UAE
```

**Headline line (required on every CV):** the second line is a one-line professional headline chosen by the Writer to mirror the JD's role identity when defensible (per the Defensibility Framework in `agents/writer.md`). The text above is an example — replace it per application. It is part of the header and is never trimmed for page fit.

**Golden Visa (conditional):** for UAE/GCC-located roles ONLY, the contact line's location segment becomes:

```latex
\faMapMarker\ Dubai, UAE --- UAE Golden Visa
```

For all other locations (or when the role location is unknown), keep `\faMapMarker\ Dubai, UAE` unchanged. The education-line Golden Visa mention stays in every CV regardless.

Use `\faLinkedinSquare` (not `\faLinkedin`) and `\faMapMarker` (no asterisk) — these are the correct `fontawesome` v4 names.

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
- Accent color: `#111111` (near-black) for section headers and rule lines — no blue anywhere
- Links: `\hypersetup{hidelinks}` — no underline, no color
- Font size: 10pt body, 14pt name header, 10.5pt headline line, 11pt section titles

## Structure Order
1. Header (Name, headline line, contact line with icons)
2. Professional Summary (2 lines max — tight)
3. Work Experience (reverse chronological, last 2–3 roles only)
4. Skills (one line per category, 3 categories max)
5. Education (degree, institution, date range — 1 line)
6. Projects (2 max, 1 bullet each — only if space allows)

Omit Certifications/Awards as a separate section — weave them into Skills or omit entirely. Prefer filling space with stronger experience bullets.

## Formatting Rules — Consistency Is Non-Negotiable

### Role entries
Each role must follow this exact pattern — no variation:
```latex
\noindent\textbf{Role Title} \hfill \textit{Start -- End}\\
\textit{Company Name} \hfill \textit{City, Country}
\begin{itemize}
  \item ...
\end{itemize}
```

Rules:
- **Always** prefix the role title line with `\noindent` — prevents paragraph indent drift after `\end{itemize}`
- Dates are **italic** — `\textit{May 2025 -- Present}` on every role and education entry
- Company name is `\textit{}`, location is also `\textit{}` — both italic, consistently across every entry
- Separate consecutive roles with `\vspace{4pt}` between `\end{itemize}` and the next `\noindent\textbf{}`

### Education entry
Education must fit on two lines at most — degree name and year on line 1, institution on line 2:
```latex
\noindent\textbf{Degree Name} \hfill \textit{Mon YYYY -- Mon YYYY}\\
Institution Name --- GPA: X.XX / 4.0 \quad UAE Golden Visa recipient for academic achievement
```
Use the full date range (e.g. `Sep 2017 -- Dec 2021`), not just the graduation year — consistent with the job entry date format.
Include GPA inline on the institution line, left-aligned (no `\hfill`).
**Always append `\quad UAE Golden Visa recipient for academic achievement` after the GPA** — this credential must appear on every CV, on the education line. Never omit it and never shorten it.
Never use `\hfill` after a long degree name — it will wrap and the date will appear alone on a new line.
If the degree name is long, shorten it (e.g. "Dual B.Sc., Computer Engineering & Electrical Engineering").

### Skills
Use plain text entries with bold label — no `\noindent` needed when `\parindent` is 0:
```latex
\textbf{Category:} item one, item two, item three\\[2pt]
\textbf{Category:} ...
```
No trailing `\\[2pt]` on the last line.

## Pre-Save Visual Checklist

Before saving the .tex file, verify every item below. Do not skip any check.

**Indentation:**
- [ ] `\setlength{\parindent}{0pt}` and `\setlength{\parskip}{0pt}` are in the preamble
- [ ] Every role title line starts with `\noindent\textbf{...}`
- [ ] No role title is indented more than any other — they must all start at the same left margin

**Font / style consistency:**
- [ ] Dates are italic — `\textit{}` wrapping the date on every role and education entry
- [ ] Company names and locations both use `\textit{}` — consistently across all entries
- [ ] No random `\textbf{}` or `\textit{}` used for decoration outside the defined patterns

**Education:**
- [ ] Degree name and year fit on one line (use `\hfill` for year)
- [ ] Institution is on the next line — not wrapping past the margin

**Overall:**
- [ ] All role entries use identical LaTeX structure (same line pattern, same `\hfill` usage)
- [ ] No section has different spacing treatment than others
- [ ] Headline line is present directly under the name, italic, 10.5pt
- [ ] Golden Visa appears on the contact line ONLY for UAE/GCC-located roles; education-line mention present in all cases

## Content Volume Limits (enforce strictly)

| Section | Limit |
|---|---|
| Summary | 2 lines max |
| Work Experience | 2–3 roles max |
| Bullets per most recent role | 3–4 |
| Bullets per older role | 2–3 |
| Skills categories | 3 max, single line each |
| Education | 2 lines max (degree + date range on line 1, institution + GPA on line 2) |
| Projects | 2 max, 1 bullet each |

**Every role must be self-explanatory.** A reader who doesn't know the candidate should understand what the role involved and what was contributed — even with 2 bullets. Never leave a role with a single bullet. If space is tight, cut a bullet from the most recent role before cutting from an older one: a well-rounded picture of the candidate matters more than an exhaustive list of recent work.

## Content Rules
- **Tailor aggressively**: reorder bullets to surface what matches the JD first
- **Mirror JD language**: use exact keywords from the job description
- **Quantify everything possible**: "improved performance" → "reduced latency by 35%"
- **Action verbs**: start every bullet with a strong past-tense verb
- **No filler**: cut anything that doesn't directly support this application
- **No first-person pronouns in bullets**

## Output
Generate a complete, compilable `.tex` file. Every field must be filled from the base profile and tailored to the job. No placeholder text.
