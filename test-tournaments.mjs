import { db } from './server/db.js';

async function main() {
  try {
    // Get all tournaments
    const tournaments = await db.query.tournaments.findMany();
    console.log('All tournaments:', tournaments);
    
    // Get all weeks
    const weeks = await db.query.weeks.findMany();
    console.log('All weeks:', weeks);
    
    // Get tournaments by week
    if (weeks.length > 0) {
      const week = weeks[0];
      console.log('Checking tournaments for week', week.id);
      const weekTournaments = await db.getTournamentsByWeek(week.id);
      console.log('Tournaments for week', week.id, ':', weekTournaments);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
