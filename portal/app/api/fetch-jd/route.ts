// app/api/fetch-jd/route.ts
import { NextRequest, NextResponse } from 'next/server'

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
function extractJsonLdJob(html: string): { role: string; company: string; jd_text: string } | null {
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
        const rawDesc = typeof n['description'] === 'string' ? n['description'] : ''
        const jd_text = rawDesc ? htmlToText(rawDesc) : ''
        if (role || jd_text) return { role, company, jd_text }
      }
    } catch {
      // malformed JSON-LD, skip
    }
  }
  return null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
}

function htmlToText(html: string): string {
  const text = html
    // Decode entities first so entity-encoded tags like &lt;div&gt; are stripped below
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
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
  return text.slice(0, 12000)
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
      return NextResponse.json(result)
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
      return NextResponse.json(result)
    } catch (err) {
      return NextResponse.json(
        { error: `Could not fetch LinkedIn job: ${err instanceof Error ? err.message : err}` },
        { status: 422 }
      )
    }
  }

  // Generic fetch
  let html: string
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
    return NextResponse.json({ error: `Could not fetch URL: ${err instanceof Error ? err.message : err}` }, { status: 422 })
  }

  // Try JSON-LD first — it survives JS-rendered pages because it's embedded for SEO crawlers
  const jsonLd = extractJsonLdJob(html)
  if (jsonLd) {
    const company = jsonLd.company || companyFromUrl(url)
    return NextResponse.json({ role: jsonLd.role, company, jd_text: jsonLd.jd_text })
  }

  // Fallback: parse HTML meta/title tags
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

  const jd_text = extractDescriptionSection(html) || htmlToText(html)

  return NextResponse.json({ role, company, jd_text })
}
