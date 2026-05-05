import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.getElementById('loginBtn');

// Handle Login
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
      showError("Please enter email and password.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Fetch user role/shopId from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        localStorage.setItem("userRole", userData.role);
        localStorage.setItem("shopId", userData.shopId);
        localStorage.setItem("userName", userData.name);
        
        // Redirect based on role
        if (userData.role === 'admin' || userData.role === 'super_admin') {
          window.location.href = 'dashboard.html';
        } else {
          window.location.href = 'index.html';
        }
      } else {
        // If no user doc found, default to staff, but usually this is an error in setup
        console.warn("User document not found in Firestore. Defaulting to staff.");
        localStorage.setItem("userRole", "staff");
        localStorage.setItem("shopId", "shop1"); // Default fallback
        window.location.href = 'index.html';
      }
    } catch (error) {
      console.error(error);
      showError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  });
}

function showError(msg) {
  if (errorMessage) {
    errorMessage.textContent = msg;
    errorMessage.classList.remove('hidden');
  }
}

function setLoading(isLoading) {
  if (loginBtn) {
    if (isLoading) {
      loginBtn.disabled = true;
      loginBtn.innerHTML = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Logging in...`;
    } else {
      loginBtn.disabled = false;
      loginBtn.innerHTML = `Login to Workspace`;
    }
  }
}

// Global Auth State Observer (For protecting pages)
export function checkAuth(requireRole = null) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        const role = localStorage.getItem("userRole");
        if (requireRole && role !== requireRole && role !== 'super_admin') {
          // If required role is admin and user is staff
          alert("Unauthorized access. Redirecting...");
          window.location.href = 'index.html';
        }
        resolve(user);
      } else {
        // No user is signed in.
        if (window.location.pathname.indexOf('login.html') === -1) {
          window.location.href = 'login.html';
        }
        resolve(null);
      }
    });
  });
}

// Global Logout
window.logout = async function() {
  try {
    await signOut(auth);
    localStorage.clear();
    window.location.href = 'login.html';
  } catch (error) {
    console.error("Logout error", error);
  }
};
