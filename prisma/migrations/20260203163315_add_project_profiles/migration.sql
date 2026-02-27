/*
  Warnings:

  - You are about to drop the column `highlight` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `label` on the `GeneratedDoc` table. All the data in the column will be lost.
  - You are about to drop the column `experienceId` on the `GeneratedDocExperience` table. All the data in the column will be lost.
  - You are about to drop the column `generatedDocId` on the `GeneratedDocExperience` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `GeneratedDocExperience` table. All the data in the column will be lost.
  - You are about to drop the column `generatedDocId` on the `GeneratedDocProject` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `GeneratedDocProject` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Job` table. All the data in the column will be lost.
  - Added the required column `position` to the `Experience` table without a default value. This is not possible if the table is not empty.
  - Made the column `startDate` on table `Experience` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `format` to the `GeneratedDoc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `template` to the `GeneratedDoc` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docId` to the `GeneratedDocExperience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expId` to the `GeneratedDocExperience` table without a default value. This is not possible if the table is not empty.
  - Added the required column `docId` to the `GeneratedDocProject` table without a default value. This is not possible if the table is not empty.
  - Made the column `company` on table `Job` required. This step will fail if there are existing NULL values in that column.
  - Made the column `title` on table `Job` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "AICache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cacheKey" TEXT NOT NULL,
    "cacheType" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "tokensUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "category" TEXT,
    "masterDescription" TEXT NOT NULL,
    "bulletPoints" TEXT NOT NULL,
    "techStack" TEXT NOT NULL,
    "architectureNotes" TEXT,
    "metrics" TEXT NOT NULL,
    "problemStatement" TEXT,
    "solutionApproach" TEXT,
    "impact" TEXT,
    "githubData" TEXT,
    "primaryLanguage" TEXT,
    "topics" TEXT,
    "lastAnalyzed" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "analysisVersion" TEXT NOT NULL DEFAULT '1.0',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Experience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT,
    "description" TEXT,
    "responsibilities" TEXT,
    "achievements" TEXT,
    "techStack" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Experience" ("company", "createdAt", "description", "endDate", "id", "location", "responsibilities", "startDate", "updatedAt", "userId") SELECT "company", "createdAt", "description", "endDate", "id", "location", "responsibilities", "startDate", "updatedAt", "userId" FROM "Experience";
DROP TABLE "Experience";
ALTER TABLE "new_Experience" RENAME TO "Experience";
CREATE INDEX "Experience_userId_idx" ON "Experience"("userId");
CREATE TABLE "new_GeneratedDoc" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT,
    "template" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "filePath" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedDoc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedDoc" ("createdAt", "id", "jobId", "userId") SELECT "createdAt", "id", "jobId", "userId" FROM "GeneratedDoc";
DROP TABLE "GeneratedDoc";
ALTER TABLE "new_GeneratedDoc" RENAME TO "GeneratedDoc";
CREATE INDEX "GeneratedDoc_userId_idx" ON "GeneratedDoc"("userId");
CREATE TABLE "new_GeneratedDocExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docId" TEXT NOT NULL,
    "expId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedDocExperience_docId_fkey" FOREIGN KEY ("docId") REFERENCES "GeneratedDoc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocExperience_expId_fkey" FOREIGN KEY ("expId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedDocExperience" ("id") SELECT "id" FROM "GeneratedDocExperience";
DROP TABLE "GeneratedDocExperience";
ALTER TABLE "new_GeneratedDocExperience" RENAME TO "GeneratedDocExperience";
CREATE UNIQUE INDEX "GeneratedDocExperience_docId_expId_key" ON "GeneratedDocExperience"("docId", "expId");
CREATE TABLE "new_GeneratedDocProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "docId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GeneratedDocProject_docId_fkey" FOREIGN KEY ("docId") REFERENCES "GeneratedDoc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_GeneratedDocProject" ("id", "projectId") SELECT "id", "projectId" FROM "GeneratedDocProject";
DROP TABLE "GeneratedDocProject";
ALTER TABLE "new_GeneratedDocProject" RENAME TO "GeneratedDocProject";
CREATE UNIQUE INDEX "GeneratedDocProject_docId_projectId_key" ON "GeneratedDocProject"("docId", "projectId");
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "preferredSkills" TEXT,
    "salary" TEXT,
    "link" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("company", "createdAt", "description", "id", "title", "updatedAt", "userId") SELECT "company", "createdAt", "description", "id", "title", "updatedAt", "userId" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE INDEX "Job_userId_idx" ON "Job"("userId");
CREATE INDEX "Job_status_idx" ON "Job"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "AICache_cacheKey_key" ON "AICache"("cacheKey");

-- CreateIndex
CREATE INDEX "AICache_cacheKey_idx" ON "AICache"("cacheKey");

-- CreateIndex
CREATE INDEX "AICache_cacheType_idx" ON "AICache"("cacheType");

-- CreateIndex
CREATE INDEX "AICache_expiresAt_idx" ON "AICache"("expiresAt");

-- CreateIndex
CREATE INDEX "ProjectProfile_userId_idx" ON "ProjectProfile"("userId");

-- CreateIndex
CREATE INDEX "ProjectProfile_category_idx" ON "ProjectProfile"("category");

-- CreateIndex
CREATE INDEX "ProjectProfile_lastAnalyzed_idx" ON "ProjectProfile"("lastAnalyzed");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectProfile_userId_repoName_key" ON "ProjectProfile"("userId", "repoName");
