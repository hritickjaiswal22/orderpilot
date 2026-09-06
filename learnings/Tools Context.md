# Tools Context

You can pass in arbitrary runtime context from `generateText` or `streamText` via the `runtimeContext` setting.

This is useful for values like tenant information, feature flags, session data, or other server-side state that should influence step preparation without being embedded into the prompt.

Context lets you pass server-side state through a generation or agent loop without putting that state into the prompt. The AI SDK separates shared runtime state from per-tool execution state so agents can keep track of their work while tools only receive the values they need.

Use context for values such as tenant information, feature flags, session data, request IDs, API credentials, **access tokens**, or other application state that should affect execution.

```
const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    location: z.string(),
  }),
  contextSchema: z.object({
    weatherApiKey: z.string(),
    defaultUnit: z.enum(['celsius', 'fahrenheit']),
  }),
  execute: async ({ location }, { context }) => {
    return fetchWeather({
      location,
      apiKey: context.weatherApiKey,
      unit: context.defaultUnit,
    });
  },
});

const result = await generateText({
  model: xai("grok-4.6"),
  tools: { weather: weatherTool },
  toolsContext: {
    weather: {
      weatherApiKey: process.env.WEATHER_API_KEY,
      defaultUnit: 'fahrenheit',
    },
  },
});
```
