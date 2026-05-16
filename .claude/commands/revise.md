# /revise — CV Revision Orchestrator

You are the orchestrator for a targeted CV revision. The CV and cover letter have already been generated. Your job is to apply user feedback, run the ATS loop, and recompile — without re-running the Analyzer.

**Slug:** {SLUG}
**App ID:** {APP_ID}
**User feedback:** {FEEDBACK}
**Update base profile:** {UPDATE_PROFILE}

---

## Phase 1 — Load Brief

Read `applications/{APP_ID}-{SLUG}/brief.md`. This file already exists. Extract the role title, company, and keyword list for use in the final report.

---

## Phase 2 — Revise (Iteration 1, feedback-driven)

Read the file `agents/writer.md`.

The writer must overwrite the existing `cv.tex` and `cover_letter.tex` files in-place. Do not create backup copies, versioned files, or files with different names. `brief.md` is not touched.

Replace `{SLUG}` with: {SLUG}
Replace `{APP_ID}` with: {APP_ID}
Replace `{FEEDBACK}` with: {FEEDBACK}
Replace `{GAPS}` with: *(empty — this is iteration 1)*

Spawn the **Writer Agent** using the Agent tool with the fully constructed writer prompt. The agent has access to all tools (Read, Write, Bash).

Wait for the Writer to complete.

---

## Phase 3 — ATS Feedback Loop

Run up to **3 iterations** of the following loop:

### Check

Read the file `agents/ats_checker.md`.

Replace `{SLUG}` with: {SLUG}
Replace `{APP_ID}` with: {APP_ID}
Replace `{ITERATION}` with the current iteration number (1, 2, or 3).

Spawn the **ATS Checker Agent** using the Agent tool with the fully constructed checker prompt. The agent has access to Read and Bash tools only.

Wait for the Checker to complete.

### Evaluate

- If **score ≥ 80**: exit the loop. Proceed to Phase 4.
- If **score < 80 and iterations < 3**: extract the GAPS TO FIX section. Spawn the **Writer Agent** again — replace `{GAPS}` with the full GAPS TO FIX list, replace `{FEEDBACK}` with empty (user feedback already applied in iteration 1). Then run the Checker again. Increment iteration count.
- If **score < 80 and iterations = 3**: exit the loop with a warning. Proceed to Phase 4.

Store each iteration's score for the final report.

---

## Phase 4 — Compile

Run:

```bash
cd /Users/khaled/Desktop/BatCave/Jobz && tectonic applications/{APP_ID}-{SLUG}/cv.tex && tectonic applications/{APP_ID}-{SLUG}/cover_letter.tex
```

If tectonic is not found, tell the user:
```
tectonic is not installed. Run: brew install tectonic
Then rerun the compilation manually:
  tectonic applications/{APP_ID}-{SLUG}/cv.tex
  tectonic applications/{APP_ID}-{SLUG}/cover_letter.tex
```

If there are LaTeX errors, read the .tex file, fix the errors, and retry. Do not give up.

---

## Phase 5 — Final Report

Output this summary:

```
════════════════════════════════════════
APPLICATION: {SLUG}
════════════════════════════════════════

ATS SCORE: XX/100  ✓ PASS  (or ✗ BELOW TARGET)
Iterations: X

  Keyword Match:           XX/35
  Quantified Achievements: XX/25
  Section Completeness:    XX/20
  Formatting:              XX/12
  Action Verbs:            XX/8

Score history: [e.g. 68 → 77 → 83]

────────────────────────────────────────
GENERATED FILES
  applications/{APP_ID}-{SLUG}/cv.tex
  applications/{APP_ID}-{SLUG}/cv.pdf
  applications/{APP_ID}-{SLUG}/cover_letter.tex
  applications/{APP_ID}-{SLUG}/cover_letter.pdf

────────────────────────────────────────
BEFORE YOU SEND — REVIEW THESE
  [List all [ESTIMATE] placeholders added or changed]
  [List all [FILL IN] placeholders]
  [Any unresolvable gaps]
════════════════════════════════════════
```

---

## Phase 6 — Update Base Profile (optional)

Only run this phase if **Update base profile** is `true`.

Read the file `agents/profile_updater.md`.

Replace `{SLUG}` with: {SLUG}
Replace `{FEEDBACK}` with: {FEEDBACK}

Spawn the **Profile Updater Agent** using the Agent tool with the fully constructed prompt. The agent has access to Read and Write tools only.

Wait for the agent to complete and include its summary in the final report under a `PROFILE UPDATES` section.

---

## Orchestrator Rules
- You coordinate — you do not write CV content yourself
- Always wait for each agent to fully complete before spawning the next
- User feedback is applied in iteration 1 only — subsequent iterations address ATS gaps only
- The slug must remain consistent across all phases
- If any agent fails or produces unexpected output, report clearly and stop
