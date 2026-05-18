CREATE TABLE `userNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`category` varchar(80) NOT NULL DEFAULT 'general',
	`title` varchar(255),
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `userNotes` ADD CONSTRAINT `userNotes_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `user_notes_user_created_idx` ON `userNotes` (`userId`,`createdAt`);
