CREATE TABLE `strategyNodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`version` varchar(80) NOT NULL,
	`stackBucket` int NOT NULL,
	`playerCount` int NOT NULL DEFAULT 9,
	`scenarioFamily` enum('rfi','facing_open_early','facing_open_middle','facing_open_late','facing_jam','sb_first_in','bb_vs_sb_open','bb_vs_sb_limp') NOT NULL,
	`heroPosition` varchar(10) NOT NULL,
	`villainPosition` varchar(10),
	`villainGroup` enum('early','middle','late'),
	`spotKey` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`sourceLabel` varchar(255) NOT NULL,
	`notes` text,
	`reviewed` boolean NOT NULL DEFAULT false,
	`structurallyComplete` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategyNodes_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE TABLE `strategyNodeRanges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nodeId` int NOT NULL,
	`action` enum('JAM','FOUR_BET','THREE_BET','RAISE','LIMP','CALL','CHECK','FOLD') NOT NULL,
	`rangeNotation` text NOT NULL,
	`priority` int NOT NULL,
	`notes` text,
	`reviewed` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyNodeRanges_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
CREATE TABLE `strategyTrainerAttempts` (
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
	`confidence` enum('knew_it','unsure','guessed'),
	`sessionId` varchar(64),
	`responseTimeMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `strategyTrainerAttempts_id` PRIMARY KEY(`id`)
);--> statement-breakpoint
ALTER TABLE `strategyNodeRanges` ADD CONSTRAINT `strategyNodeRanges_nodeId_strategyNodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `strategyNodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategyTrainerAttempts` ADD CONSTRAINT `strategyTrainerAttempts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `strategyTrainerAttempts` ADD CONSTRAINT `strategyTrainerAttempts_nodeId_strategyNodes_id_fk` FOREIGN KEY (`nodeId`) REFERENCES `strategyNodes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `strategy_node_lookup_idx` ON `strategyNodes` (`version`,`stackBucket`,`playerCount`,`scenarioFamily`,`heroPosition`,`villainPosition`);--> statement-breakpoint
CREATE INDEX `strategy_node_spot_idx` ON `strategyNodes` (`stackBucket`,`scenarioFamily`,`heroPosition`,`villainPosition`,`villainGroup`);--> statement-breakpoint
CREATE INDEX `strategy_node_active_idx` ON `strategyNodes` (`isActive`,`reviewed`);--> statement-breakpoint
CREATE INDEX `strategy_node_range_idx` ON `strategyNodeRanges` (`nodeId`,`priority`,`action`);--> statement-breakpoint
CREATE INDEX `strategy_trainer_attempt_user_idx` ON `strategyTrainerAttempts` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `strategy_trainer_attempt_node_idx` ON `strategyTrainerAttempts` (`nodeId`,`createdAt`);
