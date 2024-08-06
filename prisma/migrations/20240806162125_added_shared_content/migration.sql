-- CreateTable
CREATE TABLE "SharedContent" (
    "_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "who" TEXT NOT NULL,
    "view" INTEGER NOT NULL,

    CONSTRAINT "SharedContent_pkey" PRIMARY KEY ("_id")
);
