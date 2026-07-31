# /revise — CV Revision Orchestrator

You are the orchestrator for a targeted CV revision. The CV and cover letter have already been generated. Your job is to apply user feedback, run the ATS loop, and recompile — without re-running the Analyzer.

**Slug:** {SLUG}
**App ID:** {APP_ID}
**User feedback:** {FEEDBACK}
**Update base profile:** {UPDATE_PROFILE}

---

## Phase 0 — Register the revision (portal visibility)

Record this revision so it shows in the portal exactly like a portal-triggered revise — whether this run was spawned by the portal or started from the CLI. This appends the revision-history marker the portal parses and flips the application back into the pipeline. Run this once, before anything else.

```bash
node -e "
const fs = require('fs');
const appId = '{APP_ID}';
const feedback = {FEEDBACK_JSON};
fs.mkdirSync('.pipeline-logs', { recursive: true });
fs.appendFileSync('.pipeline-logs/' + appId + '.log', '\n[REVISE REQUEST]\n' + feedback + '\n[/REVISE REQUEST]\n');
try {
  const Database = require('./portal/node_modules/better-sqlite3');
  const db = new Database('portal/jobz.db');
  db.prepare(\"UPDATE applications SET status='generating', updated_at=datetime('now') WHERE id=?\").run(Number(appId));
  console.log('Revision registered: history marker written, portal status set to generating');
} catch (e) {
  console.log('Warning: portal DB not updated (' + e.message + ') — revision will still run');
}
"
```

If `portal/jobz.db` does not exist, the marker is still written to the log and the revision proceeds normally — it just will not appear in the portal. Do not abort.

Compute the run number for this revise session and write the user's feedback to the iterations directory:

```bash
RUN_N=$(( $(ls -d applications/{APP_ID}-{SLUG}/iterations/run-* 2>/dev/null | wc -l) + 1 ))
echo "Run number: $RUN_N"
```

```bash
python3 -c "
import os
app_id = '{APP_ID}'
slug = '{SLUG}'
run_n = {RUN_N}
feedback = {FEEDBACK_JSON}
run_dir = f'applications/{app_id}-{slug}/iterations/run-{run_n}-revise'
os.makedirs(run_dir, exist_ok=True)
with open(f'{run_dir}/feedback.md', 'w') as f:
    f.write(feedback)
print(f'Feedback written: {run_dir}/feedback.md')
" 2>/dev/null || true
```

Remember `RUN_N` for use in Phase 3 and Phase 4.

---

## Phase 1 — Load Brief

Read `applications/{APP_ID}-{SLUG}/brief.md`. This file already exists. Extract the role title, company, and keyword list for use in the final report.

```bash
python3 -c "
import datetime
with open(f'.pipeline-logs/{APP_ID}.log', 'a') as f:
    f.write(f'\n[PHASE: brief-loaded @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" 2>/dev/null || true
```

---

## Phase 2 — Revise (Iteration 1, feedback-driven)

Read the file `agents/writer.md`.

**Before spawning the Writer, determine the revision scope from the feedback:**

- **Cover letter only** — feedback explicitly refers to the cover letter, its structure, tone, opening, body paragraphs, closing, or cover-letter-specific style rules (e.g. "revise the cover letter", "fix the opening", "the body paragraph is wrong", "add a transition")
- **CV only** — feedback explicitly refers to the CV, its bullets, sections, formatting, or CV-specific concerns (e.g. "update the CV", "change this bullet", "fix the summary section")
- **Both** — feedback corrects a factual error, wrong claim, incorrect information, or a specific topic/achievement that may appear in both documents (e.g. "the team size is wrong", "change X to Y everywhere", "the FTA project description is inaccurate")

The writer must only write files in scope — never touch a file outside the scope. `brief.md` is never touched.

Replace `{SLUG}` with: {SLUG}
Replace `{APP_ID}` with: {APP_ID}
Replace `{FEEDBACK}` with: {FEEDBACK}
Replace `{GAPS}` with: *(empty — this is iteration 1)*

```bash
python3 -c "
import datetime
with open(f'.pipeline-logs/{APP_ID}.log', 'a') as f:
    f.write(f'\n[PHASE: writer-start @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" 2>/dev/null || true
```

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

Compile the CV and capture the page count, then replace `{PAGES}` in the checker prompt with the result (just the number, e.g. `1` or `2`; use `unknown` if pdfinfo fails):

```bash
python3 -c "
import datetime, sys
iteration = sys.argv[1]
with open(f'.pipeline-logs/{APP_ID}.log', 'a') as f:
    f.write(f'\n[PHASE: ats-check-{iteration} @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" "{ITERATION}" 2>/dev/null || true
tectonic applications/{APP_ID}-{SLUG}/cv.tex --outdir applications/{APP_ID}-{SLUG}/ 2>&1 | tail -3
pdfinfo applications/{APP_ID}-{SLUG}/cv.pdf 2>/dev/null | grep "^Pages:" || echo "Pages: unknown"
```

Spawn the **ATS Checker Agent** using the Agent tool with the fully constructed checker prompt (with `{PAGES}` substituted). The agent has access to Read and Bash tools only.

Wait for the Checker to complete. It will return a structured score report with a total score and a GAPS TO FIX section.

After the Checker returns its report, extract the numeric score and the list of gaps from the GAPS TO FIX section, then snapshot this iteration.

First, write the Checker's full report text to `applications/{APP_ID}-{SLUG}/iterations/run-{RUN_N}-revise/v{ITERATION}/ats_report.md` using the Write tool (substitute the actual iteration number for `{ITERATION}` and the computed run number for `{RUN_N}`).

Then run the following bash, substituting actual values for ITERATION (current iteration number), SCORE (integer extracted from the report), RUN_N (the run number computed in Phase 0), and GAPS_JSON (a JSON array of gap strings from the GAPS TO FIX section):

```bash
python3 -c "
import os, json, datetime, shutil

app_id = '{APP_ID}'
slug = '{SLUG}'
iteration = {ITERATION}
score = {SCORE}
run_n = {RUN_N}
gaps = {GAPS_JSON}

snap_dir = f'applications/{app_id}-{slug}/iterations/run-{run_n}-revise/v{iteration}'
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

After each Checker run, determine two things independently:
1. **ATS pass:** score ≥ 80
2. **Page pass:** the report contains no PAGE OVERFLOW warning

**Exit condition:** both must be true. If either fails, treat it as a revision needed.

- If **ATS pass AND page pass**: exit the loop. Proceed to Phase 4.
- If **either fails AND iterations < 3**: extract the GAPS TO FIX section. Append a heartbeat:

  ```bash
  python3 -c "
  import datetime, sys
  iteration = sys.argv[1]
  with open(f'.pipeline-logs/{APP_ID}.log', 'a') as f:
      f.write(f'\n[PHASE: writer-gap-{iteration} @ {datetime.datetime.utcnow().isoformat()}Z]\n')
  " "{ITERATION}" 2>/dev/null || true
  ```

  Spawn the **Writer Agent** again — replace `{GAPS}` with the full GAPS TO FIX list, replace `{FEEDBACK}` with empty (user feedback already applied in iteration 1). Then run the Checker again. Increment iteration count.
- If **either fails AND iterations = 3**: exit the ATS loop and enter the **trim loop** below.

### Trim loop (page compliance enforcement)

If a PAGE OVERFLOW exists after the ATS loop, run this loop — up to **3 additional trim passes**:

1. Spawn the **Writer Agent** with the overflow gap only: instruct it to trim the CV to exactly 1 page. It must **prefer compressing or merging bullets over deleting them** — condensing two bullets into one tight line preserves keywords; outright deletion loses them. When a bullet must be cut, cut bullets that contain no ATS keywords from the brief first. Only cut keyword-bearing bullets as a last resort, and when doing so, try to fold the keyword into a surviving bullet rather than losing it entirely.
2. Spawn the **ATS Checker Agent** (increment iteration count for reporting).
3. If no PAGE OVERFLOW in the result: exit the trim loop. Proceed to Phase 4.
4. If PAGE OVERFLOW persists and trim passes < 3: repeat from step 1.
5. If PAGE OVERFLOW persists after 3 trim passes: proceed to Phase 4 with a prominent warning that the CV could not be trimmed to 1 page automatically — the user must review and trim manually before submitting.

**Never proceed to Phase 4 silently with a PAGE OVERFLOW — always surface it clearly if it could not be resolved.**

Store each iteration's score for the final report.

---

## Phase 4 — Compile

```bash
python3 -c "
import datetime
with open(f'.pipeline-logs/{APP_ID}.log', 'a') as f:
    f.write(f'\n[PHASE: compile @ {datetime.datetime.utcnow().isoformat()}Z]\n')
" 2>/dev/null || true
```

Compile only the files that were in scope for this revision (determined in Phase 2):

- **CV in scope** → run tectonic on `cv.tex` and clean up its aux files
- **Cover letter in scope** → run tectonic on `cover_letter.tex` and clean up its aux files
- **Both in scope** → compile both

```bash
# If CV is in scope:
tectonic applications/{APP_ID}-{SLUG}/cv.tex --outdir applications/{APP_ID}-{SLUG}/
rm -f applications/{APP_ID}-{SLUG}/cv.aux applications/{APP_ID}-{SLUG}/cv.log applications/{APP_ID}-{SLUG}/cv.out

# If cover letter is in scope:
tectonic applications/{APP_ID}-{SLUG}/cover_letter.tex --outdir applications/{APP_ID}-{SLUG}/
rm -f applications/{APP_ID}-{SLUG}/cover_letter.aux applications/{APP_ID}-{SLUG}/cover_letter.log applications/{APP_ID}-{SLUG}/cover_letter.out
```

After tectonic succeeds, overwrite the PDFs in the latest snapshot directory with the freshly compiled ones (for whichever files were in scope). The last iteration number is the total number of ATS checks run (including any trim-loop iterations). Run:

```bash
python3 -c "
import shutil
app_id = '{APP_ID}'
slug = '{SLUG}'
run_n = {RUN_N}
last_iter = {LAST_ITERATION}
snap_dir = f'applications/{app_id}-{slug}/iterations/run-{run_n}-revise/v{last_iter}'
src_dir = f'applications/{app_id}-{slug}'
for fname in ['cv.pdf', 'cover_letter.pdf']:
    try:
        shutil.copy2(f'{src_dir}/{fname}', f'{snap_dir}/{fname}')
        print(f'Updated snapshot {fname}')
    except FileNotFoundError:
        pass
" 2>/dev/null || true
```

If tectonic is not found, tell the user:
```
tectonic is not installed. Run: brew install tectonic
Then rerun the compilation manually:
  tectonic applications/{APP_ID}-{SLUG}/cv.tex
  tectonic applications/{APP_ID}-{SLUG}/cover_letter.tex
```

If pdfinfo is not found (page count comes back as "Pages: unknown"), tell the user:
```
pdfinfo is not installed — page count cannot be verified automatically.
Run: brew install poppler
       (or on Linux: sudo apt-get install poppler-utils)
Then rerun.
```
Do not proceed with "Pages: unknown" — accurate page count is required for the overflow check.

If there are LaTeX errors, read the .tex file, fix the errors, and retry. Do not give up.

Persist the final ATS result to the portal DB. Replace `{FINAL_SCORE}` with the final ATS score integer, `{ATS_BREAKDOWN_JSON}` with a JSON object containing scores and one-line notes from the final checker report, and `{ITERATIONS_JSON}` with the JSON array of per-iteration scores.

The breakdown JSON must include these keys — be specific, the notes are displayed as captions in the portal:
- `keyword` (int), `keywordNote` — matched keywords then missing ones, e.g. `"Python, Go, Kubernetes, CI/CD · Missing: eBPF, Production Evals"` or `"Python, Go · Missing (resolvable): eBPF · Missing (unresolvable): WorkOS, FooBar"`
- `quantified` (int), `quantifiedNote` — unquantified bullet examples, e.g. `"Led a team of technical consultants"`
- `sections` (int), `sectionsNote` — e.g. `"All sections present"` or `"Missing: Skills"`
- `formatting` (int), `formattingNote` — e.g. `"OK"` or specific issues found
- `actionVerbs` (int), `actionVerbsNote` — e.g. `"OK"` or weak openers found

```bash
python3 - <<'PYEOF'
import sqlite3, json

ats_score = {FINAL_SCORE}
ats_breakdown = {ATS_BREAKDOWN_JSON}
iterations = {ITERATIONS_JSON}
app_id = {APP_ID}

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
