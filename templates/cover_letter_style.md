# Cover Letter Generation Style Guide

## LaTeX Engine
Use `tectonic`. Must compile in a single pass.

## Document Class & Packages
```latex
\documentclass[11pt, letterpaper]{article}
\usepackage[top=1in, bottom=1in, left=1.1in, right=1.1in]{geometry}
\usepackage{hyperref}
\usepackage{parskip}
\usepackage[T1]{fontenc}
\usepackage{lmodern}
\linespread{1.12}
\usepackage{xcolor}
```

**Do not alter the font size, margins, or `\linespread` to make content fit.** These exact values (11pt, 1.1in side margins, 1.12 leading) are calibrated so that a 250–350 word body fills the page like a real business letter. A 10pt letter at this word count fills only ~60% of the page and looks thin and top-heavy — that is the defect these settings fix. If the letter runs long, cut words; if short, add substance. Never shrink the type to compensate.

## Page Constraint — HARD LIMIT
**The cover letter must fill approximately 3/4 of a page — not more, not less.**

- Too short (< 1/2 page) looks thin — fill it with substance, not padding
- Too long (full page) looks wordy — cut ruthlessly
- Target: header + body land at roughly the 3/4 mark, sign-off ends it cleanly
- The page-fill comes from the calibrated typography above (11pt + 1.12 leading), not from padding or vertical spacing hacks

Body word count: **250–350 words** (not counting header, recipient block, subject line, or sign-off). Aim for the upper half of that range (~300–340) so the calibrated typography lands the sign-off near the 3/4–4/5 mark.

## Visual Style
- Clean, professional letter format
- Matches CV fonts and accent color for a cohesive application package

## Structure
1. Sender info (name, email, phone, date) — top right
2. Blank line
3. Recipient block: `Hiring Manager` / `[Company], [City, Country]` — do NOT include a team name. Product names, division names, and internal org labels (e.g. "WorkOS Team", "Platform Team") are omitted — they are not how hiring managers identify themselves externally and can read as awkward or incorrect.
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
The opening sets the stage — it should feel like a natural beginning, not a dramatic cold open. The reader needs to know who you are and why you're writing before they can care about any project story. Project specifics belong in the body.

Structure:
- **Sentence 1:** Who the candidate is right now — current role + what they work on, in one clean line. No drama, no hook. Just grounding.
- **Sentence 2:** A specific, genuine observation about what this team or company is building — something that shows real attention, not generic praise. This is why *this* role, not just any role.
- **Sentence 3 (optional):** A one-line preview of the fit — what connects the candidate's work to what the team is doing. A promise, not a delivery.

What NOT to do:
- Do NOT open with a project story or a technical anecdote — that belongs in Body paragraph 1
- Do NOT use "I am excited to apply", "I have always admired", "I am passionate about"
- Do NOT make the opening sound like it could be copy-pasted to a different company

The test: could this opening paragraph appear on a letter to a different company? If yes, rewrite it.

### Body paragraph 1 — Relevant impact (3–4 sentences)
- Pick the single strongest experience that maps to the role's core responsibility
- Tell what you built/led, the challenge, and the outcome — this is where the project story lands
- Be specific — scale, approach, result

### Body paragraph 2 — Why this team / why now (3–4 sentences)
- Show you understand what this team is actually doing — reference specifics from the JD or Company Intelligence
- Connect the candidate's trajectory to what this role enables next
- Must feel researched, not generic — one sentence that couldn't appear in a letter to a different company

### Closing paragraph (2 sentences)
- Confident, not desperate
- Invite next steps directly: "I'd welcome the chance to discuss how my work on X could contribute to Y"
- No "Thank you for your consideration"
- **Do not overstate or combine experience in the closing.** The closing often tempts inflated summaries like "my experience building X and Y" where X and Y are merged in a way that implies more than what exists. Reference only what was explicitly described in the body — use the same framing, not an upgraded version of it.

## Voice

The cover letter must sound like the candidate wrote it — not like a professional letter writer, not like a polished template, not like any other applicant's letter.

Before drafting, calibrate voice by reading the candidate's base profile bullets. Notice how they phrase things: sentence length, level of technical specificity, whether they write with restraint or confidence, how they describe impact. Write the cover letter in that same register.

**The voice test:** read the finished letter aloud and ask — does this sound like something this specific person would say, or does it sound like "a cover letter"? Generic professional prose fails this test. If it could have been written by anyone, rewrite it.

What this means in practice:
- Keep the candidate's natural vocabulary — do not upgrade it to more formal synonyms
- Match their sentence rhythm — if their bullets are terse and direct, don't write flowing multi-clause sentences
- Preserve their characteristic way of framing impact — if they tend to lead with the technical challenge before the outcome, keep that pattern
- If a sentence reads as polished-letter-writer prose rather than something the candidate would naturally say, it's wrong — rewrite it until it sounds like them

## Content Rules
- Every sentence must earn its place — cut anything generic
- Mirror JD language naturally (no keyword stuffing)
- Writing quality should reflect the same care the candidate brings to their engineering work

## Punctuation Rules — AI Tell Signs to Avoid

**No repeated colons mid-sentence.** One colon per letter is acceptable if it genuinely introduces a list or clause. More than one reads as a structural crutch. If you find yourself reaching for a colon, try splitting into two sentences or restructuring the clause instead.
**No em dashes or en dashes mid-sentence.** This is the single strongest signal of AI-generated writing and will read as such to any experienced recruiter.

- **Never use `---` or `--` mid-sentence** in LaTeX (renders as em dash or en dash)
- If you are about to use a dash to introduce a list or examples, use a colon instead: "building three things: X, Y, and Z"
- If you are about to use a dash as a parenthetical aside, rewrite the sentence so the aside becomes its own clause, or fold it in with a comma
- If you are about to use a dash to add emphasis or contrast, rewrite using "but", "however", "because", "which", "where", or restructure the sentence entirely
- Hyphens in compound words are fine (`cloud-native`, `full-stack`, `e-invoicing`) — this rule is about mid-sentence dashes only

## Output
Generate a complete, compilable `.tex` file. Recipient name should be "Hiring Manager" unless specified.
