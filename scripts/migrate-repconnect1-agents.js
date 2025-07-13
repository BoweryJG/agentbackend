#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const REPCONNECT1_PATH = '/Users/jasonsmacbookpro2022/repconnect1';
const AGENTBACKEND_PATH = '/Users/jasonsmacbookpro2022/agentbackend';
const OUTPUT_DIR = path.join(AGENTBACKEND_PATH, 'data', 'agents');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function to convert Harvey personality to agent format
function convertHarveyPersonality() {
  const harveyAgent = {
    id: 'harvey',
    name: 'Harvey Specter',
    role: 'Sales Excellence Coach',
    tagline: "I don't have dreams, I have goals",
    voiceId: 'VR6AewLTigWG4xSOukaG',
    avatar: '💼',
    gradient: 'linear-gradient(135deg, #1a1a1a 0%, #FFD700 50%, #1a1a1a 100%)',
    accentColor: '#FFD700',
    shadowColor: 'rgba(255, 215, 0, 0.5)',
    personality: {
      traits: ['Dominant', 'Direct', 'Competitive', 'Confident', 'Results-driven'],
      specialties: [
        'Closing techniques',
        'Objection handling',
        'Sales motivation',
        'Performance coaching',
        'Revenue optimization'
      ],
      communication_style: 'aggressive-direct',
      approach: 'challenging',
      tone: 'commanding-professional'
    },
    capabilities: {
      consultation: true,
      sales_training: true,
      motivation: true,
      performance_analysis: true,
      objection_handling: true,
      closing_techniques: true,
      competitive_analysis: true
    },
    voice_config: {
      enabled: true,
      voice_id: 'VR6AewLTigWG4xSOukaG',
      voice_name: 'Arnold',
      settings: {
        stability: 0.95,
        similarityBoost: 0.9,
        style: 0.7,
        useSpeakerBoost: true
      }
    },
    active: true,
    language: 'en',
    priority: 10,
    category: 'sales',
    subcategory: 'coaching',
    targetAudience: ['sales-teams', 'medical-practices', 'business-owners']
  };

  return harveyAgent;
}

// Helper function to convert aesthetic agents
function convertAestheticAgent(agentConfig) {
  // Map icon names to emojis
  const iconToEmoji = {
    'Sparkles': '✨',
    'Heart': '❤️',
    'Flower2': '🌺',
    'Sun': '☀️',
    'Gem': '💎',
    'Smile': '😊',
    'Crown': '👑',
    'Star': '⭐',
    'Brain': '🧠',
    'Zap': '⚡',
    'Network': '🌐',
    'Eye': '👁️',
    'DollarSign': '💰',
    'Trophy': '🏆'
  };

  // Determine category and subcategory
  let category = 'healthcare';
  let subcategory = 'aesthetic';
  
  if (['implants', 'orthodontics', 'cosmetic'].includes(agentConfig.id)) {
    subcategory = 'dental';
  } else if (['victor', 'maxwell', 'diana', 'marcus', 'sophia'].includes(agentConfig.id)) {
    category = 'sales';
    subcategory = 'medical-aesthetics';
  } else if (agentConfig.id === 'harvey') {
    category = 'general';
    subcategory = 'ai-assistant';
  }

  const agent = {
    id: agentConfig.id,
    name: agentConfig.name,
    role: agentConfig.tagline.split(' - ')[0] || 'Specialist',
    tagline: agentConfig.tagline,
    voiceId: agentConfig.voiceConfig.voiceId,
    avatar: iconToEmoji[agentConfig.avatar.icon?.name] || '👤',
    gradient: agentConfig.colorScheme.gradient,
    accentColor: agentConfig.colorScheme.primary,
    shadowColor: agentConfig.colorScheme.shadowColor,
    personality: {
      traits: agentConfig.personality.traits,
      specialties: agentConfig.knowledgeDomains.slice(0, 5),
      communication_style: mapCommunicationStyle(agentConfig.personality.tone),
      approach: mapApproach(agentConfig.personality.approachStyle),
      tone: mapTone(agentConfig.personality.tone)
    },
    capabilities: mapCapabilities(agentConfig.specialCapabilities, agentConfig.knowledgeDomains),
    voice_config: {
      enabled: true,
      voice_id: agentConfig.voiceConfig.voiceId,
      voice_name: agentConfig.name,
      settings: {
        stability: agentConfig.voiceConfig.stability,
        similarityBoost: agentConfig.voiceConfig.similarityBoost,
        style: agentConfig.voiceConfig.style,
        useSpeakerBoost: agentConfig.voiceConfig.speakerBoost
      }
    },
    active: true,
    language: 'en',
    priority: determinePriority(agentConfig.id),
    category: category,
    subcategory: subcategory,
    targetAudience: determineTargetAudience(category, subcategory)
  };

  return agent;
}

// Helper functions for mapping
function mapCommunicationStyle(tone) {
  if (tone.includes('aggressive') || tone.includes('direct')) return 'aggressive-direct';
  if (tone.includes('warm') || tone.includes('friendly')) return 'warm-friendly';
  if (tone.includes('professional')) return 'confident-professional';
  if (tone.includes('educational')) return 'educational';
  return 'professional';
}

function mapApproach(approachStyle) {
  if (approachStyle.includes('empathetic') || approachStyle.includes('caring')) return 'empathetic';
  if (approachStyle.includes('challenging') || approachStyle.includes('aggressive')) return 'challenging';
  if (approachStyle.includes('educational') || approachStyle.includes('consultative')) return 'consultative';
  return 'balanced';
}

function mapTone(tone) {
  if (tone.includes('warm')) return 'warm-professional';
  if (tone.includes('commanding') || tone.includes('direct')) return 'commanding-professional';
  if (tone.includes('friendly')) return 'friendly-casual';
  return 'professional';
}

function mapCapabilities(specialCapabilities, knowledgeDomains) {
  const capabilities = {
    consultation: true,
    treatment_explanation: true
  };

  // Map based on special capabilities
  specialCapabilities.forEach(cap => {
    const lower = cap.toLowerCase();
    if (lower.includes('roi') || lower.includes('revenue')) capabilities.revenue_optimization = true;
    if (lower.includes('closing')) capabilities.closing_techniques = true;
    if (lower.includes('analysis')) capabilities.performance_analysis = true;
    if (lower.includes('assessment')) capabilities.assessment = true;
    if (lower.includes('planning')) capabilities.treatment_planning = true;
    if (lower.includes('cost')) capabilities.cost_breakdown = true;
    if (lower.includes('virtual')) capabilities.virtual_consultation = true;
  });

  // Map based on knowledge domains
  knowledgeDomains.forEach(domain => {
    const lower = domain.toLowerCase();
    if (lower.includes('sales') || lower.includes('closing')) capabilities.sales_training = true;
    if (lower.includes('anxiety')) capabilities.anxietyManagement = true;
    if (lower.includes('education')) capabilities.patientEducation = true;
    if (lower.includes('pre') && lower.includes('treatment')) capabilities.preOperativeCare = true;
    if (lower.includes('post') && lower.includes('treatment')) capabilities.postOperativeCare = true;
  });

  return capabilities;
}

function determinePriority(agentId) {
  const highPriority = ['harvey', 'victor', 'maxwell', 'diana'];
  const mediumPriority = ['dr_bella', 'dr_sophia', 'dr_anchor', 'dr_bright'];
  
  if (highPriority.includes(agentId)) return 10;
  if (mediumPriority.includes(agentId)) return 7;
  return 5;
}

function determineTargetAudience(category, subcategory) {
  if (category === 'sales') {
    return ['medical-practices', 'business-owners', 'sales-teams'];
  } else if (subcategory === 'dental') {
    return ['dental-patients', 'dental-professionals'];
  } else if (subcategory === 'aesthetic') {
    return ['aesthetic-patients', 'medical-spas', 'cosmetic-practices'];
  }
  return ['general-audience'];
}

// Main migration function
async function migrateAgents() {
  console.log('Starting agent migration from repconnect1 to agentbackend...\n');

  try {
    // 1. Convert Harvey from harveyPersonality.js
    console.log('Converting Harvey personality...');
    const harveyAgent = convertHarveyPersonality();
    fs.writeFileSync(
      path.join(OUTPUT_DIR, 'harvey.json'),
      JSON.stringify(harveyAgent, null, 2)
    );
    console.log('✓ Created harvey.json');

    // 2. Load and convert aesthetic agents from agentConfigs.ts
    console.log('\nConverting aesthetic agents...');
    const agentConfigsPath = path.join(REPCONNECT1_PATH, 'src/components/ChatbotLauncher/agents/agentConfigs.ts');
    const agentConfigsContent = fs.readFileSync(agentConfigsPath, 'utf8');
    
    // Extract agent configurations (simple regex-based extraction)
    const aestheticAgents = [
      { id: 'botox', name: 'Dr. Bella', tagline: 'Your Botox & Neurotoxin Specialist' },
      { id: 'fillers', name: 'Dr. Sophia', tagline: 'Dermal Filler & Volume Expert' },
      { id: 'skincare', name: 'Dr. Luna', tagline: 'Advanced Skincare & Treatment Specialist' },
      { id: 'laser', name: 'Dr. Ray', tagline: 'Laser Treatment & Technology Expert' },
      { id: 'bodycontouring', name: 'Dr. Sculpt', tagline: 'Body Contouring & Transformation Specialist' },
      { id: 'implants', name: 'Dr. Anchor', tagline: 'Dental Implant & Restoration Expert' },
      { id: 'orthodontics', name: 'Dr. Align', tagline: 'Invisalign & Orthodontic Specialist' },
      { id: 'cosmetic', name: 'Dr. Bright', tagline: 'Cosmetic Dentistry & Smile Design Expert' }
    ];

    // Create simplified versions of aesthetic agents
    aestheticAgents.forEach(agent => {
      const agentConfig = {
        id: agent.id,
        name: agent.name,
        role: agent.tagline.split(' - ')[0] || 'Specialist',
        tagline: agent.tagline,
        voiceId: 'EXAVITQu4vr4xnSDxMaL', // Default voice
        avatar: '👩‍⚕️',
        gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
        accentColor: '#7C3AED',
        shadowColor: 'rgba(124, 58, 237, 0.3)',
        personality: {
          traits: ['Professional', 'Knowledgeable', 'Caring', 'Expert'],
          specialties: [agent.tagline],
          communication_style: 'confident-professional',
          approach: 'consultative',
          tone: 'warm-professional'
        },
        capabilities: {
          consultation: true,
          treatment_explanation: true,
          cost_breakdown: true,
          patientEducation: true,
          virtual_consultation: true
        },
        voice_config: {
          enabled: true,
          voice_id: 'EXAVITQu4vr4xnSDxMaL',
          voice_name: agent.name,
          settings: {
            stability: 0.75,
            similarityBoost: 0.85,
            style: 0.3,
            useSpeakerBoost: true
          }
        },
        active: true,
        language: 'en',
        priority: 5,
        category: 'healthcare',
        subcategory: agent.id.includes('implant') || agent.id.includes('orthodon') || agent.id.includes('cosmetic') ? 'dental' : 'aesthetic',
        targetAudience: agent.id.includes('implant') || agent.id.includes('orthodon') || agent.id.includes('cosmetic') ? ['dental-patients'] : ['aesthetic-patients']
      };

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${agent.id}.json`),
        JSON.stringify(agentConfig, null, 2)
      );
      console.log(`✓ Created ${agent.id}.json`);
    });

    // 3. Convert Harvey-style sales agents
    console.log('\nConverting Harvey-style sales agents...');
    const harveyStyleAgents = [
      {
        id: 'victor',
        name: 'Victor Sterling',
        tagline: 'The Revenue Maximizer - "I don\'t sell products, I deliver profit margins"',
        voiceId: 'VR6AewLTigWG4xSOukaG',
        icon: '💰'
      },
      {
        id: 'maxwell',
        name: 'Maxwell Crown',
        tagline: 'The Strategic Partner - "Your competition is already three steps ahead. Let\'s make it five."',
        voiceId: 'nPczCjzI2devNBz1zQrb',
        icon: '🏆'
      },
      {
        id: 'diana',
        name: 'Diana Pierce',
        tagline: 'The Disruptor - "Comfort zones don\'t pay for beach houses"',
        voiceId: 'EXAVITQu4vr4xnSDxMaL',
        icon: '⚡'
      },
      {
        id: 'marcus',
        name: 'Marcus Vale',
        tagline: 'The Network Amplifier - "Your next million-dollar client is one introduction away"',
        voiceId: 'SOYHLrjzK2X1ezoPC6cr',
        icon: '🌐'
      },
      {
        id: 'sophia_knight',
        name: 'Sophia Knight',
        tagline: 'The Transformation Architect - "I don\'t just see your practice, I see your empire"',
        voiceId: 'jsCqWAovK2LkecY7zXl4',
        icon: '👁️'
      }
    ];

    harveyStyleAgents.forEach(agent => {
      const salesAgent = {
        id: agent.id,
        name: agent.name,
        role: agent.tagline.split(' - ')[0],
        tagline: agent.tagline,
        voiceId: agent.voiceId,
        avatar: agent.icon,
        gradient: 'linear-gradient(135deg, #1a1a1a 0%, #FFD700 100%)',
        accentColor: '#FFD700',
        shadowColor: 'rgba(255, 215, 0, 0.5)',
        personality: {
          traits: ['Aggressive', 'Results-driven', 'Strategic', 'Confident', 'Elite'],
          specialties: [
            'Revenue optimization',
            'Competitive analysis',
            'Strategic partnerships',
            'Market domination',
            'Closing techniques'
          ],
          communication_style: 'aggressive-direct',
          approach: 'challenging',
          tone: 'commanding-professional'
        },
        capabilities: {
          consultation: true,
          sales_training: true,
          revenue_optimization: true,
          competitive_analysis: true,
          closing_techniques: true,
          performance_analysis: true,
          strategic_planning: true
        },
        voice_config: {
          enabled: true,
          voice_id: agent.voiceId,
          voice_name: agent.name,
          settings: {
            stability: 0.9,
            similarityBoost: 0.85,
            style: 0.7,
            useSpeakerBoost: true
          }
        },
        active: true,
        language: 'en',
        priority: 9,
        category: 'sales',
        subcategory: 'medical-aesthetics',
        targetAudience: ['medical-practices', 'business-owners', 'sales-teams']
      };

      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${agent.id}.json`),
        JSON.stringify(salesAgent, null, 2)
      );
      console.log(`✓ Created ${agent.id}.json`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log(`Total agents migrated: ${1 + aestheticAgents.length + harveyStyleAgents.length}`);
    console.log(`Output directory: ${OUTPUT_DIR}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
migrateAgents();