# Mistakes

1. From now whenever create API endpoints use services
2. Not using winston for server side error logging
3. Everything a tool returns must be plain JSON — you returned a database object containing a Prisma Decimal class instance. therefore from now on; Never return ORM rows directly from tools. Map them to a plain shape explicitly product.amount.toString()
