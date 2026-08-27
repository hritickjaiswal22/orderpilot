## Storing product images in Postgres

The industry standard for e-commerce and robust applications is to use a **separate, normalized table**.

While PostgreSQL handles arrays beautifully, storing images almost always evolves to require metadata (sort order, alt text, primary flags), which standard arrays handle poorly.

Here is a breakdown of the standard approach, a modern alternative, and a crucial best practice for S3.

---

### 1. The Industry Standard: A Separate Table (Recommended)

You create a `product_images` table with a foreign key back to your `products` table.

**Why it's the standard:**

- **Metadata:** You can easily add columns for `display_order`, `alt_text` (for SEO), and `is_primary` (for the thumbnail).
- **Flexibility:** It's trivial to delete a single image, reorder them, or temporarily disable an image without parsing an array.
- **Variants:** If you later need to store thumbnails or WebP variants alongside the original image, a dedicated table handles this gracefully.

**Example Schema:**

```sql
CREATE TABLE product_images (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    s3_key VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    alt_text VARCHAR(255)
);
-- A partial index to ensure only one primary image per product
CREATE UNIQUE INDEX one_primary_per_product
ON product_images (product_id)
WHERE is_primary = true;

```

### 2. The Modern Alternative: A JSONB Column

If your application is simpler, highly read-heavy, and you want to avoid `JOIN` operations, storing a JSON array of objects inside a `JSONB` column on the `products` table is a valid, widely used alternative.

**Why use it:**

- **Performance:** Fetches the product and all its images in a single query with zero joins.
- **Flexibility over Text Arrays:** Unlike a simple `text[]` array, JSONB allows you to store metadata alongside the URL.

**Example Schema:**

```sql
ALTER TABLE products ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

```

_Example data inside the column:_

```json
[
  { "key": "sneakers-front.jpg", "is_primary": true, "alt": "Front view" },
  { "key": "sneakers-side.jpg", "is_primary": false, "alt": "Side profile" }
]
```

_The downside?_ Partial updates (like updating just the `alt` text of the third image) require slightly more complex SQL syntax than a simple `UPDATE` on a separate table.

### 3. The Anti-Pattern: A Simple Text Array (`text[]`)

Storing an array of strings (e.g., `['image1.jpg', 'image2.jpg']`) directly on the `products` table is tempting because it's easy to set up.

**Avoid this.** The moment your marketing team asks for alt-text on images, or you need to guarantee which image shows up first on the search page, a flat array of strings becomes useless.

---

### ⚠️ Crucial S3 Best Practice: Store Keys, Not URLs

Regardless of whether you choose a separate table or JSONB, **do not store the full S3 URL** (e.g., `[https://my-bucket.s3.us-east-1.amazonaws.com/products/image.jpg](https://my-bucket.s3.us-east-1.amazonaws.com/products/image.jpg)`).

**Store the S3 Object Key or a relative path instead:** (e.g., `/products/image.jpg`).

- **Why?** If you ever change your bucket name, switch from AWS to Cloudflare R2, or put a CDN (like CloudFront) in front of your bucket, you would have to run a massive database migration to update every single row.
- **How:** Store the relative path in Postgres, and let your frontend or backend application dynamically prepend the base URL (e.g., `const imageUrl = process.env.CDN_URL + image.s3_key`).
