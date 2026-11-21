-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "shipping" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shippingZone" TEXT;

-- CreateTable
CREATE TABLE "ShippingZone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rate" INTEGER NOT NULL,
    "freeAbove" INTEGER,
    "pinPrefixes" TEXT[],
    "states" TEXT[],
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShippingZone_pkey" PRIMARY KEY ("id")
);
