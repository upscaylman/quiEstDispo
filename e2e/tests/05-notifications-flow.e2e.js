// @ts-nocheck
// Tests E2E - Parcours Notifications (EXPERT)
// Teste le système de notifications complet : réception, actions, temps réel

const puppeteer = require('puppeteer');
const { E2EHelpers } = require('../utils/helpers');
const config = require('../config/puppeteer.config');

describe('🔔 Parcours Notifications - EXPERT', () => {
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

  describe('🔔 Badge et compteur de notifications', () => {
    test(
      'doit afficher le badge de notifications non lues',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler des notifications non lues
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: '1',
                type: 'friend_invitation',
                read: false,
                message: "Paul vous a envoyé une demande d'ami",
              },
              {
                id: '2',
                type: 'invitation',
                read: false,
                message: 'Jack vous invite pour un café',
              },
              {
                id: '3',
                type: 'activity_accepted',
                read: true,
                message: 'Marie a accepté votre invitation',
              },
            ]);
          }
        });

        // Vérifier l'affichage du badge (2 non lues)
        await helpers.waitForElement(config.selectors.notifications.badge);
        await helpers.waitForText('2');

        await helpers.takeScreenshot('notification-badge-displayed');
      },
      config.timeouts.test
    );

    test(
      'doit mettre à jour le badge en temps réel',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // État initial : pas de notifications
        const badge = await page.$(config.selectors.notifications.badge);
        expect(badge).toBeFalsy();

        // Simuler l'arrivée d'une nouvelle notification
        await page.evaluate(() => {
          if (window.__addNotification) {
            window.__addNotification({
              id: 'new-notif',
              type: 'invitation',
              read: false,
              message: 'Nouvelle invitation reçue',
            });
          }
        });

        // Vérifier l'apparition du badge
        await helpers.waitForElement(config.selectors.notifications.badge);
        await helpers.waitForText('1');

        await helpers.takeScreenshot('badge-updated-realtime');
      },
      config.timeouts.test
    );
  });

  describe('📱 Interface notifications', () => {
    test(
      'doit ouvrir et fermer le centre de notifications',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Cliquer sur l'onglet notifications
        await helpers.selectTab('notifications');

        // Vérifier l'ouverture
        await helpers.waitForElement(config.selectors.notifications.center);
        await helpers.waitForText('Centre de notifications');

        await helpers.takeScreenshot('notifications-center-opened');

        // Retourner à l'accueil
        await helpers.selectTab('home');

        // Vérifier la fermeture
        const center = await page.$(config.selectors.notifications.center);
        expect(center).toBeFalsy();
      },
      config.timeouts.test
    );

    test(
      'doit afficher différents types de notifications',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler différents types de notifications
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: '1',
                type: 'friend_invitation',
                read: false,
                message: "Paul vous a envoyé une demande d'ami",
                data: { fromUserId: 'paul123', fromUserName: 'Paul' },
              },
              {
                id: '2',
                type: 'invitation',
                read: false,
                message: 'Jack vous invite pour un café',
                data: { activity: 'café', fromUserName: 'Jack' },
              },
              {
                id: '3',
                type: 'activity_accepted',
                read: false,
                message: 'Marie a accepté votre invitation pour lunch',
              },
              {
                id: '4',
                type: 'activity_declined',
                read: false,
                message: 'Tom a décliné votre invitation',
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Vérifier l'affichage des différents types
        await helpers.waitForText('Paul vous a envoyé une demande');
        await helpers.waitForText('Jack vous invite pour un café');
        await helpers.waitForText('Marie a accepté');
        await helpers.waitForText('Tom a décliné');

        // Vérifier la présence des boutons d'action pour les invitations
        await helpers.waitForElement(config.selectors.buttons.acceptFriend);
        await helpers.waitForElement(config.selectors.buttons.declineFriend);
        await helpers.waitForElement(config.selectors.buttons.acceptInvitation);
        await helpers.waitForElement(
          config.selectors.buttons.declineInvitation
        );

        await helpers.takeScreenshot('notifications-different-types');
      },
      config.timeouts.test
    );

    test(
      'doit organiser les notifications par sections',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler un mix de notifications
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: '1',
                type: 'friend_invitation',
                read: false,
                message: "Demande d'ami de Paul",
              },
              {
                id: '2',
                type: 'friend_invitation',
                read: false,
                message: "Demande d'ami de Jack",
              },
              {
                id: '3',
                type: 'invitation',
                read: false,
                message: 'Invitation café de Marie',
              },
              {
                id: '4',
                type: 'activity_accepted',
                read: false,
                message: 'Tom a accepté',
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Vérifier les sections
        await helpers.waitForText("Demandes d'amitié");
        await helpers.waitForText("Invitations d'activités");
        await helpers.waitForText("Réponses d'activités");

        // Vérifier les compteurs de section
        await helpers.waitForText('2 nouvelles'); // Demandes d'amitié

        await helpers.takeScreenshot('notifications-organized-sections');
      },
      config.timeouts.test
    );
  });

  describe("🤝 Actions sur les invitations d'amis", () => {
    test(
      "doit permettre d'accepter une demande d'ami",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une demande d'ami
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'friend-req-1',
                type: 'friend_invitation',
                read: false,
                message: "Paul vous a envoyé une demande d'ami",
                data: { fromUserId: 'paul123', fromUserName: 'Paul' },
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Accepter la demande
        await helpers.clickElement(config.selectors.buttons.acceptFriend);

        // Vérifier la confirmation
        await helpers.waitForText('Paul a été ajouté à vos amis');

        // Vérifier que la notification disparaît ou change d'état
        await page.waitForTimeout(1000);
        const notification = await page.$(
          config.selectors.notifications.friendInvitation
        );
        expect(notification).toBeFalsy();

        await helpers.takeScreenshot('friend-request-accepted');
      },
      config.timeouts.test
    );

    test(
      "doit permettre de décliner une demande d'ami",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une demande d'ami
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'friend-req-2',
                type: 'friend_invitation',
                read: false,
                message: "Jack vous a envoyé une demande d'ami",
                data: { fromUserId: 'jack456', fromUserName: 'Jack' },
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Décliner la demande
        await helpers.clickElement(config.selectors.buttons.declineFriend);

        // Vérifier la confirmation
        await helpers.waitForText("Demande d'ami déclinée");

        // Vérifier que la notification disparaît
        await page.waitForTimeout(1000);
        const notification = await page.$(
          config.selectors.notifications.friendInvitation
        );
        expect(notification).toBeFalsy();

        await helpers.takeScreenshot('friend-request-declined');
      },
      config.timeouts.test
    );
  });

  describe("🎯 Actions sur les invitations d'activités", () => {
    test(
      "doit permettre d'accepter une invitation d'activité",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une invitation d'activité
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'activity-inv-1',
                type: 'invitation',
                read: false,
                message: 'Marie vous invite pour un café',
                data: {
                  activity: 'café',
                  fromUserName: 'Marie',
                  availabilityId: 'avail-123',
                },
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Accepter l'invitation
        await helpers.clickElement(config.selectors.buttons.acceptInvitation);

        // Vérifier la confirmation et le changement d'état
        await helpers.waitForText('Invitation acceptée');
        await helpers.waitForText('Vous partagez maintenant votre position');

        // Vérifier la redirection vers la carte ou l'état de partage
        await page.waitForTimeout(2000);

        await helpers.takeScreenshot('activity-invitation-accepted');
      },
      config.timeouts.test
    );

    test(
      "doit permettre de décliner une invitation d'activité",
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une invitation d'activité
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'activity-inv-2',
                type: 'invitation',
                read: false,
                message: 'Tom vous invite pour un lunch',
                data: {
                  activity: 'lunch',
                  fromUserName: 'Tom',
                  availabilityId: 'avail-456',
                },
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Décliner l'invitation
        await helpers.clickElement(config.selectors.buttons.declineInvitation);

        // Vérifier la confirmation
        await helpers.waitForText('Invitation déclinée');

        // Vérifier que la notification disparaît
        await page.waitForTimeout(1000);
        const notification = await page.$(
          config.selectors.notifications.activityInvitation
        );
        expect(notification).toBeFalsy();

        await helpers.takeScreenshot('activity-invitation-declined');
      },
      config.timeouts.test
    );
  });

  describe('📱 Interactions gestuelles (mobile)', () => {
    test(
      'doit permettre de supprimer une notification par swipe',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une notification
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'swipe-test',
                type: 'activity_accepted',
                read: false,
                message: 'Paul a accepté votre invitation',
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        const notification = await helpers.waitForElement(
          config.selectors.notifications.item
        );

        // Simuler un swipe vers la gauche
        const box = await notification.boundingBox();
        await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 10, box.y + box.height / 2);
        await page.mouse.up();

        // Vérifier l'apparition du bouton de suppression
        await helpers.waitForElement(
          config.selectors.buttons.deleteNotification
        );

        await helpers.takeScreenshot('notification-swiped');

        // Cliquer sur supprimer
        await helpers.clickElement(config.selectors.buttons.deleteNotification);

        // Vérifier la suppression
        await page.waitForTimeout(1000);
        const deletedNotification = await page.$(
          config.selectors.notifications.item
        );
        expect(deletedNotification).toBeFalsy();

        await helpers.takeScreenshot('notification-deleted');
      },
      config.timeouts.test
    );

    test(
      'doit permettre de marquer toutes les notifications comme lues',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler plusieurs notifications non lues
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: '1',
                type: 'activity_accepted',
                read: false,
                message: 'Paul a accepté',
              },
              {
                id: '2',
                type: 'activity_declined',
                read: false,
                message: 'Jack a décliné',
              },
              {
                id: '3',
                type: 'activity_accepted',
                read: false,
                message: 'Marie a accepté',
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Vérifier le badge initial
        await helpers.waitForElement(config.selectors.notifications.badge);
        await helpers.waitForText('3');

        // Cliquer sur "Tout marquer comme lu"
        await helpers.clickElement(config.selectors.buttons.markAllRead);

        // Vérifier la disparition du badge
        await page.waitForTimeout(1000);
        const badge = await page.$(config.selectors.notifications.badge);
        expect(badge).toBeFalsy();

        // Vérifier l'état visuel des notifications (plus de point bleu)
        const unreadIndicators = await page.$$(
          config.selectors.notifications.unreadIndicator
        );
        expect(unreadIndicators.length).toBe(0);

        await helpers.takeScreenshot('all-notifications-marked-read');
      },
      config.timeouts.test
    );
  });

  describe('⏰ Notifications temps réel', () => {
    test(
      'doit recevoir et afficher les notifications en temps réel',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // État initial sans notifications
        let badge = await page.$(config.selectors.notifications.badge);
        expect(badge).toBeFalsy();

        await helpers.takeScreenshot('before-realtime-notification');

        // Simuler l'arrivée d'une notification temps réel
        await page.evaluate(() => {
          setTimeout(() => {
            if (window.__realtimeNotification) {
              window.__realtimeNotification({
                id: 'realtime-' + Date.now(),
                type: 'invitation',
                read: false,
                message: 'Nouvelle invitation reçue en temps réel',
                timestamp: new Date(),
              });
            }
          }, 1000);
        });

        // Vérifier l'apparition du badge
        await helpers.waitForElement(
          config.selectors.notifications.badge,
          3000
        );
        await helpers.waitForText('1');

        // Vérifier la notification push si activée
        await helpers.waitForText('Nouvelle notification');

        await helpers.takeScreenshot('realtime-notification-received');
      },
      config.timeouts.test
    );

    test(
      'doit synchroniser les notifications entre onglets',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Aller sur l'onglet notifications
        await helpers.selectTab('notifications');

        // État initial vide
        await helpers.waitForText('Aucune notification');

        // Simuler une nouvelle notification depuis un autre onglet/contexte
        await page.evaluate(() => {
          if (window.__externalNotificationUpdate) {
            window.__externalNotificationUpdate({
              id: 'external-update',
              type: 'friend_invitation',
              read: false,
              message: 'Synchronisation entre onglets',
            });
          }
        });

        // Vérifier l'apparition de la notification dans l'onglet actuel
        await helpers.waitForText('Synchronisation entre onglets');

        await helpers.takeScreenshot('notification-synced-between-tabs');
      },
      config.timeouts.test
    );
  });

  describe("🔧 Gestion d'erreurs et edge cases", () => {
    test(
      'doit gérer les erreurs de réseau lors des actions',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une notification
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'error-test',
                type: 'friend_invitation',
                read: false,
                message: 'Test erreur réseau',
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Simuler une erreur réseau
        await page.setOfflineMode(true);

        // Essayer d'accepter la demande d'ami
        await helpers.clickElement(config.selectors.buttons.acceptFriend);

        // Vérifier l'affichage de l'erreur
        await helpers.waitForText('Erreur de connexion');
        await helpers.waitForText('Veuillez réessayer');

        await helpers.takeScreenshot('notification-action-network-error');

        // Repasser en ligne et réessayer
        await page.setOfflineMode(false);
        await helpers.clickElement(config.selectors.buttons.retry);

        // Vérifier la réussite
        await helpers.waitForText("Demande d'ami acceptée");

        await helpers.takeScreenshot('notification-action-retry-success');
      },
      config.timeouts.test
    );

    test(
      'doit gérer les notifications expirées ou invalides',
      async () => {
        await helpers.navigateTo('/');
        await helpers.login(
          config.testUsers.testUser1.phone,
          config.testUsers.testUser1.code
        );

        // Simuler une notification expirée
        await page.evaluate(() => {
          if (window.__mockNotifications) {
            window.__mockNotifications([
              {
                id: 'expired-invitation',
                type: 'invitation',
                read: false,
                message: 'Invitation expirée',
                data: {
                  availabilityId: 'expired-123',
                  expiresAt: new Date(Date.now() - 3600000), // Expirée il y a 1h
                },
              },
            ]);
          }
        });

        await helpers.selectTab('notifications');

        // Essayer d'accepter l'invitation expirée
        await helpers.clickElement(config.selectors.buttons.acceptInvitation);

        // Vérifier le message d'erreur
        await helpers.waitForText('Cette invitation a expiré');

        // Vérifier que la notification est automatiquement nettoyée
        await page.waitForTimeout(2000);
        const expiredNotification = await page.$(
          config.selectors.notifications.item
        );
        expect(expiredNotification).toBeFalsy();

        await helpers.takeScreenshot('expired-notification-handled');
      },
      config.timeouts.test
    );
  });
});
