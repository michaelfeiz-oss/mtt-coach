CREATE TABLE `studyPlanBlocks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`blockNumber` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`goal` text,
	`weekStart` int NOT NULL,
	`weekEnd` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyPlanBlocks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyPlanTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`studyPlanWeekId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`studyType` enum('RANGE_TRAINING','HAND_REVIEW','ICM','EXPLOIT_LAB','DEEP_DIVE','MENTAL_GAME','LIGHT_REVIEW') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`tools` text,
	`focusPoints` text,
	`durationMinutes` int NOT NULL DEFAULT 45,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyPlanTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `studyPlanWeeks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`blockId` int NOT NULL,
	`weekNumber` int NOT NULL,
	`theme` varchar(255) NOT NULL,
	`focusAreas` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `studyPlanWeeks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `studyPlanBlocks` ADD CONSTRAINT `studyPlanBlocks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyPlanTasks` ADD CONSTRAINT `studyPlanTasks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyPlanTasks` ADD CONSTRAINT `studyPlanTasks_studyPlanWeekId_studyPlanWeeks_id_fk` FOREIGN KEY (`studyPlanWeekId`) REFERENCES `studyPlanWeeks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyPlanWeeks` ADD CONSTRAINT `studyPlanWeeks_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `studyPlanWeeks` ADD CONSTRAINT `studyPlanWeeks_blockId_studyPlanBlocks_id_fk` FOREIGN KEY (`blockId`) REFERENCES `studyPlanBlocks`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `user_block_idx` ON `studyPlanBlocks` (`userId`,`blockNumber`);--> statement-breakpoint
CREATE INDEX `week_task_idx` ON `studyPlanTasks` (`studyPlanWeekId`,`dayOfWeek`);--> statement-breakpoint
CREATE INDEX `user_week_idx` ON `studyPlanWeeks` (`userId`,`weekNumber`);