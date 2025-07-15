import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize, ROLES } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get agents directory path
const agentsDir = path.join(__dirname, '..', 'data', 'agents');

// Load all agents from JSON files
async function loadAgents() {
  try {
    const files = await fs.readdir(agentsDir);
    const agents = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(agentsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const agent = JSON.parse(content);
        agents.push(agent);
      }
    }
    
    // Sort by priority
    return agents.sort((a, b) => (a.priority || 999) - (b.priority || 999));
  } catch (error) {
    console.error('Error loading agents:', error);
    return [];
  }
}

// Load single agent
async function loadAgent(agentId) {
  try {
    const filePath = path.join(agentsDir, `${agentId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

// GET /api/agents - List all agents
router.get('/', async (req, res) => {
  try {
    const agents = await loadAgents();
    
    // Filter by language if requested
    const { language, category, subcategory, targetAudience } = req.query;
    let filteredAgents = agents;
    
    if (language) {
      filteredAgents = filteredAgents.filter(agent => agent.language === language);
    }
    
    if (category) {
      filteredAgents = filteredAgents.filter(agent => agent.category === category);
    }
    
    if (subcategory) {
      filteredAgents = filteredAgents.filter(agent => agent.subcategory === subcategory);
    }
    
    if (targetAudience) {
      filteredAgents = filteredAgents.filter(agent => 
        agent.targetAudience && agent.targetAudience.includes(targetAudience)
      );
    }
    
    res.json({
      success: true,
      count: filteredAgents.length,
      agents: filteredAgents
    });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agents'
    });
  }
});

// GET /api/agents/:id - Get specific agent
router.get('/:id', async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    res.json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent'
    });
  }
});

// POST /api/agents - Create new agent (protected - admin only)
router.post('/', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const { id, ...agentData } = req.body;
    
    if (!id || !agentData.name) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID and name are required'
      });
    }
    
    // Check if agent already exists
    const existingAgent = await loadAgent(id);
    if (existingAgent) {
      return res.status(409).json({
        success: false,
        error: 'Agent with this ID already exists'
      });
    }
    
    // Create agent object with default values for new fields
    const agent = {
      id,
      ...agentData,
      category: agentData.category || 'healthcare',
      subcategory: agentData.subcategory || 'general',
      targetAudience: agentData.targetAudience || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Save to file
    const filePath = path.join(agentsDir, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(agent, null, 2));
    
    res.status(201).json({
      success: true,
      agent
    });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agent'
    });
  }
});

// PUT /api/agents/:id - Update agent (protected - admin only)
router.put('/:id', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Update agent data
    const updatedAgent = {
      ...agent,
      ...req.body,
      id: req.params.id, // Prevent ID change
      updated_at: new Date().toISOString()
    };
    
    // Save to file
    const filePath = path.join(agentsDir, `${req.params.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedAgent, null, 2));
    
    res.json({
      success: true,
      agent: updatedAgent
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agent'
    });
  }
});

// DELETE /api/agents/:id - Delete agent (protected - admin only)
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Delete file
    const filePath = path.join(agentsDir, `${req.params.id}.json`);
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      message: `Agent ${agent.name} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agent'
    });
  }
});

// GET /api/agents/categories - List available categories
router.get('/categories', async (req, res) => {
  try {
    const agents = await loadAgents();
    
    // Extract unique categories, subcategories, and target audiences
    const categories = [...new Set(agents.map(agent => agent.category).filter(Boolean))];
    const subcategories = [...new Set(agents.map(agent => agent.subcategory).filter(Boolean))];
    const targetAudiences = [...new Set(
      agents.flatMap(agent => agent.targetAudience || []).filter(Boolean)
    )];
    
    res.json({
      success: true,
      categories,
      subcategories,
      targetAudiences
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

// GET /api/agents/search/:query - Search agents
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const agents = await loadAgents();
    
    const results = agents.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.role.toLowerCase().includes(query) ||
      agent.tagline.toLowerCase().includes(query) ||
      (agent.category && agent.category.toLowerCase().includes(query)) ||
      (agent.subcategory && agent.subcategory.toLowerCase().includes(query)) ||
      (agent.targetAudience && agent.targetAudience.some(t => t.toLowerCase().includes(query))) ||
      agent.personality.specialties.some(s => s.toLowerCase().includes(query))
    );
    
    res.json({
      success: true,
      count: results.length,
      agents: results
    });
  } catch (error) {
    console.error('Error searching agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search agents'
    });
  }
});

// POST /api/agents/:id/test - Test agent with a message
router.post('/:id/test', async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const { message, context } = req.body;
    
    // Simple mock response for testing
    // In production, this would call the chat service
    const mockResponses = [
      `Hello! I'm ${agent.name}, ${agent.role}. ${agent.tagline}. How can I help you today?`,
      `Thank you for your message. As ${agent.name}, I'm here to assist you with ${agent.personality.specialties.join(', ')}.`,
      `I understand your concern. Let me help you with that. ${agent.personality.communication_style === 'friendly-professional' ? 'I\'m here to make this easy for you.' : 'Let\'s address this directly.'}`,
      `Based on what you've told me, I can definitely help. My approach is ${agent.personality.approach}, and I'll make sure you feel comfortable throughout.`
    ];
    
    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    
    res.json({
      success: true,
      response,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role
      },
      context,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test agent'
    });
  }
});

// POST /api/agents/:id/interact - Interactive chat with agent
router.post('/:id/interact', async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    const { message, sessionId, history } = req.body;
    
    // Generate contextual response based on agent personality
    let response = '';
    
    // Check for greeting
    if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
      response = `Hello! I'm ${agent.name}, your ${agent.role}. ${agent.tagline} How can I assist you today?`;
    }
    // Check for help request
    else if (message.toLowerCase().includes('help')) {
      response = `Of course! I specialize in ${agent.personality.specialties.join(', ')}. What specific area would you like help with?`;
    }
    // Check for appointment/scheduling
    else if (message.toLowerCase().includes('appointment') || message.toLowerCase().includes('schedule')) {
      if (agent.capabilities.scheduling) {
        response = `I'd be happy to help you schedule an appointment. What day and time work best for you?`;
      } else {
        response = `I'll connect you with our scheduling team who can help you book an appointment.`;
      }
    }
    // Default contextual response
    else {
      const responses = [
        `I understand. Let me help you with that. ${agent.personality.traits.includes('Warm') ? 'You\'re in good hands.' : ''}`,
        `Thank you for sharing that with me. Based on my experience with ${agent.personality.specialties[0]}, I can guide you through this.`,
        `That's a great question. In my role as ${agent.role}, I often help patients with similar concerns.`,
        `I appreciate you bringing this up. Let's work through this together, step by step.`
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }
    
    res.json({
      success: true,
      response,
      sessionId: sessionId || `session-${Date.now()}`,
      agent: {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        avatar: agent.avatar
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in agent interaction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process interaction'
    });
  }
});

// POST /api/agents/:id/deploy/pedro - Deploy agent to Pedro platform
router.post('/:id/deploy/pedro', async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // For now, just acknowledge the deployment request
    // In production, this would sync with Pedro backend
    console.log(`Deploying agent ${agent.id} to Pedro platform`);
    
    res.json({
      success: true,
      message: `Agent ${agent.name} deployed to Pedro platform`,
      agent: {
        id: agent.id,
        name: agent.name,
        platform: 'pedro'
      },
      deployedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deploying to Pedro:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy agent to Pedro'
    });
  }
});

// POST /api/agents/:id/deploy/repconnect1 - Deploy agent to RepConnect1 platform
router.post('/:id/deploy/repconnect1', async (req, res) => {
  try {
    const agent = await loadAgent(req.params.id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // For now, just acknowledge the deployment request
    // In production, this would sync with RepConnect1 backend
    console.log(`Deploying agent ${agent.id} to RepConnect1 platform`);
    
    res.json({
      success: true,
      message: `Agent ${agent.name} deployed to RepConnect1 platform`,
      agent: {
        id: agent.id,
        name: agent.name,
        platform: 'repconnect1'
      },
      deployedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error deploying to RepConnect1:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy agent to RepConnect1'
    });
  }
});

// DELETE /api/agents/:id/deploy/:platform - Undeploy agent from platform
router.delete('/:id/deploy/:platform', async (req, res) => {
  try {
    const { id, platform } = req.params;
    const agent = await loadAgent(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    if (!['pedro', 'repconnect1'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be "pedro" or "repconnect1"'
      });
    }
    
    // For now, just acknowledge the undeployment request
    console.log(`Undeploying agent ${agent.id} from ${platform} platform`);
    
    res.json({
      success: true,
      message: `Agent ${agent.name} undeployed from ${platform} platform`,
      agent: {
        id: agent.id,
        name: agent.name,
        platform
      },
      undeployedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error undeploying from ${req.params.platform}:`, error);
    res.status(500).json({
      success: false,
      error: `Failed to undeploy agent from ${req.params.platform}`
    });
  }
});

export default router;