// Écran des paramètres - MD3 Expressive
import { motion } from 'framer-motion';
import {
  Bell,
  Bug,
  FlaskConical,
  LogOut,
  Moon,
  Palette,
  Search,
  Shield,
  Smartphone,
  Sun,
  Trash2,
} from 'lucide-react';
import { showDevTools } from '../../utils/adminUtils';
import ProfileEditor from '../ProfileEditor';
import MD3Button from '../common/MD3Button';
import MD3Card from '../common/MD3Card';
import MD3Switch from '../common/MD3Switch';

const SettingsScreen = ({
  // Props de state
  user,
  darkMode,
  themeMode,
  pushNotificationStatus,
  currentScreen,
  useMapbox,

  // Props de fonctions
  onProfileUpdate,
  onThemeChange,
  onMapProviderChange,
  onEnablePushNotifications,
  onTestPushNotification,
  onCheckPushStatus,
  onOpenDebugNotifications,
  onShowDeleteAccount,
  onSignOut,
}) => {
  // Écran de debug des notifications supprimé

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="px-4 sm:px-6 py-6 bg-[var(--md-sys-color-surface)] min-h-full"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.h2
        className="text-2xl font-bold text-[var(--md-sys-color-on-surface)] mb-6"
        variants={itemVariants}
      >
        Paramètres
      </motion.h2>

      {/* Section Profil */}
      <motion.div variants={itemVariants}>
        <ProfileEditor
          user={user}
          onProfileUpdate={onProfileUpdate}
          darkMode={darkMode}
        />
      </motion.div>

      {/* Section Apparence - MD3 Style */}
      <motion.div variants={itemVariants}>
        <MD3Card variant="elevated" className="mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-tertiary-container)] flex items-center justify-center">
              <Palette
                size={20}
                className="text-[var(--md-sys-color-on-tertiary-container)]"
              />
            </div>
            <h3 className="text-xl font-bold text-[var(--md-sys-color-on-surface)]">
              Apparence
            </h3>
          </div>

          {/* Toggle Thème Clair/Sombre */}
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[var(--md-sys-color-outline-variant)]">
              <div className="flex items-center gap-3">
                {themeMode === 'dark' ? (
                  <Moon
                    size={20}
                    className="text-[var(--md-sys-color-primary)]"
                  />
                ) : (
                  <Sun
                    size={20}
                    className="text-[var(--md-sys-color-primary)]"
                  />
                )}
                <div>
                  <p className="font-medium text-[var(--md-sys-color-on-surface)]">
                    Mode sombre
                  </p>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    {themeMode === 'auto'
                      ? 'Géré par votre appareil'
                      : themeMode === 'dark'
                        ? 'Activé'
                        : 'Désactivé'}
                  </p>
                </div>
              </div>
              <MD3Switch
                checked={themeMode === 'dark'}
                onChange={() =>
                  themeMode !== 'auto' &&
                  onThemeChange(themeMode === 'dark' ? 'light' : 'dark')
                }
                disabled={themeMode === 'auto'}
                checkedIcon={<Moon size={12} />}
                icon={<Sun size={12} />}
              />
            </div>

            {/* Toggle Thème Automatique */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Smartphone
                  size={20}
                  className="text-[var(--md-sys-color-secondary)]"
                />
                <div>
                  <p className="font-medium text-[var(--md-sys-color-on-surface)]">
                    Thème automatique
                  </p>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    Suit les préférences système
                  </p>
                </div>
              </div>
              <MD3Switch
                checked={themeMode === 'auto'}
                onChange={() =>
                  onThemeChange(themeMode === 'auto' ? 'light' : 'auto')
                }
              />
            </div>
          </div>
        </MD3Card>
      </motion.div>

      {/* Section Notifications Push (dev seulement) - MD3 Style */}
      {showDevTools(user) && (
        <motion.div variants={itemVariants}>
          <MD3Card variant="outlined" className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-secondary-container)] flex items-center justify-center">
                <Bell
                  size={20}
                  className="text-[var(--md-sys-color-on-secondary-container)]"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--md-sys-color-on-surface)]">
                  Notifications Push
                </h3>
                <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                  {pushNotificationStatus.subscribed
                    ? 'Activées et fonctionnelles'
                    : pushNotificationStatus.permission === 'granted'
                      ? 'Autorisées mais non configurées'
                      : pushNotificationStatus.permission === 'denied'
                        ? 'Refusées par le navigateur'
                        : 'Non configurées'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <MD3Button
                variant="filled"
                size="small"
                onClick={onEnablePushNotifications}
              >
                🔔 Activer
              </MD3Button>
              <MD3Button
                variant="tonal"
                size="small"
                onClick={onCheckPushStatus}
                icon={<Search size={14} />}
              >
                Statut
              </MD3Button>
              <MD3Button
                variant="tonal"
                size="small"
                onClick={onTestPushNotification}
                icon={<FlaskConical size={14} />}
              >
                Tester
              </MD3Button>
              <MD3Button
                variant="outlined"
                size="small"
                onClick={onOpenDebugNotifications}
                icon={<Bug size={14} />}
              >
                Debug
              </MD3Button>
            </div>
          </MD3Card>
        </motion.div>
      )}

      {/* Section Provider de Cartes (dev) - MD3 Style */}
      {showDevTools(user) && (
        <motion.div variants={itemVariants}>
          <MD3Card variant="outlined" className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
                  🗺️
                </div>
                <div>
                  <p className="font-medium text-[var(--md-sys-color-on-surface)]">
                    Utiliser Mapbox
                  </p>
                  <p className="text-sm text-[var(--md-sys-color-on-surface-variant)]">
                    {useMapbox
                      ? 'Cartes Mapbox activées'
                      : 'Cartes CSS par défaut'}
                  </p>
                </div>
              </div>
              <MD3Switch
                checked={useMapbox}
                onChange={() =>
                  onMapProviderChange(useMapbox ? 'default' : 'mapbox')
                }
              />
            </div>
          </MD3Card>
        </motion.div>
      )}

      {/* Zone dangereuse - MD3 Style */}
      <motion.div variants={itemVariants}>
        <MD3Card
          variant="outlined"
          className="mb-6 border-[var(--md-sys-color-error)] bg-[var(--md-sys-color-error-container)]/20"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-error)] flex items-center justify-center">
              <Shield
                size={20}
                className="text-[var(--md-sys-color-on-error)]"
              />
            </div>
            <h3 className="text-lg font-bold text-[var(--md-sys-color-error)]">
              Zone dangereuse
            </h3>
          </div>
          <p className="text-sm text-[var(--md-sys-color-on-surface-variant)] mb-5">
            Cette action est irréversible. Toutes vos données seront
            définitivement supprimées.
          </p>
          <MD3Button
            variant="filled"
            onClick={onShowDeleteAccount}
            fullWidth
            icon={<Trash2 size={18} />}
            className="bg-[var(--md-sys-color-error)] hover:bg-[var(--md-sys-color-error)]/90"
          >
            Supprimer mon compte
          </MD3Button>
        </MD3Card>
      </motion.div>

      {/* Section Déconnexion - MD3 Style */}
      <motion.div variants={itemVariants}>
        <MD3Card variant="elevated" className="mb-20">
          <MD3Button
            variant="tonal"
            onClick={onSignOut}
            fullWidth
            size="large"
            icon={<LogOut size={20} />}
          >
            Se déconnecter
          </MD3Button>
        </MD3Card>
      </motion.div>
    </motion.div>
  );
};

export default SettingsScreen;
