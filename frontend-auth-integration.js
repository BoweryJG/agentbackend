// Frontend Auth Integration Example
// This can be used in Pedro, RepConnect, and Agent Command Center

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Auth service for integration with AgentBackend
export const agentBackendAuth = {
  // Sign in with Google
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'email profile'
        }
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle auth callback
  async handleAuthCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      if (!session) throw new Error('No session found');
      
      // Register session with AgentBackend
      const response = await fetch(`${this.getAgentBackendUrl()}/api/auth/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to register with AgentBackend');
      }
      
      const data = await response.json();
      
      // Store user info
      localStorage.setItem('agentbackend_user', JSON.stringify(data.user));
      
      return { success: true, user: data.user, session };
    } catch (error) {
      console.error('Auth callback error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return session;
  },

  // Get current user
  async getCurrentUser() {
    const session = await this.getSession();
    if (!session) return null;
    
    try {
      const response = await this.authenticatedFetch('/api/auth/me');
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  // Sign out
  async signOut() {
    try {
      // Notify backend
      await this.authenticatedFetch('/api/auth/logout', {
        method: 'POST'
      });
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('agentbackend_user');
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Authenticated fetch helper
  async authenticatedFetch(path, options = {}) {
    const session = await this.getSession();
    if (!session) {
      throw new Error('No active session');
    }
    
    const url = `${this.getAgentBackendUrl()}${path}`;
    const headers = {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await this.refreshSession();
      if (refreshed.success) {
        // Retry with new token
        headers.Authorization = `Bearer ${refreshed.session.access_token}`;
        return fetch(url, { ...options, headers });
      }
    }
    
    return response;
  },

  // Refresh session
  async refreshSession() {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      return { success: true, session };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { success: false, error: error.message };
    }
  },

  // Get AgentBackend URL based on environment
  getAgentBackendUrl() {
    // For production
    if (window.location.hostname.includes('netlify.app') || 
        window.location.hostname.includes('onrender.com')) {
      return 'https://agentbackend-2932.onrender.com';
    }
    // For local development
    return process.env.REACT_APP_AGENT_BACKEND_URL || 
           process.env.VITE_AGENT_BACKEND_URL || 
           'http://localhost:3002';
  },

  // Check if user is admin
  async isAdmin() {
    const user = await this.getCurrentUser();
    return user?.role === 'admin';
  },

  // Check if user is client
  async isClient() {
    const user = await this.getCurrentUser();
    return user?.role === 'client';
  }
};

// Auth context provider for React
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session
    checkSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await handleNewSession(session);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const session = await agentBackendAuth.getSession();
      if (session) {
        await handleNewSession(session);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = async (session) => {
    setSession(session);
    const user = await agentBackendAuth.getCurrentUser();
    setUser(user);
  };

  const signIn = async () => {
    const result = await agentBackendAuth.signInWithGoogle();
    return result;
  };

  const signOut = async () => {
    const result = await agentBackendAuth.signOut();
    if (result.success) {
      setUser(null);
      setSession(null);
    }
    return result;
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
    isAdmin: user?.role === 'admin',
    isClient: user?.role === 'client',
    authenticatedFetch: agentBackendAuth.authenticatedFetch.bind(agentBackendAuth)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Example usage in components
export const ExampleComponent = () => {
  const { user, signIn, signOut, isAdmin, authenticatedFetch } = useAuth();
  
  const fetchAgents = async () => {
    try {
      const response = await authenticatedFetch('/api/agents');
      const data = await response.json();
      console.log('Agents:', data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };
  
  return (
    <div>
      {user ? (
        <div>
          <p>Welcome, {user.email}!</p>
          <p>Role: {user.role}</p>
          {isAdmin && <p>You have admin access</p>}
          <button onClick={signOut}>Sign Out</button>
          <button onClick={fetchAgents}>Fetch Agents</button>
        </div>
      ) : (
        <button onClick={signIn}>Sign In with Google</button>
      )}
    </div>
  );
};