import { drizzle } from 'drizzle-orm/mysql2/http';
import * as schema from './drizzle/schema';

async function main() {
  const db = drizzle(process.env.DATABASE_URL!, { schema });
  const tournaments = await db.query.tournaments.findMany();
  console.log('Tournaments:', JSON.stringify(tournaments, null, 2));
  
  const weeks = await db.query.weeks.findMany();
  console.log('Weeks:', JSON.stringify(weeks, null, 2));
}

main().catch(console.error);
