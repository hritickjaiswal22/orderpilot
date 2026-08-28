### The architecture is:

```text
                    Browser
                       │
                       ▼
                 Next.js Middleware
                       │
              ┌────────┴────────┐
              │                 │
         Access valid       Access expired
              │                 │
              ▼                 ▼
           Continue        Refresh using
                           refresh token
                                │
                         ┌──────┴──────┐
                         │             │
                      success        failure
                         │             │
                         ▼             ▼
                   Set new access    /login
                         │
                         ▼
                      Continue
                         │
                         ▼
                    /api/chat
                         │
                         ▼
                  Extract user_id
                    from JWT
                         │
                         ▼
                  Validate request
                         │
                         ▼
                     AI Agent
                         │
                         ▼
                       Tools
                         │
                         ▼
                  Domain services
                         │
                         ▼
                     Database
```

And that's a **perfectly reasonable design for this project**, especially because you've already implemented and understood this pattern in LedgerLite.

### The important boundary

The key is that middleware handles **authentication/session lifecycle**, while your API handlers still enforce **authorization/business rules**.

For example:

```text
JWT
 └── user_id = customer_123
          │
          ▼
POST /api/chat
          │
          ▼
req.user.id = customer_123
          │
          ▼
Agent Tool:
getCustomerOrders()
          │
          ▼
orderService.getOrders(customer_123)
          │
          ▼
DB
```

If the LLM says:

> "Get order `ORD-999`"

your backend should still verify:

```text
ORD-999.customer_id === authenticatedUser.id
```

The LLM/user input **never gets to override the authenticated identity**.

---

## So your implementation sequence is actually quite clean

### Phase 1 — Auth

```text
POST /api/auth/login
        ↓
verify demo user_id
        ↓
issue access + refresh tokens
        ↓
httpOnly cookies
        ↓
redirect /chat
```

Then reuse your LedgerLite:

- JWT verification
- middleware
- silent refresh
- invalid refresh → login
- logout
- cookie handling

**Don't reinvent this.**

### Phase 2 — Chat endpoint

```text
POST /api/chat
        ↓
middleware
        ↓
authenticated request
        ↓
useChat()
        ↓
AI agent
```

### Phase 3 — Tools

Start with **read-only tools**:

```text
getMyOrders()
getOrderDetails()
searchProducts()
getShippingStatus()
```

Then mutations:

```text
cancelOrder()
createRefund()
updateShippingAddress()
createSupportTicket()
```

And mutations should have the stronger validation/confirmation discussed above.
