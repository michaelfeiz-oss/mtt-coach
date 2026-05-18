CREATE TABLE IF NOT EXISTS `strategyNodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(80) NOT NULL,
	`stackBucket` int NOT NULL,
	`playerCount` int NOT NULL DEFAULT 9,
	`scenarioFamily` varchar(40) NOT NULL,
	`heroPosition` varchar(10) NOT NULL,
	`villainPosition` varchar(10),
	`villainGroup` varchar(16),
	`spotKey` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceLabel` varchar(255) NOT NULL,
	`notes` text,
	`reviewed` boolean NOT NULL DEFAULT false,
	`structurallyComplete` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyNodes_id` PRIMARY KEY(`id`),
	KEY `strategy_node_lookup_idx` (`version`,`stackBucket`,`playerCount`,`scenarioFamily`,`heroPosition`,`villainPosition`),
	KEY `strategy_node_spot_idx` (`stackBucket`,`scenarioFamily`,`heroPosition`,`villainPosition`,`villainGroup`),
	KEY `strategy_node_active_idx` (`isActive`,`reviewed`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `strategyNodeRanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` int NOT NULL,
	`action` varchar(20) NOT NULL,
	`rangeNotation` text NOT NULL,
	`priority` int NOT NULL,
	`notes` text,
	`reviewed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyNodeRanges_id` PRIMARY KEY(`id`),
	KEY `strategy_node_range_idx` (`nodeId`,`priority`,`action`),
	CONSTRAINT `strategyNodeRanges_nodeId_strategyNodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `strategyNodes`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `strategyTrainerAttempts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`nodeId` int NOT NULL,
	`stackBucket` int NOT NULL,
	`scenarioFamily` varchar(40) NOT NULL,
	`heroPosition` varchar(10) NOT NULL,
	`villainPosition` varchar(10),
	`villainGroup` varchar(16),
	`handCode` varchar(4) NOT NULL,
	`selectedAction` varchar(20) NOT NULL,
	`correctAction` varchar(20) NOT NULL,
	`isCorrect` boolean NOT NULL,
	`confidence` varchar(20),
	`sessionId` varchar(64),
	`responseTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyTrainerAttempts_id` PRIMARY KEY(`id`),
	KEY `strategy_trainer_attempt_user_idx` (`userId`,`createdAt`),
	KEY `strategy_trainer_attempt_node_idx` (`nodeId`,`createdAt`),
	CONSTRAINT `strategyTrainerAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action,
	CONSTRAINT `strategyTrainerAttempts_nodeId_strategyNodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `strategyNodes`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `strategyChartStatus` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeKey` varchar(120) NOT NULL,
	`spotType` varchar(40) NOT NULL,
	`stackBb` int NOT NULL,
	`position` varchar(10) NOT NULL,
	`villainPosition` varchar(10),
	`anteType` varchar(16) NOT NULL DEFAULT 'BBA',
	`format` varchar(16) NOT NULL DEFAULT 'MTT',
	`title` varchar(255) NOT NULL,
	`description` text,
	`allowedActionsJson` text NOT NULL,
	`status` varchar(20) NOT NULL,
	`activeSnapshotId` int,
	`seedProtected` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyChartStatus_id` PRIMARY KEY(`id`),
	CONSTRAINT `strategyChartStatus_nodeKey_unique` UNIQUE(`nodeKey`),
	KEY `strategy_chart_status_node_key_idx` (`nodeKey`),
	KEY `strategy_chart_status_idx` (`status`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `strategyChartSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chartId` int NOT NULL,
	`nodeKey` varchar(120) NOT NULL,
	`version` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`allowedActionsJson` text NOT NULL,
	`cellsJson` text NOT NULL,
	`checksum` varchar(128) NOT NULL,
	`notes` text,
	`createdBy` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyChartSnapshots_id` PRIMARY KEY(`id`),
	KEY `strategy_chart_snapshot_node_version_idx` (`nodeKey`,`version`),
	KEY `strategy_chart_snapshot_chart_idx` (`chartId`),
	CONSTRAINT `strategyChartSnapshots_chartId_strategyChartStatus_id_fk` FOREIGN KEY (`chartId`) REFERENCES `strategyChartStatus`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `strategyChartEdits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chartId` int,
	`nodeKey` varchar(120) NOT NULL,
	`actionType` varchar(80),
	`allowedActionsJson` text,
	`cellsJson` text,
	`detailsJson` text,
	`notes` text,
	`createdBy` varchar(255),
	`updatedBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyChartEdits_id` PRIMARY KEY(`id`),
	KEY `strategy_chart_edit_node_idx` (`nodeKey`),
	KEY `strategy_chart_edit_chart_idx` (`chartId`),
	CONSTRAINT `strategyChartEdits_chartId_strategyChartStatus_id_fk` FOREIGN KEY (`chartId`) REFERENCES `strategyChartStatus`(`id`) ON DELETE cascade ON UPDATE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `strategyChartImportExports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` varchar(20) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`chartCount` int NOT NULL DEFAULT 0,
	`checksum` varchar(128),
	`notes` text,
	`payloadJson` text,
	`createdBy` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyChartImportExports_id` PRIMARY KEY(`id`),
	KEY `strategy_chart_import_export_type_idx` (`type`,`createdAt`)
);
