## Imp Notes

### - In case of Agents while, DB updates idempotency and retries is PARAMOUNT

### Absolutely critical to provide `instructions` to streamText or the model will make up or hallucinate to make it's own conclusions (check Bug image in learnings)

### Learning `Prompt and context engineering` is critical

### Tools will always return { success: true/false , with data or error }

### About the use of `toolsContext`

    runtimeContext?:
    CONTEXT
    The shared runtime context passed via the runtimeContext setting.
    toolsContext:
    InferToolSetContext<TOOLS>
    The per-tool context map passed via the toolsContext setting.

    #### Key points

        - The **runtime context** (second argument of `execute`) always contains built‑in properties like `abortSignal`, `toolCallId`, `messages`, etc. It cannot be extended with custom data.

### Add `stopWhen: isStepCount(N)` for allowing the model to step in filter through the data to provide necessary data
