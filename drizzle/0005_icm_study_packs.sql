CREATE TABLE `icmPacks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(120) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `icmPacks_id` PRIMARY KEY(`id`),
	CONSTRAINT `icmPacks_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `icmSpots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`sourcePath` varchar(500) NOT NULL,
	`playerCount` int NOT NULL,
	`primaryCategory` varchar(80) NOT NULL,
	`heroPosition` varchar(10),
	`villainPosition` varchar(10),
	`heroStackBb` float,
	`villainStackBb` float,
	`stackSummaryJson` text,
	`tagsJson` text,
	`actionHint` varchar(80),
	`rawMetadataJson` text,
	`contentJson` text,
	`isCurated` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `icmSpots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `icmSpots` ADD CONSTRAINT `icmSpots_packId_icmPacks_id_fk` FOREIGN KEY (`packId`) REFERENCES `icmPacks`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `icm_pack_active_idx` ON `icmPacks` (`isActive`);
--> statement-breakpoint
CREATE INDEX `icm_spot_pack_idx` ON `icmSpots` (`packId`);
--> statement-breakpoint
CREATE INDEX `icm_spot_player_count_idx` ON `icmSpots` (`playerCount`);
--> statement-breakpoint
CREATE INDEX `icm_spot_category_idx` ON `icmSpots` (`primaryCategory`);
--> statement-breakpoint
CREATE INDEX `icm_spot_curated_idx` ON `icmSpots` (`isCurated`);
