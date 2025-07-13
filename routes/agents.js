import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

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
    const { language } = req.query;
    const filteredAgents = language 
      ? agents.filter(agent => agent.language === language)
      : agents;
    
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

// POST /api/agents - Create new agent (protected)
router.post('/', async (req, res) => {
  try {
    // TODO: Add authentication check
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
    
    // Create agent object
    const agent = {
      id,
      ...agentData,
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

// PUT /api/agents/:id - Update agent (protected)
router.put('/:id', async (req, res) => {
  try {
    // TODO: Add authentication check
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

// DELETE /api/agents/:id - Delete agent (protected)
router.delete('/:id', async (req, res) => {
  try {
    // TODO: Add authentication check
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

// GET /api/agents/search/:query - Search agents
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const agents = await loadAgents();
    
    const results = agents.filter(agent => 
      agent.name.toLowerCase().includes(query) ||
      agent.role.toLowerCase().includes(query) ||
      agent.tagline.toLowerCase().includes(query) ||
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

export default router;