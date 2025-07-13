import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// All agent configurations from Pedro
const agents = [
  {
    id: 'gina',
    name: 'Gina',
    role: 'Treatment Coordinator',
    tagline: 'Real talk about your dental needs',
    voiceId: '9BWtsMINqrJLrRacOk9x',
    audioSample: 'si_gina_edgy.mp3',
    avatar: '💅',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    accentColor: '#fa709a',
    shadowColor: 'rgba(250, 112, 154, 0.3)',
    personality: {
      traits: ['Direct', 'Honest', 'Protective'],
      specialties: ['Cost breakdowns', 'No BS advice', 'Fast solutions'],
      origin: 'Staten Island'
    }
  },
  {
    id: 'teresa',
    name: 'Teresa',
    role: 'Patient Advocate',
    tagline: 'Like family, but with dental expertise',
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    audioSample: 'si_teresa_warm.mp3',
    avatar: '🤱',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    accentColor: '#fed6e3',
    shadowColor: 'rgba(254, 214, 227, 0.3)',
    personality: {
      traits: ['Nurturing', 'Understanding', 'Experienced'],
      specialties: ['Anxiety management', 'Family care', 'Comfort'],
      origin: 'Staten Island'
    }
  },
  {
    id: 'tony',
    name: 'Tony',
    role: 'Operations Chief',
    tagline: 'Getting it done right, the first time',
    voiceId: 'nPczCjzI2devNBz1zQrb',
    audioSample: 'si_tony_confident.mp3',
    avatar: '🤵',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    accentColor: '#4facfe',
    shadowColor: 'rgba(79, 172, 254, 0.3)',
    personality: {
      traits: ['Confident', 'Decisive', 'Results-driven'],
      specialties: ['Complex cases', 'Quick decisions', 'Problem solving'],
      origin: 'Staten Island'
    }
  },
  {
    id: 'vinny',
    name: 'Vinny',
    role: 'Community Liaison',
    tagline: 'Your neighborhood dental buddy',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    audioSample: 'si_vinny_friendly.mp3',
    avatar: '🤝',
    gradient: 'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
    accentColor: '#fe5196',
    shadowColor: 'rgba(254, 81, 150, 0.3)',
    personality: {
      traits: ['Friendly', 'Approachable', 'Connected'],
      specialties: ['First visits', 'Referrals', 'Community care'],
      origin: 'Staten Island'
    }
  },
  {
    id: 'joey',
    name: 'Joey',
    role: 'Tech Specialist',
    tagline: 'Excited about your smile transformation!',
    voiceId: 'yoZ06aMxZJJ28mfd3POQ',
    audioSample: 'si_joey_excited.mp3',
    avatar: '🚀',
    gradient: 'linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)',
    accentColor: '#5ee7df',
    shadowColor: 'rgba(94, 231, 223, 0.3)',
    personality: {
      traits: ['Enthusiastic', 'Tech-savvy', 'Energetic'],
      specialties: ['YOMI robot', 'Digital dentistry', 'Innovation'],
      origin: 'Staten Island'
    }
  },
  {
    id: 'carmen',
    name: 'Carmen',
    role: 'Bilingual Receptionist',
    tagline: 'Aquí para ayudarte, mami',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    audioSample: 'latin_carmen_dominican.mp3',
    avatar: '🌺',
    gradient: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
    accentColor: '#ff0844',
    shadowColor: 'rgba(255, 8, 68, 0.3)',
    personality: {
      traits: ['Warm', 'Helpful', 'Bilingual'],
      specialties: ['Spanish translation', 'Cultural comfort', 'Family care'],
      origin: 'Dominican Republic',
      language: 'Spanish/English'
    }
  },
  {
    id: 'rosa',
    name: 'Rosa',
    role: 'Dental Assistant',
    tagline: 'Making dental care feel like home',
    voiceId: 'XrExE9yKIg1WjnnlVkGX',
    audioSample: 'latin_rosa_mexican.mp3',
    avatar: '🌹',
    gradient: 'linear-gradient(135deg, #f9d423 0%, #ff4e50 100%)',
    accentColor: '#ff4e50',
    shadowColor: 'rgba(255, 78, 80, 0.3)',
    personality: {
      traits: ['Friendly', 'Caring', 'Detailed'],
      specialties: ['Patient comfort', 'Procedure explanation', 'Calming presence'],
      origin: 'Mexico',
      language: 'Spanish/English'
    }
  },
  {
    id: 'miguel',
    name: 'Miguel',
    role: 'Scheduling Coordinator',
    tagline: '¡Dale! Let\'s get you scheduled',
    voiceId: 'TxGEqnHWrfWFTfGW9XjX',
    audioSample: 'latin_miguel_puertorican.mp3',
    avatar: '📅',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    accentColor: '#30cfd0',
    shadowColor: 'rgba(48, 207, 208, 0.3)',
    personality: {
      traits: ['Animated', 'Efficient', 'Personable'],
      specialties: ['Quick booking', 'Flexible scheduling', 'Reminder calls'],
      origin: 'Puerto Rico',
      language: 'Spanish/English'
    }
  },
  {
    id: 'carlos_en',
    name: 'Carlos',
    role: 'Clinical Coordinator',
    tagline: 'Excellence in every detail',
    voiceId: 'nPczCjzI2devNBz1zQrb',
    audioSample: 'latin_carlos_venezuelan.mp3',
    avatar: '🏥',
    gradient: 'linear-gradient(135deg, #7028e4 0%, #e5b2ca 100%)',
    accentColor: '#7028e4',
    shadowColor: 'rgba(112, 40, 228, 0.3)',
    personality: {
      traits: ['Professional', 'Thorough', 'Caring'],
      specialties: ['Clinical protocols', 'Quality care', 'Patient education'],
      origin: 'Venezuela',
      language: 'Spanish/English'
    }
  },
  {
    id: 'maria_es',
    name: 'María',
    role: 'Spanish Specialist',
    tagline: 'Atención completa en español',
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    audioSample: 'spanish_maria_demo.mp3',
    avatar: '🇪🇸',
    gradient: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)',
    accentColor: '#fc4a1a',
    shadowColor: 'rgba(252, 74, 26, 0.3)',
    personality: {
      traits: ['Professional', 'Clear', 'Helpful'],
      specialties: ['Spanish consultations', 'Translation', 'Cultural bridge'],
      language: 'Spanish'
    }
  },
  {
    id: 'carlos_es',
    name: 'Carlos',
    role: 'Spanish Advisor',
    tagline: 'Su consultor dental de confianza',
    voiceId: 'nPczCjzI2devNBz1zQrb',
    audioSample: 'spanish_carlos_demo.mp3',
    avatar: '🦷',
    gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    accentColor: '#11998e',
    shadowColor: 'rgba(17, 153, 142, 0.3)',
    personality: {
      traits: ['Knowledgeable', 'Patient', 'Trustworthy'],
      specialties: ['Detailed explanations', 'Insurance help', 'Treatment planning'],
      language: 'Spanish'
    }
  },
  {
    id: 'dr_pedro',
    name: 'Dr. Pedro',
    role: 'Head Dentist',
    tagline: 'Direct access to the expert himself',
    voiceId: 'pNInz6obpgDQGcFmaJgB',
    avatar: '👨‍⚕️',
    gradient: 'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
    accentColor: '#243b55',
    shadowColor: 'rgba(36, 59, 85, 0.5)',
    personality: {
      traits: ['Expert', 'Prestigious', 'Innovative'],
      specialties: ['YOMI robotics', 'Complex implants', 'Full reconstructions']
    }
  }
];

// Function to convert agent to standardized format
function standardizeAgent(agent) {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    tagline: agent.tagline,
    voiceId: agent.voiceId,
    audioSample: agent.audioSample,
    avatar: agent.avatar,
    gradient: agent.gradient,
    accentColor: agent.accentColor,
    shadowColor: agent.shadowColor,
    personality: {
      ...agent.personality,
      communication_style: agent.personality.communication_style || 'professional',
      approach: agent.personality.approach || 'empathetic',
      tone: agent.personality.tone || 'warm-professional'
    },
    capabilities: {
      scheduling: true,
      insurance_check: true,
      basic_dental_info: true,
      patientEducation: true,
      preOperativeCare: true,
      postOperativeCare: true,
      anxietyManagement: true
    },
    voice_config: {
      enabled: true,
      voice_id: agent.voiceId,
      voice_name: agent.name,
      settings: {
        stability: 0.7,
        similarityBoost: 0.8,
        style: 0.5,
        useSpeakerBoost: true
      }
    },
    active: true,
    language: agent.personality.language ? 
      (agent.personality.language.includes('Spanish') ? 'es' : 'en') : 'en',
    priority: 10
  };
}

// Migrate all agents
async function migrateAgents() {
  const agentsDir = path.join(__dirname, '..', 'data', 'agents');
  
  console.log('Starting agent migration...');
  console.log(`Target directory: ${agentsDir}`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const agent of agents) {
    try {
      const standardizedAgent = standardizeAgent(agent);
      const filename = `${agent.id}.json`;
      const filepath = path.join(agentsDir, filename);
      
      // Check if already exists
      if (fs.existsSync(filepath)) {
        console.log(`⚠️  Skipping ${filename} - already exists`);
        continue;
      }
      
      // Write JSON file
      fs.writeFileSync(
        filepath, 
        JSON.stringify(standardizedAgent, null, 2)
      );
      
      console.log(`✅ Migrated ${agent.name} (${agent.id})`);
      migrated++;
    } catch (error) {
      console.error(`❌ Error migrating ${agent.name}:`, error.message);
      errors++;
    }
  }
  
  console.log('\nMigration complete!');
  console.log(`✅ Successfully migrated: ${migrated} agents`);
  console.log(`❌ Errors: ${errors}`);
}

// Run migration
migrateAgents().catch(console.error);