CREATE TABLE `families` (
	`id` text PRIMARY KEY NOT NULL,
	`root_person_id` text NOT NULL,
	`owner_user_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `family_keys` (
	`token` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`family_id` text NOT NULL,
	`person_id` text,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE TABLE `family_members` (
	`family_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `persons` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`name` text NOT NULL,
	`clan` text,
	`origin` text,
	`claimed_user_id` text,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `relations` (
	`id` text PRIMARY KEY NOT NULL,
	`family_id` text NOT NULL,
	`type` text NOT NULL,
	`parent_id` text,
	`child_id` text,
	`role` text,
	`a` text,
	`b` text,
	FOREIGN KEY (`family_id`) REFERENCES `families`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);