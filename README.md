# Jobz

AI-assisted job application pipeline built on Claude Code. Analyzes job postings, tailors CVs and cover letters, scores ATS fitness, and tracks applications through a Next.js portal.

---

## What it does

- `/apply` — full application pipeline: analyze JD → tailor CV + cover letter → ATS-score → compile PDFs → save to portal
- `/revise` — re-tailor an existing application based on new feedback, with the same ATS loop
- Portal (`portal/`) — Next.js app for tracking application state, viewing ATS scores, and browsing outputs

---

## Requirements

### Local

**Claude Code**
```bash
npm install -g @anthropic-ai/claude-code
claude auth login
```

**tectonic** (LaTeX compiler)
```bash
# macOS
brew install tectonic

# Linux / Windows — download a binary from the releases page:
# https://github.com/tectonic-typesetting/tectonic/releases
```

**Node.js 22+**
```bash
# macOS
brew install node

# or use nvm (any platform)
nvm install 22 && nvm use 22
```

### Docker (recommended for a clean environment)

Install [Docker Desktop](https://www.docker.com/products/docker-desktop). Everything else is in the image — including tectonic and Node.js. You still need to run `claude auth login` on your host machine first so the container can inherit your auth from `~/.claude`.

---

## Setup

### 1. Build your profile

`profile/base_profile.md` is the single source of truth the AI draws from. Nothing will be fabricated — if it's not here, it won't appear in your CV.

**Option A — Build from a CV file (recommended)**

Drop your existing CV or resume into the `profile/` folder (PDF or DOCX), then run:

```
/build-profile
```

The builder reads your file, asks targeted questions to fill any gaps (metrics, team sizes, technologies), and writes `profile/base_profile.md` for you.

**Option B — Write it manually**

Create `profile/base_profile.md` directly. Include: full work history with responsibilities and metrics, all skills and technologies, education, and any projects or certifications. The more detail you provide, the better the tailoring.

**Keeping it up to date**

Run `/revise` with the update profile option after any CV revision to backport factual additions (new metrics, corrected numbers, added skills) into the base profile automatically.

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

1. Open the portal, click **New Application**, fill in the job URL or JD text, and submit.
2. On the application page, click **Generate CV & Cover Letter** — the pipeline runs from there.

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

**From the portal** — open the application page, fill in the revision form at the bottom, and submit. The re-tailoring and ATS loop run automatically.

**From Claude Code directly**

```
/revise
```

Re-runs the Writer + ATS loop on an existing application. Useful after you've edited `base_profile.md` or received feedback.

---

## Project structure

```
agents/           Agent prompts (analyzer, writer, ats_checker, profile_builder)
.claude/commands/ Slash command orchestrators (apply, revise, build_profile)
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
