// Configuration Puppeteer pour tests E2E - PHASE 6
const puppeteer = require('puppeteer');

const config = {
  // Configuration navigateur
  browser: {
    headless: process.env.CI === 'true' ? true : false, // Mode visual en dev, headless en CI
    slowMo: process.env.CI === 'true' ? 0 : 100, // Ralentir pour debugging
    defaultViewport: {
      width: 1280,
      height: 720,
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--allow-running-insecure-content',
    ],
  },

  // URLs de test
  baseUrl: process.env.E2E_BASE_URL || 'http://localhost:3000',

  // Timeouts
  timeouts: {
    navigation: 30000,
    element: 15000,
    short: 5000,
    medium: 10000,
    long: 20000,
  },

  // Données de test
  testData: {
    users: {
      testUser1: {
        phone: '+33612345678',
        code: '123456',
        displayName: 'TestUser1',
      },
      testUser2: {
        phone: '+33687654321',
        code: '123456',
        displayName: 'TestUser2',
      },
    },
    activities: {
      default: 'Café',
      alternatives: ['Lunch', 'Sport', 'Cinéma'],
    },
  },

  // Sélecteurs utiles
  selectors: {
    // Page de connexion
    phoneInput: 'input[placeholder*="téléphone"]',
    codeInput: 'input[placeholder*="code"]',
    loginButton: 'button[type="submit"]',

    // Navigation
    homeTab: '[data-testid="tab-home"]',
    friendsTab: '[data-testid="tab-friends"]',
    mapTab: '[data-testid="tab-map"]',
    settingsTab: '[data-testid="tab-settings"]',

    // Boutons principaux
    availabilityButton: '[data-testid="availability-button"]',
    addFriendButton: '[data-testid="add-friend-button"]',
    notificationIcon: '[data-testid="notification-icon"]',

    // Modals
    modalTitle: '[data-testid="modal-title"]',
    modalClose: '[data-testid="modal-close"]',
    modalConfirm: '[data-testid="modal-confirm"]',

    // Carte
    mapContainer: '[data-testid="map-container"]',
    mapMarker: '[data-testid="map-marker"]',
    mapControls: '[data-testid="map-controls"]',
  },
};

module.exports = config;
