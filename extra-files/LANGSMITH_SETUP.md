# LangSmith Setup Guide

LangSmith is now configured to monitor all AI agents in the pfaff-designs application.

## Environment Variables

Add these to your `.env.local` file (or your deployment environment):

```bash
# Required: LangSmith API Key
# Get your API key from https://smith.langchain.com/settings
LANGSMITH_API_KEY=your_langsmith_api_key_here

# Optional: Custom LangSmith API URL (defaults to https://api.smith.langchain.com)
LANGSMITH_API_URL=https://api.smith.langchain.com

# Optional: Project name for organizing traces (defaults to "pfaff-designs-orchestrator")
LANGSMITH_PROJECT=pfaff-designs
```

## Getting Your LangSmith API Key

1. Sign up or log in at [https://smith.langchain.com](https://smith.langchain.com)
2. Go to Settings → API Keys
3. Create a new API key or copy an existing one
4. Add it to your `.env.local` file

## What's Being Monitored

All three AI agents are now instrumented with LangSmith tracing:

### 1. Intent Resolver (`src/lib/ai/intentResolver.ts`)
- **Run Name**: `resolve-intent`
- **Tags**: `intent-resolver`, `agent`
- Monitors: Query analysis, intent detection, audience identification

### 2. Copywriter Agent (`src/lib/ai/copywriter.ts`)
- **Run Name**: `generate-copywriter-yaml`
- **Tags**: `copywriter`, `agent`
- Monitors: YAML generation, KB data transformation, media selection

### 3. Orchestrator Agent (`src/lib/ai/orchestrator.ts`)
- **Run Name**: `generate-orchestrator-json`
- **Tags**: `orchestrator`, `agent`
- **LangChain Integration**: Uses LangChain's built-in tracing
- **Layout Planner**: `layout-planner` (sub-run)
- Monitors: Layout planning, component tree generation, media resolution

## Viewing Traces

1. Go to [https://smith.langchain.com](https://smith.langchain.com)
2. Navigate to the "Traces" section
3. Filter by:
   - **Project**: `pfaff-designs` (or your custom project name)
   - **Tags**: `agent`, `intent-resolver`, `copywriter`, `orchestrator`
   - **Run Name**: Search for specific agent runs

## Features

- **Automatic Tracing**: All agent calls are automatically traced when `LANGSMITH_API_KEY` is set
- **Error Tracking**: Errors and exceptions are captured with full context
- **Performance Monitoring**: Track latency, token usage, and costs
- **Input/Output Logging**: See prompts, responses, and intermediate steps
- **Tagging**: Easy filtering and organization of traces

## Troubleshooting

### Traces Not Appearing

1. **Check API Key**: Ensure `LANGSMITH_API_KEY` is set correctly
2. **Check Console**: Look for "LangSmith tracing enabled" message on startup
3. **Check Network**: Ensure your environment can reach `api.smith.langchain.com`
4. **Check Project**: Verify traces are being sent to the correct project

### Disable Tracing

To disable LangSmith tracing, simply remove or comment out the `LANGSMITH_API_KEY` environment variable. The application will continue to work normally without tracing.

## Next Steps

- Set up alerts for errors or high latency
- Create dashboards for monitoring agent performance
- Analyze token usage and costs
- Debug failed agent runs with full context

