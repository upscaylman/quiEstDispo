// Gestionnaire d'erreurs pour Firebase
// Filtre les erreurs de connexion répétitives et les logs verbeux

class ErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.lastErrors = new Map();
    this.MAX_SAME_ERROR = 3;
    this.ERROR_RESET_TIME = 30000; // 30 secondes

    // Intercepter les erreurs Firebase
    this.interceptFirebaseErrors();

    // Intercepter les erreurs réseau globales
    this.interceptNetworkErrors();
  }

  // Intercepter et filtrer les erreurs Firebase
  interceptFirebaseErrors() {
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalLog = console.log;

    console.error = (...args) => {
      if (this.shouldFilterError(args)) {
        return; // Ignorer cette erreur
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (this.shouldFilterWarning(args)) {
        return; // Ignorer ce warning
      }
      originalWarn.apply(console, args);
    };

    // Intercepter aussi les logs normaux pour les erreurs réseau
    console.log = (...args) => {
      if (this.shouldFilterLog(args)) {
        return; // Ignorer ce log
      }
      originalLog.apply(console, args);
    };
  }

  // Vérifier si une erreur doit être filtrée
  shouldFilterError(args) {
    const message = args.join(' ');

    // Filtrer les erreurs Firebase de connexion répétitives
    const firebaseNetworkErrors = [
      'net::ERR_ABORTED 400',
      'net::ERR_ABORTED 400 (Bad Request)',
      'WebChannelConnection RPC',
      'transport errored',
      'Failed to get document because the client is offline',
      'Stream listen failed',
      'Firebase connection was forcefully closed',
      'GET https://firestore.googleapis.com',
      'webchannel_blob_es2018.js',
      'Firestore/Listen/channel',
      'gsessionid=',
      '__webpack_modules__',
    ];

    for (const pattern of firebaseNetworkErrors) {
      if (message.includes(pattern)) {
        return this.shouldThrottleError(pattern);
      }
    }

    return false;
  }

  // Vérifier si un warning doit être filtré
  shouldFilterWarning(args) {
    const message = args.join(' ');

    // Filtrer les warnings Firebase répétitifs
    const firebaseWarnings = [
      'Firestore (10.14.1): WebChannelConnection',
      "RPC 'Listen' stream",
      'transport errored',
      'WebChannelConnection RPC',
      'stream 0x',
    ];

    for (const pattern of firebaseWarnings) {
      if (message.includes(pattern)) {
        return this.shouldThrottleError(pattern);
      }
    }

    return false;
  }

  // Vérifier si un log doit être filtré
  shouldFilterLog(args) {
    const message = args.join(' ');

    // Filtrer les logs Firebase verbeux
    const firebaseLogs = [
      'webchannel_blob_es2018.js',
      '__webpack_modules__',
      'Firestore/Listen/channel',
      'gsessionid=',
      'net::ERR_ABORTED',
    ];

    for (const pattern of firebaseLogs) {
      if (message.includes(pattern)) {
        return this.shouldThrottleError(pattern);
      }
    }

    return false;
  }

  // Intercepter les erreurs réseau au niveau global
  interceptNetworkErrors() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', event => {
        if (event.error && event.error.stack) {
          const stackTrace = event.error.stack;
          if (
            stackTrace.includes('webchannel_blob_es2018.js') ||
            stackTrace.includes('firestore') ||
            stackTrace.includes('firebase')
          ) {
            // Empêcher la propagation de l'erreur Firebase
            event.preventDefault();
            return;
          }
        }
      });

      window.addEventListener('unhandledrejection', event => {
        const reason = event.reason;
        if (reason && typeof reason === 'object') {
          const message = reason.message || reason.toString();
          if (
            message.includes('Firebase') ||
            message.includes('Firestore') ||
            message.includes('ERR_ABORTED')
          ) {
            // Empêcher l'affichage de la rejection Firebase
            event.preventDefault();
            return;
          }
        }
      });
    }
  }

  // Limiter les erreurs répétitives
  shouldThrottleError(errorPattern) {
    const now = Date.now();
    const errorData = this.errorCounts.get(errorPattern) || {
      count: 0,
      firstSeen: now,
      lastSeen: now,
    };

    // Reset si trop de temps s'est écoulé
    if (now - errorData.lastSeen > this.ERROR_RESET_TIME) {
      errorData.count = 0;
      errorData.firstSeen = now;
    }

    errorData.count++;
    errorData.lastSeen = now;
    this.errorCounts.set(errorPattern, errorData);

    // Afficher seulement les premières erreurs
    if (errorData.count <= this.MAX_SAME_ERROR) {
      return false; // Ne pas filtrer
    }

    // Afficher un message résumé toutes les 50 erreurs
    if (errorData.count % 50 === 0) {
      console.warn(
        `🔇 Firebase: ${errorData.count} erreurs de connexion ignorées (problème réseau temporaire)`
      );
    }

    return true; // Filtrer cette erreur
  }

  // Afficher les statistiques d'erreurs
  getErrorStats() {
    const stats = {};
    for (const [pattern, data] of this.errorCounts.entries()) {
      if (data.count > this.MAX_SAME_ERROR) {
        stats[pattern] = data.count;
      }
    }
    return stats;
  }

  // Nettoyer les anciennes erreurs
  cleanup() {
    const now = Date.now();
    for (const [pattern, data] of this.errorCounts.entries()) {
      if (now - data.lastSeen > this.ERROR_RESET_TIME * 2) {
        this.errorCounts.delete(pattern);
      }
    }
  }
}

// Instance globale
const errorHandler = new ErrorHandler();

// Nettoyer périodiquement
setInterval(() => {
  errorHandler.cleanup();
}, 60000); // Chaque minute

export default errorHandler;
