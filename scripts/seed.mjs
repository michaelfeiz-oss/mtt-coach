import { drizzle } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';
import mysql from 'mysql2/promise';
import * as schema from '../drizzle/schema.js';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

console.log('🌱 Seeding database...');

// Get or create test user (you)
const [existingUser] = await db.select().from(schema.users).where(eq(schema.users.openId, process.env.OWNER_OPEN_ID)).limit(1);

let userId;
if (existingUser) {
  userId = existingUser.id;
  console.log(`✓ Using existing user: ${existingUser.name} (ID: ${userId})`);
} else {
  const [newUser] = await db.insert(schema.users).values({
    openId: process.env.OWNER_OPEN_ID,
    name: process.env.OWNER_NAME || 'Mike',
    email: 'mike@example.com',
    role: 'admin',
    timezone: 'Australia/Sydney',
    goalsJson: JSON.stringify({
      weeklyStudyHours: 7,
      weeklySessions: 5,
      weeklyTournaments: 2
    })
  });
  userId = newUser.insertId;
  console.log(`✓ Created test user: ${process.env.OWNER_NAME} (ID: ${userId})`);
}

// Create Week 1 (current week - Nov 25-Dec 1, 2025)
const week1Start = new Date('2025-11-25T00:00:00+11:00');
const week1End = new Date('2025-12-01T23:59:59+11:00');

const [week1] = await db.insert(schema.weeks).values({
  userId,
  startDate: week1Start,
  endDate: week1End,
  targetStudyHours: 7,
  targetSessions: 5,
  targetTournaments: 2,
  summaryNotes: 'Focused on ICM spots and BB defence this week',
  score: 7
});
const week1Id = week1.insertId;
console.log(`✓ Created Week 1 (Nov 25 - Dec 1)`);

// Create Week 2 (previous week - Nov 18-24, 2025)
const week2Start = new Date('2025-11-18T00:00:00+11:00');
const week2End = new Date('2025-11-24T23:59:59+11:00');

const [week2] = await db.insert(schema.weeks).values({
  userId,
  startDate: week2Start,
  endDate: week2End,
  targetStudyHours: 7,
  targetSessions: 5,
  targetTournaments: 1,
  summaryNotes: 'Good progress on postflop play',
  score: 8
});
const week2Id = week2.insertId;
console.log(`✓ Created Week 2 (Nov 18 - 24)`);

// Create Study Sessions
const sessions = [
  {
    userId,
    weekId: week1Id,
    date: new Date('2025-11-26T19:00:00+11:00'),
    type: 'HAND_REVIEW',
    durationMinutes: 90,
    resourceUsed: 'APT + ICMIZER',
    handsReviewedCount: 12,
    drillsCompletedCount: 0,
    accuracyPercent: null,
    keyTakeaways: 'Need to tighten up my 3bet calling range from BB vs BTN'
  },
  {
    userId,
    weekId: week1Id,
    date: new Date('2025-11-27T20:30:00+11:00'),
    type: 'ICM',
    durationMinutes: 60,
    resourceUsed: 'ICMIZER',
    handsReviewedCount: 0,
    drillsCompletedCount: 15,
    accuracyPercent: 78.5,
    keyTakeaways: 'ICM pressure at FT bubble - need to be more aggressive with medium stacks'
  },
  {
    userId,
    weekId: week2Id,
    date: new Date('2025-11-20T18:00:00+11:00'),
    type: 'RANGE_TRAINING',
    durationMinutes: 45,
    resourceUsed: 'APT',
    handsReviewedCount: 0,
    drillsCompletedCount: 20,
    accuracyPercent: 85.0,
    keyTakeaways: 'EP opening ranges solidified'
  }
];

for (const session of sessions) {
  await db.insert(schema.studySessions).values(session);
}
console.log(`✓ Created ${sessions.length} study sessions`);

// Create Tournaments
const tournaments = [
  {
    userId,
    weekId: week1Id,
    date: new Date('2025-11-28T19:00:00+11:00'),
    venue: 'Kings Poker',
    name: 'Thursday Night $220',
    buyIn: 220,
    startingStack: 20000,
    fieldSize: 45,
    reEntries: 0,
    finalPosition: 8,
    prize: 450,
    netResult: 230, // 450 - 220
    stageReached: 'LATE',
    selfRating: 7,
    mentalRating: 8,
    notesOverall: 'Played solid, got unlucky with AA vs KK at final table'
  },
  {
    userId,
    weekId: week2Id,
    date: new Date('2025-11-22T18:30:00+11:00'),
    venue: 'APL',
    name: 'APL Friday $150',
    buyIn: 150,
    startingStack: 15000,
    fieldSize: 62,
    reEntries: 1,
    finalPosition: 15,
    prize: 0,
    netResult: -300, // 0 - (150 * 2)
    stageReached: 'MID',
    selfRating: 5,
    mentalRating: 6,
    notesOverall: 'Tilted after bad beat, made some questionable calls'
  }
];

const tournamentIds = [];
for (const tournament of tournaments) {
  const [result] = await db.insert(schema.tournaments).values(tournament);
  tournamentIds.push(result.insertId);
}
console.log(`✓ Created ${tournaments.length} tournaments`);

// Create Leaks
const leaks = [
  {
    userId,
    name: 'Overfolding BB vs BTN',
    category: 'PREFLOP',
    description: 'Folding too often from BB when BTN opens, especially vs small sizes',
    status: 'ACTIVE',
    lastSeenAt: new Date('2025-11-28T21:30:00+11:00'),
    handsLinkedCount: 0
  },
  {
    userId,
    name: 'Check-calling too wide on dry flops',
    category: 'POSTFLOP',
    description: 'Not folding enough to c-bets on A-high and K-high boards',
    status: 'IMPROVING',
    lastSeenAt: new Date('2025-11-26T20:15:00+11:00'),
    handsLinkedCount: 0
  },
  {
    userId,
    name: 'ICM overfolding at FT bubble',
    category: 'ICM',
    description: 'Too passive with 15-25bb at FT bubble, missing +EV shoves',
    status: 'ACTIVE',
    lastSeenAt: new Date('2025-11-28T22:00:00+11:00'),
    handsLinkedCount: 0
  }
];

const leakIds = [];
for (const leak of leaks) {
  const [result] = await db.insert(schema.leaks).values(leak);
  leakIds.push(result.insertId);
}
console.log(`✓ Created ${leaks.length} leaks`);

// Create Hands
const hands = [
  {
    userId,
    tournamentId: tournamentIds[0],
    heroPosition: 'BB',
    heroHand: 'AhQs',
    boardRunout: 'Kd9h3c 7s 2d',
    effectiveStackBb: 18.5,
    spr: 3.2,
    streetDataJson: JSON.stringify({
      table: { blindLevel: '400/800/800', anteType: 'BB', numPlayers: 8 },
      players: [
        { seat: 1, position: 'BTN', stackBb: 25, isHero: false },
        { seat: 2, position: 'SB', stackBb: 12, isHero: false },
        { seat: 3, position: 'BB', stackBb: 18.5, isHero: true }
      ],
      streets: {
        preflop: {
          potBbStart: 2.5,
          actions: [
            { order: 1, actorPosition: 'BTN', action: 'raise', sizeBb: 2.2 },
            { order: 2, actorPosition: 'SB', action: 'fold' },
            { order: 3, actorPosition: 'BB', action: 'call', sizeBb: 1.4, isHero: true }
          ]
        },
        flop: {
          board: 'Kd9h3c',
          potBbStart: 5.4,
          actions: [
            { order: 1, actorPosition: 'BB', action: 'check', isHero: true },
            { order: 2, actorPosition: 'BTN', action: 'bet', sizeBb: 2.7 },
            { order: 3, actorPosition: 'BB', action: 'fold', isHero: true }
          ]
        }
      },
      result: { finalPotBb: 8.1, heroShowdown: false, heroWon: false }
    }),
    spotType: 'SINGLE_RAISED_POT',
    heroDecisionPreflop: 'call',
    heroDecisionFlop: 'fold',
    reviewed: true,
    evalSource: 'SOLVER',
    mistakeStreet: 'FLOP',
    mistakeSeverity: 2,
    evDiffBb: -1.8,
    tagsJson: JSON.stringify(['BB_DEFENCE', 'OVERFOLD']),
    lesson: 'Should have called flop c-bet with TPGK + backdoor flush draw. Solver calls 65% here.'
  },
  {
    userId,
    tournamentId: tournamentIds[0],
    heroPosition: 'BTN',
    heroHand: 'JcTs',
    boardRunout: '8h7d2c Qh 5s',
    effectiveStackBb: 22.0,
    spr: 4.5,
    streetDataJson: JSON.stringify({
      table: { blindLevel: '300/600/600', anteType: 'BB', numPlayers: 7 },
      streets: {
        preflop: {
          potBbStart: 2.5,
          actions: [
            { order: 1, actorPosition: 'BTN', action: 'raise', sizeBb: 2.5, isHero: true },
            { order: 2, actorPosition: 'SB', action: 'fold' },
            { order: 3, actorPosition: 'BB', action: 'call', sizeBb: 1.5 }
          ]
        },
        flop: {
          board: '8h7d2c',
          potBbStart: 6.0,
          actions: [
            { order: 1, actorPosition: 'BB', action: 'check' },
            { order: 2, actorPosition: 'BTN', action: 'bet', sizeBb: 3.0, isHero: true },
            { order: 3, actorPosition: 'BB', action: 'call', sizeBb: 3.0 }
          ]
        },
        turn: {
          board: 'Qh',
          potBbStart: 12.0,
          actions: [
            { order: 1, actorPosition: 'BB', action: 'check' },
            { order: 2, actorPosition: 'BTN', action: 'check', isHero: true }
          ]
        },
        river: {
          board: '5s',
          potBbStart: 12.0,
          actions: [
            { order: 1, actorPosition: 'BB', action: 'check' },
            { order: 2, actorPosition: 'BTN', action: 'check', isHero: true }
          ]
        }
      },
      result: { finalPotBb: 12.0, heroShowdown: true, heroWon: false }
    }),
    spotType: 'SINGLE_RAISED_POT',
    heroDecisionPreflop: 'raise',
    heroDecisionFlop: 'bet',
    heroDecisionTurn: 'check',
    heroDecisionRiver: 'check',
    reviewed: true,
    evalSource: 'SELF',
    mistakeStreet: null,
    mistakeSeverity: 0,
    evDiffBb: 0,
    tagsJson: JSON.stringify(['STANDARD']),
    lesson: 'Standard line, no major mistakes'
  },
  {
    userId,
    tournamentId: tournamentIds[1],
    heroPosition: 'CO',
    heroHand: 'AsKd',
    boardRunout: 'Ah9s4h 2c Kh',
    effectiveStackBb: 15.0,
    spr: 2.8,
    streetDataJson: JSON.stringify({
      table: { blindLevel: '500/1000/1000', anteType: 'BB', numPlayers: 6 },
      streets: {
        preflop: {
          potBbStart: 2.5,
          actions: [
            { order: 1, actorPosition: 'CO', action: 'raise', sizeBb: 2.5, isHero: true },
            { order: 2, actorPosition: 'BTN', action: '3bet', sizeBb: 7.0 },
            { order: 3, actorPosition: 'CO', action: 'call', sizeBb: 4.5, isHero: true }
          ]
        },
        flop: {
          board: 'Ah9s4h',
          potBbStart: 16.5,
          actions: [
            { order: 1, actorPosition: 'CO', action: 'check', isHero: true },
            { order: 2, actorPosition: 'BTN', action: 'allin', sizeBb: 8.0 },
            { order: 3, actorPosition: 'CO', action: 'call', sizeBb: 8.0, isHero: true }
          ]
        }
      },
      result: { finalPotBb: 32.5, heroShowdown: true, heroWon: true }
    }),
    spotType: '3BET_POT',
    heroDecisionPreflop: 'call',
    heroDecisionFlop: 'call',
    reviewed: false,
    evalSource: null,
    mistakeStreet: null,
    mistakeSeverity: 0,
    evDiffBb: null,
    tagsJson: JSON.stringify(['3BET_POT', 'ALLIN']),
    lesson: null
  }
];

const handIds = [];
for (const hand of hands) {
  const [result] = await db.insert(schema.hands).values(hand);
  handIds.push(result.insertId);
}
console.log(`✓ Created ${hands.length} hands`);

// Link hands to leaks
await db.insert(schema.handLeaks).values([
  { handId: handIds[0], leakId: leakIds[0] }, // AhQs hand → BB overfold leak
  { handId: handIds[0], leakId: leakIds[1] }  // AhQs hand → check-call too wide leak
]);
console.log(`✓ Linked hands to leaks`);

// Update leak counts
await db.update(schema.leaks)
  .set({ handsLinkedCount: 2 })
  .where(eq(schema.leaks.id, leakIds[0]));

await db.update(schema.leaks)
  .set({ handsLinkedCount: 1 })
  .where(eq(schema.leaks.id, leakIds[1]));

console.log('✅ Seeding complete!');
console.log('');
console.log('Summary:');
console.log(`  - 1 user (${process.env.OWNER_NAME})`);
console.log(`  - 2 weeks`);
console.log(`  - 3 study sessions`);
console.log(`  - 2 tournaments`);
console.log(`  - 3 hands`);
console.log(`  - 3 leaks`);

await connection.end();
