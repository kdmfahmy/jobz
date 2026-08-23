// __tests__/lib/db.test.ts
import { createApplication, listApplications, getApplication, updateApplication, _resetDb } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const TEST_DB = path.join(process.cwd(), 'test.db')

beforeEach(() => {
  process.env.DB_PATH = TEST_DB
  _resetDb()
  // Force fresh DB for each test
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

afterEach(() => {
  _resetDb()
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB)
})

test('createApplication inserts and returns a row', () => {
  const app = createApplication({
    slug: 'apple_sr-swe',
    company: 'Apple',
    role: 'Senior Software Engineer',
    jd_text: 'We are looking for...',
  })
  expect(app.id).toBeDefined()
  expect(app.slug).toBe('apple_sr-swe')
  expect(app.status).toBe('pending')
  expect(app.ats_score).toBeNull()
})

test('listApplications returns all rows ordered by created_at desc', () => {
  createApplication({ slug: 'a', company: 'A', role: 'Dev', jd_text: 'jd1' })
  createApplication({ slug: 'b', company: 'B', role: 'Dev', jd_text: 'jd2' })
  const apps = listApplications()
  expect(apps).toHaveLength(2)
  expect(apps[0].slug).toBe('b')
})

test('getApplication returns the row by id', () => {
  const created = createApplication({ slug: 'x', company: 'X', role: 'Dev', jd_text: 'jd' })
  const fetched = getApplication(created.id)
  expect(fetched?.slug).toBe('x')
})

test('getApplication returns null for missing id', () => {
  expect(getApplication(9999)).toBeNull()
})

test('updateApplication updates fields and returns updated row', () => {
  const created = createApplication({ slug: 'y', company: 'Y', role: 'Dev', jd_text: 'jd' })
  const updated = updateApplication(created.id, { status: 'generated', ats_score: 87 })
  expect(updated?.status).toBe('generated')
  expect(updated?.ats_score).toBe(87)
})
