ALTER TABLE `hands` MODIFY COLUMN `spotType` enum('SINGLE_RAISED_POT','3BET_POT','BvB','ICM_SPOT','LIMPED_POT');--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `canonicalSpotId` varchar(120);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `spotFamily` varchar(40) NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `sourceStatus` enum('exact_source','simplified_population','derived') NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `stackBb` int NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `heroPosition` varchar(10) NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `villainPosition` varchar(10);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `confidence` enum('knew_it','unsure','guessed');--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `drillPackId` varchar(80);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `leakFamilyId` varchar(80);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `sessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `responseTimeMs` int;--> statement-breakpoint
CREATE INDEX `trainer_spot_created_idx` ON `trainerAttempts` (`userId`,`canonicalSpotId`,`createdAt`);--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `heroCard1`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `heroCard2`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `handClass`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `exactSuitsKnown`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `actualStackBB`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `openerPosition`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `villainPosition`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `villainType`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `rangeRead`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `tournamentStage`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `preflopDecision`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `actionsJson`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `boardJson`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `leakFamilyId`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `confidence`;--> statement-breakpoint
ALTER TABLE `hands` DROP COLUMN `reviewStatus`;