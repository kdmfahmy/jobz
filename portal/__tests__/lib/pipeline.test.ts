// __tests__/lib/pipeline.test.ts
import { parsePipelineSteps, parseAtsResult } from '@/lib/pipeline'

describe('parsePipelineSteps', () => {
  test('all pending on empty log', () => {
    const steps = parsePipelineSteps('')
    expect(steps[0].status).toBe('pending')
    expect(steps[1].status).toBe('pending')
    expect(steps[2].status).toBe('pending')
    expect(steps[3].status).toBe('pending')
  })

  test('step 1 in_progress when Analyzer Agent appears', () => {
    const steps = parsePipelineSteps('Spawning Analyzer Agent...')
    expect(steps[0].status).toBe('in_progress')
  })

  test('step 1 done when brief file written', () => {
    const steps = parsePipelineSteps('Analyzer Agent\nWrite: applications/1-apple_sr-swe/brief.md')
    expect(steps[0].status).toBe('done')
    expect(steps[1].status).toBe('in_progress')
  })

  test('step 2 done when tex files written', () => {
    const log = 'Analyzer Agent\napplications/1-apple/brief.md\nWriter Agent\nATS Checker'
    const steps = parsePipelineSteps(log)
    expect(steps[1].status).toBe('done')
    expect(steps[2].status).toBe('in_progress')
  })

  test('step 3 shows iteration detail', () => {
    const log = 'Analyzer Agent\napplications/1-apple/brief.md\nWriter Agent\nATS Checker\niteration 2'
    const steps = parsePipelineSteps(log)
    expect(steps[2].status).toBe('in_progress')
    expect(steps[2].detail).toBe('iteration 2 of 3')
  })

  test('all done when APPLICATION: appears', () => {
    const log = 'Analyzer Agent\napplications/1-apple/brief.md\nWriter Agent\nATS Checker\ntectonic applications/1-apple/cv.tex\nAPPLICATION: Senior SWE'
    const steps = parsePipelineSteps(log)
    expect(steps.every(s => s.status === 'done')).toBe(true)
  })
})

describe('parseAtsResult', () => {
  test('returns null when no score found', () => {
    expect(parseAtsResult('no score here')).toBeNull()
  })

  test('parses score and breakdown from final report', () => {
    const log = `
════════════════════════════════════════
APPLICATION: Senior SWE
ATS SCORE: 87/100  ✓ PASS
  Keyword Match:           31/35
  Quantified Achievements: 22/25
  Section Completeness:    20/20
  Formatting:              8/12
  Action Verbs:            6/8
Score history: [68 → 77 → 87]
    `
    const result = parseAtsResult(log)
    expect(result?.score).toBe(87)
    expect(result?.breakdown.keyword).toBe(31)
    expect(result?.breakdown.quantified).toBe(22)
    expect(result?.breakdown.sections).toBe(20)
    expect(result?.breakdown.formatting).toBe(8)
    expect(result?.breakdown.actionVerbs).toBe(6)
    expect(result?.iterations).toEqual([68, 77, 87])
  })
})
