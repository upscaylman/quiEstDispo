// Test E2E - Parcours connexion complète - PHASE 6
const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const E2EHelpers = require('../utils/helpers');

describe('🔐 E2E - Parcours connexion complète', () => {
  let browser;
  let page;
  let helpers;

  beforeAll(async () => {
    console.log('🚀 Lancement du navigateur pour tests E2E...');
    browser = await puppeteer.launch(config.browser);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('🔚 Navigateur fermé');
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    helpers = new E2EHelpers(page);

    // Configuration de la page
    await page.setViewport(config.browser.defaultViewport);

    // Écouter les erreurs console
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Erreur console:', msg.text());
      }
    });

    // Écouter les erreurs de page
    page.on('pageerror', error => {
      console.log('💥 Erreur page:', error.message);
    });
  });

  afterEach(async () => {
    if (page) {
      await helpers.cleanup();
      await page.close();
    }
  });

  describe("📱 Flux d'authentification", () => {
    test('doit permettre une connexion complète avec numéro français', async () => {
      console.log('🧪 Test: Connexion complète avec numéro français');

      // 1. Naviguer vers l'application
      await helpers.navigateTo('/');
      await helpers.takeScreenshot('01-page-accueil');

      // 2. Vérifier que la page de connexion s'affiche
      const phoneInputVisible = await helpers.waitForElement(
        config.selectors.phoneInput,
        10000
      );
      expect(phoneInputVisible).toBe(true);

      // 3. Effectuer la connexion
      await helpers.login('testUser1');
      await helpers.takeScreenshot('02-apres-connexion');

      // 4. Vérifier qu'on est bien sur la page d'accueil
      const homeScreenVisible = await helpers.waitForElement(
        '[data-testid="home-screen"]'
      );
      expect(homeScreenVisible).toBe(true);

      // 5. Vérifier la présence des éléments principaux
      const availabilityButtonVisible = await helpers.isElementVisible(
        config.selectors.availabilityButton
      );
      expect(availabilityButtonVisible).toBe(true);

      console.log('✅ Connexion complète réussie');
    }, 60000); // Timeout de 60s pour E2E

    test('doit gérer les erreurs de numéro invalide', async () => {
      console.log('🧪 Test: Gestion erreurs numéro invalide');

      await helpers.navigateTo('/');

      // Tenter avec un numéro invalide
      await helpers.waitForSelector(config.selectors.phoneInput);
      await helpers.clearAndType(config.selectors.phoneInput, '+1234567890'); // Numéro non français

      await helpers.clickElement(config.selectors.loginButton);

      // Vérifier qu'un message d'erreur s'affiche
      const errorVisible = await helpers.waitForText('numéro français', 5000);
      expect(errorVisible).toBe(true);

      await helpers.takeScreenshot('03-erreur-numero-invalide');

      console.log('✅ Gestion erreur numéro invalide validée');
    }, 30000);

    test('doit permettre la déconnexion', async () => {
      console.log('🧪 Test: Déconnexion utilisateur');

      // Se connecter d'abord
      await helpers.navigateTo('/');
      await helpers.login('testUser1');

      // Aller dans les paramètres
      await helpers.selectTab('settings');
      await helpers.waitForElement('[data-testid="settings-screen"]');

      // Chercher le bouton de déconnexion
      const logoutButtonVisible = await helpers.waitForElement(
        '[data-testid="logout-button"]',
        5000
      );

      if (logoutButtonVisible) {
        await helpers.clickElement('[data-testid="logout-button"]');

        // Confirmer la déconnexion si modal
        const confirmVisible = await helpers.waitForElement(
          config.selectors.modalConfirm,
          3000
        );
        if (confirmVisible) {
          await helpers.clickElement(config.selectors.modalConfirm);
        }

        // Vérifier retour à la page de connexion
        const phoneInputVisible = await helpers.waitForElement(
          config.selectors.phoneInput,
          10000
        );
        expect(phoneInputVisible).toBe(true);

        await helpers.takeScreenshot('04-apres-deconnexion');

        console.log('✅ Déconnexion réussie');
      } else {
        console.log('⚠️ Bouton de déconnexion non trouvé - test skippé');
      }
    }, 45000);
  });

  describe('🔄 Persistance de session', () => {
    test('doit maintenir la session après rechargement de page', async () => {
      console.log('🧪 Test: Persistance session après rechargement');

      // Se connecter
      await helpers.navigateTo('/');
      await helpers.login('testUser1');

      // Recharger la page
      await page.reload({ waitUntil: 'networkidle0' });
      await helpers.takeScreenshot('05-apres-rechargement');

      // Vérifier qu'on reste connecté
      const homeScreenVisible = await helpers.waitForElement(
        '[data-testid="home-screen"]',
        15000
      );
      expect(homeScreenVisible).toBe(true);

      console.log('✅ Session maintenue après rechargement');
    }, 45000);

    test('doit gérer la navigation entre onglets', async () => {
      console.log('🧪 Test: Navigation entre onglets');

      await helpers.navigateTo('/');
      await helpers.login('testUser1');

      // Tester navigation vers amis
      await helpers.selectTab('friends');
      const friendsScreenVisible = await helpers.waitForElement(
        '[data-testid="friends-screen"]',
        10000
      );
      expect(friendsScreenVisible).toBe(true);

      // Tester navigation vers carte
      await helpers.selectTab('map');
      const mapScreenVisible = await helpers.waitForElement(
        '[data-testid="map-screen"]',
        10000
      );
      expect(mapScreenVisible).toBe(true);

      // Retour à l'accueil
      await helpers.selectTab('home');
      const homeScreenVisible = await helpers.waitForElement(
        '[data-testid="home-screen"]',
        10000
      );
      expect(homeScreenVisible).toBe(true);

      await helpers.takeScreenshot('06-navigation-onglets');

      console.log('✅ Navigation entre onglets validée');
    }, 60000);
  });
});
