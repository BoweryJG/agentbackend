# AgentBackend

Centralized backend for healthcare conversational agents. This system manages and deploys AI-powered dental practice assistants to multiple healthcare clients.

## Features

- **15 Pre-configured Agents**: Multilingual healthcare assistants with unique personalities
- **Multi-tenant Architecture**: Deploy agents to different healthcare practices
- **Real-time Chat**: Claude AI-powered conversations with WebSocket support
- **Agent Management**: CRUD operations for agent configurations
- **Deployment Tracking**: Monitor which agents are deployed to which clients
- **Language Support**: English and Spanish speaking agents
- **Voice Integration**: Ready for voice interaction capabilities

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Add your Anthropic API key to .env
   ```

3. **Migrate agents (if needed):**
   ```bash
   npm run migrate
   ```

4. **Start the server:**
   ```bash
   npm start
   # Development mode: npm run dev
   ```

5. **Test the API:**
   ```bash
   npm test
   ```

## Available Agents

### English-Speaking Agents
- **Julie** - Care Coordinator (Primary)
- **Brian** - Senior Advisor  
- **Maria** - Office Manager (Staten Island)
- **Gina** - Treatment Coordinator (Direct/Honest)
- **Teresa** - Patient Advocate (Nurturing)
- **Tony** - Operations Chief (Confident)
- **Vinny** - Community Liaison (Friendly)
- **Joey** - Tech Specialist (Enthusiastic)
- **Dr. Pedro** - Head Dentist

### Spanish-Speaking Agents
- **Carmen** - Bilingual Receptionist (Dominican)
- **Rosa** - Dental Assistant (Mexican)
- **Miguel** - Scheduling Coordinator (Puerto Rican)
- **Carlos** - Clinical Coordinator (Venezuelan)
- **María** - Spanish Specialist
- **Carlos** - Spanish Advisor

## License

ISC
EOF < /dev/null