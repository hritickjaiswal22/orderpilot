# How errors are handled in the tool‑calling loop

1. **Model decides to call a tool** (e.g., `get_user` with an ID).
2. **Your tool function runs**.
   - If it succeeds, you return a normal result, like `{ name: "Alice", email: "alice@example.com" }`.
   - If it fails (e.g., user not found), you should **return a structured error object** rather than throwing an exception. For example:
     ```ts
     return { error: "User not found" };
     ```
3. **The SDK takes that returned value and sends it back to the model** as the tool’s output. The model sees it just like it would see any other tool result.
4. **The model uses that error message to decide what to do next**.
   - It might respond to the user: _“I’m sorry, but I couldn’t find a user with that ID.”_
   - Or it might ask for more information: _“Could you provide a different username?”_
   - Or it might even try calling another tool if that seems appropriate.

### Example flow

User: _“Get me the details of user 123.”_

- AI calls `get_user(id: 123)`.
- Your tool returns `{ error: "User not found" }`.
- The model receives that error and responds:  
  _“I couldn’t find a user with ID 123. Would you like to try a different ID?”_

### Important: Return errors, don’t throw them

If you throw an unhandled exception inside a tool, the SDK may treat it as a tool execution failure and could return a generic error to the model (or stop the loop). Returning an error object gives you control over the message and lets the model recover gracefully.

### Make your error messages helpful

- **Be specific** – “User not found” is better than “Error”.
- **Include context if possible** – “User with ID 123 not found” tells the model exactly what failed.
- **Suggest next steps** (implicitly or explicitly) – _“Try using a different ID”_ or _“The user may have been deleted”_.

By designing your tools to return clear, structured errors, you enable the AI to handle failures intelligently, which is a key part of building reliable AI‑powered applications.
