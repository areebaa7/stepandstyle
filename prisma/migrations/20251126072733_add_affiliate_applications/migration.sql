-- CreateEnum
CREATE TYPE "AffiliateApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "AffiliateApplication" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "channelLink1" TEXT NOT NULL,
    "channelLink2" TEXT,
    "status" "AffiliateApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateApplication_pkey" PRIMARY KEY ("id")
);
