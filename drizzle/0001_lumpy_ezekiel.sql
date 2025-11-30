ALTER TABLE `studySessions` ADD `fromPlan` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `studySessions` ADD `planSlot` varchar(30);