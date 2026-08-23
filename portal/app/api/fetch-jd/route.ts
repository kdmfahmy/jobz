// app/api/fetch-jd/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'

function extractMeta(html: string, property: string): string {
  const m = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'))
    ?? html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i'))
  return m?.[1]?.trim() ?? ''
}

function extractTag(html: string, tag: string): string {
  const m = html.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i'))
  return m?.[1]?.trim() ?? ''
}

function parseRoleAndCompany(raw: string): { role: string; company: string } {
  const separators = [' - ', ' | ', ' — ', ' at ']
  for (const sep of separators) {
    const idx = raw.lastIndexOf(sep)
    if (idx > 0) {
      return {
        role: raw.slice(0, idx).trim(),
        company: raw.slice(idx + sep.length).trim(),
      }
    }
  }
  return { role: raw.trim(), company: '' }
}

function companyFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    const knownHosts: Record<string, string> = {
      'jobs.apple.com': 'Apple',
      'careers.google.com': 'Google',
      'amazon.jobs': 'Amazon',
      'careers.microsoft.com': 'Microsoft',
      'www.metacareers.com': 'Meta',
      'jobs.netflix.com': 'Netflix',
      'jobs.sap.com': 'SAP',
      'careers.sap.com': 'SAP',
      'careers.amazon.com': 'Amazon',
      'jobs.lever.co': '',  // handled by leverMatch below
    }
    if (knownHosts[host] !== undefined) return knownHosts[host]
    const ghMatch = url.match(/greenhouse\.io\/([^/]+)/)
    if (ghMatch) return ghMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    const leverMatch = url.match(/lever\.co\/([^/]+)/)
    if (leverMatch) return leverMatch[1].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  } catch {}
  return ''
}

// Many JS-heavy job boards embed schema.org/JobPosting in <script type="application/ld+json"> for SEO crawlers.
// This is statically served and doesn't require JS execution.
function extractJsonLdJob(html: string): { role: string; company: string; job_id: string; jd_text: string } | null {
  const scriptBlocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  for (const block of scriptBlocks) {
    try {
      const data = JSON.parse(block[1])
      const nodes: unknown[] = Array.isArray(data) ? data : data['@graph'] ? data['@graph'] : [data]
      for (const node of nodes) {
        if (typeof node !== 'object' || node === null) continue
        const n = node as Record<string, unknown>
        if (n['@type'] !== 'JobPosting') continue
        const role = typeof n['title'] === 'string' ? decodeEntities(n['title']) : ''
        const orgName = typeof n['hiringOrganization'] === 'object' && n['hiringOrganization'] !== null
          ? String((n['hiringOrganization'] as Record<string, unknown>)['name'] ?? '')
          : typeof n['hiringOrganization'] === 'string' ? n['hiringOrganization'] : ''
        const company = decodeEntities(orgName)
        const job_id = typeof n['identifier'] === 'string' ? n['identifier']
          : typeof n['identifier'] === 'object' && n['identifier'] !== null
            ? String((n['identifier'] as Record<string, unknown>)['value'] ?? '')
            : ''
        const rawDesc = typeof n['description'] === 'string' ? n['description'] : ''
        const jd_text = rawDesc ? htmlToText(rawDesc) : ''
        if (role || jd_text) return { role, company, job_id, jd_text }
      }
    } catch {
      // malformed JSON-LD, skip
    }
  }
  return null
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', nbsp: ' ', quot: '"', apos: "'",
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      const code = parseInt(hex, 16)
      return code === 0x200b ? '' : String.fromCodePoint(code)
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      const code = parseInt(dec, 10)
      return code === 0x200b ? '' : String.fromCodePoint(code)
    })
    .replace(/&([a-zA-Z]+);/g, (m, name) => NAMED_ENTITIES[name] ?? m)
}

function htmlToTextRaw(html: string): string {
  return decodeEntities(html)
    .replace(/<(script|style|nav|footer|header|noscript)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|ul|ol|li|h[1-6]|section|article)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\r/g, '')              // strip CR from CRLF line endings
    .replace(/ /g, ' ')         // normalize non-breaking spaces to regular spaces
    .replace(/[ \t]+/g, ' ')        // collapse horizontal whitespace
    .replace(/^ +$/gm, '')          // blank out space-only lines (from <p> </p> spacers)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function htmlToText(html: string): string {
  return htmlToTextRaw(html).slice(0, 12000)
}

function jobIdFromUrl(url: string): string {
  // Greenhouse
  const gh = url.match(/greenhouse\.io\/[^/]+\/jobs\/(\d+)/)
  if (gh) return gh[1]
  // Lever
  const lever = url.match(/lever\.co\/[^/]+\/([0-9a-f-]{36})/)
  if (lever) return lever[1]
  // LinkedIn
  const li = url.match(/linkedin\.com\/jobs\/view\/(\d+)/)
  if (li) return li[1]
  // Workday
  const wd = url.match(/[?&](?:jobId|Job_ID|requisitionId)=([^&]+)/)
  if (wd) return wd[1]
  // Generic numeric/alphanumeric ID at end of path
  const generic = url.match(/\/(\d{6,})(?:[/?#]|$)/)
  if (generic) return generic[1]
  return ''
}

type JdExtraction = { role: string; company: string; job_id?: string; jd_text: string }

async function cleanWithClaude(pageText: string, url: string): Promise<JdExtraction | null> {
  const prompt = `You are extracting clean job posting content from a fetched web page.

Source URL: ${url}

Return ONLY a JSON object with this exact shape, on a single line, with no markdown fences and no commentary before or after:
{"role":"<job title>","company":"<company name>","jd_text":"<clean job description>"}

Rules for jd_text:
- Include only the job description prose: role overview, responsibilities, requirements, qualifications, preferred qualifications, benefits, "about the team", "why join us", "diversity & inclusion" sections.
- Do NOT include the role title as a standalone heading at the very top (it's already in the role field). It IS fine for the role title to appear inside JD prose, e.g. "As a Solutions Engineer, you will..." — keep those mentions intact.
- Do NOT include standalone metadata header blocks like "Location: X", "Employment Type: Y", "Job Code: Z", "Job ID", "Department", "Salary range" when they appear as a page-header listing. (If location is mentioned naturally inside a sentence in the JD prose, keep it.)
- Strip site navigation, footers, language switchers, application form fields, cookie banners, social links, "Apply"/"Share"/"Save" UI text, breadcrumbs, copyright lines, "Search now" / "Join us" CTAs that are part of the site shell, and any other site chrome.
- Preserve the original wording and structure of the job description. Do not paraphrase or summarize.

Other rules:
- company is the hiring company (e.g. "TikTok", "Apple") — not the job board.
- If the page is not a job posting, return {"role":"","company":"","jd_text":""}.

Page text:
---
${pageText.slice(0, 40000)}
---`

  return new Promise((resolve) => {
    const proc = spawn(
      'claude',
      [
        '-p', prompt,
        '--model', 'claude-sonnet-4-6',
        '--output-format', 'json',
        '--dangerously-skip-permissions',
      ],
      { cwd: '/tmp', env: process.env, timeout: 60000 }
    )

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.on('error', (err) => {
      console.error('[fetch-jd] claude spawn error:', err)
      resolve(null)
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[fetch-jd] claude exit', code, 'stderr:', stderr.slice(0, 500))
        return resolve(null)
      }
      try {
        const envelope = JSON.parse(stdout)
        const result = typeof envelope?.result === 'string' ? envelope.result : ''
        const stripped = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
        const parsed = JSON.parse(stripped)
        resolve({
          role: typeof parsed.role === 'string' ? parsed.role : '',
          company: typeof parsed.company === 'string' ? parsed.company : '',
          jd_text: typeof parsed.jd_text === 'string' ? parsed.jd_text : '',
        })
      } catch (err) {
        console.error('[fetch-jd] could not parse claude output:', err, 'raw:', stdout.slice(0, 500))
        resolve(null)
      }
    })
  })
}

// For JS-heavy SPAs where Node fetch returns an empty shell, ask Claude to fetch
// the URL directly using its WebFetch tool, which renders JavaScript.
async function fetchWithClaude(url: string): Promise<JdExtraction | null> {
  const prompt = `Fetch this job posting URL and extract the content.

URL: ${url}

Use the WebFetch tool to fetch the page. Then return ONLY a JSON object with this exact shape, on a single line, with no markdown fences and no commentary before or after:
{"role":"<job title>","company":"<company name>","jd_text":"<clean job description>"}

Rules for jd_text:
- Include only the job description prose: role overview, responsibilities, requirements, qualifications, preferred qualifications, benefits, "about the team", "why join us", "diversity & inclusion" sections.
- Do NOT include the role title as a standalone heading at the very top.
- Strip site navigation, footers, cookie banners, apply buttons, and other site chrome.
- Preserve the original wording. Do not paraphrase or summarize.

Other rules:
- company is the hiring company (e.g. "TikTok", "ByteDance") — not the job board.
- If the page is not a job posting, cannot be fetched, returns an error, requires login, or is geoblocked, return exactly: {"role":"","company":"","jd_text":""}
- CRITICAL: Your entire response must be that single JSON object and nothing else — no explanations, no apologies, no error descriptions. Even on failure, output only the JSON.`

  return new Promise((resolve) => {
    const proc = spawn(
      'claude',
      [
        '-p', prompt,
        '--model', 'claude-sonnet-4-6',
        '--output-format', 'json',
        '--dangerously-skip-permissions',
      ],
      { cwd: '/tmp', env: process.env, timeout: 90000 }
    )

    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString() })
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString() })

    proc.on('error', (err) => {
      console.error('[fetch-jd] fetchWithClaude spawn error:', err)
      resolve(null)
    })

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[fetch-jd] fetchWithClaude exit', code, 'stderr:', stderr.slice(0, 500))
        return resolve(null)
      }
      try {
        const envelope = JSON.parse(stdout)
        const result = typeof envelope?.result === 'string' ? envelope.result : ''
        const stripped = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
        let parsed: Record<string, unknown>
        try {
          parsed = JSON.parse(stripped)
        } catch {
          // Claude returned prose instead of JSON — try to find an embedded object
          const m = stripped.match(/\{[\s\S]*"jd_text"[\s\S]*\}/)
          if (!m) { console.error('[fetch-jd] fetchWithClaude no JSON in output, raw:', result.slice(0, 200)); return resolve(null) }
          parsed = JSON.parse(m[0])
        }
        resolve({
          role: typeof parsed.role === 'string' ? parsed.role : '',
          company: typeof parsed.company === 'string' ? parsed.company : '',
          jd_text: typeof parsed.jd_text === 'string' ? parsed.jd_text : '',
        })
      } catch (err) {
        console.error('[fetch-jd] fetchWithClaude could not parse output:', err, 'raw:', stdout.slice(0, 500))
        resolve(null)
      }
    })
  })
}

// Extract description from well-known container patterns used by major job boards.
// Uses anchor+end-marker slicing to handle deeply nested HTML that breaks regex closing-tag matching.
function extractDescriptionSection(html: string): string {
  // Each entry: [anchor string to find, end marker (or null to take a fixed chunk)]
  const anchors: [string, string | null][] = [
    // SAP SuccessFactors — actual JD content ends before joblayouttoken sidebar tiles
    ['class="jobdescription"', '<div class="joblayouttoken'],
    // Workday
    ['data-automation-id="jobPostingDescription"', 'data-automation-id="jobPostingFooter"'],
    // Greenhouse
    ['id="content" class="content"', '<div id="bottom_content"'],
    // Lever
    ['class="section-wrapper posting-detail"', '<div class="postings-btn-wrapper"'],
    // SmartRecruiters
    ['class="job-description"', '<div class="job-section details"'],
    // Generic itemprop
    ['itemprop="description"', null],
  ]

  for (const [anchor, endMarker] of anchors) {
    const anchorPos = html.indexOf(anchor)
    if (anchorPos === -1) continue
    // Advance past the closing > of the opening tag so the attribute text itself isn't included
    const tagClose = html.indexOf('>', anchorPos)
    const start = tagClose > anchorPos ? tagClose + 1 : anchorPos + anchor.length
    const endPos = endMarker ? html.indexOf(endMarker, start) : -1
    const end = endPos > start ? endPos : start + 30000
    const text = htmlToText(html.slice(start, end))
    if (text.length > 200) return text
  }
  return ''
}

// Greenhouse job-boards pages include the application form in the HTML.
// Their public API returns clean JSON with just the job posting content.
async function fetchGreenhouse(company: string, jobId: string): Promise<{ role: string; company: string; jd_text: string }> {
  const apiUrl = `https://boards-api.greenhouse.io/v1/boards/${company}/jobs/${jobId}`
  const res = await fetch(apiUrl, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`Greenhouse API returned HTTP ${res.status}`)
  const data = await res.json()
  const role = typeof data.title === 'string' ? decodeEntities(data.title) : ''
  const rawDesc = typeof data.content === 'string' ? data.content : ''
  const jd_text = rawDesc ? htmlToText(rawDesc) : ''
  return {
    role,
    company: company.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    jd_text,
  }
}

// LinkedIn renders server-side blank pages — use their guest API instead
async function fetchLinkedIn(jobId: string): Promise<{ role: string; company: string; jd_text: string }> {
  const apiUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`
  const res = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  })
  if (!res.ok) throw new Error(`LinkedIn API returned HTTP ${res.status}`)
  const html = await res.text()

  // Role: <h2 class="top-card-layout__title ...">
  const roleMatch = html.match(/<h2[^>]*top-card-layout__title[^>]*>\s*([^<]+)\s*<\/h2>/i)
  const role = decodeEntities(roleMatch?.[1]?.trim() ?? '')

  // Company: <a class="topcard__org-name-link ...">
  const companyMatch = html.match(/<a[^>]*topcard__org-name-link[^>]*>\s*([^<]+)\s*<\/a>/i)
    ?? html.match(/<span[^>]*topcard__flavor[^>]*>\s*([^<]+)\s*<\/span>/i)
  const company = decodeEntities(companyMatch?.[1]?.trim() ?? '')

  // Description: <div class="show-more-less-html__markup ...">
  const descMatch = html.match(/<div[^>]*show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i)
  const jd_text = descMatch ? htmlToText(descMatch[1]) : htmlToText(html)

  return { role, company, jd_text }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 })

  // Greenhouse special case — job-boards.greenhouse.io/{company}/jobs/{id}
  const ghBoardMatch = url.match(/job-boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
    ?? url.match(/boards\.greenhouse\.io\/([^/]+)\/jobs\/(\d+)/)
  if (ghBoardMatch) {
    try {
      const result = await fetchGreenhouse(ghBoardMatch[1], ghBoardMatch[2])
      return NextResponse.json({ ...result, job_id: ghBoardMatch[2] })
    } catch (err) {
      return NextResponse.json(
        { error: `Could not fetch Greenhouse job: ${err instanceof Error ? err.message : err}` },
        { status: 422 }
      )
    }
  }

  // LinkedIn special case
  const linkedInMatch = url.match(/linkedin\.com\/jobs\/view\/(\d+)/)
  if (linkedInMatch) {
    try {
      const result = await fetchLinkedIn(linkedInMatch[1])
      return NextResponse.json({ ...result, job_id: linkedInMatch[1] })
    } catch (err) {
      return NextResponse.json(
        { error: `Could not fetch LinkedIn job: ${err instanceof Error ? err.message : err}` },
        { status: 422 }
      )
    }
  }

  // Generic fetch — null if network/DNS failure
  let html: string | null = null
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    html = await res.text()
  } catch (err) {
    console.error('[fetch-jd] fetch failed for', url, err instanceof Error ? err.message : err)
  }

  const urlJobId = jobIdFromUrl(url)

  if (html) {
    const jsonLd = extractJsonLdJob(html)
    if (jsonLd) {
      const company = jsonLd.company || companyFromUrl(url)
      const job_id = jsonLd.job_id || urlJobId
      return NextResponse.json({ role: jsonLd.role, company, job_id, jd_text: jsonLd.jd_text })
    }

    const cleaned = await cleanWithClaude(htmlToTextRaw(html), url)
    if (cleaned && (cleaned.role || cleaned.jd_text)) {
      const company = cleaned.company || companyFromUrl(url)
      return NextResponse.json({ role: cleaned.role, company, job_id: cleaned.job_id || urlJobId, jd_text: cleaned.jd_text })
    }
  }

  // Node fetch failed or Claude found nothing — try Claude's WebFetch (renders JS, own DNS)
  const claudeFetched = await fetchWithClaude(url)
  if (claudeFetched && (claudeFetched.role || claudeFetched.jd_text)) {
    const company = claudeFetched.company || companyFromUrl(url)
    return NextResponse.json({ role: claudeFetched.role, company, job_id: claudeFetched.job_id || urlJobId, jd_text: claudeFetched.jd_text })
  }

  // Last-resort: parse meta/title tags from whatever HTML we have
  if (!html) return NextResponse.json({ error: 'Could not fetch URL' }, { status: 422 })

  const ogTitle = extractMeta(html, 'og:title')
  const pageTitle = extractTag(html, 'title')
  const h1 = extractTag(html, 'h1')
  const titleSource = decodeEntities(ogTitle || pageTitle || '')
  let { role, company } = parseRoleAndCompany(titleSource)
  if (h1 && h1.length < 120) role = decodeEntities(h1)
  if (!company) company = companyFromUrl(url)
  if (company && role.toLowerCase().endsWith(company.toLowerCase())) {
    role = role.slice(0, role.length - company.length).replace(/[-|–\s]+$/, '').trim()
  }
  return NextResponse.json({ role, company, job_id: urlJobId, jd_text: extractDescriptionSection(html) || htmlToText(html) })
}
