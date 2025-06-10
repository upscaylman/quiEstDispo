import React, { useEffect, useState } from 'react';
import PushNotificationService from '../services/pushNotificationService';

const NotificationTest = ({ user, darkMode }) => {
  const [logs, setLogs] = useState([]);
  const [status, setStatus] = useState(null);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
  };

  const checkNotificationStatus = async () => {
    try {
      addLog('🔍 Vérification du statut des notifications...', 'info');

      const status = await PushNotificationService.checkStatus();
      setStatus(status);

      addLog(`✅ Statut: ${JSON.stringify(status)}`, 'success');

      // Vérifier l'utilisateur actuel
      const currentUserId = PushNotificationService.getCurrentUserId();
      addLog(`🔍 Utilisateur actuel détecté: ${currentUserId}`, 'info');
      addLog(`🔍 Utilisateur connecté: ${user?.uid}`, 'info');

      // Vérifier les permissions
      addLog(`🔍 Permission: ${Notification.permission}`, 'info');
    } catch (error) {
      addLog(`❌ Erreur: ${error.message}`, 'error');
    }
  };

  const requestPermission = async () => {
    try {
      addLog('📱 Demande de permission...', 'info');
      await PushNotificationService.requestPermission();
      addLog('✅ Permission accordée', 'success');
      await checkNotificationStatus();
    } catch (error) {
      addLog(`❌ Erreur permission: ${error.message}`, 'error');
    }
  };

  const testNotification = async () => {
    try {
      addLog('🧪 Test notification...', 'info');
      await PushNotificationService.sendTestPushNotification();
      addLog('✅ Notification test envoyée', 'success');
    } catch (error) {
      addLog(`❌ Erreur test: ${error.message}`, 'error');
    }
  };

  const testFriendInvitation = async () => {
    try {
      addLog("👥 Test invitation d'ami...", 'info');

      if (!user?.uid) {
        addLog("❌ Pas d'utilisateur connecté", 'error');
        return;
      }

      // Simuler l'envoi d'une invitation à soi-même pour tester
      await PushNotificationService.sendPushToUser(user.uid, {
        title: "👥 Nouvelle demande d'ami",
        body: "Test d'invitation d'ami",
        tag: 'friend-invitation',
        data: {
          type: 'friend_invitation',
          fromUserId: user.uid,
          fromUserName: 'Test User',
          invitationId: 'test-123',
        },
        requireInteraction: true,
      });

      addLog('✅ Test invitation envoyé', 'success');
    } catch (error) {
      addLog(`❌ Erreur test invitation: ${error.message}`, 'error');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  return (
    <div
      className={`p-4 max-w-2xl mx-auto ${darkMode ? 'text-white' : 'text-gray-900'}`}
    >
      <h2 className="text-xl font-bold mb-4">🔧 Test des Notifications Push</h2>

      <div className="space-y-3 mb-4">
        <button
          onClick={checkNotificationStatus}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          🔍 Vérifier le statut
        </button>

        <button
          onClick={requestPermission}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
        >
          📱 Demander permission
        </button>

        <button
          onClick={testNotification}
          className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
        >
          🧪 Test notification
        </button>

        <button
          onClick={testFriendInvitation}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded"
        >
          👥 Test invitation ami
        </button>

        <button
          onClick={clearLogs}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded"
        >
          🗑️ Effacer logs
        </button>
      </div>

      <div
        className={`border rounded p-4 h-80 overflow-y-auto ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-gray-50'}`}
      >
        <h3 className="font-semibold mb-2">📋 Logs de diagnostic</h3>
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">Aucun log pour le moment...</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`text-sm p-2 rounded ${
                  log.type === 'error'
                    ? 'bg-red-100 text-red-800'
                    : log.type === 'success'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                <span className="text-xs text-gray-600">[{log.timestamp}]</span>{' '}
                {log.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {status && (
        <div className="mt-4 p-3 border rounded">
          <h4 className="font-semibold">📊 Statut actuel</h4>
          <pre className="text-xs mt-2 overflow-x-auto">
            {JSON.stringify(status, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default NotificationTest;
