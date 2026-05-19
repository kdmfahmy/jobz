# Jobz

AI-assisted job application pipeline built on Claude Code. Analyzes job postings, tailors CVs and cover letters, scores ATS fitness, and tracks applications through a Next.js portal.

---

## What it does

- `/apply` — full application pipeline: analyze JD → tailor CV + cover letter → ATS-score → compile PDFs → save to portal
- `/revise` — re-tailor an existing application based on new feedback, with the same ATS loop
- Portal (`portal/`) — Next.js app for tracking application state, viewing ATS scores, and browsing outputs

---

## Requirements

### Local (macOS)

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI (`npm install -g @anthropic-ai/claude-code`)
- [tectonic](https://tectonic-typesetting.github.io/) for LaTeX compilation (`brew install tectonic` or download from GitHub releases)
- Node.js 22+ (for the portal)
- An `ANTHROPIC_API_KEY` set in your environment

### Docker (recommended for a clean environment)

Docker and Docker Compose. Everything else is in the image.

---

## Setup

### 1. Fill in your profile

Edit `profile/base_profile.md` — this is the single source of truth the AI draws from. It should contain your full work history, skills, education, and any other facts you want available for tailoring. Nothing will be fabricated; if it's not here, it won't appear in your CV.

### 2. Configure templates

- `templates/cv_style.md` — LaTeX CV layout and formatting rules
- `templates/cover_letter_style.md` — cover letter voice and structure
- `templates/ats_rubric.md` — the scoring criteria used by the ATS checker

### 3. Start the portal

```bash
cd portal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Docker setup

```bash
# Set your API key
export ANTHROPIC_API_KEY=sk-ant-...

# Build and start the container
docker compose up -d

# Attach a shell
docker compose exec dev bash

# Inside the container — start the portal
cd portal && npm install && npm run dev &

# Run Claude Code
claude
```

The container mounts the repo at `/workspace`, shares your `~/.claude` auth, and isolates `node_modules` and `.next` in named volumes so native binaries rebuild correctly for the container's architecture.

> On first run inside the container, Claude Code will prompt you to authenticate if `~/.claude` is empty.

---

## Running an application

### From the portal

1. Open the portal, click **New Application**, paste the job URL or JD text, and submit.
2. In Claude Code, run `/apply` — it picks up the pending portal record automatically.

### From Claude Code directly

```
/apply
```

Claude will ask for the job URL or JD text, then run the full pipeline:

1. **Analyzer** — parses the JD, extracts keywords, writes a brief to `applications/{id}-{slug}/brief.md`
2. **Writer** — tailors CV and cover letter to `applications/{id}-{slug}/cv.tex` and `cover_letter.tex`
3. **ATS Checker** — scores the CV, flags gaps, runs up to 3 revision iterations (plus a trim loop if the CV overflows 1 page)
4. **Compiler** — runs `tectonic` to produce PDFs
5. **Portal update** — saves ATS score, breakdown, and iteration history

Output files live in `applications/{id}-{slug}/`.

### Revising an existing application

```
/revise
```

Re-runs the Writer + ATS loop on an existing application. Useful after you've edited `base_profile.md` or received feedback.

---

## Project structure

```
agents/           Agent prompts (analyzer, writer, ats_checker)
.claude/commands/ Slash command orchestrators (apply, revise)
applications/     Generated per-application files (gitignored by default)
portal/           Next.js tracking app
profile/          base_profile.md — your facts, never edited by the AI
templates/        CV style, cover letter style, ATS rubric
```

---

## Notes

- The AI never fabricates facts. All CV content must exist in `base_profile.md`.
- Placeholder text is never inserted into documents — if something is missing, it's omitted or flagged in a summary.
- ATS loop exits when score ≥ 80 **and** the CV fits on 1 page. If neither condition is met after 3 iterations, a trim loop runs. If the CV still overflows after that, you're warned to trim manually.
