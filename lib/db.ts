// lib/db.ts
import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'jobz.db')

let _db: Database.Database | null = null

export function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(process.env.DB_PATH ?? path.join(process.cwd(), 'jobz.db'))
  _db.pragma('journal_mode = WAL')
  initSchema(_db)
  return _db
}

// Reset for testing
export function _resetDb() {
  _db?.close()
  _db = null
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id                  INTEGER PRIMARY KEY AUTOINCREMENT,
      slug                TEXT NOT NULL UNIQUE,
      company             TEXT NOT NULL,
      role                TEXT NOT NULL,
      jd_url              TEXT,
      jd_text             TEXT NOT NULL,
      status              TEXT NOT NULL DEFAULT 'generating',
      ats_score           INTEGER,
      ats_breakdown       TEXT,
      job_match_score     INTEGER,
      job_match_breakdown TEXT,
      iterations          TEXT,
      log                 TEXT NOT NULL DEFAULT '',
      created_at          TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at          TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)
}

export type ApplicationStatus =
  | 'generating' | 'generated' | 'applied'
  | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: number
  slug: string
  company: string
  role: string
  jd_url: string | null
  jd_text: string
  status: ApplicationStatus
  ats_score: number | null
  ats_breakdown: string | null
  job_match_score: number | null
  job_match_breakdown: string | null
  iterations: string | null
  log: string
  created_at: string
  updated_at: string
}

export function createApplication(data: {
  slug: string
  company: string
  role: string
  jd_url?: string
  jd_text: string
}): Application {
  const db = getDb()
  return db.prepare(`
    INSERT INTO applications (slug, company, role, jd_url, jd_text)
    VALUES (@slug, @company, @role, @jd_url, @jd_text)
    RETURNING *
  `).get({ jd_url: null, ...data }) as Application
}

export function listApplications(): Application[] {
  return getDb()
    .prepare('SELECT * FROM applications ORDER BY created_at DESC, id DESC')
    .all() as Application[]
}

export function getApplication(id: number): Application | null {
  return (getDb()
    .prepare('SELECT * FROM applications WHERE id = ?')
    .get(id) as Application) ?? null
}

export function updateApplication(
  id: number,
  data: Partial<Omit<Application, 'id' | 'created_at'>>
): Application | null {
  const fields = Object.keys(data)
    .map(k => `${k} = @${k}`)
    .join(', ')
  return (getDb().prepare(`
    UPDATE applications
    SET ${fields}, updated_at = datetime('now')
    WHERE id = @id
    RETURNING *
  `).get({ ...data, id }) as Application) ?? null
}

export function appendLog(id: number, chunk: string): void {
  getDb().prepare(`
    UPDATE applications
    SET log = log || ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(chunk, id)
}
