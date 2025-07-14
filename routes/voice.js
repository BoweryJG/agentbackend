import express from 'express';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import { authenticate, optionalAuth, ROLES } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'voice.log' }),
  ],
});

// In-memory session storage (in production, use Redis or database)
const voiceSessions = new Map();

// Helper function to load agent data
const loadAgentData = (agentId) => {
  try {
    const agentPath = join(__dirname, '..', 'data', 'agents', `${agentId}.json`);
    const agentData = JSON.parse(readFileSync(agentPath, 'utf8'));
    return agentData;
  } catch (error) {
    logger.error('Error loading agent data', { agentId, error: error.message });
    return null;
  }
};

// Generate session ID
const generateSessionId = () => {
  return `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * POST /api/voice/session
 * Start voice session with specific agent
 */
router.post('/session', optionalAuth, async (req, res) => {
  try {
    const { agentId, clientConfig } = req.body;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }

    // Load agent configuration
    const agent = loadAgentData(agentId);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Check if agent has voice capabilities
    if (!agent.voice_config || !agent.voice_config.enabled) {
      return res.status(400).json({
        success: false,
        error: 'Agent does not support voice interactions'
      });
    }

    // Create voice session
    const sessionId = generateSessionId();
    const session = {
      id: sessionId,
      agentId,
      agentName: agent.name,
      voiceConfig: agent.voice_config,
      personality: agent.personality,
      capabilities: agent.capabilities,
      userId: req.user?.id || null,
      clientConfig: clientConfig || {},
      status: 'initiated',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      rtcOffer: null,
      rtcAnswer: null,
      iceCandidates: []
    };

    voiceSessions.set(sessionId, session);

    logger.info('Voice session created', { 
      sessionId, 
      agentId, 
      userId: req.user?.id 
    });

    res.json({
      success: true,
      data: {
        sessionId,
        agentId,
        agentName: agent.name,
        voiceConfig: {
          voiceId: agent.voice_config.voice_id,
          voiceName: agent.voice_config.voice_name,
          settings: agent.voice_config.settings
        },
        personality: agent.personality,
        capabilities: agent.capabilities
      }
    });

  } catch (error) {
    logger.error('Error creating voice session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to create voice session'
    });
  }
});

/**
 * POST /api/voice/transcribe
 * Handle voice transcription
 */
router.post('/transcribe', optionalAuth, async (req, res) => {
  try {
    const { sessionId, audioData, format = 'webm' } = req.body;

    if (!sessionId || !audioData) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and audio data are required'
      });
    }

    // Get session
    const session = voiceSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Voice session not found'
      });
    }

    // Update session activity
    session.lastActivity = new Date().toISOString();

    // TODO: Integrate with speech-to-text service (e.g., Whisper, Google Speech-to-Text)
    // For now, return a placeholder response
    const transcriptionResult = {
      text: "Transcription placeholder - integrate with actual STT service",
      confidence: 0.95,
      language: session.agentId.includes('_es') ? 'es' : 'en',
      timestamp: new Date().toISOString()
    };

    logger.info('Voice transcription processed', { 
      sessionId, 
      textLength: transcriptionResult.text.length 
    });

    res.json({
      success: true,
      data: {
        sessionId,
        transcription: transcriptionResult,
        agentResponse: {
          text: `Agent ${session.agentName} received your message`,
          shouldSpeak: true
        }
      }
    });

  } catch (error) {
    logger.error('Error processing voice transcription', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to process voice transcription'
    });
  }
});

/**
 * GET /api/voice/agents/:id/config
 * Get agent voice configuration
 */
router.get('/agents/:id/config', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Load agent data
    const agent = loadAgentData(id);
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Check if agent has voice capabilities
    if (!agent.voice_config) {
      return res.status(404).json({
        success: false,
        error: 'Agent does not have voice configuration'
      });
    }

    logger.info('Agent voice config retrieved', { agentId: id });

    res.json({
      success: true,
      data: {
        agentId: id,
        agentName: agent.name,
        voiceConfig: agent.voice_config,
        personality: agent.personality,
        capabilities: agent.capabilities,
        language: agent.language,
        audioSample: agent.audioSample || null
      }
    });

  } catch (error) {
    logger.error('Error retrieving agent voice config', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agent voice configuration'
    });
  }
});

/**
 * POST /api/voice/offer
 * Handle WebRTC offer/answer exchange
 */
router.post('/offer', optionalAuth, async (req, res) => {
  try {
    const { sessionId, offer, type = 'offer' } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Get session
    const session = voiceSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Voice session not found'
      });
    }

    // Update session activity
    session.lastActivity = new Date().toISOString();

    if (type === 'offer') {
      session.rtcOffer = offer;
      session.status = 'offer-received';
      
      // TODO: Generate actual WebRTC answer based on agent capabilities
      // For now, return a placeholder response
      const answer = {
        type: 'answer',
        sdp: 'v=0\\r\\no=- 123456789 2 IN IP4 127.0.0.1\\r\\n...(placeholder SDP answer)',
        timestamp: new Date().toISOString()
      };
      
      session.rtcAnswer = answer;
      session.status = 'answer-sent';

      logger.info('WebRTC offer processed', { sessionId, type });

      res.json({
        success: true,
        data: {
          sessionId,
          answer,
          status: session.status
        }
      });

    } else if (type === 'answer') {
      session.rtcAnswer = offer; // 'offer' contains the answer in this case
      session.status = 'answer-received';

      logger.info('WebRTC answer received', { sessionId });

      res.json({
        success: true,
        data: {
          sessionId,
          status: session.status
        }
      });

    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid offer type. Must be "offer" or "answer"'
      });
    }

  } catch (error) {
    logger.error('Error handling WebRTC offer/answer', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to handle WebRTC offer/answer'
    });
  }
});

/**
 * POST /api/voice/ice
 * Handle ICE candidates for WebRTC
 */
router.post('/ice', optionalAuth, async (req, res) => {
  try {
    const { sessionId, candidate } = req.body;

    if (!sessionId || !candidate) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and ICE candidate are required'
      });
    }

    // Get session
    const session = voiceSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Voice session not found'
      });
    }

    // Update session activity
    session.lastActivity = new Date().toISOString();

    // Store ICE candidate
    session.iceCandidates.push({
      candidate,
      timestamp: new Date().toISOString()
    });

    logger.info('ICE candidate received', { 
      sessionId, 
      candidateCount: session.iceCandidates.length 
    });

    res.json({
      success: true,
      data: {
        sessionId,
        candidatesReceived: session.iceCandidates.length,
        status: session.status
      }
    });

  } catch (error) {
    logger.error('Error handling ICE candidate', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to handle ICE candidate'
    });
  }
});

/**
 * GET /api/voice/sessions/:id
 * Get voice session status
 */
router.get('/sessions/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get session
    const session = voiceSessions.get(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Voice session not found'
      });
    }

    // Check if user has access to this session
    if (session.userId && req.user?.id !== session.userId && req.user?.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this voice session'
      });
    }

    logger.info('Voice session status retrieved', { sessionId: id });

    // Return session status without sensitive data
    const sessionStatus = {
      id: session.id,
      agentId: session.agentId,
      agentName: session.agentName,
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      iceCandidatesCount: session.iceCandidates.length,
      hasOffer: !!session.rtcOffer,
      hasAnswer: !!session.rtcAnswer
    };

    res.json({
      success: true,
      data: sessionStatus
    });

  } catch (error) {
    logger.error('Error retrieving voice session status', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve voice session status'
    });
  }
});

/**
 * DELETE /api/voice/sessions/:id
 * End voice session
 */
router.delete('/sessions/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get session
    const session = voiceSessions.get(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Voice session not found'
      });
    }

    // Check if user has access to this session
    if (session.userId && req.user?.id !== session.userId && req.user?.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this voice session'
      });
    }

    // Remove session
    voiceSessions.delete(id);

    logger.info('Voice session ended', { sessionId: id });

    res.json({
      success: true,
      data: {
        sessionId: id,
        message: 'Voice session ended successfully'
      }
    });

  } catch (error) {
    logger.error('Error ending voice session', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to end voice session'
    });
  }
});

/**
 * GET /api/voice/sessions
 * List active voice sessions (admin only)
 */
router.get('/sessions', authenticate, async (req, res) => {
  try {
    // Only admins can list all sessions
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const sessions = Array.from(voiceSessions.values()).map(session => ({
      id: session.id,
      agentId: session.agentId,
      agentName: session.agentName,
      status: session.status,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      userId: session.userId
    }));

    logger.info('Voice sessions listed', { count: sessions.length });

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });

  } catch (error) {
    logger.error('Error listing voice sessions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to list voice sessions'
    });
  }
});

// POST /api/voices/preview - Generate voice preview
router.post('/preview', async (req, res) => {
  try {
    const { voiceId, text, settings } = req.body;
    
    if (!voiceId || !text) {
      return res.status(400).json({
        error: 'Voice ID and text are required'
      });
    }
    
    // In a real implementation, this would call a TTS service
    // For now, return a mock audio response
    logger.info('Voice preview requested', { voiceId, textLength: text.length });
    
    // Create a simple WAV header for a silent audio file
    const sampleRate = 44100;
    const duration = 2; // 2 seconds
    const numSamples = sampleRate * duration;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;
    
    const buffer = Buffer.alloc(44 + dataSize);
    
    // RIFF header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    
    // fmt chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // fmt chunk size
    buffer.writeUInt16LE(1, 20); // audio format (PCM)
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    
    // data chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);
    
    // Fill with silence (zeros already from Buffer.alloc)
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length
    });
    
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating voice preview', { error: error.message });
    res.status(500).json({
      error: 'Failed to generate voice preview'
    });
  }
});

// Clean up old sessions periodically (runs every 5 minutes)
setInterval(() => {
  const now = new Date();
  const maxAge = 30 * 60 * 1000; // 30 minutes

  for (const [sessionId, session] of voiceSessions.entries()) {
    const lastActivity = new Date(session.lastActivity);
    if (now - lastActivity > maxAge) {
      voiceSessions.delete(sessionId);
      logger.info('Cleaned up inactive voice session', { sessionId });
    }
  }
}, 5 * 60 * 1000);

export default router;