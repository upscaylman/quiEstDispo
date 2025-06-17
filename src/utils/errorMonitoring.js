import { debugError } from './logger';

/**
 * Configuration du monitoring d'erreurs
 * Prêt pour intégration avec Sentry ou autre service
 */
class ErrorMonitoring {
  constructor() {
    this.isInitialized = false;
    this.errorQueue = [];
    this.maxQueueSize = 100;
  }

  /**
   * Initialise le service de monitoring
   * @param {Object} config - Configuration du service
   */
  init(config = {}) {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Intégrer Sentry ici
      // Sentry.init({ dsn: config.dsn, environment: process.env.NODE_ENV });
      debugError("⚠️ Monitoring d'erreurs non configuré pour la production");
    }

    this.isInitialized = true;
    this.setupGlobalErrorHandlers();
    this.processErrorQueue();
  }

  /**
   * Capture une erreur
   * @param {Error} error - L'erreur à capturer
   * @param {Object} context - Contexte additionnel
   */
  captureError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (this.isInitialized) {
      this.sendError(errorData);
    } else {
      this.queueError(errorData);
    }

    debugError('🚨 Erreur capturée:', errorData);
  }

  /**
   * Capture une exception Firebase spécifique
   * @param {any} error - Erreur Firebase (peut avoir une propriété code)
   * @param {string} operation - Opération qui a échoué
   */
  captureFirebaseError(error, operation) {
    const context = {
      type: 'firebase_error',
      operation,
      // eslint-disable-next-line no-prototype-builtins
      code: error.hasOwnProperty('code') ? error.code : 'unknown',
      // eslint-disable-next-line no-prototype-builtins
      isAppCheckError:
        error.hasOwnProperty('code') && error.code.includes('app-check'),
    };

    this.captureError(error, context);
  }

  /**
   * Configure les gestionnaires d'erreurs globaux
   */
  setupGlobalErrorHandlers() {
    // Erreurs JavaScript non gérées
    window.addEventListener('error', event => {
      this.captureError(event.error, { type: 'unhandled_error' });
    });

    // Promesses rejetées non gérées
    window.addEventListener('unhandledrejection', event => {
      this.captureError(event.reason, { type: 'unhandled_promise_rejection' });
    });
  }

  /**
   * Ajoute une erreur à la queue
   * @param {Object} errorData
   */
  queueError(errorData) {
    if (this.errorQueue.length >= this.maxQueueSize) {
      this.errorQueue.shift(); // Supprime le plus ancien
    }
    this.errorQueue.push(errorData);
  }

  /**
   * Traite la queue d'erreurs
   */
  processErrorQueue() {
    while (this.errorQueue.length > 0) {
      const errorData = this.errorQueue.shift();
      this.sendError(errorData);
    }
  }

  /**
   * Envoie l'erreur au service de monitoring
   * @param {Object} errorData
   */
  sendError(errorData) {
    if (process.env.NODE_ENV === 'production') {
      // TODO: Envoyer à Sentry
      // Sentry.captureException(errorData);
    } else {
      debugError('📊 Erreur envoyée au monitoring:', errorData);
    }
  }
}

// Instance singleton
const errorMonitoring = new ErrorMonitoring();

export default errorMonitoring;
