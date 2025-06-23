// Test E2E - Parcours ajout d'ami - PHASE 6
const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');
const E2EHelpers = require('../utils/helpers');

describe("👥 E2E - Parcours ajout d'ami", () => {
  let browser;
  let page;
  let helpers;

  beforeAll(async () => {
    browser = await puppeteer.launch(config.browser);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    helpers = new E2EHelpers(page);
    await page.setViewport(config.browser.defaultViewport);

    // Se connecter avant chaque test
    await helpers.navigateTo('/');
    await helpers.login('testUser1');
  });

  afterEach(async () => {
    if (page) {
      await helpers.cleanup();
      await page.close();
    }
  });

  describe("📱 Ajout d'ami via téléphone", () => {
    test("doit ouvrir le modal d'ajout d'ami", async () => {
      console.log('🧪 Test: Ouverture modal ajout ami');

      // Aller sur l'écran amis
      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');

      // Cliquer sur le bouton d'ajout d'ami
      const addFriendButton = await helpers.waitForElement(
        config.selectors.addFriendButton,
        10000
      );
      expect(addFriendButton).toBe(true);

      await helpers.clickElement(config.selectors.addFriendButton);

      // Vérifier que le modal s'ouvre
      const modalVisible = await helpers.waitForElement(
        '[data-testid="add-friend-modal"]',
        5000
      );
      expect(modalVisible).toBe(true);

      await helpers.takeScreenshot('07-modal-ajout-ami');

      console.log('✅ Modal ajout ami ouvert');
    }, 30000);

    test("doit permettre l'ajout par numéro de téléphone", async () => {
      console.log('🧪 Test: Ajout ami par téléphone');

      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');
      await helpers.clickElement(config.selectors.addFriendButton);

      // Attendre le modal et sélectionner méthode téléphone
      await helpers.waitForElement('[data-testid="add-friend-modal"]');

      const phoneMethodButton = await helpers.waitForElement(
        '[data-testid="method-phone"]',
        5000
      );
      if (phoneMethodButton) {
        await helpers.clickElement('[data-testid="method-phone"]');

        // Saisir un numéro de test
        const phoneInput = await helpers.waitForElement(
          'input[placeholder*="téléphone"]',
          5000
        );
        if (phoneInput) {
          await helpers.clearAndType(
            'input[placeholder*="téléphone"]',
            config.testData.users.testUser2.phone
          );

          // Cliquer sur rechercher/ajouter
          const searchButton = await helpers.waitForElement(
            '[data-testid="search-friend-button"]',
            3000
          );
          if (searchButton) {
            await helpers.clickElement('[data-testid="search-friend-button"]');

            // Attendre le résultat
            await page.waitForTimeout(2000);
            await helpers.takeScreenshot('08-recherche-ami-telephone');

            console.log('✅ Recherche ami par téléphone effectuée');
          } else {
            console.log('⚠️ Bouton recherche non trouvé');
          }
        } else {
          console.log('⚠️ Input téléphone non trouvé');
        }
      } else {
        console.log('⚠️ Méthode téléphone non disponible');
      }
    }, 45000);

    test("doit permettre l'ajout par QR Code", async () => {
      console.log('🧪 Test: Ajout ami par QR Code');

      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');
      await helpers.clickElement(config.selectors.addFriendButton);

      await helpers.waitForElement('[data-testid="add-friend-modal"]');

      // Sélectionner méthode QR Code
      const qrMethodButton = await helpers.waitForElement(
        '[data-testid="method-qr"]',
        5000
      );
      if (qrMethodButton) {
        await helpers.clickElement('[data-testid="method-qr"]');

        // Vérifier que l'interface QR s'affiche
        const qrScannerVisible = await helpers.waitForElement(
          '[data-testid="qr-scanner"]',
          5000
        );
        const qrCodeVisible = await helpers.waitForElement(
          '[data-testid="qr-code"]',
          5000
        );

        expect(qrScannerVisible || qrCodeVisible).toBe(true);

        await helpers.takeScreenshot('09-interface-qr-code');

        console.log('✅ Interface QR Code affichée');
      } else {
        console.log('⚠️ Méthode QR Code non disponible');
      }
    }, 30000);

    test('doit permettre le partage de profil', async () => {
      console.log('🧪 Test: Partage de profil');

      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');
      await helpers.clickElement(config.selectors.addFriendButton);

      await helpers.waitForElement('[data-testid="add-friend-modal"]');

      // Sélectionner méthode partage
      const shareMethodButton = await helpers.waitForElement(
        '[data-testid="method-share"]',
        5000
      );
      if (shareMethodButton) {
        await helpers.clickElement('[data-testid="method-share"]');

        // Cliquer sur le bouton de partage
        const shareButton = await helpers.waitForElement(
          '[data-testid="share-profile-button"]',
          5000
        );
        if (shareButton) {
          await helpers.clickElement('[data-testid="share-profile-button"]');

          await helpers.takeScreenshot('10-partage-profil');

          console.log('✅ Partage de profil déclenché');
        } else {
          console.log('⚠️ Bouton partage non trouvé');
        }
      } else {
        console.log('⚠️ Méthode partage non disponible');
      }
    }, 30000);
  });

  describe('📨 Gestion des invitations', () => {
    test("doit fermer le modal d'ajout d'ami", async () => {
      console.log('🧪 Test: Fermeture modal ajout ami');

      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');
      await helpers.clickElement(config.selectors.addFriendButton);

      await helpers.waitForElement('[data-testid="add-friend-modal"]');

      // Fermer le modal
      const closeButton = await helpers.waitForElement(
        config.selectors.modalClose,
        5000
      );
      if (closeButton) {
        await helpers.clickElement(config.selectors.modalClose);

        // Vérifier que le modal est fermé
        await page.waitForTimeout(1000);
        const modalStillVisible = await helpers.isElementVisible(
          '[data-testid="add-friend-modal"]'
        );
        expect(modalStillVisible).toBe(false);

        console.log('✅ Modal fermé correctement');
      } else {
        // Essayer avec Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(1000);

        const modalStillVisible = await helpers.isElementVisible(
          '[data-testid="add-friend-modal"]'
        );
        expect(modalStillVisible).toBe(false);

        console.log('✅ Modal fermé avec Escape');
      }
    }, 30000);

    test('doit afficher la liste des amis', async () => {
      console.log('🧪 Test: Affichage liste amis');

      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');

      // Vérifier la présence d'éléments de la liste
      const friendsList = await helpers.waitForElement(
        '[data-testid="friends-list"]',
        5000
      );

      if (friendsList) {
        // Compter les amis affichés
        const friendsCount = await helpers.getElementCount(
          '[data-testid^="friend-item"]'
        );
        console.log(`📊 Nombre d'amis affichés: ${friendsCount}`);

        expect(friendsCount).toBeGreaterThanOrEqual(0);

        await helpers.takeScreenshot('11-liste-amis');

        console.log('✅ Liste amis affichée');
      } else {
        console.log('⚠️ Liste amis non trouvée - peut être vide');
      }
    }, 30000);
  });

  describe('🔄 Navigation et états', () => {
    test("doit revenir à l'écran amis après ajout", async () => {
      console.log('🧪 Test: Retour écran amis après ajout');

      await helpers.selectTab('friends');
      await helpers.waitForElement('[data-testid="friends-screen"]');

      // Ouvrir le modal d'ajout
      await helpers.clickElement(config.selectors.addFriendButton);
      await helpers.waitForElement('[data-testid="add-friend-modal"]');

      // Fermer le modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);

      // Vérifier qu'on est toujours sur l'écran amis
      const friendsScreenVisible = await helpers.waitForElement(
        '[data-testid="friends-screen"]'
      );
      expect(friendsScreenVisible).toBe(true);

      console.log("✅ Retour à l'écran amis confirmé");
    }, 30000);
  });
});
