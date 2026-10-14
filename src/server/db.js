import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

const databasePath = process.env.WHELPS_DATABASE_PATH || path.join(process.cwd(), '.data', 'whelps.sqlite')
const pets = [
  ['max','Max','/images/pets/max.webp','Dog','Golden Retriever','2 years old','Male','Neutered','Vaccinated','A friendly and energetic retriever who loves to play fetch and is great with families and other dogs.'],
  ['luna','Luna','/images/pets/luna.webp','Cat','Persian','3 years old','Female','Spayed','Vaccinated','A beautiful and affectionate cat who loves cuddles, calm company, and quiet playtime.'],
  ['buddy','Buddy','/images/pets/buddy.webp','Dog','Labrador','5 months old','Male','Neutered','Vaccinated','A loyal, gentle family dog looking for an active home with plenty of love and play.'],
  ['felix','Felix','/images/pets/felix.webp','Cat','Tabby','2 years old','Male','Neutered','Vaccinated','An easygoing lap cat who enjoys head scratches and casual window-gazing.'],
  ['rocky','Rocky','/images/pets/rocky.webp','Dog','Aspin','4 years old','Male','Neutered','Vaccinated','An energetic, clever pup who would thrive in an active home with room to run.'],
  ['bella','Bella','/images/pets/bella.webp','Cat','Puspin','5 months old','Female','Spayed','Vaccinated','A confident, patient companion who gets along well with children and other pets.']
]

function openDatabase() {
  fs.mkdirSync(path.dirname(databasePath), { recursive:true })
  const database = new Database(databasePath)
  database.pragma('journal_mode = WAL'); database.pragma('foreign_keys = ON'); database.pragma('busy_timeout = 5000')
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER' CHECK(role IN ('USER','ADMIN')), phone TEXT, region TEXT, city TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pets (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, image TEXT NOT NULL, type TEXT NOT NULL, breed TEXT NOT NULL,
      age TEXT NOT NULL, gender TEXT NOT NULL, fixed_status TEXT NOT NULL, vaccination_status TEXT NOT NULL,
      health_notes TEXT, health_verification TEXT NOT NULL DEFAULT 'Verified' CHECK(health_verification IN ('Pending Verification','Requires Update','Verified')),
      description TEXT NOT NULL, availability TEXT NOT NULL DEFAULT 'Available' CHECK(availability IN ('Available','On Hold','Adopted','Archived')),
      published INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS adoption_applications (
      id TEXT PRIMARY KEY, applicant_user_id TEXT NOT NULL REFERENCES users(id), pet_id TEXT NOT NULL REFERENCES pets(id),
      full_name TEXT NOT NULL, email TEXT NOT NULL, contact TEXT NOT NULL, address TEXT NOT NULL, reason TEXT NOT NULL,
      housing_type TEXT NOT NULL, pets_allowed TEXT NOT NULL, housing_details TEXT, income_range TEXT NOT NULL,
      financial_support TEXT NOT NULL, pet_experience TEXT NOT NULL, experience_details TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted' CHECK(status IN ('Submitted','Under Review','Additional Information Required','Approved — Awaiting Placement','Rejected','Cancelled by Applicant','Adoption Completed')),
      submitted_at TEXT NOT NULL, updated_at TEXT NOT NULL, cancelled_at TEXT, decision_at TEXT, latest_update TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1
    );
    CREATE UNIQUE INDEX IF NOT EXISTS one_active_application_per_user ON adoption_applications(applicant_user_id)
      WHERE status IN ('Submitted','Under Review','Additional Information Required','Approved — Awaiting Placement');
    CREATE TABLE IF NOT EXISTS administrative_reviews (
      id TEXT PRIMARY KEY, application_id TEXT NOT NULL UNIQUE REFERENCES adoption_applications(id) ON DELETE CASCADE,
      reviewer_admin_id TEXT NOT NULL REFERENCES users(id), housing_evaluation TEXT, financial_evaluation TEXT,
      experience_evaluation TEXT, readiness_evaluation TEXT, internal_notes TEXT, decision TEXT, decision_reason TEXT,
      reviewed_at TEXT NOT NULL, decision_at TEXT
    );
    CREATE TABLE IF NOT EXISTS application_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT, application_id TEXT NOT NULL REFERENCES adoption_applications(id) ON DELETE CASCADE,
      previous_status TEXT, new_status TEXT NOT NULL, updated_by TEXT NOT NULL REFERENCES users(id), updated_at TEXT NOT NULL, reason TEXT
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY, recipient_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      application_id TEXT REFERENCES adoption_applications(id) ON DELETE CASCADE, conversation_id TEXT,
      type TEXT NOT NULL, message TEXT NOT NULL, is_read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY, adopter_user_id TEXT NOT NULL REFERENCES users(id), application_id TEXT NOT NULL UNIQUE REFERENCES adoption_applications(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL, last_activity_at TEXT NOT NULL, closed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY, conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_user_id TEXT NOT NULL REFERENCES users(id), content TEXT NOT NULL, message_kind TEXT NOT NULL DEFAULT 'MESSAGE',
      created_at TEXT NOT NULL, read_at TEXT, client_request_id TEXT,
      UNIQUE(conversation_id,sender_user_id,client_request_id)
    );
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY, message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      storage_key TEXT NOT NULL, mime_type TEXT NOT NULL, file_size INTEGER NOT NULL, original_name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS adoption_placements (
      id TEXT PRIMARY KEY, application_id TEXT NOT NULL UNIQUE REFERENCES adoption_applications(id), pet_id TEXT NOT NULL UNIQUE REFERENCES pets(id),
      adopter_user_id TEXT NOT NULL REFERENCES users(id), recorded_by TEXT NOT NULL REFERENCES users(id), adopted_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Active'
    );
    CREATE TABLE IF NOT EXISTS monitoring_records (
      id TEXT PRIMARY KEY, placement_id TEXT NOT NULL REFERENCES adoption_placements(id) ON DELETE CASCADE,
      submitted_by TEXT NOT NULL REFERENCES users(id), pet_condition TEXT NOT NULL, feeding_update TEXT,
      health_observations TEXT, behavior_update TEXT, notes TEXT, submitted_at TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'Pending Review', reviewed_by TEXT REFERENCES users(id), reviewed_at TEXT, admin_notes TEXT
    );
    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY, submitted_by TEXT NOT NULL REFERENCES users(id), topic TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5), comments TEXT, created_at TEXT NOT NULL
    );
  `)
  const now = new Date().toISOString()
  const insert = database.prepare(`INSERT OR IGNORE INTO pets
    (id,name,image,type,breed,age,gender,fixed_status,vaccination_status,description,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
  database.transaction(() => pets.forEach(pet => insert.run(...pet,now,now)))()
  return database
}

export const db = globalThis.__whelpsDb || openDatabase()
if (process.env.NODE_ENV !== 'production') globalThis.__whelpsDb = db
export const makeId = prefix => `${prefix}-${Date.now()}-${crypto.randomUUID().slice(0,8)}`

