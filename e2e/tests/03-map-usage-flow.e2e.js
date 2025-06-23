// @ts-nocheck
// Tests E2E - Parcours Utilisation Carte (EXPERT)
// Teste les fonctionnalités avancées : géolocalisation, amis, temps réel

const puppeteer = require('puppeteer');
const { E2EHelpers } = require('../utils/helpers');
const config = require('../config/puppeteer.config');

describe('🗺️ Parcours Utilisation Carte - EXPERT', () => {
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
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('🌍 Géolocalisation et permissions', () => {
    test(
      'doit demander les permissions de géolocalisation',
      async () => {
        await helpers.navigateTo('/');

        // Mock geolocation permissions
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        // Connecter l'utilisateur pour accéder à la carte
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Naviguer vers l'onglet carte
        await helpers.selectTab('map');

        // Vérifier que la carte se charge
        await helpers.waitForElement(config.selectors.map.container);

        await helpers.takeScreenshot('geolocation-permissions');
      },
      config.timeouts.test
    );

    test(
      'doit afficher la position utilisateur sur la carte',
      async () => {
        await helpers.navigateTo('/');

        // Simuler une position précise
        const userLocation = { latitude: 48.8566, longitude: 2.3522 };
        await page.setGeolocation(userLocation);

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        // Attendre le chargement de la carte
        await helpers.waitForElement(config.selectors.map.container);

        // Vérifier la présence du marqueur utilisateur
        const userMarker = await helpers.waitForElement(
          config.selectors.map.userMarker,
          5000
        );
        expect(userMarker).toBeTruthy();

        await helpers.takeScreenshot('user-position-on-map');
      },
      config.timeouts.test
    );

    test(
      'doit gérer le refus de géolocalisation',
      async () => {
        await helpers.navigateTo('/');

        // Simuler le refus de géolocalisation
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'geolocation', {
            value: {
              getCurrentPosition: (success, error) => {
                error({ code: 1, message: 'User denied Geolocation' });
              },
            },
          });
        });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        // Vérifier l'affichage du message d'erreur géolocalisation
        await helpers.waitForText('Géolocalisation non disponible');

        await helpers.takeScreenshot('geolocation-denied');
      },
      config.timeouts.test
    );
  });

  describe('👥 Affichage des amis sur la carte', () => {
    test(
      'doit afficher les amis disponibles sur la carte',
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        // Attendre le chargement des données amis
        await helpers.waitForElement(config.selectors.map.container);

        // Simuler la présence d'amis (via network interception si nécessaire)
        await page.evaluate(() => {
          // Mock des données d'amis pour la carte
          window.__mockFriendsData = [
            {
              id: 'friend1',
              name: 'Paul',
              location: { lat: 48.8576, lng: 2.3522 },
              activity: 'café',
              isAvailable: true,
            },
          ];
        });

        // Recharger la carte pour prendre en compte les amis
        await page.reload();
        await helpers.selectTab('map');

        // Vérifier l'affichage des marqueurs d'amis
        await helpers.waitForElement(config.selectors.map.friendMarkers);

        await helpers.takeScreenshot('friends-on-map');
      },
      config.timeouts.test
    );

    test(
      "doit afficher les détails d'un ami au clic sur son marqueur",
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        await helpers.waitForElement(config.selectors.map.container);

        // Simuler un clic sur un marqueur d'ami
        const friendMarker = await helpers.waitForElement(
          config.selectors.map.friendMarkers
        );
        if (friendMarker) {
          await friendMarker.click();

          // Vérifier l'ouverture de la popup avec détails de l'ami
          await helpers.waitForElement(config.selectors.map.friendPopup);

          // Vérifier la présence des informations essentielles
          await helpers.waitForText('Paul'); // Nom de l'ami
          await helpers.waitForText('café'); // Activité

          await helpers.takeScreenshot('friend-marker-details');
        }
      },
      config.timeouts.test
    );
  });

  describe('🎯 Interactions carte avancées', () => {
    test(
      'doit permettre de zoomer et déplacer la carte',
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        const mapContainer = await helpers.waitForElement(
          config.selectors.map.container
        );

        // Test du zoom
        await mapContainer.evaluate(el => {
          // Simuler un événement de zoom (wheel event)
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: -100, // Zoom in
            clientX: el.offsetWidth / 2,
            clientY: el.offsetHeight / 2,
          });
          el.dispatchEvent(wheelEvent);
        });

        // Attendre la mise à jour du zoom
        await page.waitForTimeout(1000);

        // Test du déplacement (pan)
        await mapContainer.hover();
        await page.mouse.down();
        await page.mouse.move(
          mapContainer.getBoundingBox().x + 100,
          mapContainer.getBoundingBox().y + 100
        );
        await page.mouse.up();

        await helpers.takeScreenshot('map-interactions');
      },
      config.timeouts.test
    );

    test(
      'doit centrer la carte sur ma position',
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        await helpers.waitForElement(config.selectors.map.container);

        // Cliquer sur le bouton "Ma position"
        const myLocationButton = await helpers.waitForElement(
          config.selectors.map.myLocationButton
        );
        if (myLocationButton) {
          await myLocationButton.click();

          // Vérifier que la carte se centre (animation peut prendre du temps)
          await page.waitForTimeout(2000);

          await helpers.takeScreenshot('map-centered-on-user');
        }
      },
      config.timeouts.test
    );
  });

  describe('📍 Changement de disponibilité depuis la carte', () => {
    test(
      'doit permettre de définir sa disponibilité depuis la carte',
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        await helpers.waitForElement(config.selectors.map.container);

        // Cliquer sur le bouton "Définir ma disponibilité"
        const setAvailabilityButton = await helpers.waitForElement(
          config.selectors.map.setAvailabilityButton
        );
        if (setAvailabilityButton) {
          await setAvailabilityButton.click();

          // Vérifier l'ouverture du modal de disponibilité
          await helpers.waitForElement(config.selectors.modals.availability);

          // Sélectionner une activité (café)
          await helpers.clickElement(config.selectors.activities.coffee);

          // Confirmer
          await helpers.clickElement(config.selectors.buttons.confirm);

          // Vérifier que la disponibilité est active
          await helpers.waitForText('Vous êtes disponible');

          await helpers.takeScreenshot('availability-set-from-map');
        }
      },
      config.timeouts.test
    );

    test(
      'doit mettre à jour la position en temps réel',
      async () => {
        await helpers.navigateTo('/');

        // Position initiale
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        await helpers.waitForElement(config.selectors.map.container);

        // Définir une disponibilité pour activer le partage de position
        const setAvailabilityButton = await helpers.waitForElement(
          config.selectors.map.setAvailabilityButton
        );
        if (setAvailabilityButton) {
          await setAvailabilityButton.click();
          await helpers.waitForElement(config.selectors.modals.availability);
          await helpers.clickElement(config.selectors.activities.coffee);
          await helpers.clickElement(config.selectors.buttons.confirm);
        }

        await helpers.takeScreenshot('position-before-move');

        // Changer de position
        await page.setGeolocation({ latitude: 48.8576, longitude: 2.3532 });

        // Attendre la mise à jour de la position (peut prendre quelques secondes)
        await page.waitForTimeout(5000);

        await helpers.takeScreenshot('position-after-move');

        // Vérifier que la position a été mise à jour
        // (Test visuel via screenshot ou vérification DOM si possible)
      },
      config.timeouts.test
    );
  });

  describe('🤝 Invitations depuis la carte', () => {
    test(
      "doit permettre d'inviter un ami depuis ses détails sur la carte",
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        await helpers.waitForElement(config.selectors.map.container);

        // Simuler la présence d'un ami sur la carte
        // (Cliquer sur marqueur ami → popup → bouton inviter)
        const friendMarker = await helpers.waitForElement(
          config.selectors.map.friendMarkers
        );
        if (friendMarker) {
          await friendMarker.click();

          await helpers.waitForElement(config.selectors.map.friendPopup);

          // Cliquer sur "Inviter"
          const inviteButton = await helpers.waitForElement(
            config.selectors.buttons.invite
          );
          if (inviteButton) {
            await inviteButton.click();

            // Vérifier l'ouverture du modal d'invitation
            await helpers.waitForElement(config.selectors.modals.invite);

            // Sélectionner une activité et confirmer
            await helpers.clickElement(config.selectors.activities.coffee);
            await helpers.clickElement(config.selectors.buttons.send);

            // Vérifier le message de confirmation
            await helpers.waitForText('Invitation envoyée');

            await helpers.takeScreenshot('invitation-sent-from-map');
          }
        }
      },
      config.timeouts.test
    );
  });

  describe('🔄 Temps réel et synchronisation', () => {
    test(
      "doit synchroniser les changements d'amis en temps réel",
      async () => {
        await helpers.navigateTo('/');
        await page.setGeolocation({ latitude: 48.8566, longitude: 2.3522 });

        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );
        await helpers.selectTab('map');

        await helpers.waitForElement(config.selectors.map.container);

        // Screenshot initial
        await helpers.takeScreenshot('map-before-realtime-update');

        // Simuler un changement côté serveur (nouveau ami disponible)
        await page.evaluate(() => {
          // Simuler un événement de mise à jour temps réel
          if (window.__firebaseCallbacks) {
            window.__firebaseCallbacks.forEach(callback => {
              callback({
                docs: [
                  {
                    id: 'new-friend',
                    data: () => ({
                      name: 'Jack',
                      location: { lat: 48.858, lng: 2.354 },
                      activity: 'lunch',
                      isAvailable: true,
                    }),
                  },
                ],
              });
            });
          }
        });

        // Attendre la mise à jour de l'interface
        await page.waitForTimeout(3000);

        await helpers.takeScreenshot('map-after-realtime-update');

        // Vérifier l'apparition du nouveau marqueur
        // (Test visuel ou vérification DOM)
      },
      config.timeouts.test
    );
  });
});
