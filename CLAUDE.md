# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AgentBackend is a centralized Express.js API server for healthcare conversational agents powered by AI (Claude). It features multi-tenant architecture, real-time chat via WebSocket, and voice integration capabilities.

## Common Commands

### Development
```bash
# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Start production server
npm start
```

### Testing
```bash
# Run general API tests
npm test

# Test voice functionality
npm run test:voice

# Run specific test files
node test-auth.js
node test-chat.js
node test-deployment.js
```

### Data Migration
```bash
# Migrate agent configurations
npm run migrate
```

## Architecture

### Core Components

1. **Main Server** (`index.js`): Express server with Socket.IO for real-time communication
   - CORS configuration for multiple client domains
   - Rate limiting and security middleware (Helmet)
   - WebSocket handling for chat and WebRTC voice communication

2. **Routes** (`/routes`):
   - `auth.js`: JWT-based authentication for admin/client roles
   - `agents.js`: CRUD operations for AI agent configurations
   - `chat.js`: Claude AI-powered chat endpoints
   - `deployment.js`: Agent deployment tracking to client systems
   - `voice.js`: Voice session management and WebRTC signaling

3. **Middleware** (`/middleware`):
   - `auth.js`: Authentication middleware with role-based access control (RBAC)
     - Roles: admin, client, public

4. **Data Storage** (`/data`):
   - `/agents/*.json`: Individual agent personality configurations
   - `deployments.json`: Agent-to-client deployment mappings

### Key Integrations

- **Claude AI** (Anthropic SDK): Powers agent conversations
- **Supabase**: Database integration (configured via environment)
- **Socket.IO**: Real-time chat and WebRTC signaling
- **JWT**: Stateless authentication

### Environment Variables

Required in `.env`:
- `ANTHROPIC_API_KEY`: Claude API access
- `JWT_SECRET`: Token signing (change from default!)
- `PORT`: Server port (default: 3002)
- `ALLOWED_ORIGINS`: CORS-allowed domains (comma-separated)

Optional:
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`: Database connection
- `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`: Additional AI services
- Rate limiting: `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`

### Agent System

Agents are JSON-configured AI personalities stored in `/data/agents/`. Each agent has:
- Unique ID, name, role, language
- System prompt defining personality/expertise
- Deployment status and client assignments

The system supports 15+ pre-configured healthcare agents in English and Spanish.

### WebSocket Events

Chat events:
- `agent:select`: Select an agent for conversation
- `chat:message`: Send message to agent
- `chat:response`: Receive agent response

Voice/WebRTC events:
- `voice:join-session`, `voice:leave-session`: Session management
- `webrtc:offer`, `webrtc:answer`, `webrtc:ice-candidate`: WebRTC signaling
- `voice:transcription`, `voice:agent-response`: Voice interaction

### Security Notes

- Default admin credentials: `admin/admin123` - **MUST BE CHANGED**
- JWT tokens expire in 24 hours by default
- Rate limiting: 100 requests per 15 minutes per IP
- All production deployments should use proper SSL/TLS