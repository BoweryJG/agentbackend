import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Get JWT secret from environment or use a default (should be changed in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Role definitions
export const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  PUBLIC: 'public'
};

// Hardcoded admin credentials for initial setup
// In production, these should be moved to a database
const ADMIN_USERS = [
  {
    id: 'admin1',
    username: 'admin',
    // Password: admin123 (hashed)
    password: '$2b$10$YourHashedPasswordHere', // Will be replaced with actual hash
    role: ROLES.ADMIN
  }
];

// Initialize admin password
const initializeAdminPassword = async () => {
  const defaultPassword = 'admin123'; // Change this!
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);
  ADMIN_USERS[0].password = hashedPassword;
  console.log('Admin password initialized. Default: admin/admin123 - PLEASE CHANGE THIS!');
};

// Call this when the module loads
initializeAdminPassword();

// Client credentials (for client-specific deployments)
const CLIENT_USERS = [
  {
    id: 'client1',
    username: 'client1',
    password: '$2b$10$ClientHashedPasswordHere', // Will be replaced
    role: ROLES.CLIENT,
    clientId: 'healthsystem1'
  }
];

// Initialize client passwords
const initializeClientPasswords = async () => {
  for (let i = 0; i < CLIENT_USERS.length; i++) {
    const defaultPassword = `client${i + 1}123`;
    CLIENT_USERS[i].password = await bcrypt.hash(defaultPassword, 10);
  }
};

initializeClientPasswords();

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    clientId: user.clientId || null
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Find user by username
export const findUserByUsername = async (username) => {
  // Check admin users
  const adminUser = ADMIN_USERS.find(u => u.username === username);
  if (adminUser) return adminUser;
  
  // Check client users
  const clientUser = CLIENT_USERS.find(u => u.username === username);
  if (clientUser) return clientUser;
  
  return null;
};

// Validate password
export const validatePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Authorization middleware - check for specific roles
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Client authorization middleware - ensure client can only access their own data
export const authorizeClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // Admins can access any client
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }
  
  // Clients can only access their own data
  if (req.user.role === ROLES.CLIENT) {
    const requestedClientId = req.params.clientId;
    
    if (requestedClientId && requestedClientId !== req.user.clientId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this client\'s data'
      });
    }
  }
  
  next();
};

// Optional authentication - allows public access but attaches user if token is provided
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = decoded;
      }
    }
    
    // Continue regardless of authentication status
    next();
  } catch (error) {
    // Ignore errors and continue
    next();
  }
};

export default {
  authenticate,
  authorize,
  authorizeClient,
  optionalAuth,
  generateToken,
  verifyToken,
  findUserByUsername,
  validatePassword,
  ROLES
};