# Cover Letter Generation Style Guide

## LaTeX Engine
Use `tectonic`. Must compile in a single pass.

## Document Class & Packages
```latex
\documentclass[10pt, letterpaper]{article}
\usepackage[margin=1in]{geometry}
\usepackage{hyperref}
\usepackage{parskip}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\usepackage{xcolor}
```

## Visual Style
- Clean, professional letter format
- Matches CV fonts and accent color for a cohesive application package
- Single page, always

## Structure
1. Sender info (name, email, phone, date) — top right or top left
2. Recipient block: Hiring Manager / [Team Name] Team, Apple Inc., Cupertino, CA
3. Subject line (bold): Re: [Exact Job Title] — [Job ID if available]
4. Opening paragraph
5. Body (2 paragraphs)
6. Closing paragraph
7. Sign-off

## Tone & Content Rules

### Opening paragraph
- Lead with a specific, genuine hook — a product, a moment, a problem Apple is solving
- State the role clearly
- Signal why you specifically, not why Apple generally (everyone wants to work at Apple)
- NO clichés: "I am excited to apply...", "Apple has always inspired me...", "I am a passionate..."

### Body paragraphs (2 paragraphs)
- **Paragraph 1 — Relevant impact**: Pick the 1–2 strongest experiences from the base profile that directly map to the role's core responsibilities. Tell the story of what you built, the challenge, and the measurable outcome. Be specific.
- **Paragraph 2 — Why this team / why now**: Show you understand the specific team's work (reference the JD, Apple products, or publicly known initiatives). Connect your next goal to what this role enables. This should feel researched, not generic.

### Closing paragraph
- Concise, confident, not desperate
- Invite next steps
- No "Thank you for your consideration" — be direct: "I'd welcome the opportunity to discuss how my work on X could contribute to Y"

## Content Rules
- Max 350 words in body (not counting header/footer)
- Every sentence must earn its place — cut throat anything generic
- Apple context: Apple values craftsmanship, taste, user obsession, and getting details right — reflect this in both substance and writing quality
- Mirror JD language naturally (don't keyword-stuff)
- If the JD mentions a specific technology, product, or challenge — address it directly

## Output
Generate a complete, compilable `.tex` file. Recipient name should be "Hiring Manager" unless specified.
