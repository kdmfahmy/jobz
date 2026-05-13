import { parseJobMatchResponse } from '@/lib/jobmatch'

test('parseJobMatchResponse extracts valid JSON from claude output with code block', () => {
  const output = `
Here is my analysis:

\`\`\`json
{
  "overall": 88,
  "breakdown": {
    "skills":     { "score": 95, "matched": ["Python", "PostgreSQL"], "gaps": ["Rust"] },
    "experience": { "score": 85, "notes": "3 yrs team lead" },
    "education":  { "score": 100, "notes": "B.Sc. Computer Engineering" },
    "domain":     { "score": 78, "notes": "Enterprise platform" }
  }
}
\`\`\`
`
  const result = parseJobMatchResponse(output)
  expect(result.overall).toBe(88)
  expect(result.breakdown.skills.score).toBe(95)
  expect(result.breakdown.skills.matched).toContain('Python')
  expect(result.breakdown.skills.gaps).toContain('Rust')
  expect(result.breakdown.experience.score).toBe(85)
  expect(result.breakdown.education.score).toBe(100)
  expect(result.breakdown.domain.score).toBe(78)
})

test('parseJobMatchResponse handles raw JSON without code block', () => {
  const output = `{"overall":75,"breakdown":{"skills":{"score":80,"matched":["JS"],"gaps":[]},"experience":{"score":70,"notes":"ok"},"education":{"score":80,"notes":"ok"},"domain":{"score":70,"notes":"ok"}}}`
  const result = parseJobMatchResponse(output)
  expect(result.overall).toBe(75)
})
