ALTER TABLE "products"
ADD CONSTRAINT "products_amount_non_negative"
CHECK ("amount" >= 0);

ALTER TABLE "orders"
ADD CONSTRAINT "orders_original_paid_amount_non_negative"
CHECK ("original_paid_amount" >= 0);

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_original_unit_amount_non_negative"
CHECK ("original_unit_amount" >= 0);

ALTER TABLE "order_items"
ADD CONSTRAINT "order_items_quantity_positive"
CHECK ("quantity" > 0);

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_original_paid_amount_non_negative"
CHECK ("original_paid_amount" >= 0);

ALTER TABLE "refunds"
ADD CONSTRAINT "refunds_amount_positive"
CHECK ("amount" > 0);