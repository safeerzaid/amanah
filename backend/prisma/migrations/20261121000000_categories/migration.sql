-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- The shop's original five categories, matching src/data/collections.js.
INSERT INTO "Category" ("id", "name", "tagline", "description", "sortOrder") VALUES
  ('necklaces', 'Necklaces', 'Drawn close to the heart', 'Pendants and fine chains designed to be layered, gifted and kept.', 0),
  ('earrings', 'Earrings', 'Light that frames the face', 'Studs, drops and hoops for quiet everyday moments and grand occasions.', 1),
  ('rings', 'Rings', 'Promises worn every day', 'Sculpted bands and statement rings made to carry meaning.', 2),
  ('bracelets', 'Bracelets', 'Elegance at the wrist', 'Cuffs and delicate bracelets that move with you.', 3),
  ('designer', 'Designer Jewellery', 'Signature statement pieces', 'Distinctive designs where craftsmanship takes centre stage.', 4);
