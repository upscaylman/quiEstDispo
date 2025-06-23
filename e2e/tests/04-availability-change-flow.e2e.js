// @ts-nocheck
// Tests E2E - Parcours Changement de Disponibilité (MOYEN → EXPERT)
// Teste les transitions d'état de disponibilité et leur impact

const puppeteer = require('puppeteer');
const { E2EHelpers } = require('../utils/helpers');
const config = require('../config/puppeteer.config');

describe('📍 Parcours Changement de Disponibilité - EXPERT', () => {
  let browser;
  let page;
  let helpers;

  beforeAll(async () => {
    browser = await puppeteer.launch(config.launchOptions);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    helpers = new E2EHelpers(page);

    await helpers.setupPage();

    // Setup géolocalisation pour tous les tests
    await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('🚀 Définir une disponibilité', () => {
    test(
      'doit permettre de définir sa première disponibilité',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Vérifier l'état initial (non disponible)
        await helpers.waitForText("Vous n'êtes pas disponible");

        // Cliquer sur "Définir ma disponibilité"
        await helpers.clickElement(config.selectors.buttons.setAvailability);

        // Vérifier l'ouverture du modal
        await helpers.waitForElement(config.selectors.modals.availability);

        // Sélectionner une activité (café)
        await helpers.clickElement(config.selectors.activities.coffee);

        // Optionnel : modifier la durée
        const durationInput = await helpers.waitForElement(
          config.selectors.inputs.duration
        );
        if (durationInput) {
          await durationInput.clear();
          await durationInput.type('60'); // 1 heure
        }

        // Confirmer
        await helpers.clickElement(config.selectors.buttons.confirm);

        // Vérifier le changement d'état
        await helpers.waitForText('Vous êtes disponible pour café');
        await helpers.waitForElement(config.selectors.buttons.stopAvailability);

        await helpers.takeScreenshot('availability-set-successfully');
      },
      config.timeouts.test
    );

    test(
      'doit afficher le compte à rebours de disponibilité',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir une disponibilité de 30 minutes
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);

        const durationInput = await helpers.waitForElement(
          config.selectors.inputs.duration
        );
        if (durationInput) {
          await durationInput.clear();
          await durationInput.type('30');
        }

        await helpers.clickElement(config.selectors.buttons.confirm);

        // Vérifier l'affichage du compte à rebours
        await helpers.waitForText(/\d{1,2}:\d{2}/); // Format MM:SS ou HH:MM

        // Attendre quelques secondes et vérifier la décrémentation
        const initialTime = await page.$eval(
          config.selectors.countdown,
          el => el.textContent
        );

        await page.waitForTimeout(3000);

        const updatedTime = await page.$eval(
          config.selectors.countdown,
          el => el.textContent
        );

        // Le temps doit avoir diminué
        expect(updatedTime).not.toBe(initialTime);

        await helpers.takeScreenshot('countdown-active');
      },
      config.timeouts.test
    );

    test(
      "doit permettre de changer d'activité pendant la disponibilité",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir une première disponibilité (café)
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        await helpers.waitForText('Vous êtes disponible pour café');
        await helpers.takeScreenshot('first-activity-set');

        // Changer d'activité
        await helpers.clickElement(config.selectors.buttons.changeActivity);
        await helpers.waitForElement(config.selectors.modals.availability);

        // Sélectionner une nouvelle activité (lunch)
        await helpers.clickElement(config.selectors.activities.lunch);
        await helpers.clickElement(config.selectors.buttons.confirm);

        // Vérifier le changement
        await helpers.waitForText('Vous êtes disponible pour lunch');

        await helpers.takeScreenshot('activity-changed');
      },
      config.timeouts.test
    );
  });

  describe('⏹️ Arrêter une disponibilité', () => {
    test(
      "doit permettre d'arrêter sa disponibilité manuellement",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir une disponibilité d'abord
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        await helpers.waitForText('Vous êtes disponible pour café');

        // Arrêter la disponibilité
        await helpers.clickElement(config.selectors.buttons.stopAvailability);

        // Vérifier la confirmation
        await helpers.waitForElement(config.selectors.modals.confirmation);
        await helpers.waitForText('Êtes-vous sûr de vouloir arrêter');

        await helpers.clickElement(config.selectors.buttons.confirmStop);

        // Vérifier le retour à l'état initial
        await helpers.waitForText("Vous n'êtes pas disponible");
        await helpers.waitForElement(config.selectors.buttons.setAvailability);

        await helpers.takeScreenshot('availability-stopped');
      },
      config.timeouts.test
    );

    test(
      "doit gérer l'expiration automatique de la disponibilité",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir une disponibilité très courte (1 minute pour le test)
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);

        const durationInput = await helpers.waitForElement(
          config.selectors.inputs.duration
        );
        if (durationInput) {
          await durationInput.clear();
          await durationInput.type('1'); // 1 minute
        }

        await helpers.clickElement(config.selectors.buttons.confirm);

        await helpers.waitForText('Vous êtes disponible pour café');

        // Attendre l'expiration (accélérer le temps si possible)
        // Pour le test, on peut simuler l'expiration via JavaScript
        await page.evaluate(() => {
          // Simuler l'expiration côté client
          if (window.__availabilityTimer) {
            clearTimeout(window.__availabilityTimer);
            window.__availabilityTimer = setTimeout(() => {
              // Déclencher l'expiration
              if (window.__handleAvailabilityExpired) {
                window.__handleAvailabilityExpired();
              }
            }, 1000);
          }
        });

        // Attendre la notification d'expiration
        await helpers.waitForText('Votre disponibilité a expiré');
        await helpers.waitForText("Vous n'êtes pas disponible");

        await helpers.takeScreenshot('availability-expired');
      },
      config.timeouts.test
    );
  });

  describe("🔄 Transitions d'état complexes", () => {
    test(
      'doit gérer les invitations pendant une disponibilité active',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir une disponibilité
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        await helpers.waitForText('Vous êtes disponible pour café');

        // Simuler la réception d'une invitation
        await page.evaluate(() => {
          // Mock d'une notification d'invitation
          if (window.__mockNotification) {
            window.__mockNotification({
              type: 'invitation',
              from: 'Paul',
              activity: 'café',
              message: 'Paul vous invite pour un café',
            });
          }
        });

        // Vérifier l'affichage de la notification
        await helpers.waitForText('Paul vous invite');

        // Accepter l'invitation
        await helpers.clickElement(config.selectors.buttons.acceptInvitation);

        // Vérifier le changement d'état
        await helpers.waitForText('Vous partagez votre position');

        await helpers.takeScreenshot('invitation-accepted-during-availability');
      },
      config.timeouts.test
    );

    test(
      "doit synchroniser l'état entre onglets",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir une disponibilité depuis l'onglet home
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        await helpers.waitForText('Vous êtes disponible pour café');
        await helpers.takeScreenshot('availability-set-home-tab');

        // Naviguer vers l'onglet carte
        await helpers.selectTab('map');

        // Vérifier que l'état est synchronisé
        await helpers.waitForElement(config.selectors.map.userMarker);
        // Vérifier que le bouton disponibilité reflète l'état actuel
        await helpers.waitForText('Arrêter ma disponibilité');

        await helpers.takeScreenshot('availability-synced-map-tab');

        // Arrêter depuis la carte
        await helpers.clickElement(config.selectors.buttons.stopAvailability);
        await helpers.waitForElement(config.selectors.modals.confirmation);
        await helpers.clickElement(config.selectors.buttons.confirmStop);

        // Retourner à l'onglet home et vérifier la synchronisation
        await helpers.selectTab('home');
        await helpers.waitForText("Vous n'êtes pas disponible");

        await helpers.takeScreenshot('availability-stopped-synced');
      },
      config.timeouts.test
    );
  });

  describe('📊 États et indicateurs visuels', () => {
    test(
      'doit afficher les bons indicateurs pour chaque état',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // État initial - Non disponible
        await helpers.waitForElement(config.selectors.status.notAvailable);
        await helpers.takeScreenshot('status-not-available');

        // État disponible
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        await helpers.waitForElement(config.selectors.status.available);
        await helpers.takeScreenshot('status-available');

        // État partage de position (simulation)
        await page.evaluate(() => {
          if (window.__setLocationSharing) {
            window.__setLocationSharing(true);
          }
        });

        await helpers.waitForElement(config.selectors.status.sharingLocation);
        await helpers.takeScreenshot('status-sharing-location');
      },
      config.timeouts.test
    );

    test(
      "doit afficher les notifications de changement d'état",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Définir disponibilité et vérifier la notification
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        // Vérifier la notification de succès
        await helpers.waitForText('Disponibilité activée');

        await helpers.takeScreenshot('notification-availability-set');

        // Arrêter et vérifier la notification
        await helpers.clickElement(config.selectors.buttons.stopAvailability);
        await helpers.waitForElement(config.selectors.modals.confirmation);
        await helpers.clickElement(config.selectors.buttons.confirmStop);

        await helpers.waitForText('Disponibilité arrêtée');

        await helpers.takeScreenshot('notification-availability-stopped');
      },
      config.timeouts.test
    );
  });

  describe('🌐 Gestion offline/online', () => {
    test(
      'doit gérer la définition de disponibilité en mode offline',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Passer en mode offline
        await page.setOfflineMode(true);

        // Essayer de définir une disponibilité
        await helpers.clickElement(config.selectors.buttons.setAvailability);
        await helpers.waitForElement(config.selectors.modals.availability);
        await helpers.clickElement(config.selectors.activities.coffee);
        await helpers.clickElement(config.selectors.buttons.confirm);

        // Vérifier le message d'erreur ou mode dégradé
        await helpers.waitForText('Mode hors ligne');

        await helpers.takeScreenshot('availability-offline-mode');

        // Repasser en ligne et vérifier la synchronisation
        await page.setOfflineMode(false);
        await page.waitForTimeout(2000);

        // La disponibilité devrait se synchroniser automatiquement
        await helpers.waitForText('Synchronisation en cours');

        await helpers.takeScreenshot('availability-back-online');
      },
      config.timeouts.test
    );
  });
});
