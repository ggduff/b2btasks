-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "uploadKey" TEXT NOT NULL,
    "dateAdded" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT,
    "partnerType" TEXT,
    "config" TEXT,
    "partnerStatus" TEXT NOT NULL DEFAULT 'PRE_SALES',
    "hasLandingPage" BOOLEAN NOT NULL DEFAULT false,
    "supportChannel" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "commission" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jiraKey" TEXT NOT NULL,
    "jiraId" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'To Do',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "assignee" TEXT,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Task_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assignee", "createdAt", "description", "id", "jiraId", "jiraKey", "lastSyncedAt", "priority", "status", "summary", "updatedAt", "userId") SELECT "assignee", "createdAt", "description", "id", "jiraId", "jiraKey", "lastSyncedAt", "priority", "status", "summary", "updatedAt", "userId" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE UNIQUE INDEX "Task_jiraKey_key" ON "Task"("jiraKey");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Partner_name_key" ON "Partner"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_uploadKey_key" ON "Partner"("uploadKey");
