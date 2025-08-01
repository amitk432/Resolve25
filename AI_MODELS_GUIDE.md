# AI Models Guide - Resolve25 AI Task Manager

This document explains the available AI models, their limits, pricing, and setup requirements.

## Currently Available Models (✅ Working)

### Gemini 2.0 Flash (Default)
- **Model ID**: `gemini-2.0-flash`
- **Description**: Latest multimodal model with vision, audio, and code capabilities
- **Speed**: Fast
- **Accuracy**: High
- **Cost**: Low (Free tier available)
- **Limits**: 
  - 15 RPM (requests per minute)
  - 1M TPM (tokens per minute)
  - 1500 RPD (requests per day)
- **Context Window**: 1M tokens
- **Setup**: ✅ Configured with Gemini API key

### Gemini 1.5 Pro
- **Model ID**: `gemini-1.5-pro`
- **Description**: Advanced reasoning with massive context window
- **Speed**: Medium
- **Accuracy**: High
- **Cost**: Medium
- **Limits**: 
  - 2 RPM (requests per minute)
  - 32K TPM (tokens per minute)
  - 50 RPD (requests per day)
- **Context Window**: 2M tokens
- **Setup**: ✅ Configured with Gemini API key

### Gemini 1.5 Flash
- **Model ID**: `gemini-1.5-flash`
- **Description**: Fast and efficient with large context
- **Speed**: Fast
- **Accuracy**: High
- **Cost**: Low
- **Limits**: 
  - 15 RPM (requests per minute)
  - 1M TPM (tokens per minute)
  - 1500 RPD (requests per day)
- **Context Window**: 1M tokens
- **Setup**: ✅ Configured with Gemini API key

### Gemini 1.0 Pro
- **Model ID**: `gemini-1.0-pro`
- **Description**: Reliable general-purpose model
- **Speed**: Medium
- **Accuracy**: Medium
- **Cost**: Low
- **Limits**: 
  - 60 RPM (requests per minute)
  - 32K TPM (tokens per minute)
  - No daily limit
- **Context Window**: 32K tokens
- **Setup**: ✅ Configured with Gemini API key

## Models Not Available (❌ Require Setup)

### GPT-4 Turbo
- **Model ID**: `gpt-4-turbo`
- **Description**: OpenAI's most capable model for complex tasks
- **Speed**: Medium
- **Accuracy**: High
- **Cost**: High ($10/1M input tokens, $30/1M output tokens)
- **Limits**: Depends on OpenAI tier
- **Context Window**: 128K tokens
- **Setup Required**: OpenAI API key needed
- **How to Enable**: 
  1. Get API key from https://platform.openai.com/api-keys
  2. Add to environment: `OPENAI_API_KEY=your_key_here`
  3. Install OpenAI plugin: `npm install @genkit-ai/openai`
  4. Update genkit configuration

### GPT-3.5 Turbo
- **Model ID**: `gpt-3.5-turbo`
- **Description**: Fast and efficient for most tasks
- **Speed**: Fast
- **Accuracy**: Medium
- **Cost**: Low ($0.50/1M input tokens, $1.50/1M output tokens)
- **Limits**: Depends on OpenAI tier
- **Context Window**: 16K tokens
- **Setup Required**: OpenAI API key needed

### Claude 3 Sonnet
- **Model ID**: `claude-3`
- **Description**: Anthropic's excellent model for analysis and research
- **Speed**: Medium
- **Accuracy**: High
- **Cost**: Medium ($3/1M input tokens, $15/1M output tokens)
- **Limits**: Depends on Anthropic tier
- **Context Window**: 200K tokens
- **Setup Required**: Anthropic API key needed
- **How to Enable**: 
  1. Get API key from https://console.anthropic.com/
  2. Add to environment: `ANTHROPIC_API_KEY=your_key_here`
  3. Install Anthropic plugin: `npm install @genkit-ai/anthropic`
  4. Update genkit configuration

## Gemini API Setup (Current Configuration)

The application is currently configured to use Google's Gemini models through the Genkit framework.

### Environment Variables
Set one of these in your `.env.local` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
# OR
GOOGLE_API_KEY=your_gemini_api_key_here
```

### Getting a Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your environment variables

### Free Tier Limits
Google's Gemini API offers generous free tier limits:
- **Gemini 1.0 Pro**: 60 RPM, unlimited daily requests
- **Gemini 1.5 Flash**: 15 RPM, 1500 requests/day
- **Gemini 1.5 Pro**: 2 RPM, 50 requests/day
- **Gemini 2.0 Flash**: 15 RPM, 1500 requests/day

## Rate Limiting & Error Handling

The application includes built-in error handling for:
- API key missing or invalid
- Rate limit exceeded (429 errors)
- Quota exceeded
- Network errors
- Model-specific errors

When limits are exceeded, the system will:
1. Show user-friendly error messages
2. Suggest trying a different model
3. Provide information about rate limits
4. Allow retry after cooldown period

## Choosing the Right Model

### For Speed (Recommended for Task Manager):
1. **Gemini 2.0 Flash** - Best overall choice
2. **Gemini 1.5 Flash** - Good alternative
3. **Gemini 1.0 Pro** - Highest rate limits

### For Complex Analysis:
1. **Gemini 1.5 Pro** - Largest context window
2. **Gemini 2.0 Flash** - Latest capabilities
3. **Claude 3 Sonnet** (if configured) - Excellent reasoning

### For Cost Efficiency:
1. **Gemini 1.0 Pro** - No daily limits
2. **Gemini 1.5 Flash** - Good balance
3. **Gemini 2.0 Flash** - Latest with good limits

## Monitoring Usage

To monitor your API usage:
- **Gemini**: Visit [Google AI Studio](https://aistudio.google.com/) usage dashboard
- **OpenAI**: Check [OpenAI Usage Dashboard](https://platform.openai.com/usage)
- **Anthropic**: Visit [Anthropic Console](https://console.anthropic.com/)

## Future Enhancements

Planned model integrations:
- [ ] OpenAI GPT models support
- [ ] Anthropic Claude models support
- [ ] Local model support (Ollama)
- [ ] Azure OpenAI integration
- [ ] Multiple API key rotation
- [ ] Usage analytics dashboard
