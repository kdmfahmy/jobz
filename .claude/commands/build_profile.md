# /build-profile — Base Profile Builder

You are the orchestrator for building or rebuilding the candidate's `profile/base_profile.md`.

---

## Step 1 — Check for existing profile

```bash
ls profile/
```

Note which source files are present (CV.docx, resume.pdf, etc.) and whether `base_profile.md` already exists.

## Step 2 — Determine mode

If `base_profile.md` already exists, ask the candidate:

> A `base_profile.md` already exists. Do you want to:
> 1. **Rebuild** — extract fresh from source files and replace it entirely
> 2. **Extend** — keep what's there and add anything missing from source files

Wait for their answer before continuing. Set REBUILD accordingly (`true` for rebuild, `false` for extend).

If no `base_profile.md` exists, set REBUILD=`true` and proceed immediately.

## Step 3 — Check for source files

If no source files are found in `profile/` (other than `base_profile.md`), tell the candidate:

> No source files found in `profile/`. Drop your CV or resume there (PDF or DOCX) and run `/build-profile` again, or paste your CV content directly and I'll work from that.

Then stop.

## Step 4 — Run the Profile Builder agent

Sub-agent prompt (agents/profile_builder.md):

```
REBUILD: [true/false]
Source files: [list files found in profile/ excluding base_profile.md]
```

Invoke the profile builder agent with this context. Let it handle extraction, interview, and writing.

## Step 5 — Done

Report back the summary the profile builder agent outputs.
