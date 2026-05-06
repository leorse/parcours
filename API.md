

# Chat with AI API

A unified chat endpoint that consolidates all AI chat interactions into
a single, streamlined API.

Migration
Notice

All legacy chat endpoints (`CHAT_WITH_AI`, `CHAT_WITH_IMAGE`,
`CHAT_WITH_PDF`, `CHAT_WITH_YOUTUBE_VIDEO` via AI Feature API) will be
deprecated in a future release. Please migrate to this unified Chat with
AI API using the `UNIFY_CHAT_WITH_AI` type for all new integrations.

## Overview
The Chat with AI API provides a dedicated endpoint for all chat-related
interactions, replacing the need to use the general-purpose AI Feature
API for chat. It supports both streaming and non-streaming modes, web
search, image attachments, conversation history, brand voice, and memory
features.

**Key benefits over the legacy AI Feature API for chat:**

- Dedicated chat endpoint with optimized streaming
- Structured prompt settings (web search, history, attachments) via a
  clean nested object
- Built-in support for AI memory across conversations
- Simplified request format

## Endpoints

### Streaming Chat

<span class="badge badge--success">POST</span><a href="https://api.1min.ai/api/chat-with-ai?isStreaming=true"
target="_blank"
rel="noopener noreferrer"><code>https://api.1min.ai/api/chat-with-ai?isStreaming=true</code></a>

### Non-Streaming Chat

<span class="badge badge--success">POST</span><a href="https://api.1min.ai/api/chat-with-ai" target="_blank"
rel="noopener noreferrer"><code>https://api.1min.ai/api/chat-with-ai</code></a>

## Authentication

All requests require authentication using an API key in the request
header.

| Field        | Value              |
|--------------|--------------------|
| API-KEY      | `<api-key>`        |
| Content-Type | `application/json` |

## Create a Conversation for History

If you want to maintain context across multiple messages, create a
conversation first and then pass the returned `uuid` as
`promptObject.conversationId` in Chat with AI requests.

This endpoint is also used by legacy conversation-based chat flows. Only
the `type` and any feature-specific fields change:

- Use `UNIFY_CHAT_WITH_AI` for the recommended unified chat flow.
- Use `CHAT_WITH_IMAGE` for legacy image chat.
- Use `CHAT_WITH_PDF` with legacy PDF chat.
- Use `CHAT_WITH_YOUTUBE_VIDEO` for legacy YouTube chat.

<span class="badge badge--success">POST</span><a href="https://api.1min.ai/api/conversations" target="_blank"
rel="noopener noreferrer"><code>https://api.1min.ai/api/conversations</code></a>

### Conversation Request Parameters

| Parameter | Type   | Required | Description                                    |
|-----------|--------|----------|------------------------------------------------|
| `type`    | string | ✔️       | Conversation type such as `UNIFY_CHAT_WITH_AI` |
| `title`   | string | ✔️       | Conversation title                             |
| `model`   | string | ✔️       | AI model used for the conversation             |

### Unified Chat Conversation (Recommended)

Loading interactive playground...

Use the returned `uuid` as `promptObject.conversationId` when calling
the Chat with AI endpoint.

## Request Payload

### Required Parameters

| Parameter | Type | Required | Description |
|----|----|----|----|
| `type` | string | ✔️ | Feature type. Use `UNIFY_CHAT_WITH_AI` (defaults to this if omitted) |
| `model` | string | ✔️ | AI model to use |
| `promptObject` | object | ✔️ | Chat parameters (see below) |

### Optional Parameters

| Parameter | Type | Required | Description |
|----|----|----|----|
| `brandVoiceId` | string | \- | Brand voice ID to apply a custom tone/style to the response |
| `metadata` | object | \- | Additional metadata for the request |

### Available Models

Loading available models...

### promptObject Parameters

| Parameter | Type | Required | Description |
|----|----|----|----|
| `prompt` | string | ✔️ | The user's message |
| `conversationId` | string | \- | Conversation ID for multi-turn chat context |
| `settings` | object | \- | Chat settings (see below) |
| `attachments` | object | \- | File and image attachments (see below) |

### settings Object

| Parameter | Type | Required | Description |
|----|----|----|----|
| `webSearchSettings` | object | \- | Web search configuration |
| `historySettings` | object | \- | Conversation history configuration |
| `withMemories` | boolean | \- | Enable AI memory across conversations (default: `false`) |

#### webSearchSettings

| Parameter | Type | Default | Description |
|----|----|----|----|
| `webSearch` | boolean | `false` | Enable web search for grounding responses |
| `numOfSite` | number | `3` | Number of sites to search (when webSearch is true) |
| `maxWord` | number | `1000` | Maximum words from web search (when webSearch is true) |

#### historySettings

| Parameter | Type | Default | Description |
|----|----|----|----|
| `isMixed` | boolean | `false` | Mix context from different AI models in conversation history |
| `historyMessageLimit` | number | `10` | Maximum number of history messages to include as context |

### attachments Object

| Parameter | Type | Default | Description |
|----|----|----|----|
| `images` | string\[\] | `[]` | Image URLs or asset keys from [Asset API](/docs/api/asset-api) |
| `files` | string\[\] | `[]` | File IDs from [Asset API](/docs/api/asset-api) |

## Example Requests

### Simple Chat (No Context)

Loading interactive playground...

### Chat with Conversation History

Create a conversation first with [Create a Conversation for
History](#create-a-conversation-for-history), then pass the returned
`uuid` as `promptObject.conversationId`.

- JavaScript
- cURL
- Python

``` javascript
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Can you elaborate on that?',
      conversationId: 'c5c5e1d4-76a9-46a6-bf6b-1ba843b838db',
      settings: {
        historySettings: {
          isMixed: false,
          historyMessageLimit: 10
        }
      }
    }
  })
})
```

``` bash
curl --location 'https://api.1min.ai/api/chat-with-ai?isStreaming=true' \
--header 'API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Can you elaborate on that?",
    "conversationId": "c5c5e1d4-76a9-46a6-bf6b-1ba843b838db",
    "settings": {
      "historySettings": {
        "isMixed": false,
        "historyMessageLimit": 10
      }
    }
  }
}'
```

``` python
import requests

url = "https://api.1min.ai/api/chat-with-ai?isStreaming=true"
headers = {
  "Content-Type": "application/json",
  "API-KEY": "YOUR_API_KEY"
}

data = {
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
      "prompt": "Can you elaborate on that?",
      "conversationId": "c5c5e1d4-76a9-46a6-bf6b-1ba843b838db",
      "settings": {
          "historySettings": {
              "isMixed": False,
              "historyMessageLimit": 10
          }
      }
  }
}

response = requests.post(url, headers=headers, json=data)
```

### Chat with Web Search<a href="#chat-with-web-search" class="hash-link"
aria-label="Direct link to Chat with Web Search"
title="Direct link to Chat with Web Search">​</a>

- JavaScript
- cURL
- Python

``` javascript
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'What are the latest developments in AI?',
      settings: {
        webSearchSettings: {
          webSearch: true,
          numOfSite: 3,
          maxWord: 1000
        }
      }
    }
  })
})
```

``` bash
curl --location 'https://api.1min.ai/api/chat-with-ai?isStreaming=true' \
--header 'API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "What are the latest developments in AI?",
    "settings": {
      "webSearchSettings": {
        "webSearch": true,
        "numOfSite": 3,
        "maxWord": 1000
      }
    }
  }
}'
```

``` python
import requests

url = "https://api.1min.ai/api/chat-with-ai?isStreaming=true"
headers = {
  "Content-Type": "application/json",
  "API-KEY": "YOUR_API_KEY"
}

data = {
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
      "prompt": "What are the latest developments in AI?",
      "settings": {
          "webSearchSettings": {
              "webSearch": True,
              "numOfSite": 3,
              "maxWord": 1000
          }
      }
  }
}

response = requests.post(url, headers=headers, json=data)
```

### Chat with Image Attachments

- JavaScript
- cURL
- Python

``` javascript
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'What do you see in this image?',
      attachments: {
        images: ['development/images/2024_09_30_13_41_50_758_photo.png']
      }
    }
  })
})
```

``` bash
curl --location 'https://api.1min.ai/api/chat-with-ai?isStreaming=true' \
--header 'API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "What do you see in this image?",
    "attachments": {
      "images": ["development/images/2024_09_30_13_41_50_758_photo.png"]
    }
  }
}'
```

``` python
import requests

url = "https://api.1min.ai/api/chat-with-ai?isStreaming=true"
headers = {
  "Content-Type": "application/json",
  "API-KEY": "YOUR_API_KEY"
}

data = {
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
      "prompt": "What do you see in this image?",
      "attachments": {
          "images": ["development/images/2024_09_30_13_41_50_758_photo.png"]
      }
  }
}

response = requests.post(url, headers=headers, json=data)
```

### Chat with File Attachments

Upload files via the [Asset API](/docs/api/asset-api) first, then pass
the returned file IDs in `attachments.files`.

- JavaScript
- cURL
- Python

``` javascript
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Summarize the key points from this document',
      attachments: {
        files: ['20ad0277-74df-4629-8c50-56a2549acbd7']
      }
    }
  })
})
```

``` bash
curl --location 'https://api.1min.ai/api/chat-with-ai?isStreaming=true' \
--header 'API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Summarize the key points from this document",
    "attachments": {
      "files": ["20ad0277-74df-4629-8c50-56a2549acbd7"]
    }
  }
}'
```

``` python
import requests

url = "https://api.1min.ai/api/chat-with-ai?isStreaming=true"
headers = {
  "Content-Type": "application/json",
  "API-KEY": "YOUR_API_KEY"
}

data = {
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
      "prompt": "Summarize the key points from this document",
      "attachments": {
          "files": ["20ad0277-74df-4629-8c50-56a2549acbd7"]
      }
  }
}

response = requests.post(url, headers=headers, json=data)
```

### Chat with YouTube Video

Include a YouTube URL directly in your prompt. The AI will automatically
detect the link, fetch the video transcript, and use it as context for
the conversation. Up to 3 YouTube URLs are supported per request.

- JavaScript
- cURL
- Python

``` javascript
fetch('https://api.1min.ai/api/chat-with-ai?isStreaming=true', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Summarize this video https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  })
})
```

``` bash
curl --location 'https://api.1min.ai/api/chat-with-ai?isStreaming=true' \
--header 'API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Summarize this video https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}'
```

``` python
import requests

url = "https://api.1min.ai/api/chat-with-ai?isStreaming=true"
headers = {
  "Content-Type": "application/json",
  "API-KEY": "YOUR_API_KEY"
}

data = {
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
      "prompt": "Summarize this video https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
}

response = requests.post(url, headers=headers, json=data)
```

### Non-Streaming Chat

- JavaScript
- cURL
- Python

``` javascript
fetch('https://api.1min.ai/api/chat-with-ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'API-KEY': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    type: 'UNIFY_CHAT_WITH_AI',
    model: 'gpt-4o-mini',
    promptObject: {
      prompt: 'Explain quantum computing in simple terms'
    }
  })
})
```

``` bash
curl --location 'https://api.1min.ai/api/chat-with-ai' \
--header 'API-KEY: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Explain quantum computing in simple terms"
  }
}'
```

``` python
import requests

url = "https://api.1min.ai/api/chat-with-ai"
headers = {
  "Content-Type": "application/json",
  "API-KEY": "YOUR_API_KEY"
}

data = {
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
      "prompt": "Explain quantum computing in simple terms"
  }
}

response = requests.post(url, headers=headers, json=data)
print(response.json())
```

## Streaming Response

For streaming requests (`?isStreaming=true`), the response is sent as
Server-Sent Events (SSE):

### Event Types

| Event     | Description                             |
|-----------|-----------------------------------------|
| `content` | A chunk of the AI-generated response    |
| `result`  | Final AI record with full response data |
| `done`    | Stream completed signal                 |
| `error`   | Error occurred during processing        |

### Streaming Event Format

``` text
event: content
data: {"content": "Artificial intelligence is"}

event: content
data: {"content": " a branch of computer science..."}

event: result
data: {"aiRecord": { ... }}

event: done
data: {"message": "Stream completed"}
```

## Non-Streaming Response

### Success Response (200)

``` json
{
  "aiRecord": {
    "uuid": "120qae97-d77d-468d-9d78-2e7c0b2bbb98",
    "userId": "75cz1a57-c969-47ac-9dc5-82941cdcfe57",
    "teamId": "595w4b41-dcc7-466f-8697-d4a919810b11",
    "teamUser": {
      "teamId": "595w4b41-dcc7-466f-8697-d4a919810b11",
      "userId": "75cz1a57-c969-47ac-9dc5-82941cdcfe57",
      "userName": "1minAI",
      "userAvatar": "https://lh3.googleusercontent.com/a/ACg8ocJxHeiuADdtp",
      "status": "ACTIVE",
      "role": "ADMIN",
      "creditLimit": 214748364,
      "usedCredit": 3086973,
      "createdAt": "2023-11-24T06:31:06.467Z",
      "createdBy": "SYSTEM",
      "updatedAt": "2024-09-29T09:17:08.210Z",
      "updatedBy": "SYSTEM"
    },
    "model": "gpt-4o-mini",
    "type": "UNIFY_CHAT_WITH_AI",
    "metadata": null,
    "rating": null,
    "feedback": null,
    "conversationId": null,
    "status": "SUCCESS",
    "createdAt": "2024-09-30T03:47:29.738Z",
    "aiRecordDetail": {
      "promptObject": {
        "prompt": "Explain quantum computing in simple terms",
        "linkContentList": [],
        "searchContentList": []
      },
      "resultObject": [
        "Quantum computing is a type of computing that uses quantum bits (qubits) instead of classical bits..."
      ]
    },
    "modelDetail": {
      "name": "gpt-4o-mini",
      "provider": "OPENAI"
    }
  }
}
```

### Response Fields

#### aiRecord Object

| Field            | Type   | Description                                    |
|------------------|--------|------------------------------------------------|
| `uuid`           | string | Unique identifier for the AI record            |
| `userId`         | string | User identifier                                |
| `teamId`         | string | Team identifier                                |
| `teamUser`       | object | Team user details and permissions              |
| `model`          | string | Model used for processing                      |
| `type`           | string | Feature type (`UNIFY_CHAT_WITH_AI`)            |
| `metadata`       | object | Additional metadata (nullable)                 |
| `rating`         | number | User rating for the result (nullable)          |
| `feedback`       | string | User feedback text (nullable)                  |
| `conversationId` | string | Associated conversation ID (nullable)          |
| `status`         | string | Processing status (SUCCESS, FAILED, etc.)      |
| `createdAt`      | string | Record creation timestamp (ISO 8601)           |
| `aiRecordDetail` | object | Detailed request and response data (see below) |
| `modelDetail`    | object | Model information (name, provider)             |

#### aiRecordDetail Object

| Field | Type | Description |
|----|----|----|
| `promptObject` | object | Original request parameters (prompt, settings, etc.) |
| `resultObject` | string\[\] | AI-generated response content as a list of strings |

## Error Responses

### Bad Request (400)

``` json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required parameters or invalid format"
  }
}
```

### Unauthorized (401)

``` json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing API key"
  }
}
```

### Validation Error (422)

``` json
{
  "success": false,
  "error": {
    "code": "PROMPT_OBJECT_VALIDATION_FAILED",
    "message": "Invalid prompt object",
    "details": [
      {
        "field": "prompt",
        "message": "prompt must be a string"
      }
    ]
  }
}
```

### Rate Limited (429)

``` json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests"
  }
}
```

## Migration Guide

### Migrating from AI Feature API

If you are currently using the [AI Feature
API](/docs/api/ai-feature-api) with `CHAT_WITH_AI`, `CHAT_WITH_IMAGE`,
`CHAT_WITH_PDF`, or `CHAT_WITH_YOUTUBE_VIDEO` types, here's how to
migrate:

**Before (Legacy - AI Feature API):**

``` json
{
  "type": "CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Hello!",
    "isMixed": false,
    "webSearch": true,
    "numOfSite": 3,
    "maxWord": 500
  }
}
```

**After (New - Chat with AI API):**

``` json
{
  "type": "UNIFY_CHAT_WITH_AI",
  "model": "gpt-4o-mini",
  "promptObject": {
    "prompt": "Hello!",
    "settings": {
      "historySettings": {
        "isMixed": false
      },
      "webSearchSettings": {
        "webSearch": true,
        "numOfSite": 3,
        "maxWord": 500
      }
    }
  }
}
```

### Key Differences

| Aspect | Legacy (AI Feature API) | New (Chat with AI API) |
|----|----|----|
| **Endpoint** | `POST /api/features` | `POST /api/chat-with-ai` |
| **Type** | `CHAT_WITH_AI` / `CHAT_WITH_IMAGE` / `CHAT_WITH_PDF` / `CHAT_WITH_YOUTUBE_VIDEO` | `UNIFY_CHAT_WITH_AI` |
| **Prompt structure** | Flat `promptObject` with mixed params | Structured `promptObject` with nested settings |
| **Image support** | Separate `CHAT_WITH_IMAGE` type + `imageList` | Same type with `attachments.images` |
| **Web search** | Top-level `webSearch`, `numOfSite`, `maxWord` | Nested under `settings.webSearchSettings` |
| **History config** | Top-level `isMixed` | Nested under `settings.historySettings` |
| **PDF/File support** | Separate `CHAT_WITH_PDF` type + conversation | Same type with `attachments.files` |
| **YouTube support** | Separate `CHAT_WITH_YOUTUBE_VIDEO` type + conversation | Same type — just include YouTube URL in prompt |
| **Memory** | Not available | `settings.withMemories` for cross-conversation memory |
| **Streaming events** | Raw text stream | Structured SSE with `content`, `result`, `done` events |

### Conversation Type Changes

When creating conversations via [Create a Conversation for
History](#create-a-conversation-for-history), use `UNIFY_CHAT_WITH_AI`
as the type instead of `CHAT_WITH_AI`, `CHAT_WITH_IMAGE`,
`CHAT_WITH_PDF`, or `CHAT_WITH_YOUTUBE_VIDEO`.

