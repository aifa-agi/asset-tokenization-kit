-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalTokens" INTEGER NOT NULL,
    "pricePerToken" DECIMAL(18,6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USDT',
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "txHash" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "pricePerToken" DECIMAL(18,6) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "blockNumber" INTEGER,
    "gasUsed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holder" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "balance" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncStatus" (
    "id" TEXT NOT NULL,
    "chainId" INTEGER NOT NULL,
    "lastBlock" BIGINT NOT NULL DEFAULT 0,
    "lastSyncAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Asset_contractAddress_key" ON "Asset"("contractAddress");

-- CreateIndex
CREATE INDEX "Asset_contractAddress_idx" ON "Asset"("contractAddress");

-- CreateIndex
CREATE INDEX "Asset_createdBy_idx" ON "Asset"("createdBy");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_txHash_key" ON "Transaction"("txHash");

-- CreateIndex
CREATE INDEX "Transaction_assetId_idx" ON "Transaction"("assetId");

-- CreateIndex
CREATE INDEX "Transaction_from_idx" ON "Transaction"("from");

-- CreateIndex
CREATE INDEX "Transaction_to_idx" ON "Transaction"("to");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Holder_address_idx" ON "Holder"("address");

-- CreateIndex
CREATE INDEX "Holder_assetId_balance_idx" ON "Holder"("assetId", "balance");

-- CreateIndex
CREATE UNIQUE INDEX "Holder_assetId_address_key" ON "Holder"("assetId", "address");

-- CreateIndex
CREATE UNIQUE INDEX "SyncStatus_chainId_key" ON "SyncStatus"("chainId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holder" ADD CONSTRAINT "Holder_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
