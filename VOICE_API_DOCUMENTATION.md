# Voice API Documentation

## Overview

The Voice API provides WebRTC integration for real-time voice communication with conversational agents. It supports voice sessions, transcription, and agent personality integration.

## Base URL

```
http://localhost:3002/api/voice
```

## Authentication

Most endpoints support optional authentication. Protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Start Voice Session

**POST** `/session`

Start a new voice session with a specific agent.

#### Request Body

```json
{
  "agentId": "dr_pedro",
  "clientConfig": {
    "audioSettings": {
      "echoCancellation": true,
      "noiseSuppression": true
    }
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "voice_1672531200000_abc123def",
    "agentId": "dr_pedro",
    "agentName": "Dr. Pedro",
    "voiceConfig": {
      "voiceId": "pNInz6obpgDQGcFmaJgB",
      "voiceName": "Dr. Pedro",
      "settings": {
        "stability": 0.7,
        "similarityBoost": 0.8,
        "style": 0.5,
        "useSpeakerBoost": true
      }
    },
    "personality": {
      "traits": ["Expert", "Prestigious", "Innovative"],
      "communication_style": "professional",
      "approach": "empathetic",
      "tone": "warm-professional"
    },
    "capabilities": {
      "scheduling": true,
      "insurance_check": true,
      "basic_dental_info": true
    }
  }
}
```

### 2. Get Agent Voice Configuration

**GET** `/agents/:id/config`

Retrieve voice configuration for a specific agent.

#### Parameters

- `id` (path): Agent ID

#### Response

```json
{
  "success": true,
  "data": {
    "agentId": "dr_pedro",
    "agentName": "Dr. Pedro",
    "voiceConfig": {
      "enabled": true,
      "voice_id": "pNInz6obpgDQGcFmaJgB",
      "voice_name": "Dr. Pedro",
      "settings": {
        "stability": 0.7,
        "similarityBoost": 0.8,
        "style": 0.5,
        "useSpeakerBoost": true
      }
    },
    "personality": {
      "traits": ["Expert", "Prestigious", "Innovative"],
      "communication_style": "professional"
    },
    "language": "en",
    "audioSample": null
  }
}
```

### 3. Handle Voice Transcription

**POST** `/transcribe`

Process voice audio data and return transcription.

#### Request Body

```json
{
  "sessionId": "voice_1672531200000_abc123def",
  "audioData": "base64-encoded-audio-data",
  "format": "webm"
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "voice_1672531200000_abc123def",
    "transcription": {
      "text": "Hello, I'd like to schedule an appointment",
      "confidence": 0.95,
      "language": "en",
      "timestamp": "2023-12-31T12:00:00.000Z"
    },
    "agentResponse": {
      "text": "I'd be happy to help you schedule an appointment",
      "shouldSpeak": true
    }
  }
}
```

### 4. Handle WebRTC Offer/Answer

**POST** `/offer`

Exchange WebRTC offers and answers for establishing peer connection.

#### Request Body

```json
{
  "sessionId": "voice_1672531200000_abc123def",
  "type": "offer",
  "offer": {
    "type": "offer",
    "sdp": "v=0\r\no=- 123456789 2 IN IP4 127.0.0.1\r\n..."
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "voice_1672531200000_abc123def",
    "answer": {
      "type": "answer",
      "sdp": "v=0\r\no=- 987654321 2 IN IP4 127.0.0.1\r\n...",
      "timestamp": "2023-12-31T12:00:00.000Z"
    },
    "status": "answer-sent"
  }
}
```

### 5. Handle ICE Candidates

**POST** `/ice`

Exchange ICE candidates for WebRTC connection.

#### Request Body

```json
{
  "sessionId": "voice_1672531200000_abc123def",
  "candidate": {
    "candidate": "candidate:1 1 UDP 2113667326 192.168.1.100 54400 typ host",
    "sdpMLineIndex": 0,
    "sdpMid": "audio"
  }
}
```

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "voice_1672531200000_abc123def",
    "candidatesReceived": 3,
    "status": "offer-received"
  }
}
```

### 6. Get Voice Session Status

**GET** `/sessions/:id`

Get current status of a voice session.

#### Parameters

- `id` (path): Session ID

#### Response

```json
{
  "success": true,
  "data": {
    "id": "voice_1672531200000_abc123def",
    "agentId": "dr_pedro",
    "agentName": "Dr. Pedro",
    "status": "answer-sent",
    "createdAt": "2023-12-31T12:00:00.000Z",
    "lastActivity": "2023-12-31T12:05:00.000Z",
    "iceCandidatesCount": 3,
    "hasOffer": true,
    "hasAnswer": true
  }
}
```

### 7. End Voice Session

**DELETE** `/sessions/:id`

End an active voice session.

#### Parameters

- `id` (path): Session ID

#### Response

```json
{
  "success": true,
  "data": {
    "sessionId": "voice_1672531200000_abc123def",
    "message": "Voice session ended successfully"
  }
}
```

### 8. List Active Sessions (Admin Only)

**GET** `/sessions`

List all active voice sessions. Requires admin authentication.

#### Headers

```
Authorization: Bearer <admin_jwt_token>
```

#### Response

```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "voice_1672531200000_abc123def",
        "agentId": "dr_pedro",
        "agentName": "Dr. Pedro",
        "status": "answer-sent",
        "createdAt": "2023-12-31T12:00:00.000Z",
        "lastActivity": "2023-12-31T12:05:00.000Z",
        "userId": "user123"
      }
    ],
    "count": 1
  }
}
```

## WebSocket Events

The system also supports real-time WebSocket communication for better WebRTC signaling:

### Client Events (Emit)

- `voice:join-session` - Join a voice session room
- `voice:leave-session` - Leave a voice session room
- `webrtc:offer` - Send WebRTC offer
- `webrtc:answer` - Send WebRTC answer
- `webrtc:ice-candidate` - Send ICE candidate
- `voice:transcription` - Send voice transcription
- `voice:agent-response` - Send agent response

### Server Events (Listen)

- `voice:session-joined` - Confirmation of joining session
- `voice:session-left` - Confirmation of leaving session
- `webrtc:offer` - Receive WebRTC offer from peer
- `webrtc:answer` - Receive WebRTC answer from peer
- `webrtc:ice-candidate` - Receive ICE candidate from peer
- `voice:transcription` - Receive transcription from peer
- `voice:agent-response` - Receive agent response

### WebSocket Example

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3002');

// Join voice session
socket.emit('voice:join-session', { sessionId: 'voice_123...' });

// Handle WebRTC offer
socket.on('webrtc:offer', (data) => {
  console.log('Received offer:', data.offer);
  // Process offer and send answer
});

// Send ICE candidate
socket.emit('webrtc:ice-candidate', {
  sessionId: 'voice_123...',
  candidate: iceCandidate
});
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (missing parameters, invalid data)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (agent or session not found)
- `500` - Internal Server Error

## Session Management

- Sessions automatically expire after 30 minutes of inactivity
- Sessions are cleaned up automatically every 5 minutes
- Session IDs are unique and generated with timestamp + random string
- Sessions store WebRTC state, ICE candidates, and agent configuration

## Integration Notes

1. **Agent Selection**: Always check if an agent supports voice (`voice_config.enabled: true`) before starting a session
2. **Session Management**: Store session IDs on the client side for subsequent API calls
3. **WebRTC Flow**: Use both REST API and WebSocket for optimal WebRTC signaling
4. **Error Handling**: Implement proper error handling for network issues and session timeouts
5. **Authentication**: Use optional authentication for better session management and access control

## Example Integration Flow

```javascript
// 1. Get agent voice config
const agentConfig = await fetch('/api/voice/agents/dr_pedro/config');

// 2. Start voice session
const session = await fetch('/api/voice/session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentId: 'dr_pedro' })
});

// 3. Join WebSocket room
socket.emit('voice:join-session', { sessionId: session.data.sessionId });

// 4. Establish WebRTC connection
// (Use session.data.voiceConfig for agent-specific voice settings)

// 5. Exchange offers/answers via REST API or WebSocket

// 6. Send audio for transcription
const transcription = await fetch('/api/voice/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: session.data.sessionId,
    audioData: base64AudioData
  })
});
```