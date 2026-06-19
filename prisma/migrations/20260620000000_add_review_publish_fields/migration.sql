ALTER TABLE "Review"
ADD COLUMN "dateRead" TEXT,
ADD COLUMN "currentlyReading" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "coverImage" TEXT,
ADD COLUMN "status" TEXT,
ADD COLUMN "coverPreference" TEXT;
