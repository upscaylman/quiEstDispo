import { getLimitedUseToken, getToken } from 'firebase/app-check';
import { appCheck } from '../firebase';

/**
 * Service App Check pour protéger les API backend selon la documentation Firebase
 * https://firebase.google.com/docs/app-check/web/custom-resource
 */
export class AppCheckService {
  /**
   * Obtenir un jeton App Check standard pour les requêtes normales
   * @param {boolean} forceRefresh - Forcer l'actualisation du jeton
   * @returns {Promise<string|null>} Le jeton App Check ou null si échec
   */
  static async getAppCheckToken(forceRefresh = false) {
    try {
      if (!appCheck) {
        console.warn('⚠️ App Check non initialisé');
        return null;
      }

      const tokenResponse = await getToken(appCheck, forceRefresh);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 App Check token obtained');
      }

      return tokenResponse.token;
    } catch (error) {
      console.warn('❌ Échec obtention jeton App Check:', error);
      return null;
    }
  }

  /**
   * Obtenir un jeton App Check à usage limité pour la protection contre la relecture
   * @returns {Promise<string|null>} Le jeton à usage limité ou null si échec
   */
  static async getLimitedUseAppCheckToken() {
    try {
      if (!appCheck) {
        console.warn('⚠️ App Check non initialisé');
        return null;
      }

      const tokenResponse = await getLimitedUseToken(appCheck);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 App Check limited-use token obtained');
      }

      return tokenResponse.token;
    } catch (error) {
      console.warn('❌ Échec obtention jeton App Check limité:', error);
      return null;
    }
  }

  /**
   * Créer des en-têtes HTTP avec jeton App Check pour requêtes sécurisées
   * @param {boolean} limitedUse - Utiliser un jeton à usage limité
   * @param {Object} additionalHeaders - En-têtes supplémentaires
   * @returns {Promise<Object>} Les en-têtes avec le jeton App Check
   */
  static async createSecureHeaders(limitedUse = false, additionalHeaders = {}) {
    const token = limitedUse
      ? await this.getLimitedUseAppCheckToken()
      : await this.getAppCheckToken();

    const headers = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (token) {
      headers['X-Firebase-AppCheck'] = token;
    }

    return headers;
  }

  /**
   * Effectuer une requête sécurisée avec App Check selon la documentation Firebase
   * @param {string} url - URL de l'API
   * @param {Object} options - Options de la requête (method, body, etc.)
   * @param {boolean} limitedUse - Utiliser un jeton à usage limité
   * @returns {Promise<Response>} La réponse de l'API
   */
  static async secureApiCall(url, options = {}, limitedUse = false) {
    try {
      const headers = await this.createSecureHeaders(
        limitedUse,
        options.headers
      );

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      return response;
    } catch (error) {
      console.error('❌ Secure API call failed:', error);
      throw error;
    }
  }

  /**
   * Exemple d'appel API protégé avec App Check
   * @param {string} endpoint - Point de terminaison de l'API
   * @param {Object} data - Données à envoyer
   * @returns {Promise<Object>} La réponse de l'API
   */
  static async callProtectedEndpoint(endpoint, data = null) {
    try {
      const options = {
        method: data ? 'POST' : 'GET',
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await this.secureApiCall(
        `https://yourbackend.example.com${endpoint}`,
        options
      );

      return await response.json();
    } catch (error) {
      console.error('❌ Protected endpoint call failed:', error);
      throw error;
    }
  }

  /**
   * Vérifier si App Check est disponible et fonctionnel
   * @returns {Promise<boolean>} True si App Check fonctionne
   */
  static async isAppCheckAvailable() {
    try {
      const token = await this.getAppCheckToken();
      return token !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Forcer l'actualisation du jeton App Check
   * @returns {Promise<string|null>} Le nouveau jeton ou null
   */
  static async refreshAppCheckToken() {
    return await this.getAppCheckToken(true);
  }
}

export default AppCheckService;
