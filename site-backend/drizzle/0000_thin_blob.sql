CREATE TABLE `rehearsals` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`title` text NOT NULL,
	`scenario` text NOT NULL,
	`fear` text NOT NULL,
	`action` text NOT NULL,
	`tension_before` integer NOT NULL,
	`predicted_impact` integer NOT NULL,
	`readiness_before` integer NOT NULL,
	`readiness_after` integer NOT NULL,
	`outcome` text,
	`impact` integer
);
--> statement-breakpoint
CREATE INDEX `rehearsals_user_created_idx` ON `rehearsals` (`user_id`,`created_at`);