ALTER TABLE `hands` MODIFY COLUMN `spotType` enum('SINGLE_RAISED_POT','3BET_POT','BvB','ICM_SPOT','LIMPED_POT','RFI','DEFEND_VS_RFI','THREE_BET','FACING_3BET','BVB','LIMP_ISO','FOUR_BET_JAM','OTHER_PREFLOP');--> statement-breakpoint
ALTER TABLE `hands` ADD `heroCard1` varchar(4);--> statement-breakpoint
ALTER TABLE `hands` ADD `heroCard2` varchar(4);--> statement-breakpoint
ALTER TABLE `hands` ADD `handClass` varchar(10);--> statement-breakpoint
ALTER TABLE `hands` ADD `exactSuitsKnown` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `hands` ADD `actualStackBB` float;--> statement-breakpoint
ALTER TABLE `hands` ADD `openerPosition` varchar(10);--> statement-breakpoint
ALTER TABLE `hands` ADD `villainPosition` varchar(10);--> statement-breakpoint
ALTER TABLE `hands` ADD `villainType` varchar(50);--> statement-breakpoint
ALTER TABLE `hands` ADD `rangeRead` varchar(100);--> statement-breakpoint
ALTER TABLE `hands` ADD `tournamentStage` varchar(20);--> statement-breakpoint
ALTER TABLE `hands` ADD `preflopDecision` varchar(30);--> statement-breakpoint
ALTER TABLE `hands` ADD `actionsJson` text;--> statement-breakpoint
ALTER TABLE `hands` ADD `boardJson` text;--> statement-breakpoint
ALTER TABLE `hands` ADD `leakFamilyId` varchar(100);--> statement-breakpoint
ALTER TABLE `hands` ADD `confidence` enum('LOW','MEDIUM','HIGH');--> statement-breakpoint
ALTER TABLE `hands` ADD `reviewStatus` enum('DRAFT','NEEDS_REVIEW','REVIEWED') DEFAULT 'NEEDS_REVIEW' NOT NULL;