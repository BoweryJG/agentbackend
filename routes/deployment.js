import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, authorize, authorizeClient, ROLES } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple file-based deployment tracking (in production, use a database)
const deploymentsFile = path.join(__dirname, '..', 'data', 'deployments.json');

// Load deployments
async function loadDeployments() {
  try {
    const content = await fs.readFile(deploymentsFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    // If file doesn't exist, return empty object
    return {};
  }
}

// Save deployments
async function saveDeployments(deployments) {
  await fs.writeFile(deploymentsFile, JSON.stringify(deployments, null, 2));
}

// POST /api/deploy/:clientId/:agentId - Deploy agent to client (admin or authorized client)
router.post('/:clientId/:agentId', authenticate, authorizeClient, async (req, res) => {
  try {
    const { clientId, agentId } = req.params;
    const { config = {} } = req.body;
    
    // Load current deployments
    const deployments = await loadDeployments();
    
    // Initialize client deployments if not exists
    if (!deployments[clientId]) {
      deployments[clientId] = {
        client_id: clientId,
        agents: [],
        created_at: new Date().toISOString()
      };
    }
    
    // Check if agent already deployed
    const existingIndex = deployments[clientId].agents.findIndex(
      a => a.agent_id === agentId
    );
    
    if (existingIndex >= 0) {
      // Update existing deployment
      deployments[clientId].agents[existingIndex] = {
        agent_id: agentId,
        config,
        deployed_at: new Date().toISOString(),
        active: true
      };
    } else {
      // Add new deployment
      deployments[clientId].agents.push({
        agent_id: agentId,
        config,
        deployed_at: new Date().toISOString(),
        active: true
      });
    }
    
    // Save deployments
    await saveDeployments(deployments);
    
    res.json({
      success: true,
      message: `Agent ${agentId} deployed to ${clientId}`,
      deployment: {
        client_id: clientId,
        agent_id: agentId,
        config,
        deployed_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deploying agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to deploy agent'
    });
  }
});

// GET /api/deploy/:clientId/agents - Get client's deployed agents (admin or authorized client)
router.get('/:clientId/agents', authenticate, authorizeClient, async (req, res) => {
  try {
    const { clientId } = req.params;
    const deployments = await loadDeployments();
    
    if (!deployments[clientId]) {
      return res.json({
        success: true,
        client_id: clientId,
        agents: []
      });
    }
    
    // Load agent details for each deployed agent
    const agentsDir = path.join(__dirname, '..', 'data', 'agents');
    const deployedAgents = [];
    
    for (const deployment of deployments[clientId].agents) {
      if (deployment.active) {
        try {
          const agentFile = path.join(agentsDir, `${deployment.agent_id}.json`);
          const agentContent = await fs.readFile(agentFile, 'utf-8');
          const agent = JSON.parse(agentContent);
          
          deployedAgents.push({
            ...agent,
            deployment: {
              deployed_at: deployment.deployed_at,
              config: deployment.config
            }
          });
        } catch (error) {
          console.error(`Error loading agent ${deployment.agent_id}:`, error);
        }
      }
    }
    
    res.json({
      success: true,
      client_id: clientId,
      agents: deployedAgents
    });
  } catch (error) {
    console.error('Error fetching client agents:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client agents'
    });
  }
});

// DELETE /api/deploy/:clientId/:agentId - Remove agent from client (admin or authorized client)
router.delete('/:clientId/:agentId', authenticate, authorizeClient, async (req, res) => {
  try {
    const { clientId, agentId } = req.params;
    const deployments = await loadDeployments();
    
    if (!deployments[clientId]) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }
    
    const agentIndex = deployments[clientId].agents.findIndex(
      a => a.agent_id === agentId
    );
    
    if (agentIndex < 0) {
      return res.status(404).json({
        success: false,
        error: 'Agent not deployed to this client'
      });
    }
    
    // Mark as inactive instead of deleting
    deployments[clientId].agents[agentIndex].active = false;
    deployments[clientId].agents[agentIndex].removed_at = new Date().toISOString();
    
    await saveDeployments(deployments);
    
    res.json({
      success: true,
      message: `Agent ${agentId} removed from ${clientId}`
    });
  } catch (error) {
    console.error('Error removing agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove agent'
    });
  }
});

// GET /api/deploy - Get all deployments (admin only)
router.get('/', authenticate, authorize(ROLES.ADMIN), async (req, res) => {
  try {
    const deployments = await loadDeployments();
    
    res.json({
      success: true,
      deployments
    });
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deployments'
    });
  }
});

export default router;