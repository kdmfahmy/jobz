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

**Do not alter the font size, margins, or `\linespread` to make content fit.** These exact values (11pt, 1.1in side margins, 1.12 leading) are calibrated so that a 220–290 word body fills the page like a real business letter. If the letter runs long, cut words; if short, add substance. Never shrink the type to compensate.

## Page Constraint — HARD LIMIT
**The cover letter must fill approximately 3/4 of a page — not more, not less.**

- Too short (< 1/2 page) looks thin — fill it with substance, not padding
- Too long (full page) looks wordy — cut ruthlessly
- Target: header + body land at roughly the 3/4 mark, sign-off ends it cleanly
- The page-fill comes from the calibrated typography above (11pt + 1.12 leading), not from padding or vertical spacing hacks

Body word count: **220–290 words** (not counting header, recipient block, subject line, or sign-off). Aim for ~250–270 so the calibrated typography lands the sign-off near the 3/4 mark cleanly.

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
7. Opening paragraph: who you are + what you want + optionally what you believe in (2–3 sentences, with transition bridge as last sentence)
8. Body paragraph 1: strongest story, 4-part structure — theme → context → action → why it matters (3–4 sentences)
9. Body paragraph 2: second story OR why this team/now (2 sentences)
10. Closing paragraph (2 sentences)
11. Sign-off (`Sincerely,` then name)

---

## How to Write This Letter (Before Drafting Anything)

This is a **marketing document**, not a biography. The goal is to answer one question for the reader: "Why this person, for this specific problem we have?"

### Step 1 — Identify the top 3 JD needs

Read the brief. Find the three things this role genuinely most needs from a hire. Not every requirement — the top three. These become the organizing principle. Every sentence in the body should serve at least one of them.

### Step 2 — Map each need to a story from the CV

For each JD need, find the experience from the **CV already written** (not from base_profile) that best addresses it. Then identify its story theme.

**To find the theme:** don't pick one arbitrarily — ask "what quality or trait did this work require?" The answer points to the theme:
- "This person had to ask a lot of questions and probe for information" → **Driven by curiosity**
- "This person had to do both technical and non-technical work" → **Affinity for different types of work**
- "This person led a bunch of projects with different stakeholders to completion" → **Leading people**
- "This person had to prioritize and say no to different teams" → **Managing conflict**

The 8 story themes:
- **Leading people** — team size, mentorship, driving team output, growing others
- **Taking initiative** — acting before asked, owning something no one gave you
- **Affinity for challenging work** — drawn to hard problems, complexity, high-stakes work
- **Affinity for different types of work** — breadth, wearing multiple hats, crossing disciplines
- **Affinity for specific work** — genuine pull toward a domain, technology, or problem type
- **Dealing with failure** — recovering, iterating, learning under pressure
- **Managing conflict** — alignment across orgs, navigating competing priorities, saying no
- **Driven by curiosity** — digging deeper than required, building to understand, self-directed learning

The story theme gives the body paragraph its emotional hook. The specific outcome gives it credibility.

### Step 3 — Draft in this order

1. Opening (who + why here)
2. Body 1 (strongest story, tied to JD need 1)
3. Body 2 (second story OR "why this company", tied to JD need 2)
4. Closing (confident invite)

---

## Tone & Content Rules

### Opening paragraph (2–3 sentences)

The opening covers three things: **who you are**, **what you want**, and **what you believe in** (your values or professional stance). Not all three need separate sentences — weave at least two into the opening naturally.

- **Who you are:** Current role + what you work on. One clean, grounding line.
- **What you want:** A specific, genuine observation about what this company or team is building. This is why *this* role, not any role. Must not be copy-pasteable to a different company.
- **What you believe in (optional):** A one-line statement of your professional values or technical convictions — e.g. "I've always believed that reliability is a product feature, not an afterthought." Use only when it connects naturally to the role and company.

**What NOT to do:**
- Do not open with a project story or technical anecdote — body paragraph 1 is for that
- Do not use "I am excited to apply", "I have always admired", "I am passionate about"
- Do not use generic company praise ("industry leader", "innovative company", "fast-paced environment")

**Test:** could this opening appear on a letter to a different company? If yes, rewrite it.

### Transition (2 sentences, end of opening paragraph)

After grounding the reader in who you are and why this company, end the opening paragraph with a 2-sentence transition that bridges into the stories. This is a specific device:

**Sentence 1 — Quantified summary:** "Over the last [X years/months], I've [most relevant achievement with a clear sense of the impact made]." The key word is *quantified*: not "I've helped grow the team" but "I've led compliance platform delivery across four regulated markets against hard government deadlines." Specific action + specific scope or outcome.

**Sentence 2 — Bridge:** A natural variant of "here's what I'd bring to this role" — it signals that the body paragraphs are deliberate, not random. Can be as simple as "Here's what makes me a strong fit for this work." Avoid the literal "there are three things that make me the perfect fit" — it reads as a template.

**Weak transition:** "I have a strong background in backend engineering and believe I would be a great fit."
**Strong transition:** "Over the last 4 years I've led architecture and delivery of distributed compliance infrastructure across regulated markets, shipping against hard government deadlines. Here's what makes this role the right next step."

Compare weak vs strong summary statements — the difference is always: vague outcome → specific action with specific numbers or scope:
- "helped solve problems in the ML space" → "applied ML to ride personalization, increasing revenue in that vertical by 10% annually"
- "helped launch a few products that have been well received" → "shipped three core products with the engineering team, improving our NPS by 2 points"
- "helped our merchants save money" → "built a fraud analytics tool that saved clients over $100k, then took on team lead responsibilities for impression log analysis"

**The summary test:** Avoid jargon and get specific. Half the words, twice the examples. Ideally with a few numbers sprinkled in.

### Body paragraph 1 — Strongest story (3–4 sentences)

Pick the single experience from the CV that maps most directly to the top JD need. Build it using 4 parts — in this order:

1. **Theme sentence** — lead with the thematic hook, one sentence that names the quality or conviction this story demonstrates. Examples: "I've always been drawn to problems that require building consensus across competing priorities." / "I go above and beyond what's asked when I see an opportunity to change how a team operates." This is what gives the story meaning before the facts land.
2. **Context** — set the scene: what the situation was, at what scale or under what constraint.
3. **What you did** — be as specific as possible: the decision, the approach, the action.
4. **Why it matters** — the outcome, with a specific number, deadline, or measurable result from the CV. What did the work gain for the team or company?

Be concrete. "Distributed, event-driven compliance service" is better than "complex backend system." Numbers from the CV should appear here — don't invent them, but do use them.

**Strong vs weak:** "helped my team improve metrics" is weak. "Cut our on-call incident rate by 40% by building an observability layer the team now uses as default" is strong. The difference is always: specific action → specific outcome.

### Body paragraph 2 — Second story or why this team (2 sentences)

Two options — pick whichever creates a stronger letter:

**Option A — Second story:** Address JD need 2 through a different experience from the CV. Lead with a theme sentence, follow with context + outcome in 1–2 sentences. Keep it brief — body 1 already established depth.

**Option B — Why this team / why now:** Two reasons, in this order:
1. **If the candidate uses their product** — this is the strongest "why company" signal and leads if it applies. Being a genuine user/customer of what they build is more compelling than any researched reason. Mention it first.
2. **A values/mission reason** — something about what this company stands for or how they work that genuinely connects to what the candidate cares about. Not flattery — a real alignment. "I've spent the last three years building compliance infrastructure in regulated markets, and what draws me to [Company] is that they treat reliability as a product quality, not an afterthought."
3. **A topical/industry reason** — something current: a product direction they're pursuing, a technical problem they're known to be tackling, a market they're expanding into. This shows homework beyond the job posting.

At most two of these three will fit in 2 sentences — pick the strongest ones.

Either way: one sentence in this paragraph that could not appear in a letter to a different company.

### Closing paragraph (2 sentences)

- Confident, not desperate
- Invite next steps directly: reference the specific work you described in the body, tie it to what the role needs
- No "Thank you for your consideration"
- **Do not inflate the summary in the closing.** Reference only what was described in the body, using the same framing — not an upgraded version.

---

## Voice

The cover letter must sound like the candidate wrote it, not like a professional letter writer, not like a polished template, not like any other applicant's letter.

**Before drafting:** read the CV bullets for rhythm, vocabulary, and how this person frames impact. Write in that register.

**The voice test:** read the letter aloud. Does it sound like something this specific person would say? Or does it sound like "a cover letter"? Generic professional prose fails. If it could have been written by anyone, rewrite it.

In practice:
- Keep the candidate's natural vocabulary — do not upgrade it to more formal synonyms
- Match their sentence rhythm — if their bullets are terse and direct, don't write flowing multi-clause sentences
- Preserve how they frame impact — if they lead with the technical challenge before the outcome, keep that pattern

---

## Language Rules

### Use employer language, not synonyms
If the JD says "distributed systems", write "distributed systems" — not "scalable infrastructure" or "cloud architecture." Mirror the exact terminology. The reader recognizes their own words as signals of fit.

### Clarity over cleverness
If a sentence requires a second read to understand, rewrite it. This is an engineering role — precision is valued over stylistic flair. A clear, direct sentence beats a clever one every time.

### Strong assertion verbs
Never use hedging assertion verbs: **never "I feel", "I consider", "I believe", "I think"** — these weaken the statement. Use instead: **"I am", "I have", "I would", "I bring"**. If you're about to hedge, restructure the sentence so the claim stands on its own.

### Never repeat the CV
The cover letter is not a prose summary of the CV. Every sentence should add something — context, motivation, scale, connection to the role — that the CV bullet alone doesn't convey. If a sentence just restates what's already in the CV, cut it.

---

## Content Rules
- Every sentence must earn its place — cut anything generic
- Mirror JD language naturally (no keyword stuffing)
- Writing quality should reflect the same care the candidate brings to their engineering work
- **Cover letter content scope is the CV just written.** If an experience, role, or achievement is not in the CV, it must not appear in the cover letter. The two documents must be consistent — a recruiter reading both should never encounter a claim in the cover letter with no corresponding CV entry.

---

## Punctuation Rules — AI Tell Signs to Avoid

**No repeated colons mid-sentence.** One colon per letter is acceptable if it genuinely introduces a list or clause. More than one reads as a structural crutch.

**No em dashes or en dashes mid-sentence.** This is the single strongest signal of AI-generated writing and will read as such to any experienced recruiter.

- **Never use `---` or `--` mid-sentence** in LaTeX (renders as em dash or en dash)
- If you are about to use a dash to introduce a list or examples, use a colon instead: "building three things: X, Y, and Z"
- If you are about to use a dash as a parenthetical aside, rewrite the sentence so the aside becomes its own clause, or fold it in with a comma
- If you are about to use a dash to add emphasis or contrast, rewrite using "but", "however", "because", "which", "where", or restructure the sentence entirely
- Hyphens in compound words are fine (`cloud-native`, `full-stack`, `e-invoicing`) — this rule is about mid-sentence dashes only

---

## Output
Generate a complete, compilable `.tex` file. Recipient name should be "Hiring Manager" unless specified.
