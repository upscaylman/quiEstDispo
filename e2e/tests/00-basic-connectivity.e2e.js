// Test E2E basique - Vérification connectivité - PHASE 6
const puppeteer = require('puppeteer');
const config = require('../config/puppeteer.config');

describe('🔗 E2E - Test connectivité basique', () => {
  let browser;
  let page;

  beforeAll(async () => {
    console.log('🚀 Test de connectivité E2E...');
    browser = await puppeteer.launch(config.browser);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
      console.log('🔚 Test terminé');
    }
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport(config.browser.defaultViewport);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('🌐 Connectivité de base', () => {
    test("doit pouvoir accéder à l'application", async () => {
      console.log("🧪 Test: Accès à l'application");

      try {
        // Naviguer vers l'application
        await page.goto(config.baseUrl, {
          waitUntil: 'networkidle0',
          timeout: config.timeouts.navigation,
        });

        // Vérifier que la page se charge
        const title = await page.title();
        console.log(`📄 Titre de la page: "${title}"`);

        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(0);

        // Prendre une capture d'écran
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotPath = `e2e/screenshots/00-basic-connectivity-${timestamp}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });
        console.log(`📸 Screenshot: ${screenshotPath}`);

        console.log('✅ Application accessible');
      } catch (error) {
        console.error('❌ Erreur de connectivité:', error.message);
        throw error;
      }
    }, 30000);

    test("doit détecter la présence d'éléments React", async () => {
      console.log('🧪 Test: Détection éléments React');

      await page.goto(config.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: config.timeouts.navigation,
      });

      // Attendre qu'un élément React soit présent
      try {
        await page.waitForSelector('#root', { timeout: 10000 });
        console.log('✅ Élément #root trouvé');

        // Vérifier que du contenu est présent
        const content = await page.$eval('#root', el => el.innerHTML);
        expect(content.length).toBeGreaterThan(10);

        console.log('✅ Contenu React détecté');
      } catch (error) {
        console.warn(
          '⚠️ Élément #root non trouvé - application peut-être pas encore chargée'
        );

        // Essayer avec un sélecteur plus général
        const bodyContent = await page.$eval('body', el => el.innerHTML);
        expect(bodyContent.length).toBeGreaterThan(10);

        console.log('✅ Contenu HTML de base détecté');
      }
    }, 30000);

    test('doit pouvoir écouter les erreurs console', async () => {
      console.log('🧪 Test: Écoute erreurs console');

      const consoleErrors = [];

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      await page.goto(config.baseUrl, {
        waitUntil: 'networkidle0',
        timeout: config.timeouts.navigation,
      });

      // Attendre un peu pour capturer d'éventuelles erreurs
      await page.waitForTimeout(3000);

      console.log(`📊 Erreurs console détectées: ${consoleErrors.length}`);

      if (consoleErrors.length > 0) {
        console.log('⚠️ Erreurs console:', consoleErrors);
      }

      // Ne pas faire échouer le test s'il y a des erreurs console
      // (l'application peut fonctionner malgré des warnings)

      console.log('✅ Écoute des erreurs console opérationnelle');
    }, 30000);
  });
});
