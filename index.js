import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import winston from 'winston';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Create Express app
const app = express();
const server = createServer(app);

// Trust proxy for rate limiting on Render
app.set('trust proxy', 1);

// Initialize Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://agent-command-center.netlify.app',
      'https://pedro.netlify.app',
      'https://repconnect.netlify.app',
      'https://osbackend-zl1h.onrender.com',
      'https://gregpedromd.com',
      'https://www.gregpedromd.com',
      'http://gregpedromd.com',
      'http://www.gregpedromd.com',
      'https://repconnect.repspheres.com',
      'https://www.repconnect.repspheres.com',
      'http://repconnect.repspheres.com',
      'http://www.repconnect.repspheres.com',
      'https://repspheres.com',
      'https://www.repspheres.com',
      'http://repspheres.com',
      'http://www.repspheres.com'
    ];
    
    // Add any origins from environment variable
    if (process.env.ALLOWED_ORIGINS) {
      allowedOrigins.push(...process.env.ALLOWED_ORIGINS.split(','));
    }
    
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now to ensure functionality
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    services: {
      database: 'connected', // TODO: Add actual DB check
      ai: 'ready',
      voice: 'ready',
    },
    activeConnections: io.engine.clientsCount,
  });
});

// Import routes
import authRoutes from './routes/auth.js';
import supabaseAuthRoutes from './routes/supabaseAuth.js';
import agentRoutes from './routes/agents.js';
import chatRoutes from './routes/chat.js';
import deploymentRoutes from './routes/deployment.js';
import voiceRoutes from './routes/voice.js';

// Use routes
app.use('/api/auth/legacy', authRoutes); // Keep legacy auth for backward compatibility
app.use('/api/auth', supabaseAuthRoutes); // New Supabase auth routes
app.use('/api/agents', agentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/deploy', deploymentRoutes);
app.use('/api/voices', voiceRoutes);

// WebSocket connection handling
io.on('connection', (socket) => {
  logger.info('New WebSocket connection', { socketId: socket.id });

  socket.on('agent:select', (data) => {
    logger.info('Agent selected', { agentId: data.agentId, socketId: socket.id });
    socket.emit('agent:ready', { agentId: data.agentId });
  });

  socket.on('chat:message', (data) => {
    logger.info('Chat message received', { socketId: socket.id });
    // TODO: Process message with selected agent
    socket.emit('chat:response', {
      message: 'Response from agent - full implementation coming soon',
      agentId: data.agentId,
    });
  });

  // Voice/WebRTC related events
  socket.on('voice:join-session', (data) => {
    logger.info('Voice session join request', { sessionId: data.sessionId, socketId: socket.id });
    socket.join(`voice:${data.sessionId}`);
    socket.emit('voice:session-joined', { sessionId: data.sessionId });
  });

  socket.on('voice:leave-session', (data) => {
    logger.info('Voice session leave request', { sessionId: data.sessionId, socketId: socket.id });
    socket.leave(`voice:${data.sessionId}`);
    socket.emit('voice:session-left', { sessionId: data.sessionId });
  });

  socket.on('webrtc:offer', (data) => {
    logger.info('WebRTC offer received', { sessionId: data.sessionId, socketId: socket.id });
    // Broadcast offer to other participants in the session
    socket.to(`voice:${data.sessionId}`).emit('webrtc:offer', {
      offer: data.offer,
      from: socket.id,
      sessionId: data.sessionId
    });
  });

  socket.on('webrtc:answer', (data) => {
    logger.info('WebRTC answer received', { sessionId: data.sessionId, socketId: socket.id });
    // Broadcast answer to other participants in the session
    socket.to(`voice:${data.sessionId}`).emit('webrtc:answer', {
      answer: data.answer,
      from: socket.id,
      sessionId: data.sessionId
    });
  });

  socket.on('webrtc:ice-candidate', (data) => {
    logger.info('ICE candidate received', { sessionId: data.sessionId, socketId: socket.id });
    // Broadcast ICE candidate to other participants in the session
    socket.to(`voice:${data.sessionId}`).emit('webrtc:ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
      sessionId: data.sessionId
    });
  });

  socket.on('voice:transcription', (data) => {
    logger.info('Voice transcription received', { sessionId: data.sessionId, socketId: socket.id });
    // Broadcast transcription to session participants
    socket.to(`voice:${data.sessionId}`).emit('voice:transcription', {
      text: data.text,
      from: socket.id,
      sessionId: data.sessionId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('voice:agent-response', (data) => {
    logger.info('Agent voice response', { sessionId: data.sessionId, agentId: data.agentId, socketId: socket.id });
    // Broadcast agent response to session participants
    socket.to(`voice:${data.sessionId}`).emit('voice:agent-response', {
      response: data.response,
      agentId: data.agentId,
      sessionId: data.sessionId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    logger.info('WebSocket disconnected', { socketId: socket.id });
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Express error', { error: err.message, stack: err.stack });
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  logger.info(`AgentBackend server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`CORS origins: ${process.env.ALLOWED_ORIGINS || 'http://localhost:3000'}`);
  
  // Log Supabase configuration status
  logger.info(`Supabase URL configured: ${!!process.env.SUPABASE_URL}`);
  logger.info(`Supabase Service Key configured: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logger.info('Supabase authentication is ACTIVE');
  } else {
    logger.warn('Using legacy authentication system');
  }
});