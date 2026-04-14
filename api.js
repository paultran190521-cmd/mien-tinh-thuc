/**
 * SUNNYCARE MindWell — Google Apps Script API Wrapper
 * ⚠️  Replace GAS_URL with your deployed GAS Web App URL after setup
 */

// ─── CONFIGURATION ─────────────────────────────────────────────────────────
const GAS_URL = 'https://script.google.com/macros/s/AKfycbzcfXOKg_9hT_XEq0G4UoWFn-4HH_WNJv8F1XknE7uTVQRFCONmhUsB9KPDMPVnWuTc/exec'; // Replace after GAS deploy

// ─── API HELPER ─────────────────────────────────────────────────────────────
async function gasRequest(action, payload = {}) {
  const body = JSON.stringify({ action, ...payload });
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Lỗi máy chủ');
    return data.data || data; // Backend might wrap in "data" property
  } catch (err) {
    console.error('[GAS API Error]', err);
    throw err;
  }
}

// ─── TEST SUBMISSIONS ────────────────────────────────────────────────────────
const API = {
  /**
   * Submit a psychological test result
   */
  async submitTest(testType, payload) {
    return gasRequest('submitTest', { testType, ...payload });
  },

  // ─── AUTH ───────────────────────────────────────────────────────────────────
  async register(email, password, name) {
    return gasRequest('register', { email, password, name });
  },

  async login(email, password) {
    return gasRequest('login', { email, password });
  },

  // ─── JOURNAL ────────────────────────────────────────────────────────────────
  async getJournal(token) {
    return gasRequest('getJournal', { token });
  },

  async saveJournal(token, entry) {
    return gasRequest('saveJournal', { token, entry });
  },

  // ─── ADMIN ──────────────────────────────────────────────────────────────────
  async getAdminStats(password) {
    return gasRequest('adminStats', { password });
  }
};

// Export for module use
if (typeof module !== 'undefined') module.exports = { API, GAS_URL };
