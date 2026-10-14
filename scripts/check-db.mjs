import { db } from '../src/server/db.js'

try {
  const connection = await db.prepare("SELECT current_database() database,current_setting('server_version') serverVersion").get()
  const tables = await db.prepare("SELECT COUNT(*) count FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('users','sessions','pets','adoption_applications','administrative_reviews','application_status_history','notifications','conversations','messages','attachments','adoption_placements','monitoring_records','feedback')").get()
  const pets = await db.prepare('SELECT COUNT(*) count FROM pets').get()
  if (Number(tables.count) !== 13) throw new Error(`Expected 13 WHELPS tables, found ${tables.count}. Run the migrations first.`)
  console.log(`Connected to ${connection.database} (PostgreSQL ${connection.serverVersion}); ${tables.count} tables and ${pets.count} pets are ready.`)
} finally {
  await db.close()
}
