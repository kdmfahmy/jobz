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

After each Checker run, determine two things independently:
1. **ATS pass:** score ≥ 80
2. **Page pass:** the report contains no PAGE OVERFLOW warning

**Exit condition:** both must be true. If either fails, treat it as a revision needed.

- If **ATS pass AND page pass**: exit the loop. Proceed to Phase 4.
- If **either fails AND iterations < 3**: extract the GAPS TO FIX section. Spawn the **Writer Agent** again — replace `{GAPS}` with the full GAPS TO FIX list, replace `{FEEDBACK}` with empty (user feedback already applied in iteration 1). Then run the Checker again. Increment iteration count.
- If **either fails AND iterations = 3**: exit the ATS loop and enter the **trim loop** below.

### Trim loop (page compliance enforcement)

If a PAGE OVERFLOW exists after the ATS loop, run this loop — up to **3 additional trim passes**:

1. Spawn the **Writer Agent** with the overflow gap only: instruct it to trim the CV to exactly 1 page by cutting the lowest-scoring bullets, making no other changes.
2. Spawn the **ATS Checker Agent** (increment iteration count for reporting).
3. If no PAGE OVERFLOW in the result: exit the trim loop. Proceed to Phase 4.
4. If PAGE OVERFLOW persists and trim passes < 3: repeat from step 1.
5. If PAGE OVERFLOW persists after 3 trim passes: proceed to Phase 4 with a prominent warning that the CV could not be trimmed to 1 page automatically — the user must review and trim manually before submitting.

**Never proceed to Phase 4 silently with a PAGE OVERFLOW — always surface it clearly if it could not be resolved.**

Store each iteration's score for the final report.

---

## Phase 4 — Compile

Run:

```bash
cd /Users/khaled/Desktop/BatCave/Jobz && tectonic applications/{APP_ID}-{SLUG}/cv.tex && tectonic applications/{APP_ID}-{SLUG}/cover_letter.tex
rm -f applications/{APP_ID}-{SLUG}/cv.aux applications/{APP_ID}-{SLUG}/cv.log applications/{APP_ID}-{SLUG}/cv.out
rm -f applications/{APP_ID}-{SLUG}/cover_letter.aux applications/{APP_ID}-{SLUG}/cover_letter.log applications/{APP_ID}-{SLUG}/cover_letter.out
```

If tectonic is not found, tell the user:
```
tectonic is not installed. Run: brew install tectonic
Then rerun the compilation manually:
  tectonic applications/{APP_ID}-{SLUG}/cv.tex
  tectonic applications/{APP_ID}-{SLUG}/cover_letter.tex
```

If there are LaTeX errors, read the .tex file, fix the errors, and retry. Do not give up.

Persist the final ATS result to the portal DB. Replace `{FINAL_SCORE}` with the final ATS score integer, `{ATS_BREAKDOWN_JSON}` with a JSON object containing scores and one-line notes from the final checker report, and `{ITERATIONS_JSON}` with the JSON array of per-iteration scores.

The breakdown JSON must include: `keyword`, `keywordNote`, `quantified`, `quantifiedNote`, `sections`, `sectionsNote`, `formatting`, `formattingNote`, `actionVerbs`, `actionVerbsNote`. Be specific in notes — matched keywords then missing ones for keyword, unquantified bullet examples for quantified, specific issues for formatting/verbs. These are displayed as captions under progress bars in the portal.

```bash
python3 - <<'PYEOF'
import sqlite3, json

ats_score = {FINAL_SCORE}
ats_breakdown = {ATS_BREAKDOWN_JSON}
iterations = {ITERATIONS_JSON}
app_id = {APP_ID}

db = sqlite3.connect("portal/jobz.db")
db.execute(
    "UPDATE applications SET ats_score=?, ats_breakdown=?, iterations=?, updated_at=datetime('now') WHERE id=?",
    (ats_score, json.dumps(ats_breakdown), json.dumps(iterations), app_id)
)
db.commit()
print(f"ATS result saved: {ats_score}/100")
PYEOF
```

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

## Phase 7 — Re-score Job Match

Re-read `profile/base_profile.md` and `applications/{APP_ID}-{SLUG}/brief.md` (use the files as they exist now — Phase 6 may have updated the profile). Score the match across the same four dimensions as the initial pipeline:

- **Skills (40%):** compare the candidate's technical skills and tools against the JD requirements — list matched skills and gaps
- **Experience (35%):** assess years, seniority level, and domain relevance
- **Education (15%):** degree field and level match
- **Domain (10%):** industry and problem-space alignment

Produce scores 0–100 for each dimension. Overall = Skills×0.4 + Experience×0.35 + Education×0.15 + Domain×0.10.

Output the result as a log marker (replace the placeholders with your computed values):

```
[JOB_MATCH_START]
{"overall": X, "breakdown": {"skills": {"score": X, "matched": ["skill1"], "gaps": ["gap1"]}, "experience": {"score": X, "notes": "one line"}, "education": {"score": X, "notes": "one line"}, "domain": {"score": X, "notes": "one line"}}}
[JOB_MATCH_END]
```

Then persist it directly to the portal DB:

```bash
python3 - <<'PYEOF'
import sqlite3, json

overall = {OVERALL}
breakdown = {BREAKDOWN_JSON}
app_id = {APP_ID}

db = sqlite3.connect("portal/jobz.db")
db.execute(
    "UPDATE applications SET job_match_score=?, job_match_breakdown=?, updated_at=datetime('now') WHERE id=?",
    (overall, json.dumps(breakdown), app_id)
)
db.commit()
print(f"Job match re-scored: {overall}")
PYEOF
```

Replace `{OVERALL}` with the computed overall integer, `{BREAKDOWN_JSON}` with the breakdown dict literal, and `{APP_ID}` with {APP_ID}.

---

## Orchestrator Rules
- You coordinate — you do not write CV content yourself
- Always wait for each agent to fully complete before spawning the next
- User feedback is applied in iteration 1 only — subsequent iterations address ATS gaps only
- The slug must remain consistent across all phases
- If any agent fails or produces unexpected output, report clearly and stop
