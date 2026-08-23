// lib/db.ts
import Database from 'better-sqlite3'
import path from 'path'

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
      status              TEXT NOT NULL DEFAULT 'pending',
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
  try { db.exec('ALTER TABLE applications ADD COLUMN pid INTEGER') } catch {}
  try { db.exec('ALTER TABLE applications ADD COLUMN job_id TEXT') } catch {}
}

export type ApplicationStatus =
  | 'pending' | 'generating' | 'generated' | 'applied'
  | 'interview' | 'offer' | 'rejected'

export interface Application {
  id: number
  slug: string
  company: string
  role: string
  jd_url: string | null
  job_id: string | null
  jd_text: string
  status: ApplicationStatus
  ats_score: number | null
  ats_breakdown: string | null
  job_match_score: number | null
  job_match_breakdown: string | null
  iterations: string | null
  log: string
  pid: number | null
  created_at: string
  updated_at: string
}

export function createApplication(data: {
  slug: string
  company: string
  role: string
  jd_url?: string
  job_id?: string
  jd_text: string
}): Application {
  const db = getDb()
  return db.prepare(`
    INSERT INTO applications (slug, company, role, jd_url, job_id, jd_text, status)
    VALUES (@slug, @company, @role, @jd_url, @job_id, @jd_text, 'pending')
    RETURNING *
  `).get({ jd_url: null, job_id: null, ...data }) as Application
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

export function deleteApplication(id: number): boolean {
  const result = getDb()
    .prepare('DELETE FROM applications WHERE id = ?')
    .run(id)
  return result.changes > 0
}
