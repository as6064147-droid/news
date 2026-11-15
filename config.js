// =====================================================
//  Configuration File
// =====================================================

const firebaseConfig = {
  apiKey: "AIzaSyAccVmtHXNNm1eq-rVn-sRraWa7JqLDTQc",
  authDomain: "sheko-3817f.firebaseapp.com",
  projectId: "sheko-3817f",
  storageBucket: "sheko-3817f.firebasestorage.app",
  messagingSenderId: "267877115512",
  appId: "1:267877115512:web:1efcccf07d090a438e6f8d"
};

// =====================================================
//  Accounts
// =====================================================
// Everyone signs in with a USERNAME + PASSWORD.
//
// Firebase Auth only understands emails, so every username is translated
// into an internal address on EDITOR_EMAIL_DOMAIN. The domain is never
// shown to the user and never receives mail — it is just an internal key.
//
// Note: no password is stored in this file.

// --- The administrator ---
// Behind the scenes the admin username maps to this real Firebase Auth email.
const ADMIN_USERNAME = "ahmedsheko123";
const ADMIN_EMAIL = "as6064147@gmail.com";

// --- Editors ---
const EDITOR_EMAIL_DOMAIN = "jareedati.app";

// Usernames may only contain these characters.
const USERNAME_RE = /^[a-z0-9._-]{3,20}$/;

/**
 * Turns the administrator's login box input into a Firebase Auth email.
 * Accepts the admin username, and also the full admin email as a fallback.
 * Returns '' when the input cannot be matched.
 */
function usernameToEmail(input) {
  const v = String(input || '').trim().toLowerCase();
  if (!v) return '';
  if (v === String(ADMIN_USERNAME).toLowerCase()) return ADMIN_EMAIL.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : '';
}

/**
 * Turns an editor username into its internal Firebase Auth email.
 * A full email address is passed through unchanged, so accounts created
 * before the switch to usernames keep working.
 */
function editorUsernameToEmail(input) {
  const v = String(input || '').trim().toLowerCase();
  if (!v) return '';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return v;
  return v + '@' + EDITOR_EMAIL_DOMAIN;
}

/**
 * Reverse of editorUsernameToEmail — used to display a friendly username.
 */
function emailToUsername(email) {
  const e = String(email || '').trim().toLowerCase();
  const suffix = '@' + EDITOR_EMAIL_DOMAIN;
  return e.endsWith(suffix) ? e.slice(0, -suffix.length) : e;
}
