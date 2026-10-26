-- Optional customer accounts (guest checkout still works without one)
ALTER TABLE "Customer" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Customer" ADD COLUMN "email" TEXT;
ALTER TABLE "Customer" ADD COLUMN "authProvider" TEXT;
ALTER TABLE "Customer" ADD COLUMN "providerId" TEXT;
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");
