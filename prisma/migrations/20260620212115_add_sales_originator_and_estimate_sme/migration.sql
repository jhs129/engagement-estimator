-- AlterTable
ALTER TABLE "Estimate" ADD COLUMN     "salesOriginator" TEXT;

-- CreateTable
CREATE TABLE "EstimateSme" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "order" INTEGER NOT NULL,

    CONSTRAINT "EstimateSme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EstimateSme_estimateId_idx" ON "EstimateSme"("estimateId");

-- AddForeignKey
ALTER TABLE "EstimateSme" ADD CONSTRAINT "EstimateSme_estimateId_fkey" FOREIGN KEY ("estimateId") REFERENCES "Estimate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
