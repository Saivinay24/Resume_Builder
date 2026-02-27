-- CreateTable
CREATE TABLE "Experience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "description" TEXT,
    "responsibilities" TEXT,
    "skills" TEXT,
    "type" TEXT NOT NULL DEFAULT 'internship',
    "location" TEXT,
    "highlight" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Experience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedDocExperience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "generatedDocId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    CONSTRAINT "GeneratedDocExperience_generatedDocId_fkey" FOREIGN KEY ("generatedDocId") REFERENCES "GeneratedDoc" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GeneratedDocExperience_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "Experience" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Experience_userId_idx" ON "Experience"("userId");

-- CreateIndex
CREATE INDEX "GeneratedDocExperience_generatedDocId_idx" ON "GeneratedDocExperience"("generatedDocId");

-- CreateIndex
CREATE UNIQUE INDEX "GeneratedDocExperience_generatedDocId_experienceId_key" ON "GeneratedDocExperience"("generatedDocId", "experienceId");
