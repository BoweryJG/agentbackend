import express from 'express';
import { Anthropic } from '@anthropic-ai/sdk';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Anthropic client if API key is available
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

// In-memory conversation storage (use database in production)
const conversations = new Map();

// POST /api/chat - Start or continue a chat conversation
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { 
      agentId, 
      message, 
      conversationId = uuidv4(),
      clientId 
    } = req.body;
    
    // If authenticated, use the user's clientId
    const effectiveClientId = req.user?.clientId || clientId || 'anonymous';
    
    if (!agentId || !message) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID and message are required'
      });
    }
    
    // Load agent configuration
    const agentPath = path.join(__dirname, '..', 'data', 'agents', `${agentId}.json`);
    const agentContent = await fs.readFile(agentPath, 'utf-8');
    const agent = JSON.parse(agentContent);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Get or create conversation
    let conversation = conversations.get(conversationId);
    if (!conversation) {
      conversation = {
        id: conversationId,
        agentId,
        clientId,
        messages: [],
        created_at: new Date().toISOString()
      };
      conversations.set(conversationId, conversation);
    }
    
    // Add user message
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });
    
    // Generate response
    let response;
    if (anthropic) {
      // Use Claude for response
      response = await generateClaudeResponse(agent, conversation);
    } else {
      // Fallback response
      response = generateFallbackResponse(agent, message);
    }
    
    // Add assistant response
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      conversationId,
      response,
      agent: {
        id: agent.id,
        name: agent.name,
        avatar: agent.avatar
      }
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message'
    });
  }
});

// GET /api/chat/:conversationId - Get conversation history
router.get('/:conversationId', async (req, res) => {
  try {
    const conversation = conversations.get(req.params.conversationId);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
});

// Generate response using Claude
async function generateClaudeResponse(agent, conversation) {
  const systemPrompt = buildSystemPrompt(agent);
  
  const messages = conversation.messages.map(msg => ({
    role: msg.role,
    content: msg.content
  }));
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: messages
    });
    
    return response.content[0].text;
  } catch (error) {
    console.error('Claude API error:', error);
    return generateFallbackResponse(agent, messages[messages.length - 1].content);
  }
}

// Build system prompt for agent
function buildSystemPrompt(agent) {
  const traits = agent.personality.traits.join(', ');
  const specialties = agent.personality.specialties.join(', ');
  
  let prompt = `You are ${agent.name}, ${agent.role} at Dr. Pedro's dental practice.
Your personality traits: ${traits}
Your specialties: ${specialties}
Your tagline: "${agent.tagline}"

Communication style: ${agent.personality.communication_style || 'professional'}
Approach: ${agent.personality.approach || 'empathetic'}
Tone: ${agent.personality.tone || 'warm-professional'}`;

  if (agent.personality.origin) {
    prompt += `\nYou are from ${agent.personality.origin} and speak with that local flavor.`;
  }
  
  if (agent.personality.language) {
    prompt += `\nYou speak ${agent.personality.language}.`;
  }
  
  prompt += `\n\nProvide helpful, accurate information about dental care while maintaining your unique personality.
Keep responses concise and conversational. If asked about appointments, guide them through scheduling.
Always be professional while showing your personality.`;
  
  return prompt;
}

// Generate fallback response when Claude is not available
function generateFallbackResponse(agent, message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
    return `Hi! I'm ${agent.name}, ${agent.role}. I'd be happy to help you schedule an appointment. What day works best for you?`;
  }
  
  if (lowerMessage.includes('insurance')) {
    return `As ${agent.role}, I can help with insurance questions. We accept most major dental insurance plans. Would you like me to check if we accept your specific insurance?`;
  }
  
  if (lowerMessage.includes('pain') || lowerMessage.includes('emergency')) {
    return `I understand you're experiencing discomfort. As ${agent.name}, I want to make sure you get the care you need. If this is a dental emergency, we can see you today. Would you like me to arrange an urgent appointment?`;
  }
  
  if (lowerMessage.includes('cost') || lowerMessage.includes('price')) {
    return `I'm ${agent.name}, and I can help with pricing information. The cost varies depending on the procedure. Would you like to tell me what specific treatment you're interested in?`;
  }
  
  // Default response
  return `Hello! I'm ${agent.name}, ${agent.role} at Dr. Pedro's office. ${agent.tagline}. How can I help you today?`;
}

export default router;