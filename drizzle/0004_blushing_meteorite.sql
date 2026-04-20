CREATE TABLE `rangeChartActions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chartId` int NOT NULL,
	`handCode` varchar(4) NOT NULL,
	`primaryAction` enum('FOLD','RAISE','CALL','THREE_BET','JAM','LIMP','CHECK') NOT NULL,
	`mixJson` text,
	`weightPercent` float,
	`colorToken` varchar(30),
	`note` text,
	CONSTRAINT `rangeChartActions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rangeCharts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`title` varchar(255) NOT NULL,
	`stackDepth` int NOT NULL,
	`spotGroup` enum('RFI','VS_UTG_RFI','VS_MP_RFI','VS_LP_RFI','VS_3BET','BVB') NOT NULL,
	`spotKey` varchar(100) NOT NULL,
	`heroPosition` varchar(10) NOT NULL,
	`villainPosition` varchar(10),
	`sourceLabel` varchar(255),
	`notesJson` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rangeCharts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trainerAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chartId` int NOT NULL,
	`handCode` varchar(4) NOT NULL,
	`selectedAction` varchar(20) NOT NULL,
	`correctAction` varchar(20) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trainerAttempts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `rangeChartActions` ADD CONSTRAINT `rangeChartActions_chartId_rangeCharts_id_fk` FOREIGN KEY (`chartId`) REFERENCES `rangeCharts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `rangeCharts` ADD CONSTRAINT `rangeCharts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD CONSTRAINT `trainerAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `trainerAttempts` ADD CONSTRAINT `trainerAttempts_chartId_rangeCharts_id_fk` FOREIGN KEY (`chartId`) REFERENCES `rangeCharts`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chart_hand_idx` ON `rangeChartActions` (`chartId`,`handCode`);--> statement-breakpoint
CREATE INDEX `spot_idx` ON `rangeCharts` (`stackDepth`,`spotGroup`,`spotKey`);--> statement-breakpoint
CREATE INDEX `range_user_idx` ON `rangeCharts` (`userId`);--> statement-breakpoint
CREATE INDEX `trainer_user_created_idx` ON `trainerAttempts` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `trainer_chart_created_idx` ON `trainerAttempts` (`chartId`,`createdAt`);