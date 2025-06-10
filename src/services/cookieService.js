// Service de gestion des cookies conforme RGPD
export class CookieService {
  static CONSENT_COOKIE_NAME = 'cookie_consent';
  static CONSENT_EXPIRY_DAYS = 365; // 1 an

  // Types de cookies par catégorie
  static COOKIE_CATEGORIES = {
    necessary: {
      name: 'Cookies nécessaires',
      cookies: [
        'cookie_consent', // Stockage du consentement
        'auth_token', // Authentification
        'session_id', // Session utilisateur
        'csrf_token', // Protection CSRF
      ],
    },
    functional: {
      name: 'Cookies fonctionnels',
      cookies: [
        'theme_preference', // Thème sombre/clair
        'language_preference', // Langue préférée
        'map_provider_preference', // Mapbox vs Google Maps
        'notification_settings', // Paramètres de notifications
      ],
    },
    analytics: {
      name: 'Cookies analytiques',
      cookies: [
        'analytics_session', // Session d'analyse
        'user_analytics_id', // ID utilisateur anonyme
        'page_views', // Compteur de vues
        'app_usage_stats', // Statistiques d'utilisation
      ],
    },
    marketing: {
      name: 'Cookies marketing',
      cookies: [
        'marketing_id', // ID marketing
        'ad_preferences', // Préférences publicitaires
        'campaign_tracking', // Suivi de campagnes
      ],
    },
  };

  // Obtenir le consentement actuel
  static getConsent() {
    try {
      const consentData = localStorage.getItem(this.CONSENT_COOKIE_NAME);
      if (!consentData) return null;

      const parsed = JSON.parse(consentData);

      // Vérifier si le consentement n'a pas expiré
      const consentDate = new Date(parsed.timestamp);
      const expiryDate = new Date(
        consentDate.getTime() + this.CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000
      );

      if (new Date() > expiryDate) {
        this.clearConsent();
        return null;
      }

      return parsed;
    } catch (error) {
      console.warn('Erreur lecture consentement cookies:', error);
      return null;
    }
  }

  // Définir le consentement
  static setConsent(preferences) {
    const consentData = {
      preferences,
      timestamp: new Date().toISOString(),
      version: '1.0', // Pour gérer les futures versions
    };

    try {
      localStorage.setItem(
        this.CONSENT_COOKIE_NAME,
        JSON.stringify(consentData)
      );

      // Appliquer immédiatement les préférences
      this.applyConsentPreferences(preferences);

      console.log('✅ Consentement cookies sauvegardé:', preferences);

      // Déclencher un événement personnalisé pour notifier les autres composants
      window.dispatchEvent(
        new CustomEvent('cookieConsentChanged', {
          detail: { preferences, consentData },
        })
      );
    } catch (error) {
      console.error('❌ Erreur sauvegarde consentement:', error);
    }
  }

  // Supprimer le consentement
  static clearConsent() {
    localStorage.removeItem(this.CONSENT_COOKIE_NAME);
    this.clearAllNonNecessaryCookies();
  }

  // Appliquer les préférences de consentement
  static applyConsentPreferences(preferences) {
    Object.keys(preferences).forEach(category => {
      if (!preferences[category] && category !== 'necessary') {
        // Supprimer les cookies de cette catégorie
        this.clearCookiesByCategory(category);
      }
    });
  }

  // Supprimer les cookies d'une catégorie
  static clearCookiesByCategory(category) {
    const categoryData = this.COOKIE_CATEGORIES[category];
    if (!categoryData) return;

    categoryData.cookies.forEach(cookieName => {
      this.deleteCookie(cookieName);
      localStorage.removeItem(cookieName);
      sessionStorage.removeItem(cookieName);
    });

    console.log(`🗑️ Cookies ${category} supprimés`);
  }

  // Supprimer tous les cookies non nécessaires
  static clearAllNonNecessaryCookies() {
    Object.keys(this.COOKIE_CATEGORIES).forEach(category => {
      if (category !== 'necessary') {
        this.clearCookiesByCategory(category);
      }
    });
  }

  // Vérifier si un type de cookie est autorisé
  static isConsentGiven(category) {
    const consent = this.getConsent();
    if (!consent) return false;

    // Les cookies nécessaires sont toujours autorisés
    if (category === 'necessary') return true;

    return consent.preferences[category] === true;
  }

  // Créer un cookie si autorisé
  static setCookie(name, value, category = 'necessary', options = {}) {
    if (!this.isConsentGiven(category)) {
      console.warn(`❌ Cookie ${name} refusé (catégorie: ${category})`);
      return false;
    }

    const defaults = {
      expires: 30, // 30 jours par défaut
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax',
    };

    const settings = { ...defaults, ...options };

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (settings.expires) {
      const date = new Date();
      date.setTime(date.getTime() + settings.expires * 24 * 60 * 60 * 1000);
      cookieString += `; expires=${date.toUTCString()}`;
    }

    if (settings.path) cookieString += `; path=${settings.path}`;
    if (settings.domain) cookieString += `; domain=${settings.domain}`;
    if (settings.secure) cookieString += `; secure`;
    if (settings.sameSite) cookieString += `; samesite=${settings.sameSite}`;

    document.cookie = cookieString;
    console.log(`✅ Cookie ${name} créé (catégorie: ${category})`);
    return true;
  }

  // Lire un cookie
  static getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  }

  // Supprimer un cookie
  static deleteCookie(name, path = '/', domain = null) {
    let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    if (domain) cookieString += `; domain=${domain}`;
    document.cookie = cookieString;
  }

  // Stockage local sécurisé (vérifie le consentement)
  static setLocalStorage(key, value, category = 'functional') {
    if (!this.isConsentGiven(category)) {
      console.warn(`❌ LocalStorage ${key} refusé (catégorie: ${category})`);
      return false;
    }

    try {
      localStorage.setItem(
        key,
        JSON.stringify({
          value,
          category,
          timestamp: new Date().toISOString(),
        })
      );
      return true;
    } catch (error) {
      console.error('Erreur localStorage:', error);
      return false;
    }
  }

  // Lecture du stockage local
  static getLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Vérifier si la catégorie est encore autorisée
      if (parsed.category && !this.isConsentGiven(parsed.category)) {
        localStorage.removeItem(key);
        return null;
      }

      return parsed.value;
    } catch (error) {
      console.error('Erreur lecture localStorage:', error);
      return null;
    }
  }

  // Méthodes spécifiques pour l'application

  // Préférences de thème
  static setThemePreference(theme) {
    return this.setLocalStorage('theme_preference', theme, 'functional');
  }

  static getThemePreference() {
    return this.getLocalStorage('theme_preference');
  }

  // Préférences de cartes
  static setMapProviderPreference(provider) {
    return this.setLocalStorage(
      'map_provider_preference',
      provider,
      'functional'
    );
  }

  static getMapProviderPreference() {
    return this.getLocalStorage('map_provider_preference');
  }

  // Analytics anonymes
  static setAnalyticsSession() {
    if (!this.isConsentGiven('analytics')) return false;

    const sessionId =
      'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    return this.setCookie('analytics_session', sessionId, 'analytics', {
      expires: 1,
    });
  }

  static trackPageView(page) {
    if (!this.isConsentGiven('analytics')) return false;

    const views = this.getLocalStorage('page_views') || {};
    views[page] = (views[page] || 0) + 1;
    views.lastView = new Date().toISOString();

    return this.setLocalStorage('page_views', views, 'analytics');
  }

  // Obtenir un résumé du consentement pour les stats
  static getConsentSummary() {
    const consent = this.getConsent();
    if (!consent) return null;

    const summary = {
      hasConsent: true,
      consentDate: consent.timestamp,
      preferences: consent.preferences,
      categoriesAccepted: Object.keys(consent.preferences).filter(
        key => consent.preferences[key] === true
      ).length,
      totalCategories: Object.keys(consent.preferences).length,
    };

    return summary;
  }

  // Initialiser les cookies par défaut
  static initializeDefaultCookies() {
    // Créer un ID de session anonyme pour les cookies nécessaires
    if (!this.getCookie('session_id')) {
      const sessionId =
        'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      this.setCookie('session_id', sessionId, 'necessary', { expires: 1 });
    }
  }

  // Debug : lister tous les cookies
  static debugListAllCookies() {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('🍪 === COOKIES DEBUG ===');
    console.log('📋 Consentement:', this.getConsent());
    console.log('🌐 Cookies navigateur:', document.cookie);
    console.log('💾 LocalStorage cookies:');

    Object.keys(localStorage).forEach(key => {
      if (
        key.includes('preference') ||
        key.includes('analytics') ||
        key.includes('marketing')
      ) {
        console.log(`  - ${key}:`, this.getLocalStorage(key));
      }
    });
  }
}

// Auto-initialisation
if (typeof window !== 'undefined') {
  // Initialiser les cookies par défaut au chargement
  CookieService.initializeDefaultCookies();

  // Debug en développement
  if (process.env.NODE_ENV === 'development') {
    window.CookieService = CookieService;
    console.log('🍪 CookieService disponible globalement pour debug');
  }
}
