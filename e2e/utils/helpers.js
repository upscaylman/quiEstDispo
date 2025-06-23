// Utilitaires helpers pour tests E2E - PHASE 6
const config = require('../config/puppeteer.config');

class E2EHelpers {
  constructor(page) {
    this.page = page;
    this.config = config;
  }

  // === NAVIGATION ===

  async navigateTo(url) {
    const fullUrl = url.startsWith('http')
      ? url
      : `${this.config.baseUrl}${url}`;
    await this.page.goto(fullUrl, {
      waitUntil: 'networkidle0',
      timeout: this.config.timeouts.navigation,
    });
  }

  async waitForSelector(selector, timeout = this.config.timeouts.element) {
    return await this.page.waitForSelector(selector, { timeout });
  }

  async clickElement(selector) {
    await this.waitForSelector(selector);
    await this.page.click(selector);
  }

  async typeText(selector, text) {
    await this.waitForSelector(selector);
    await this.page.type(selector, text);
  }

  async clearAndType(selector, text) {
    await this.waitForSelector(selector);
    await this.page.click(selector, { clickCount: 3 }); // Sélectionner tout
    await this.page.type(selector, text);
  }

  // === AUTHENTIFICATION ===

  async login(userKey = 'testUser1') {
    const user = this.config.testData.users[userKey];

    console.log(`🔐 Connexion avec ${user.displayName} (${user.phone})`);

    // Attendre la page de connexion
    await this.waitForSelector(this.config.selectors.phoneInput);

    // Saisir le numéro de téléphone
    await this.clearAndType(this.config.selectors.phoneInput, user.phone);

    // Cliquer sur envoyer
    await this.clickElement(this.config.selectors.loginButton);

    // Attendre l'input du code
    await this.waitForSelector(
      this.config.selectors.codeInput,
      this.config.timeouts.medium
    );

    // Saisir le code
    await this.clearAndType(this.config.selectors.codeInput, user.code);

    // Soumettre
    await this.clickElement(this.config.selectors.loginButton);

    // Attendre la redirection vers l'accueil
    await this.waitForElement(
      '[data-testid="home-screen"]',
      this.config.timeouts.long
    );

    console.log(`✅ Connexion réussie pour ${user.displayName}`);
  }

  // === ATTENTES SMART ===

  async waitForElement(selector, timeout = this.config.timeouts.element) {
    try {
      await this.page.waitForSelector(selector, {
        visible: true,
        timeout,
      });
      return true;
    } catch (error) {
      console.warn(`⚠️ Élément non trouvé: ${selector}`);
      return false;
    }
  }

  async waitForText(text, timeout = this.config.timeouts.element) {
    try {
      await this.page.waitForFunction(
        searchText => document.body.innerText.includes(searchText),
        { timeout },
        text
      );
      return true;
    } catch (error) {
      console.warn(`⚠️ Texte non trouvé: ${text}`);
      return false;
    }
  }

  async waitForNavigation(timeout = this.config.timeouts.navigation) {
    await this.page.waitForNavigation({
      waitUntil: 'networkidle0',
      timeout,
    });
  }

  // === CAPTURE D'ÉCRAN ===

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `e2e/screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({
      path: filename,
      fullPage: true,
    });
    console.log(`📸 Screenshot: ${filename}`);
    return filename;
  }

  // === UTILS INTERFACE ===

  async selectTab(tab) {
    const tabSelector = this.config.selectors[`${tab}Tab`];
    await this.clickElement(tabSelector);
    await this.page.waitForTimeout(1000); // Transition
  }

  async isElementVisible(selector) {
    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch {
      return false;
    }
  }

  async getElementText(selector) {
    await this.waitForSelector(selector);
    return await this.page.$eval(selector, el => el.textContent.trim());
  }

  async getElementCount(selector) {
    const elements = await this.page.$$(selector);
    return elements.length;
  }

  // === DEBUG ===

  async debugLog(message) {
    console.log(`🐛 DEBUG: ${message}`);

    // Log de l'URL actuelle
    const url = await this.page.url();
    console.log(`📍 URL actuelle: ${url}`);

    // Log des erreurs console
    const errors = await this.page.evaluate(() => {
      return window.console.errors || [];
    });

    if (errors.length > 0) {
      console.log(`❌ Erreurs console:`, errors);
    }
  }

  // === CLEANUP ===

  async cleanup() {
    console.log('🧹 Nettoyage après test...');

    // Vider le localStorage
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Supprimer les cookies
    const cookies = await this.page.cookies();
    if (cookies.length > 0) {
      await this.page.deleteCookie(...cookies);
    }
  }
}

module.exports = E2EHelpers;
