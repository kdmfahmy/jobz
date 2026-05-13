# Cover Letter Generation Style Guide

## LaTeX Engine
Use `tectonic`. Must compile in a single pass.

## Document Class & Packages
```latex
\documentclass[10pt, letterpaper]{article}
\usepackage[top=1in, bottom=1in, left=1in, right=1in]{geometry}
\usepackage{hyperref}
\usepackage{parskip}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{xcolor}
```

## Page Constraint — HARD LIMIT
**The cover letter must fill approximately 3/4 of a page — not more, not less.**

- Too short (< 1/2 page) looks thin — fill it with substance, not padding
- Too long (full page) looks wordy — cut ruthlessly
- Target: header + body land at roughly the 3/4 mark, sign-off ends it cleanly

Body word count: **220–260 words maximum** (not counting header, recipient block, subject line, or sign-off).

## Visual Style
- Clean, professional letter format
- Matches CV fonts and accent color for a cohesive application package

## Structure
1. Sender info (name, email, phone, date) — top right
2. Blank line
3. Recipient block: `Hiring Manager` / `[Team Name] Team, Apple Inc., Cupertino, CA`
4. Blank line
5. Subject line (bold): `Re: [Exact Job Title] — [Job ID if available]`
6. Blank line
7. Opening paragraph (2–3 sentences)
8. Body paragraph 1 (3–4 sentences)
9. Body paragraph 2 (3–4 sentences)
10. Closing paragraph (2 sentences)
11. Sign-off (`Sincerely,` then name)

## Tone & Content Rules

### Opening paragraph (2–3 sentences)
- Lead with a specific, genuine hook — a product, a problem, a moment
- State the role clearly
- Signal why you specifically, not why Apple generally
- NO clichés: "I am excited to apply...", "Apple has always inspired me...", "I am passionate about..."

### Body paragraph 1 — Relevant impact (3–4 sentences)
- Pick the single strongest experience that maps to the role's core responsibility
- Tell what you built/led, the challenge, and the measurable outcome
- Be specific — numbers, scale, outcome

### Body paragraph 2 — Why this team / why now (3–4 sentences)
- Show you understand the team's work (reference the JD, Apple products, or known initiatives)
- Connect your next goal to what this role enables
- Must feel researched, not generic

### Closing paragraph (2 sentences)
- Confident, not desperate
- Invite next steps directly: "I'd welcome the chance to discuss how my work on X could contribute to Y"
- No "Thank you for your consideration"

## Content Rules
- Every sentence must earn its place — cut anything generic
- Mirror JD language naturally (no keyword stuffing)
- Apple values craftsmanship, user obsession, and getting details right — reflect this in writing quality

## Output
Generate a complete, compilable `.tex` file. Recipient name should be "Hiring Manager" unless specified.
