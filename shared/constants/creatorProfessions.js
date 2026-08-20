/**
 * Creator Professions & Dynamic Onboarding Fields
 * Admin-configurable — this is the default seed data.
 * Never hardcoded in registration logic — always read from store.
 */

const PROFESSIONS_DB_KEY = 'addus_professions_db';

export const DEFAULT_PROFESSIONS = [
  {
    professionId: 'prof_videographer',
    name: 'Videographer',
    description: 'Specialises in video production, cinematography, and film.',
    isActive: true,
    fields: [
      { fieldId: 'vg_camera', label: 'Primary Camera', type: 'text', placeholder: 'e.g. Sony A7IV, Canon R5', required: true, order: 1 },
      { fieldId: 'vg_lens', label: 'Lens Kit', type: 'text', placeholder: 'e.g. 24-70mm, 50mm prime', required: false, order: 2 },
      { fieldId: 'vg_drone', label: 'Drone', type: 'select', options: ['None', 'DJI Mini 4 Pro', 'DJI Mavic 3', 'DJI Air 3', 'DJI Inspire 3', 'Other'], required: false, order: 3 },
      { fieldId: 'vg_gimbal', label: 'Gimbal / Stabiliser', type: 'text', placeholder: 'e.g. DJI RS4, Zhiyun Crane', required: false, order: 4 },
      { fieldId: 'vg_lighting', label: 'Lighting Equipment', type: 'multiselect', options: ['LED Panels', 'Godox Strobes', 'Aputure Lights', 'Studio Softbox', 'Reflectors', 'RGB Lights', 'None'], required: false, order: 5 },
      { fieldId: 'vg_experience', label: 'Years of Experience', type: 'number', placeholder: 'e.g. 4', required: true, order: 6 },
      { fieldId: 'vg_editing', label: 'Editing Software', type: 'multiselect', options: ['Adobe Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'After Effects', 'Capcut Pro', 'Other'], required: true, order: 7 },
      { fieldId: 'vg_shoot_types', label: 'Preferred Shoot Types', type: 'multiselect', options: ['Product Videos', 'Brand Films', 'Corporate Videos', 'Event Coverage', 'Reels / Short Form', 'Documentary', 'Wedding', 'Fashion', 'Food & Beverage', 'Real Estate', 'Healthcare', 'Other'], required: true, order: 8 },
      { fieldId: 'vg_specialisation', label: 'Specialisation', type: 'text', placeholder: 'e.g. Cinematic storytelling, commercial ads', required: false, order: 9 }
    ]
  },
  {
    professionId: 'prof_photographer',
    name: 'Photographer',
    description: 'Professional photography for products, people, events, and brands.',
    isActive: true,
    fields: [
      { fieldId: 'ph_camera', label: 'Camera System', type: 'text', placeholder: 'e.g. Sony A7R V, Nikon Z9', required: true, order: 1 },
      { fieldId: 'ph_speciality', label: 'Photography Speciality', type: 'multiselect', options: ['Studio Product', 'Outdoor Product', 'Portrait', 'Food & Beverage', 'Architecture', 'Real Estate', 'Fashion', 'Event', 'Corporate', 'Lifestyle', 'Macro', 'Other'], required: true, order: 2 },
      { fieldId: 'ph_studio', label: 'Studio Access', type: 'select', options: ['Own Studio', 'Rented Studio', 'No Studio'], required: true, order: 3 },
      { fieldId: 'ph_lighting', label: 'Lighting Setup', type: 'multiselect', options: ['Strobe / Flash', 'Continuous LED', 'Natural Light Only', 'Softboxes', 'Reflectors', 'Ring Light'], required: false, order: 4 },
      { fieldId: 'ph_editing', label: 'Editing Software', type: 'multiselect', options: ['Adobe Lightroom', 'Adobe Photoshop', 'Capture One', 'Luminar', 'Other'], required: true, order: 5 },
      { fieldId: 'ph_experience', label: 'Years of Experience', type: 'number', required: true, order: 6 }
    ]
  },
  {
    professionId: 'prof_drone_pilot',
    name: 'Drone Pilot',
    description: 'Licensed aerial drone operator for photography and videography.',
    isActive: true,
    fields: [
      { fieldId: 'dp_drone', label: 'Drone Model', type: 'text', placeholder: 'e.g. DJI Mavic 3 Cine', required: true, order: 1 },
      { fieldId: 'dp_licence', label: 'DGCA / FAA Licence Number', type: 'text', required: false, order: 2 },
      { fieldId: 'dp_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 },
      { fieldId: 'dp_locations', label: 'Operating Regions', type: 'text', placeholder: 'e.g. Maharashtra, Goa, Karnataka', required: true, order: 4 },
      { fieldId: 'dp_speciality', label: 'Shoot Types', type: 'multiselect', options: ['Real Estate', 'Cinematic Films', 'Weddings', 'Surveying', 'Events', 'Sports', 'Infrastructure'], required: true, order: 5 }
    ]
  },
  {
    professionId: 'prof_video_editor',
    name: 'Video Editor',
    description: 'Post-production specialist for video editing, colour grading, and motion.',
    isActive: true,
    fields: [
      { fieldId: 've_software', label: 'Editing Software', type: 'multiselect', options: ['Adobe Premiere Pro', 'DaVinci Resolve', 'Final Cut Pro', 'Avid Media Composer', 'CapCut Pro', 'Other'], required: true, order: 1 },
      { fieldId: 've_motion', label: 'Motion Graphics', type: 'select', options: ['None', 'Basic', 'Intermediate', 'Advanced / After Effects'], required: true, order: 2 },
      { fieldId: 've_colour', label: 'Colour Grading', type: 'select', options: ['None', 'Basic LUTs', 'DaVinci Resolve Colour', 'Advanced Colour Science'], required: true, order: 3 },
      { fieldId: 've_experience', label: 'Years of Experience', type: 'number', required: true, order: 4 },
      { fieldId: 've_speciality', label: 'Specialisation', type: 'multiselect', options: ['Short-Form Reels', 'Commercial Films', 'Corporate Videos', 'Documentary', 'Music Videos', 'Product Videos', 'Wedding', 'Other'], required: true, order: 5 }
    ]
  },
  {
    professionId: 'prof_graphic_designer',
    name: 'Graphic Designer',
    description: 'Visual designer for branding, marketing, print, and digital.',
    isActive: true,
    fields: [
      { fieldId: 'gd_software', label: 'Design Software', type: 'multiselect', options: ['Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign', 'Figma', 'Canva Pro', 'CorelDraw', 'Other'], required: true, order: 1 },
      { fieldId: 'gd_speciality', label: 'Design Speciality', type: 'multiselect', options: ['Brand Identity', 'Logo Design', 'Packaging', 'Marketing Collateral', 'Social Media Graphics', 'Infographics', 'Print Design', 'Other'], required: true, order: 2 },
      { fieldId: 'gd_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 }
    ]
  },
  {
    professionId: 'prof_motion_designer',
    name: 'Motion Designer',
    description: 'Motion graphics, animation, and visual effects specialist.',
    isActive: true,
    fields: [
      { fieldId: 'md_software', label: 'Motion Software', type: 'multiselect', options: ['Adobe After Effects', 'Cinema 4D', 'Blender', 'Cavalry', 'Lottie', 'DaVinci Fusion', 'Other'], required: true, order: 1 },
      { fieldId: 'md_style', label: 'Animation Style', type: 'multiselect', options: ['2D Motion Graphics', '3D Animation', 'Kinetic Typography', 'VFX', 'UI Animations', 'Product Visualisation', 'Other'], required: true, order: 2 },
      { fieldId: 'md_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 }
    ]
  },
  {
    professionId: 'prof_model',
    name: 'Model',
    description: 'Professional model for fashion, commercial, and brand shoots.',
    isActive: true,
    fields: [
      { fieldId: 'm_height', label: 'Height (cm)', type: 'number', required: true, order: 1 },
      { fieldId: 'm_weight', label: 'Weight (kg)', type: 'number', required: false, order: 2 },
      { fieldId: 'm_gender', label: 'Gender', type: 'select', options: ['Male', 'Female', 'Non-Binary', 'Prefer Not to Say'], required: true, order: 3 },
      { fieldId: 'm_age', label: 'Age', type: 'number', required: true, order: 4 },
      { fieldId: 'm_languages', label: 'Languages Spoken', type: 'text', placeholder: 'e.g. Hindi, English, Tamil', required: true, order: 5 },
      { fieldId: 'm_categories', label: 'Modelling Categories', type: 'multiselect', options: ['Fashion', 'Commercial', 'Product', 'Fitness', 'Plus Size', 'Kids', 'Lifestyle', 'Editorial', 'Ramp', 'Catalogue', 'Other'], required: true, order: 6 },
      { fieldId: 'm_travel', label: 'Travel Availability', type: 'select', options: ['Local Only', 'State Wide', 'Pan India', 'International'], required: true, order: 7 },
      { fieldId: 'm_experience', label: 'Years of Experience', type: 'number', required: true, order: 8 }
    ]
  },
  {
    professionId: 'prof_actor',
    name: 'Actor',
    description: 'Professional actor for commercials, brand films, and digital content.',
    isActive: true,
    fields: [
      { fieldId: 'ac_languages', label: 'Acting Languages', type: 'text', placeholder: 'e.g. Hindi, English, Telugu', required: true, order: 1 },
      { fieldId: 'ac_experience', label: 'Years of Experience', type: 'number', required: true, order: 2 },
      { fieldId: 'ac_speciality', label: 'Acting Speciality', type: 'multiselect', options: ['Commercial Ads', 'Brand Films', 'Corporate Videos', 'Digital Shorts', 'OTT Content', 'Stage', 'Other'], required: true, order: 3 },
      { fieldId: 'ac_skills', label: 'Special Skills', type: 'text', placeholder: 'e.g. Dance, Martial Arts, Horse Riding', required: false, order: 4 }
    ]
  },
  {
    professionId: 'prof_voice_artist',
    name: 'Voice Artist',
    description: 'Professional voice-over artist for ads, documentaries, and explainers.',
    isActive: true,
    fields: [
      { fieldId: 'va_languages', label: 'Voice-Over Languages', type: 'text', placeholder: 'e.g. Hindi, English, Marathi', required: true, order: 1 },
      { fieldId: 'va_style', label: 'Voice Styles', type: 'multiselect', options: ['Commercial', 'Corporate', 'Documentary', 'Character / Animation', 'Audiobook', 'E-Learning', 'IVR', 'Radio', 'Other'], required: true, order: 2 },
      { fieldId: 'va_equipment', label: 'Home Studio Setup', type: 'select', options: ['Professional Studio', 'Home Studio', 'No Studio'], required: true, order: 3 },
      { fieldId: 'va_experience', label: 'Years of Experience', type: 'number', required: true, order: 4 }
    ]
  },
  {
    professionId: 'prof_content_writer',
    name: 'Content Writer',
    description: 'Creative writer for scripts, blogs, social media, and brand content.',
    isActive: true,
    fields: [
      { fieldId: 'cw_languages', label: 'Writing Languages', type: 'text', placeholder: 'e.g. English, Hindi', required: true, order: 1 },
      { fieldId: 'cw_speciality', label: 'Writing Speciality', type: 'multiselect', options: ['Video Scripts', 'Brand Copywriting', 'Social Media Content', 'Blog / Articles', 'SEO Content', 'Product Descriptions', 'Email Marketing', 'Ad Copies', 'Storytelling', 'Other'], required: true, order: 2 },
      { fieldId: 'cw_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 },
      { fieldId: 'cw_niche', label: 'Industry Niche', type: 'text', placeholder: 'e.g. Technology, Fashion, Healthcare', required: false, order: 4 }
    ]
  },
  {
    professionId: 'prof_web_designer',
    name: 'Web Designer',
    description: 'Designer for websites, landing pages, and UI/UX.',
    isActive: true,
    fields: [
      { fieldId: 'wd_tools', label: 'Design Tools', type: 'multiselect', options: ['Figma', 'Adobe XD', 'Sketch', 'Webflow', 'WordPress', 'Framer', 'Other'], required: true, order: 1 },
      { fieldId: 'wd_dev', label: 'Development Skills', type: 'multiselect', options: ['None (Design Only)', 'HTML/CSS', 'JavaScript', 'React', 'Next.js', 'WordPress Dev', 'Webflow Dev'], required: true, order: 2 },
      { fieldId: 'wd_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 }
    ]
  },
  {
    professionId: 'prof_brand_strategist',
    name: 'Brand Strategist',
    description: 'Brand and marketing strategist for positioning and identity.',
    isActive: true,
    fields: [
      { fieldId: 'bs_speciality', label: 'Strategy Speciality', type: 'multiselect', options: ['Brand Identity', 'Brand Positioning', 'Go-to-Market', 'Marketing Strategy', 'Digital Strategy', 'Content Strategy', 'Other'], required: true, order: 1 },
      { fieldId: 'bs_industries', label: 'Industries Served', type: 'text', placeholder: 'e.g. FMCG, SaaS, Retail, Healthcare', required: true, order: 2 },
      { fieldId: 'bs_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 }
    ]
  },
  {
    professionId: 'prof_digital_marketer',
    name: 'Digital Marketer',
    description: 'Performance marketing, SEO, social media, and paid media specialist.',
    isActive: true,
    fields: [
      { fieldId: 'dm_channels', label: 'Marketing Channels', type: 'multiselect', options: ['Meta Ads (Facebook/Instagram)', 'Google Ads', 'SEO', 'Content Marketing', 'Email Marketing', 'YouTube Ads', 'LinkedIn Ads', 'Influencer Marketing', 'Other'], required: true, order: 1 },
      { fieldId: 'dm_experience', label: 'Years of Experience', type: 'number', required: true, order: 2 },
      { fieldId: 'dm_budget', label: 'Managed Ad Budget Range', type: 'select', options: ['Under ₹1L/month', '₹1L–₹5L/month', '₹5L–₹20L/month', 'Over ₹20L/month'], required: false, order: 3 }
    ]
  },
  {
    professionId: 'prof_3d_artist',
    name: '3D Artist',
    description: 'Product visualisation, architectural rendering, and 3D animation.',
    isActive: true,
    fields: [
      { fieldId: '3d_software', label: '3D Software', type: 'multiselect', options: ['Blender', 'Cinema 4D', 'Maya', '3ds Max', 'ZBrush', 'KeyShot', 'Unreal Engine', 'Other'], required: true, order: 1 },
      { fieldId: '3d_speciality', label: 'Specialisation', type: 'multiselect', options: ['Product Visualisation', 'Architectural Rendering', 'Character Animation', 'VFX', 'Motion Graphics', 'Game Assets', 'Other'], required: true, order: 2 },
      { fieldId: '3d_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 }
    ]
  },
  {
    professionId: 'prof_packaging_designer',
    name: 'Packaging Designer',
    description: 'Packaging design for FMCG, retail, and D2C brands.',
    isActive: true,
    fields: [
      { fieldId: 'pd_software', label: 'Design Software', type: 'multiselect', options: ['Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign', 'Dieline Designer', 'Other'], required: true, order: 1 },
      { fieldId: 'pd_categories', label: 'Packaging Categories', type: 'multiselect', options: ['Food & Beverage', 'Cosmetics', 'Pharma', 'E-Commerce', 'Retail', 'Luxury', 'Other'], required: true, order: 2 },
      { fieldId: 'pd_experience', label: 'Years of Experience', type: 'number', required: true, order: 3 }
    ]
  }
];

const PROFESSIONS_STORE_KEY = 'addus_professions_db';

export const professionsService = {
  /**
   * Get all professions (admin + defaults)
   */
  getAll() {
    try {
      const stored = JSON.parse(localStorage.getItem(PROFESSIONS_STORE_KEY) || 'null');
      if (stored && stored.length > 0) return stored;
    } catch { /* use defaults */ }
    // Seed defaults
    localStorage.setItem(PROFESSIONS_STORE_KEY, JSON.stringify(DEFAULT_PROFESSIONS));
    return DEFAULT_PROFESSIONS;
  },

  /**
   * Get profession by ID
   */
  getById(professionId) {
    return this.getAll().find(p => p.professionId === professionId) || null;
  },

  /**
   * Get profession by name
   */
  getByName(name) {
    return this.getAll().find(p => p.name === name) || null;
  },

  /**
   * Get list of profession names
   */
  getProfessionNames() {
    return this.getAll().filter(p => p.isActive).map(p => p.name);
  },

  /**
   * Admin: Add new profession
   */
  addProfession(profession) {
    const all = this.getAll();
    const newProfession = {
      ...profession,
      professionId: `prof_${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    all.push(newProfession);
    localStorage.setItem(PROFESSIONS_STORE_KEY, JSON.stringify(all));
    return newProfession;
  },

  /**
   * Admin: Update profession
   */
  updateProfession(professionId, updates) {
    const all = this.getAll();
    const idx = all.findIndex(p => p.professionId === professionId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    localStorage.setItem(PROFESSIONS_STORE_KEY, JSON.stringify(all));
    return all[idx];
  },

  /**
   * Admin: Toggle active status
   */
  toggleActive(professionId) {
    const profession = this.getById(professionId);
    if (!profession) return null;
    return this.updateProfession(professionId, { isActive: !profession.isActive });
  }
};

export default professionsService;
