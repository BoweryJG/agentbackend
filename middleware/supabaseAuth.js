import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl && supabaseServiceKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase not configured. Using legacy auth. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable Supabase auth.');
}

// Only create Supabase client if configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Role definitions (same as before)
export const ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
  PUBLIC: 'public'
};

// Get user role from metadata
const getUserRole = (user) => {
  return user?.user_metadata?.role || ROLES.PUBLIC;
};

// Verify Supabase JWT token
export const verifySupabaseToken = async (token) => {
  if (!supabase) {
    console.warn('Supabase not configured, cannot verify token');
    return null;
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    // Add role to user object
    user.role = getUserRole(user);
    
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Authentication middleware using Supabase
export const authenticate = async (req, res, next) => {
  // If Supabase is not configured, fall back to legacy auth
  if (!supabase) {
    const legacyAuth = await import('./auth.js');
    return legacyAuth.authenticate(req, res, next);
  }
  
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }
    
    const token = authHeader.substring(7);
    const user = await verifySupabaseToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      metadata: user.user_metadata,
      clientId: user.user_metadata?.clientId || null
    };
    
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

// Client authorization middleware
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

// Optional authentication
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await verifySupabaseToken(token);
      
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: getUserRole(user),
          metadata: user.user_metadata
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Create or update user role
export const setUserRole = async (userId, role, clientId = null) => {
  if (!supabase) {
    console.warn('Supabase not configured, cannot set user role');
    return { success: false, error: 'Supabase not configured' };
  }
  
  try {
    const metadata = { role };
    if (clientId) {
      metadata.clientId = clientId;
    }
    
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { user_metadata: metadata }
    );
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    return { success: false, error: error.message };
  }
};

// Get user by email
export const getUserByEmail = async (email) => {
  if (!supabase) {
    console.warn('Supabase not configured, cannot get user by email');
    return null;
  }
  
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) throw error;
    
    return data.users.find(user => user.email === email);
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
};

export default {
  authenticate,
  authorize,
  authorizeClient,
  optionalAuth,
  setUserRole,
  getUserByEmail,
  ROLES,
  supabase
};