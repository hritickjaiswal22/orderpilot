# Project goals for E-Commerce Agent

- findCustomer(email | customerId)
- getCustomerOrders(email | customerId)
- getOrderItems(orderId)
- checkRefundEligibility(orderId)
- createRefund(orderId, reason)
- createSupportTicket(customerId, issue)
- getProduct(productId)
- updateShippingAddress(email | customerId)

# Errors handling goals

- Handling erros in a way to distinguish between field and toast errors
