/**
 * Creator Authentication Service — ADDUS
 * Handles Creator registration, OTP verification, session management
 * ID Format: ACRA000001, ACRA000002, ...
 */

const CREATOR_SESSION_KEY = 'addus_creator_session';
const CREATOR_ID_COUNTER_KEY = 'addus_creator_id_counter';
const CREATORS_DB_KEY = 'addus_creators_db';
const OTP_STORE_KEY = 'addus_creator_otp_store';

// ── ID Generation ─────────────────────────────────────────────────────────

function getNextCreatorId() {
  const counter = parseInt(localStorage.getItem(CREATOR_ID_COUNTER_KEY) || '0', 10);
  const next = counter + 1;
  localStorage.setItem(CREATOR_ID_COUNTER_KEY, String(next));
  return `ACRA${String(next).padStart(6, '0')}`;
}

// ── Creators Database (localStorage as MVP store) ─────────────────────────

function getCreatorsDB() {
  try {
    return JSON.parse(localStorage.getItem(CREATORS_DB_KEY) || '[]');
  } catch { return []; }
}

function saveCreatorsDB(creators) {
  localStorage.setItem(CREATORS_DB_KEY, JSON.stringify(creators));
  window.dispatchEvent(new Event('addus_creator_store_updated'));
}

// ── OTP Store ─────────────────────────────────────────────────────────────

function getOTPStore() {
  try {
    return JSON.parse(localStorage.getItem(OTP_STORE_KEY) || '{}');
  } catch { return {}; }
}

function saveOTPStore(store) {
  localStorage.setItem(OTP_STORE_KEY, JSON.stringify(store));
}

// ── Public API ─────────────────────────────────────────────────────────────

export const creatorAuthService = {
  /**
   * Check if mobile or email already registered
   */
  checkExists(identifier) {
    const creators = getCreatorsDB();
    const match = creators.find(c =>
      c.phone === identifier || c.email === identifier
    );
    if (match) {
      return { exists: true, creator: match };
    }
    return { exists: false };
  },

  /**
   * Send OTP (simulated — returns OTP for dev mode)
   * In production, replace with Twilio/MSG91/Razorpay Verify
   */
  sendOTP(identifier, type = 'mobile') {
    const otp = String(Math.floor(1000 + Math.random() * 9000));
    const store = getOTPStore();
    store[identifier] = {
      otp,
      type,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
      verified: false
    };
    saveOTPStore(store);
    console.log(`[ADDUS OTP] ${type === 'mobile' ? 'Mobile' : 'Email'} OTP for ${identifier}: ${otp}`);
    return { success: true, otp, expiresIn: 600 };
  },

  /**
   * Verify OTP
   */
  verifyOTP(identifier, inputOTP) {
    const store = getOTPStore();
    const record = store[identifier];
    if (!record) return { success: false, error: 'OTP not found. Please resend.' };
    if (Date.now() > record.expiresAt) return { success: false, error: 'OTP expired. Please resend.' };
    if (record.otp !== inputOTP.trim()) return { success: false, error: 'Invalid OTP. Please try again.' };

    record.verified = true;
    saveOTPStore(store);
    return { success: true };
  },

  /**
   * Register a new creator (after OTP verified)
   */
  registerCreator({ phone, email, authType }) {
    const existing = this.checkExists(phone || email);
    if (existing.exists) {
      return { success: false, error: 'Already registered. Please login.' };
    }

    const creatorId = getNextCreatorId();
    const now = new Date().toISOString();

    const newCreator = {
      creatorId,
      phone: phone || null,
      email: email || null,
      authType,
      verificationStatus: 'draft',
      name: null,
      profilePhoto: null,
      location: null,
      primaryProfession: null,
      categories: [],
      availabilityStatus: 'available',
      documents: [],
      scoreCard: {
        overallScore: null,
        breakdown: {},
        message: 'Score will appear after your first completed project.'
      },
      adminNotes: null,
      submittedAt: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: now,
      updatedAt: now
    };

    const creators = getCreatorsDB();
    creators.push(newCreator);
    saveCreatorsDB(creators);

    this.setSession(newCreator);
    return { success: true, creator: newCreator };
  },

  /**
   * Login an existing creator
   */
  loginCreator(identifier) {
    const { exists, creator } = this.checkExists(identifier);
    if (!exists) return { success: false, error: 'Creator not found.' };
    this.setSession(creator);
    return { success: true, creator };
  },

  /**
   * Update creator profile (any fields)
   */
  updateCreator(creatorId, updates) {
    const creators = getCreatorsDB();
    const idx = creators.findIndex(c => c.creatorId === creatorId);
    if (idx === -1) return { success: false, error: 'Creator not found.' };

    creators[idx] = {
      ...creators[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    saveCreatorsDB(creators);

    // Update session if it's the current user
    const session = this.getSession();
    if (session?.creatorId === creatorId) {
      this.setSession(creators[idx]);
    }

    return { success: true, creator: creators[idx] };
  },

  /**
   * Submit creator profile for admin review
   */
  submitForReview(creatorId) {
    return this.updateCreator(creatorId, {
      verificationStatus: 'submitted',
      submittedAt: new Date().toISOString()
    });
  },

  /**
   * Get creator by ID
   */
  getCreatorById(creatorId) {
    const creators = getCreatorsDB();
    return creators.find(c => c.creatorId === creatorId) || null;
  },

  /**
   * Get all creators (for admin)
   */
  getAllCreators() {
    return getCreatorsDB();
  },

  /**
   * Admin: approve creator
   */
  approveCreator(creatorId, adminId = 'admin') {
    return this.updateCreator(creatorId, {
      verificationStatus: 'approved',
      approvedAt: new Date().toISOString(),
      adminNotes: `Approved by ${adminId}`
    });
  },

  /**
   * Admin: reject creator
   */
  rejectCreator(creatorId, reason, adminId = 'admin') {
    return this.updateCreator(creatorId, {
      verificationStatus: 'rejected',
      rejectionReason: reason,
      adminNotes: `Rejected by ${adminId}: ${reason}`
    });
  },

  // ── Session ───────────────────────────────────────────────────────────

  setSession(creator) {
    localStorage.setItem(CREATOR_SESSION_KEY, JSON.stringify({
      creatorId: creator.creatorId,
      name: creator.name,
      phone: creator.phone,
      email: creator.email,
      verificationStatus: creator.verificationStatus,
      loginAt: new Date().toISOString()
    }));
  },

  getSession() {
    try {
      return JSON.parse(localStorage.getItem(CREATOR_SESSION_KEY) || 'null');
    } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  logout() {
    localStorage.removeItem(CREATOR_SESSION_KEY);
    window.dispatchEvent(new Event('addus_creator_logout'));
  },

  /**
   * Get the full current creator profile (live, not just session)
   */
  getCurrentCreator() {
    const session = this.getSession();
    if (!session) return null;
    return this.getCreatorById(session.creatorId);
  }
};

export default creatorAuthService;
