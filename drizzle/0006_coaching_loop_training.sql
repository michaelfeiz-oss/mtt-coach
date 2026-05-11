ALTER TABLE `trainerAttempts` ADD `canonicalSpotId` varchar(120);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `spotFamily` varchar(40) DEFAULT 'OPEN_RFI';--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `sourceStatus` enum('exact_source','simplified_population','derived') NOT NULL DEFAULT 'derived';--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `stackBb` int DEFAULT 15;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `heroPosition` varchar(10) DEFAULT 'BTN';--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `villainPosition` varchar(10);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `confidence` enum('knew_it','unsure','guessed');--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `drillPackId` varchar(80);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `leakFamilyId` varchar(80);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `sessionId` varchar(64);--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD `responseTimeMs` int;--> statement-breakpoint
UPDATE `trainerAttempts` `ta`
INNER JOIN `rangeCharts` `rc` ON `ta`.`chartId` = `rc`.`id`
SET
  `ta`.`spotFamily` = CASE
    WHEN `rc`.`spotGroup` = 'RFI' THEN 'OPEN_RFI'
    WHEN `rc`.`spotGroup` IN ('VS_UTG_RFI', 'VS_MP_RFI', 'VS_LP_RFI') THEN 'DEFEND_VS_RFI'
    WHEN `rc`.`spotGroup` = 'VS_3BET' THEN 'FACING_3BET'
    WHEN `rc`.`spotGroup` = 'BVB' THEN 'BLIND_VS_BLIND'
    ELSE 'OPEN_RFI'
  END,
  `ta`.`sourceStatus` = CASE
    WHEN `rc`.`spotGroup` = 'VS_3BET' AND `rc`.`stackDepth` IN (25, 40) THEN 'simplified_population'
    WHEN `rc`.`spotGroup` = 'BVB' AND `rc`.`stackDepth` IN (25, 40) THEN 'derived'
    ELSE 'exact_source'
  END,
  `ta`.`stackBb` = `rc`.`stackDepth`,
  `ta`.`heroPosition` = `rc`.`heroPosition`,
  `ta`.`villainPosition` = `rc`.`villainPosition`;--> statement-breakpoint
ALTER TABLE `trainerAttempts` MODIFY `spotFamily` varchar(40) NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` MODIFY `sourceStatus` enum('exact_source','simplified_population','derived') NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` MODIFY `stackBb` int NOT NULL;--> statement-breakpoint
ALTER TABLE `trainerAttempts` MODIFY `heroPosition` varchar(10) NOT NULL;--> statement-breakpoint
CREATE INDEX `trainer_spot_created_idx` ON `trainerAttempts` (`userId`,`canonicalSpotId`,`createdAt`);
