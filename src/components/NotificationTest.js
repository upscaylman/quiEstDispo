import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { NotificationService } from '../services/firebaseService';

const NotificationTest = ({ darkMode = false }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = message => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[NotificationTest] ${message}`);
  };

  // Test de récupération des notifications
  const testGetNotifications = async () => {
    if (!user) {
      addLog('❌ Aucun utilisateur connecté');
      return;
    }

    setLoading(true);
    setError(null);
    addLog(`🔍 Test récupération notifications pour ${user.uid}`);

    try {
      const result = await NotificationService.getNotifications(user.uid);
      addLog(`✅ Récupération réussie: ${result.length} notifications`);
      setNotifications(result);

      if (result.length === 0) {
        addLog("ℹ️ Aucune notification trouvée - c'est peut-être normal");
      } else {
        result.forEach((notif, index) => {
          addLog(
            `📋 Notification ${index + 1}: ${notif.type} - "${notif.message}"`
          );
        });
      }
    } catch (err) {
      addLog(`❌ Erreur récupération: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test de création d'une notification de test
  const testCreateNotification = async () => {
    if (!user) {
      addLog('❌ Aucun utilisateur connecté');
      return;
    }

    setLoading(true);
    addLog('🧪 Création notification de test...');

    try {
      await NotificationService.createNotification(
        user.uid, // À soi-même
        user.uid, // De soi-même
        'test',
        '🧪 Notification de test créée automatiquement',
        { testData: true, createdAt: new Date().toISOString() }
      );
      addLog('✅ Notification de test créée');

      // Attendre un peu puis recharger
      setTimeout(() => {
        testGetNotifications();
      }, 1000);
    } catch (err) {
      addLog(`❌ Erreur création: ${err.message}`);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test du listener en temps réel
  const testListener = () => {
    if (!user) {
      addLog('❌ Aucun utilisateur connecté');
      return;
    }

    addLog('👂 Test du listener en temps réel...');

    const unsubscribe = NotificationService.onNotifications(
      user.uid,
      notifications => {
        addLog(`🔄 Listener déclenché: ${notifications.length} notifications`);
        setNotifications(notifications);
      }
    );

    // Nettoyer après 10 secondes
    setTimeout(() => {
      unsubscribe();
      addLog('🛑 Listener arrêté');
    }, 10000);
  };

  // Test automatique au montage
  useEffect(() => {
    if (user) {
      addLog('🚀 Démarrage des tests automatiques');
      testGetNotifications();
    }
  }, [user]);

  if (!user) {
    return (
      <div
        className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}
      >
        <h3 className="text-lg font-bold mb-2">🧪 Test des Notifications</h3>
        <p>Veuillez vous connecter pour tester les notifications.</p>
      </div>
    );
  }

  return (
    <div
      data-testid="notification-test"
      className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900'}`}
    >
      <h3 className="text-lg font-bold mb-4">🧪 Test des Notifications</h3>

      {/* Informations utilisateur */}
      <div className="mb-4 p-3 rounded bg-blue-100 dark:bg-blue-900">
        <p>
          <strong>Utilisateur:</strong> {user.displayName || user.email}
        </p>
        <p>
          <strong>UID:</strong> {user.uid}
        </p>
      </div>

      {/* Boutons de test */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testGetNotifications}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '⏳' : '🔍'} Récupérer notifications
        </button>

        <button
          onClick={testCreateNotification}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? '⏳' : '🧪'} Créer notification test
        </button>

        <button
          onClick={testListener}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
        >
          👂 Tester listener (10s)
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
          <strong>Erreur:</strong> {error}
        </div>
      )}

      {/* Résultats */}
      <div className="mb-4">
        <h4 className="font-bold mb-2">
          📊 Résultats ({notifications.length} notifications)
        </h4>
        {notifications.length === 0 ? (
          <p className="text-gray-500">Aucune notification trouvée</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, index) => (
              <div
                key={notif.id || index}
                className={`p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-white'} border`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-medium">{notif.type}</span>
                    <span
                      className={`ml-2 px-2 py-1 text-xs rounded ${notif.read ? 'bg-gray-200 text-gray-600' : 'bg-blue-200 text-blue-800'}`}
                    >
                      {notif.read ? 'Lu' : 'Non lu'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {notif.createdAt?.toDate?.()?.toLocaleString() ||
                      'Pas de date'}
                  </span>
                </div>
                <p className="mt-1">{notif.message}</p>
                {notif.data && (
                  <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-600 p-1 rounded overflow-x-auto">
                    {JSON.stringify(notif.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      <div>
        <h4 className="font-bold mb-2">📝 Logs de débogage</h4>
        <div
          className={`p-3 rounded text-sm font-mono max-h-60 overflow-y-auto ${darkMode ? 'bg-gray-900 text-green-400' : 'bg-black text-green-300'}`}
        >
          {logs.length === 0 ? (
            <p>Aucun log pour le moment...</p>
          ) : (
            logs.map((log, index) => <div key={index}>{log}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationTest;
