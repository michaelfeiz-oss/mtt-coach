CREATE TABLE `handLeaks` (
	`handId` int NOT NULL,
	`leakId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `handLeaks_handId_leakId_pk` PRIMARY KEY(`handId`,`leakId`)
);
--> statement-breakpoint
CREATE TABLE `hands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tournamentId` int,
	`studySessionId` int,
	`heroPosition` varchar(10),
	`heroHand` varchar(10),
	`boardRunout` varchar(50),
	`effectiveStackBb` float,
	`spr` float,
	`streetDataJson` text,
	`spotType` enum('SINGLE_RAISED_POT','3BET_POT','BvB','ICM_SPOT','LIMPED_POT'),
	`heroDecisionPreflop` varchar(50),
	`heroDecisionFlop` varchar(50),
	`heroDecisionTurn` varchar(50),
	`heroDecisionRiver` varchar(50),
	`reviewed` boolean NOT NULL DEFAULT false,
	`evalSource` enum('SOLVER','COACH','SELF'),
	`mistakeStreet` enum('PREFLOP','FLOP','TURN','RIVER'),
	`mistakeSeverity` int NOT NULL DEFAULT 0,
	`evDiffBb` float,
	`tagsJson` text,
	`lesson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leaks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`category` enum('PREFLOP','POSTFLOP','ICM','MENTAL','EXPLOIT') NOT NULL,
	`description` text,
	`status` enum('ACTIVE','IMPROVING','FIXED') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSeenAt` timestamp,
	`handsLinkedCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `leaks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studySessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekId` int NOT NULL,
	`date` timestamp NOT NULL,
	`type` enum('RANGE_TRAINING','HAND_REVIEW','ICM','EXPLOIT_LAB','DEEP_DIVE','MENTAL_GAME','LIGHT_REVIEW') NOT NULL,
	`durationMinutes` int NOT NULL,
	`resourceUsed` varchar(255),
	`handsReviewedCount` int NOT NULL DEFAULT 0,
	`drillsCompletedCount` int NOT NULL DEFAULT 0,
	`accuracyPercent` float,
	`keyTakeaways` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studySessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`weekId` int NOT NULL,
	`date` timestamp NOT NULL,
	`venue` varchar(255),
	`name` varchar(255),
	`buyIn` float NOT NULL,
	`startingStack` int,
	`fieldSize` int,
	`reEntries` int NOT NULL DEFAULT 0,
	`finalPosition` int,
	`prize` float NOT NULL DEFAULT 0,
	`netResult` float NOT NULL,
	`stageReached` enum('EARLY','MID','LATE','FT'),
	`selfRating` int,
	`mentalRating` int,
	`notesOverall` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tournaments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`timezone` varchar(50) NOT NULL DEFAULT 'Australia/Sydney',
	`goalsJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `weeks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`targetStudyHours` int NOT NULL DEFAULT 7,
	`targetSessions` int NOT NULL DEFAULT 7,
	`targetTournaments` int NOT NULL DEFAULT 1,
	`summaryNotes` text,
	`score` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weeks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `handLeaks` ADD CONSTRAINT `handLeaks_handId_hands_id_fk` FOREIGN KEY (`handId`) REFERENCES `hands`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `handLeaks` ADD CONSTRAINT `handLeaks_leakId_leaks_id_fk` FOREIGN KEY (`leakId`) REFERENCES `leaks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hands` ADD CONSTRAINT `hands_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hands` ADD CONSTRAINT `hands_tournamentId_tournaments_id_fk` FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `hands` ADD CONSTRAINT `hands_studySessionId_studySessions_id_fk` FOREIGN KEY (`studySessionId`) REFERENCES `studySessions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leaks` ADD CONSTRAINT `leaks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studySessions` ADD CONSTRAINT `studySessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studySessions` ADD CONSTRAINT `studySessions_weekId_weeks_id_fk` FOREIGN KEY (`weekId`) REFERENCES `weeks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tournaments` ADD CONSTRAINT `tournaments_weekId_weeks_id_fk` FOREIGN KEY (`weekId`) REFERENCES `weeks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `weeks` ADD CONSTRAINT `weeks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `leak_idx` ON `handLeaks` (`leakId`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `hands` (`userId`);--> statement-breakpoint
CREATE INDEX `tournament_idx` ON `hands` (`tournamentId`);--> statement-breakpoint
CREATE INDEX `reviewed_idx` ON `hands` (`reviewed`);--> statement-breakpoint
CREATE INDEX `user_idx` ON `leaks` (`userId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leaks` (`status`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `studySessions` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `user_date_idx` ON `tournaments` (`userId`,`date`);--> statement-breakpoint
CREATE INDEX `user_week_idx` ON `weeks` (`userId`,`startDate`);