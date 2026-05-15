// script.js

// Firebase konfiguratsiyasi (Sizniki)
const firebaseConfig = {
  apiKey: "AIzaSyCc3EeDkk_Bhvw8TphLj60aJSXtyWwWpZw",
  authDomain: "yenil-app.firebaseapp.com",
  projectId: "yenil-app",
  storageBucket: "yenil-app.firebasestorage.app",
  messagingSenderId: "55580105205",
  appId: "1:55580105205:web:0b3cce1b76596c5097e8bc",
  measurementId: "G-P4DP3ZSWZD"
};

// Firebase ni ishga tushirish (agar kerak bo'lsa)
let database = null;
let app = null;

// Agar Firebase kerak bo'lsa (faqat kerakli sahifalarda yuklanadi)
function initFirebaseIfNeeded() {
  if (typeof firebase !== 'undefined' && !app) {
    app = firebase.initializeApp(firebaseConfig);
    database = firebase.database();
    console.log('[Ýeňil] Firebase initialized');
  }
}

// Qora/oq rejimni saqlash va qayta tiklash
function initTheme() {
  const saved = localStorage.getItem('theme') || 'light-mode';
  document.body.className = saved;
  
  const toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.textContent = saved === 'dark-mode' ? '☀️' : '🌙';
    
    toggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode');
      const isDark = document.body.classList.contains('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark-mode' : 'light-mode');
      toggle.textContent = isDark ? '☀️' : '🌙';
    });
  }
}

// Mobil menyu
function initMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function() {
      navMenu.classList.toggle('active');
    });

    // Menyu havolalari bosilganda yopilsin
    document.querySelectorAll('.nav-menu a').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
      });
    });
  }
}

// Sanani cheklash (masalan, 15 kun)
function setMaxDate(inputId, days = 15) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + days);
  
  const todayStr = today.toISOString().split('T')[0];
  const maxDateStr = maxDate.toISOString().split('T')[0];
  
  input.min = todayStr;
  input.max = maxDateStr;
}

// Umumiy funksiyalar
function showMessage(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.display = 'block';
    el.className = isError ? 'error-message' : 'success-message';
  }
}

function hideMessage(elementId) {
  const el = document.getElementById(elementId);
  if (el) {
    el.style.display = 'none';
  }
}

// Sahifa yuklanganda barcha funksiyalarni ishga tushirish
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initMobileMenu();
  initFirebaseIfNeeded(); // Agar Firebase kerak bo'lsa
  
  // Agar "travel-date" mavjud bo'lsa, sanani cheklash
  if (document.getElementById('travel-date')) {
    setMaxDate('travel-date', 15);
  }
});

// Umumiy yordamchi funksiyalar
function isValidPhone(phone) {
  return /^[\+]?[9]{0,1}[9]{0,1}[3]{0,1}[ ]{0,1}[\(]?[0-9]{2}[\)]?[ ]{0,1}[0-9]{3}[ ]{0,1}[0-9]{2}[ ]{0,1}[0-9]{2}$/.test(phone);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  return date.toLocaleString('tk-TM');
}

// Ekspport qilish
window.YenilUtils = {
  initFirebaseIfNeeded,
  database,
  showMessage,
  hideMessage,
  isValidPhone,
  isValidEmail,
  formatDate
};