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
//  Administrator Account
// =====================================================
// The administrator signs in with a USERNAME + PASSWORD.
// Behind the scenes the username is mapped to this Firebase Auth email,
// so the password itself is never written anywhere in this code.
//
// IMPORTANT: this email must also be listed in firestore-rules.txt (isAdmin()).
const ADMIN_USERNAME = "ahmedsheko123";
const ADMIN_EMAIL = "as6064147@gmail.com";

// Turns whatever the admin types (username OR full email) into the Auth email.
function usernameToEmail(input) {
  const v = String(input || '').trim().toLowerCase();
  if (!v) return '';
  if (v === String(ADMIN_USERNAME).toLowerCase()) return ADMIN_EMAIL.toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : '';
}
