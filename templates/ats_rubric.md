# ATS Scoring Rubric

Score the CV on a 0–100 scale using the five categories below. A score of 80+ is the target before finalizing.

---

## 1. Keyword & Phrase Match — 35 points

Extract all keywords, technologies, tools, frameworks, role-specific verbs, and domain terms from the job description. Then check how many appear in the CV (exact match or close synonym counts).

Scoring:
- 90–100% of JD keywords present → 35 pts
- 75–89% → 28 pts
- 60–74% → 21 pts
- 45–59% → 14 pts
- Below 45% → 7 pts

**ATS tip:** Include keywords in context (inside bullet points), not just in a skills list. ATS systems weight in-context usage higher.

---

## 2. Quantified Achievements — 25 points

Count the total number of experience bullets. Count how many contain at least one number, percentage, dollar amount, team size, time saved, volume metric, or scale indicator.

Scoring:
- 80%+ of bullets quantified → 25 pts
- 60–79% → 20 pts
- 40–59% → 15 pts
- 20–39% → 10 pts
- Below 20% → 5 pts

**ATS tip:** Numbers signal impact and are parsed and weighted by modern ATS systems.

---

## 3. Section Completeness & Structure — 20 points

Check that the CV contains all required sections with standard ATS-recognized headers:

Required (4 pts each):
- Contact Information (name, email, phone, LinkedIn)
- Professional Summary or Objective
- Work Experience (with company, title, dates for each role)
- Skills (grouped by category)
- Education (degree, institution, year)

**ATS tip:** Non-standard section headers (e.g. "What I've Built" instead of "Work Experience") confuse parsers. Use standard terms exactly.

---

## 4. Formatting & Parseability — 12 points

Check for ATS-hostile formatting elements:

- No tables → 3 pts
- No multi-column layouts → 3 pts
- No images, icons, or graphics in content areas → 2 pts
- Dates in consistent, parseable format (e.g. "Jun 2023" or "June 2023") → 2 pts
- No text inside headers/footers that carry critical info → 2 pts

**ATS tip:** LaTeX compiled to PDF is generally ATS-safe as long as it avoids multi-column layouts and tables for content.

---

## 5. Action Verbs & Language Quality — 8 points

Check that experience bullets:
- Start with a strong past-tense action verb (Led, Built, Designed, Reduced, Shipped, Implemented, etc.) → 4 pts
- Avoid weak openers ("Responsible for", "Helped with", "Worked on", "Assisted in") → 2 pts
- Avoid first-person pronouns (I, my, we) → 2 pts

---

## Scoring Output Format

After scoring, output a structured breakdown like this:

```
ATS Score: XX/100

Category Breakdown:
  Keyword Match:          XX/35  — [X of Y JD keywords matched]
  Quantified Achievements: XX/25 — [X of Y bullets have metrics]
  Section Completeness:   XX/20  — [list any missing sections]
  Formatting:             XX/12  — [list any issues found]
  Action Verbs:           XX/8   — [list any weak openers found]

Gaps to fix before next iteration:
  1. [Specific gap with fix instruction]
  2. [Specific gap with fix instruction]
  ...
```

If score >= 80: proceed to finalize.
If score < 80: list the gaps and revise the CV to address them, then re-score.
