# For future any migrations

1. Run `npx prisma migrate dev --create-only --name the_migration_name` - this Creates an empty migration
2. Open the new migration.sql and add the required changes/updates
3. Apply the migration by running `npx prisma migrate dev`
   Applying migration `20260827xxxxxx_add_amount_checks`

   Your database is now in sync with your schema.
