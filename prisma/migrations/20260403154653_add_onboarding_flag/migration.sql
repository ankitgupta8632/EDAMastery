-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 15,
    "weekendLearning" BOOLEAN NOT NULL DEFAULT false,
    "reminderTime" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredMode" TEXT NOT NULL DEFAULT 'auto',
    "commuteStartTime" TEXT NOT NULL DEFAULT '08:00',
    "commuteEndTime" TEXT NOT NULL DEFAULT '09:00',
    "eveningStartTime" TEXT NOT NULL DEFAULT '20:00',
    "eveningEndTime" TEXT NOT NULL DEFAULT '22:00',
    "autoPlayAudio" BOOLEAN NOT NULL DEFAULT true,
    "playbackSpeed" REAL NOT NULL DEFAULT 1.0,
    "overwhelmedMode" BOOLEAN NOT NULL DEFAULT false,
    "overwhelmedUntil" DATETIME,
    "reducedGoalMinutes" INTEGER NOT NULL DEFAULT 5,
    "notebookLmConfigured" BOOLEAN NOT NULL DEFAULT false,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserSettings" ("autoPlayAudio", "commuteEndTime", "commuteStartTime", "dailyGoalMinutes", "eveningEndTime", "eveningStartTime", "id", "notebookLmConfigured", "overwhelmedMode", "overwhelmedUntil", "playbackSpeed", "preferredMode", "reducedGoalMinutes", "reminderEnabled", "reminderTime", "userId", "weekendLearning") SELECT "autoPlayAudio", "commuteEndTime", "commuteStartTime", "dailyGoalMinutes", "eveningEndTime", "eveningStartTime", "id", "notebookLmConfigured", "overwhelmedMode", "overwhelmedUntil", "playbackSpeed", "preferredMode", "reducedGoalMinutes", "reminderEnabled", "reminderTime", "userId", "weekendLearning" FROM "UserSettings";
DROP TABLE "UserSettings";
ALTER TABLE "new_UserSettings" RENAME TO "UserSettings";
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
