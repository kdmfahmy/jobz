# /apply — Job Application Orchestrator

You are the orchestrator for a 3-agent job application pipeline. Your job is to coordinate the Analyzer, Writer, and ATS Checker agents in sequence, manage the feedback loop, and compile the final output.

**Job input:** $ARGUMENTS
**Skip analysis:** $SKIP_ANALYSIS
**App ID:** $APP_ID

---

## Phase 0 — Register in portal

**Only run this phase if APP_ID is empty or not provided.**

Create a stub record in the portal database so the application appears in the portal immediately:

```bash
APP_ID=$(sqlite3 portal/jobz.db "INSERT INTO applications (slug, company, role, jd_text, status) VALUES ('pending-$(date +%s)', 'pending', 'pending', '', 'generating') RETURNING id;")
echo "Portal record created: ID $APP_ID"
```

If this fails (e.g. `portal/jobz.db` does not exist yet), print a warning and continue — the files will still be written correctly, they just won't appear in the portal.

Use this `$APP_ID` for the rest of the pipeline.

---

## Phase 1 — Analyze

If **Skip analysis** is `true`: check whether `applications/$APP_ID-{SLUG}/brief.md` already exists (derive the slug from the job input). If the file exists, read it directly — do not spawn the Analyzer Agent. Extract the confirmed slug from the "Slug" field in the brief and proceed to Phase 2.

If **Skip analysis** is `false` (or the brief file does not exist):

Read the file `agents/analyzer.md`.

Replace `{JOB_INPUT}` with: $ARGUMENTS
Replace `{SLUG}` with a slug you derive from the company and role (lowercase kebab-case, e.g. `apple_senior-software-engineer`). If you cannot determine the role yet, use `apple_role` as a temporary placeholder — the Analyzer will correct it.
Replace `{APP_ID}` with: $APP_ID
Replace `{WEB_RESEARCH}` with: $WEB_RESEARCH

Spawn the **Analyzer Agent** using the Agent tool with the fully constructed analyzer prompt. The agent has access to all tools (WebFetch, Read, Write, Bash).

Wait for the Analyzer to complete. It will:
- Fetch the JD if a URL was provided
- Write `applications/$APP_ID-{SLUG}/brief.md`
- Return the brief contents

Read `applications/$APP_ID-{SLUG}/brief.md` to confirm it was written. Extract the final slug from the "Slug" field in the brief. Also extract **Company** and **Title** from the Role Info section.

If a portal record was created in Phase 0, update it with the real data. Read `applications/{APP_ID}-{SLUG}/jd.txt` for the raw job description text:

```bash
python3 -c "
import sqlite3, sys
db = sqlite3.connect('portal/jobz.db')
slug, company, role, jd_path, app_id = sys.argv[1:]
jd_text = open(jd_path).read()
db.execute(\"UPDATE applications SET slug=?, company=?, role=?, jd_text=?, updated_at=datetime('now') WHERE id=?\",
           (slug, company, role, jd_text, int(app_id)))
db.commit()
print('Portal record updated')
" "{SLUG}" "{COMPANY}" "{ROLE_TITLE}" "applications/{APP_ID}-{SLUG}/jd.txt" "{APP_ID}"
```

If APP_ID was provided externally (portal path — Phase 0 did not run), only update slug, company, and role — jd_text is already set:

```bash
python3 -c "
import sqlite3, sys
db = sqlite3.connect('portal/jobz.db')
slug, company, role, app_id = sys.argv[1:]
db.execute(\"UPDATE applications SET slug=?, company=?, role=?, updated_at=datetime('now') WHERE id=?\",
           (slug, company, role, int(app_id)))
db.commit()
print('Portal record updated')
" "{SLUG}" "{COMPANY}" "{ROLE_TITLE}" "{APP_ID}"
```

Delete `jd.txt` — it was only needed to populate the DB and is now redundant:

```bash
rm -f applications/{APP_ID}-{SLUG}/jd.txt
```

Then compute the job match score directly — read `profile/base_profile.md` and the brief you just confirmed, and score the match across these four dimensions:

- **Skills (40%):** compare the candidate's technical skills and tools against the JD requirements — list matched skills and gaps
- **Experience (35%):** assess years, seniority level, and domain relevance
- **Education (15%):** degree field and level match
- **Domain (10%):** industry and problem-space alignment

Produce scores 0–100 for each dimension. Overall = Skills×0.4 + Experience×0.35 + Education×0.15 + Domain×0.10.

Output the result as a log marker so the portal can parse it (replace values with your computed numbers/lists):

```
[JOB_MATCH_START]
{"overall": X, "breakdown": {"skills": {"score": X, "matched": ["skill1"], "gaps": ["gap1"]}, "experience": {"score": X, "notes": "one line"}, "education": {"score": X, "notes": "one line"}, "domain": {"score": X, "notes": "one line"}}}
[JOB_MATCH_END]
```

Then store it in the portal DB:

```bash
python3 - <<'PYEOF'
import sqlite3, json, re

log = open(f"applications/{APP_ID}-{SLUG}/brief.md").read()  # use actual computed values below
overall = {OVERALL}
breakdown = {BREAKDOWN_JSON}
app_id = {APP_ID}

db = sqlite3.connect("portal/jobz.db")
db.execute("UPDATE applications SET job_match_score=?, job_match_breakdown=?, updated_at=datetime('now') WHERE id=?",
           (overall, json.dumps(breakdown), app_id))
db.commit()
print(f"Job match score: {overall}")
PYEOF
```

---

## Phase 2 — Write (Iteration 1)

Read the file `agents/writer.md`.

Replace `{SLUG}` with the confirmed slug from Phase 1.
Replace `{APP_ID}` with: $APP_ID
Replace `{GAPS}` with: *(empty — this is iteration 1)*

Spawn the **Writer Agent** using the Agent tool with the fully constructed writer prompt. The agent has access to all tools (Read, Write, Bash).

Wait for the Writer to complete. It will:
- Write `applications/$APP_ID-{SLUG}/cv.tex`
- Write `applications/$APP_ID-{SLUG}/cover_letter.tex`
- Return a summary of keywords targeted and any placeholders used

---

## Phase 3 — ATS Feedback Loop

Run up to **3 iterations** of the following loop:

### Check

Read the file `agents/ats_checker.md`.

Replace `{SLUG}` with the confirmed slug.
Replace `{APP_ID}` with: $APP_ID
Replace `{ITERATION}` with the current iteration number (1, 2, or 3).

Spawn the **ATS Checker Agent** using the Agent tool with the fully constructed checker prompt. The agent has access to Read and Bash tools only — it does not write files.

Wait for the Checker to complete. It will return a structured score report with a total score and a GAPS TO FIX section.

### Evaluate

After each Checker run, determine two things independently:
1. **ATS pass:** score ≥ 80
2. **Page pass:** the report contains no PAGE OVERFLOW warning

**Exit condition:** both must be true. If either fails, treat it as a revision needed.

- If **ATS pass AND page pass**: exit the loop. Proceed to Phase 4.
- If **either fails AND iterations < 3**: extract the GAPS TO FIX section from the Checker's report. Spawn the **Writer Agent** again (read `agents/writer.md`, replace `{GAPS}` with the full GAPS TO FIX list, replace `{SLUG}` with the confirmed slug, replace `{APP_ID}` with: $APP_ID). Then run the Checker again. Increment iteration count.
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

Run the following commands:

```bash
cd /Users/khaled/Desktop/BatCave/Jobz && tectonic applications/$APP_ID-{SLUG}/cv.tex && tectonic applications/$APP_ID-{SLUG}/cover_letter.tex
rm -f applications/$APP_ID-{SLUG}/cv.aux applications/$APP_ID-{SLUG}/cv.log applications/$APP_ID-{SLUG}/cv.out
rm -f applications/$APP_ID-{SLUG}/cover_letter.aux applications/$APP_ID-{SLUG}/cover_letter.log applications/$APP_ID-{SLUG}/cover_letter.out
```

If tectonic is not found, tell the user:
```
tectonic is not installed. Run: brew install tectonic
Then rerun the compilation manually:
  tectonic applications/$APP_ID-{SLUG}/cv.tex
  tectonic applications/$APP_ID-{SLUG}/cover_letter.tex
```

If there are LaTeX errors, read the .tex file, fix the errors, and retry compilation. Do not give up — diagnose and fix.

If a portal record exists, mark it generated with the full ATS result. Replace `{FINAL_SCORE}` with the final ATS score integer, `{ATS_BREAKDOWN_JSON}` with a JSON object containing scores and one-line notes extracted from the final checker report, and `{ITERATIONS_JSON}` with the JSON array of per-iteration scores (e.g. `[69, 86]`).

The breakdown JSON must include these keys — be specific, the notes are displayed as captions in the portal:
- `keyword` (int), `keywordNote` — matched keywords then missing ones, e.g. `"Python, Go, Kubernetes, CI/CD · missing: eBPF, Production Evals"`
- `quantified` (int), `quantifiedNote` — e.g. `"9 of 15 bullets quantified · unquantified: 'Led a team of consultants', 'Improved performance'"` (list up to 3)
- `sections` (int), `sectionsNote` — e.g. `"All sections present"` or `"Missing: Skills"`
- `formatting` (int), `formattingNote` — e.g. `"OK"` or specific issues found, e.g. `"Missing italic dates on 2 roles"`
- `actionVerbs` (int), `actionVerbsNote` — e.g. `"OK"` or `"Weak openers: 'Responsible for...', 'Helped with...'"` (list all weak openers)

```bash
python3 - <<'PYEOF'
import sqlite3, json

ats_score = {FINAL_SCORE}
ats_breakdown = {ATS_BREAKDOWN_JSON}
iterations = {ITERATIONS_JSON}
app_id = $APP_ID

db = sqlite3.connect("portal/jobz.db")
db.execute(
    "UPDATE applications SET status='generated', ats_score=?, ats_breakdown=?, iterations=?, updated_at=datetime('now') WHERE id=?",
    (ats_score, json.dumps(ats_breakdown), json.dumps(iterations), app_id)
)
db.commit()
print(f"ATS result saved: {ats_score}/100")
PYEOF
```

---

## Phase 5 — Final Report

Output this summary to the user:

```
════════════════════════════════════════
APPLICATION: {ROLE_TITLE}
Company: Apple  |  Team: {TEAM}  |  Job ID: {JOB_ID}
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
  applications/$APP_ID-{SLUG}/cv.tex
  applications/$APP_ID-{SLUG}/cv.pdf
  applications/$APP_ID-{SLUG}/cover_letter.tex
  applications/$APP_ID-{SLUG}/cover_letter.pdf

────────────────────────────────────────
BEFORE YOU SEND — REVIEW THESE
  [List all [ESTIMATE] placeholders added — the user should replace with real numbers]
  [List all [FILL IN] placeholders — missing info the user must supply]
  [List any JD requirements the profile couldn't fully address]
  [Any other caveats]
════════════════════════════════════════
```

---

## Orchestrator Rules
- You coordinate — you do not write CV content yourself
- Always wait for each agent to fully complete before spawning the next
- If any agent fails or produces unexpected output, report the failure clearly and stop rather than guessing
- The slug must be consistent across all phases — confirm it once from the brief and use it everywhere
