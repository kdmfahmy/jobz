# Next session: iteration versioning system

We are adding a per-iteration versioning system to the job application pipeline. The plan is fully decided.

## Storage layout

`applications/{id}-{slug}/iterations/run-{N}-{apply|revise}/v{M}/` containing:
- `cv.tex`, `cv.pdf`, `cover_letter.tex`
- `ats_report.md` — full checker output including GAPS TO FIX
- `meta.json` — `{ score, iteration, timestamp, gaps: [...] }`

For revise runs: also `feedback.md` at the run root with the user's revision feedback.

## Work needed

### 1. `.claude/commands/apply.md`
After each ATS check in Phase 3, snapshot the just-evaluated files into `run-apply/v{N}/`. Run number is always 1 for apply. Also snapshot the final compiled PDF at the end of Phase 4.

### 2. `.claude/commands/revise.md`
Same snapshotting as apply. Run number = `ls -d applications/$APP_ID-$SLUG/iterations/run-* 2>/dev/null | wc -l` + 1. Write the user's feedback to `run-{N}-revise/feedback.md` at the start of Phase 0.

### 3. `portal/lib/pipeline.ts`
Add `readIterationHistory(appId: number, slug: string)` that walks the iterations dir and returns structured data per run (type, feedback, iterations[]).

### 4. `portal/app/applications/[id]/iterations/page.tsx`
New server component sub-page. Groups by run, shows each iteration's score, ATS breakdown, gaps, and PDF/TEX links. PDF links work via the existing `public/applications` symlink to the project `applications/` dir.

### 5. Bug fix — `portal/lib/pipeline.ts`
`parseAtsResult` regex `/Score history:\s*([0-9→ ]+)/` fails when the orchestrator emits `Score history: [88]` (brackets around single value). Update to handle both bracketed and arrow-separated forms.

### 6. `portal/app/applications/[id]/page.tsx`
Add a link/button to the iterations sub-page, visible only when at least one iteration snapshot exists on disk.
