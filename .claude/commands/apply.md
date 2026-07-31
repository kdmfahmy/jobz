# /apply — Job Application Orchestrator

**Use /apply for:** new applications only — when no brief.md exists yet, or when a full re-analysis from the JD is explicitly requested.
**Use /revise instead when:** the brief already exists and the user wants to regenerate or update the CV/cover letter (profile change, feedback, tweak). If the user says "regenerate", "update", "fix", or "revise" an existing application, that is always /revise.

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

Append a phase heartbeat to the pipeline log:

```bash
python3 -c "
import datetime
with open(f'.pipeline-logs/$APP_ID.log', 'a') as f:
    f.write(f'\n[PHASE: analysis-complete @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" 2>/dev/null || true
```

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

```bash
python3 -c "
import datetime
with open(f'.pipeline-logs/$APP_ID.log', 'a') as f:
    f.write(f'\n[PHASE: writer-start @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" 2>/dev/null || true
```

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

Compile the CV and capture the page count, then replace `{PAGES}` in the checker prompt with the result (just the number, e.g. `1` or `2`; use `unknown` if pdfinfo fails):

```bash
python3 -c "
import datetime, sys
iteration = sys.argv[1]
with open(f'.pipeline-logs/$APP_ID.log', 'a') as f:
    f.write(f'\n[PHASE: ats-check-{iteration} @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" "$ITERATION" 2>/dev/null || true
tectonic applications/$APP_ID-$SLUG/cv.tex --outdir applications/$APP_ID-$SLUG/ 2>&1 | tail -3
pdfinfo applications/$APP_ID-$SLUG/cv.pdf 2>/dev/null | grep "^Pages:" || echo "Pages: unknown"
```

Spawn the **ATS Checker Agent** using the Agent tool with the fully constructed checker prompt (with `{PAGES}` substituted). The agent has access to Read and Bash tools only — it does not write files.

Wait for the Checker to complete. It will return a structured score report with a total score and a GAPS TO FIX section.

After the Checker returns its report, extract the numeric score and the list of gaps from the GAPS TO FIX section, then snapshot this iteration.

First, write the Checker's full report text to `applications/$APP_ID-$SLUG/iterations/run-apply/v{ITERATION}/ats_report.md` using the Write tool (substitute the actual iteration number for `{ITERATION}`).

Then run the following bash, substituting actual values for ITERATION (current iteration number), SCORE (integer extracted from the report), and GAPS_JSON (a JSON array of gap strings from the GAPS TO FIX section):

```bash
python3 -c "
import os, json, datetime, shutil

app_id = '$APP_ID'
slug = '$SLUG'
iteration = {ITERATION}
score = {SCORE}
gaps = {GAPS_JSON}

snap_dir = f'applications/{app_id}-{slug}/iterations/run-apply/v{iteration}'
os.makedirs(snap_dir, exist_ok=True)

src = f'applications/{app_id}-{slug}'
for fname in ['cv.tex', 'cv.pdf', 'cover_letter.tex']:
    try:
        shutil.copy2(f'{src}/{fname}', f'{snap_dir}/{fname}')
    except FileNotFoundError:
        pass

meta = {
    'score': score,
    'iteration': iteration,
    'timestamp': datetime.datetime.utcnow().isoformat() + 'Z',
    'gaps': gaps,
}
with open(f'{snap_dir}/meta.json', 'w') as f:
    json.dump(meta, f, indent=2)

print(f'Snapshot written: {snap_dir}')
" 2>/dev/null || true
```

### Evaluate

After each Checker run, determine three things independently:
1. **ATS pass:** score ≥ 80
2. **Page pass:** the report contains no PAGE OVERFLOW warning
3. **CRITICAL pass:** the report's GAPS TO FIX section contains no CRITICAL gap

**Exit condition:** all three must be true. If any fails, treat it as a revision needed. A score ≥ 80 does NOT override a CRITICAL gap — a CRITICAL gap always forces another revision iteration, never a soft note to the user.

- If **ATS pass AND page pass AND CRITICAL pass**: exit the loop. Proceed to Phase 4.
- If **any fails AND iterations < 3**: extract the GAPS TO FIX section from the Checker's report. Append a heartbeat:

  ```bash
  python3 -c "
  import datetime, sys
  iteration = sys.argv[1]
  with open(f'.pipeline-logs/$APP_ID.log', 'a') as f:
      f.write(f'\n[PHASE: writer-gap-{iteration} @ {datetime.datetime.utcnow().isoformat()}Z]\n')
  " "$ITERATION" 2>/dev/null || true
  ```

  Spawn the **Writer Agent** again (read `agents/writer.md`, replace `{GAPS}` with the full GAPS TO FIX list, replace `{SLUG}` with the confirmed slug, replace `{APP_ID}` with: $APP_ID). Then run the Checker again. Increment iteration count.
- If **any fails AND iterations = 3**: exit the ATS loop and enter the **trim loop** below if a PAGE OVERFLOW remains. If a CRITICAL gap remains after iteration 3 (with no overflow), do not enter the trim loop — proceed to Phase 4 but treat the unresolved CRITICAL exactly like an unresolved overflow: surface it as a prominent **blocking** warning in the final report (not a soft "review this" note), and mark the application as needing manual fix before submission.

### Trim loop (page compliance enforcement)

If a PAGE OVERFLOW exists after the ATS loop, run this loop — up to **3 additional trim passes**:

1. Spawn the **Writer Agent** with the overflow gap only: instruct it to trim the CV to exactly 1 page. It must **prefer compressing or merging bullets over deleting them** — condensing two bullets into one tight line preserves keywords; outright deletion loses them. When a bullet must be cut, cut bullets that contain no ATS keywords from the brief first. Only cut keyword-bearing bullets as a last resort, and when doing so, try to fold the keyword into a surviving bullet rather than losing it entirely. **It must never delete the people-leadership bullet of a leadership-titled role; if trimming would leave a leadership-titled role with no people-leadership signal, condense that bullet or fold the team-size/mentorship signal into another bullet instead of deleting it** (see the precedence rule in `agents/writer.md`).
2. Spawn the **ATS Checker Agent** (increment iteration count for reporting).
3. If no PAGE OVERFLOW in the result: exit the trim loop. Proceed to Phase 4.
4. If PAGE OVERFLOW persists and trim passes < 3: repeat from step 1.
5. If PAGE OVERFLOW persists after 3 trim passes: proceed to Phase 4 with a prominent warning that the CV could not be trimmed to 1 page automatically — the user must review and trim manually before submitting.

**Never proceed to Phase 4 silently with a PAGE OVERFLOW — always surface it clearly if it could not be resolved.**

**Never proceed to Phase 4 silently with an unresolved CRITICAL gap. A CRITICAL gap is never demoted to a soft "BEFORE YOU SEND" / "SUBMISSION FLAG" advisory note — if it survives all iterations it must appear in the final report as a prominent blocking warning, and the application must be marked as requiring a manual fix before submission.**

Store each iteration's score for the final report.

---

## Phase 4 — Compile

```bash
python3 -c "
import datetime
with open(f'.pipeline-logs/$APP_ID.log', 'a') as f:
    f.write(f'\n[PHASE: compile @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" 2>/dev/null || true
```

Run the following commands:

```bash
tectonic applications/$APP_ID-{SLUG}/cv.tex --outdir applications/$APP_ID-{SLUG}/
tectonic applications/$APP_ID-{SLUG}/cover_letter.tex --outdir applications/$APP_ID-{SLUG}/
rm -f applications/$APP_ID-{SLUG}/cv.aux applications/$APP_ID-{SLUG}/cv.log applications/$APP_ID-{SLUG}/cv.out
rm -f applications/$APP_ID-{SLUG}/cover_letter.aux applications/$APP_ID-{SLUG}/cover_letter.log applications/$APP_ID-{SLUG}/cover_letter.out
```

After both tectonic commands succeed, overwrite the cv.pdf in the latest snapshot directory with the freshly compiled one. The last iteration number is the total number of ATS checks run (including any trim-loop iterations). Run:

```bash
python3 -c "
import shutil
app_id = '$APP_ID'
slug = '$SLUG'
last_iter = {LAST_ITERATION}
snap_cv = f'applications/{app_id}-{slug}/iterations/run-apply/v{last_iter}/cv.pdf'
src_cv = f'applications/{app_id}-{slug}/cv.pdf'
try:
    shutil.copy2(src_cv, snap_cv)
    print(f'Updated snapshot cv.pdf: {snap_cv}')
except FileNotFoundError:
    pass
" 2>/dev/null || true
```

If tectonic is not found, tell the user:
```
tectonic is not installed. Run: brew install tectonic
Then rerun the compilation manually:
  tectonic applications/$APP_ID-{SLUG}/cv.tex
  tectonic applications/$APP_ID-{SLUG}/cover_letter.tex
```

If pdfinfo is not found (page count comes back as "Pages: unknown"), tell the user:
```
pdfinfo is not installed — page count cannot be verified automatically.
Run: brew install poppler
       (or on Linux: sudo apt-get install poppler-utils)
Then rerun.
```
Do not proceed with "Pages: unknown" — accurate page count is required for the overflow check.

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
⛔ BLOCKING — FIX BEFORE SUBMITTING
  [Only populated if an unresolved PAGE OVERFLOW or CRITICAL gap survived all iterations.
   List each one verbatim from the final Checker report with the specific fix needed.
   If none, omit this entire section. Never move a CRITICAL or overflow into the soft
   "REVIEW THESE" list below — those are advisory only; this section is a hard blocker.]

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
