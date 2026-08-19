CREATE TABLE `documentArtifacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`artifactType` enum('original_pdf','extracted_text','page_image') NOT NULL,
	`storageKey` varchar(1024) NOT NULL,
	`contentHash` varchar(128),
	`mimeType` varchar(160),
	`pageNumber` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentArtifacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentChunks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`chunkIndex` int NOT NULL,
	`content` text NOT NULL,
	`pageStart` int NOT NULL,
	`pageEnd` int NOT NULL,
	`tokenCount` int NOT NULL,
	`contentHash` varchar(128) NOT NULL,
	`embeddingJson` json,
	`vectorDimensions` int,
	`lexicalTerms` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentChunks_id` PRIMARY KEY(`id`),
	CONSTRAINT `chunks_document_index_unique` UNIQUE(`documentId`,`chunkIndex`)
);
--> statement-breakpoint
CREATE TABLE `documentReferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceDocumentId` int NOT NULL,
	`candidateDocumentId` int,
	`referencedNumber` varchar(512),
	`referencedDate` timestamp,
	`evidenceText` text NOT NULL,
	`pageStart` int NOT NULL,
	`pageEnd` int NOT NULL,
	`resolutionState` enum('unresolved','matched','ambiguous','rejected') NOT NULL DEFAULT 'unresolved',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentReferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentRelationships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceDocumentId` int NOT NULL,
	`targetDocumentId` int NOT NULL,
	`relationshipType` enum('AMENDS','SUPERSEDES','CORRIGES','REPLACES','REVOKES','EXTENDS','REFERENCES','CONTINUES') NOT NULL,
	`scope` text,
	`confidence` float NOT NULL,
	`extractionMethod` enum('deterministic','llm','human') NOT NULL,
	`verificationState` enum('VERIFIED','AMBIGUOUS','UNVERIFIED','REJECTED') NOT NULL DEFAULT 'UNVERIFIED',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documentRelationships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schemeId` int NOT NULL,
	`title` varchar(1024) NOT NULL,
	`documentNumber` varchar(512),
	`issuingAuthority` varchar(512) NOT NULL,
	`documentType` enum('guideline','amendment','clarification','corrigendum','notification','order','other') NOT NULL,
	`issuedOn` timestamp,
	`effectiveFrom` timestamp,
	`effectiveTo` timestamp,
	`sourceUrl` varchar(2048) NOT NULL,
	`storageKey` varchar(1024),
	`extractedTextStorageKey` varchar(1024),
	`documentHash` varchar(128) NOT NULL,
	`pageCount` int,
	`isOfficial` boolean NOT NULL DEFAULT false,
	`processingState` enum('discovered','stored','extracted','indexed','failed') NOT NULL DEFAULT 'discovered',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`),
	CONSTRAINT `documents_hash_unique` UNIQUE(`documentHash`)
);
--> statement-breakpoint
CREATE TABLE `evaluationCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`schemeId` int NOT NULL,
	`question` text NOT NULL,
	`expectedDocumentIds` json NOT NULL,
	`expectedRelationshipTypes` json NOT NULL,
	`expectedCitationDocumentIds` json NOT NULL,
	`expectedVerificationState` enum('VERIFIED','AMBIGUOUS','UNVERIFIED') NOT NULL,
	`expectedAnswerNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationCases_id` PRIMARY KEY(`id`),
	CONSTRAINT `evaluation_cases_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `evaluationRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`evaluationCaseId` int NOT NULL,
	`mode` enum('baseline','dhruv') NOT NULL,
	`retrievedDocumentIds` json NOT NULL,
	`selectedDocumentIds` json NOT NULL,
	`answer` text,
	`citations` json NOT NULL,
	`metrics` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evaluationRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ingestionRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int,
	`sourceUrl` varchar(2048) NOT NULL,
	`state` enum('queued','processing','completed','failed') NOT NULL DEFAULT 'queued',
	`steps` json NOT NULL,
	`errorSummary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `ingestionRuns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lineageAssertions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`schemeId` int NOT NULL,
	`documentId` int NOT NULL,
	`status` enum('CURRENT_VERIFIED','HISTORICAL','AMBIGUOUS','UNVERIFIED') NOT NULL,
	`scope` text,
	`confidence` float NOT NULL,
	`basis` json NOT NULL,
	`computedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lineageAssertions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `relationshipEvidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`relationshipId` int NOT NULL,
	`documentId` int NOT NULL,
	`evidenceText` text NOT NULL,
	`normalizedEvidenceText` text NOT NULL,
	`pageStart` int NOT NULL,
	`pageEnd` int NOT NULL,
	`sourceOffsetStart` int,
	`sourceOffsetEnd` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `relationshipEvidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `schemes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`name` varchar(512) NOT NULL,
	`description` text,
	`issuingDepartment` varchar(512),
	`coverageStatus` enum('supported','planned','archived') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `schemes_id` PRIMARY KEY(`id`),
	CONSTRAINT `schemes_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `documentArtifacts` ADD CONSTRAINT `documentArtifacts_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentChunks` ADD CONSTRAINT `documentChunks_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentReferences` ADD CONSTRAINT `documentReferences_sourceDocumentId_documents_id_fk` FOREIGN KEY (`sourceDocumentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentReferences` ADD CONSTRAINT `documentReferences_candidateDocumentId_documents_id_fk` FOREIGN KEY (`candidateDocumentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentRelationships` ADD CONSTRAINT `documentRelationships_sourceDocumentId_documents_id_fk` FOREIGN KEY (`sourceDocumentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documentRelationships` ADD CONSTRAINT `documentRelationships_targetDocumentId_documents_id_fk` FOREIGN KEY (`targetDocumentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `documents` ADD CONSTRAINT `documents_schemeId_schemes_id_fk` FOREIGN KEY (`schemeId`) REFERENCES `schemes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluationCases` ADD CONSTRAINT `evaluationCases_schemeId_schemes_id_fk` FOREIGN KEY (`schemeId`) REFERENCES `schemes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `evaluationRuns` ADD CONSTRAINT `evaluationRuns_evaluationCaseId_evaluationCases_id_fk` FOREIGN KEY (`evaluationCaseId`) REFERENCES `evaluationCases`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `ingestionRuns` ADD CONSTRAINT `ingestionRuns_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lineageAssertions` ADD CONSTRAINT `lineageAssertions_schemeId_schemes_id_fk` FOREIGN KEY (`schemeId`) REFERENCES `schemes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lineageAssertions` ADD CONSTRAINT `lineageAssertions_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationshipEvidence` ADD CONSTRAINT `relationshipEvidence_relationshipId_documentRelationships_id_fk` FOREIGN KEY (`relationshipId`) REFERENCES `documentRelationships`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `relationshipEvidence` ADD CONSTRAINT `relationshipEvidence_documentId_documents_id_fk` FOREIGN KEY (`documentId`) REFERENCES `documents`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `artifacts_document_type_idx` ON `documentArtifacts` (`documentId`,`artifactType`);--> statement-breakpoint
CREATE INDEX `chunks_document_pages_idx` ON `documentChunks` (`documentId`,`pageStart`);--> statement-breakpoint
CREATE INDEX `references_source_idx` ON `documentReferences` (`sourceDocumentId`);--> statement-breakpoint
CREATE INDEX `relationships_source_idx` ON `documentRelationships` (`sourceDocumentId`);--> statement-breakpoint
CREATE INDEX `relationships_target_idx` ON `documentRelationships` (`targetDocumentId`);--> statement-breakpoint
CREATE INDEX `documents_scheme_issued_idx` ON `documents` (`schemeId`,`issuedOn`);--> statement-breakpoint
CREATE INDEX `documents_number_idx` ON `documents` (`documentNumber`);--> statement-breakpoint
CREATE INDEX `evaluation_runs_case_mode_idx` ON `evaluationRuns` (`evaluationCaseId`,`mode`);--> statement-breakpoint
CREATE INDEX `ingestion_runs_state_idx` ON `ingestionRuns` (`state`);--> statement-breakpoint
CREATE INDEX `assertions_scheme_status_idx` ON `lineageAssertions` (`schemeId`,`status`);--> statement-breakpoint
CREATE INDEX `relationship_evidence_idx` ON `relationshipEvidence` (`relationshipId`);