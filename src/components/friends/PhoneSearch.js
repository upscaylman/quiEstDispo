import { Contact, Users } from 'lucide-react';
import React, { useState } from 'react';

const PhoneSearch = ({
  onAddFriend,
  loading,
  setLoading,
  setError,
  setSuccess,
  onClose,
  darkMode = false,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAccessingContacts, setIsAccessingContacts] = useState(false);

  // Fonction pour accéder aux contacts du téléphone
  const handleAccessContacts = async () => {
    setIsAccessingContacts(true);
    setError('');

    try {
      // Vérifier si l'API Contact est supportée
      if ('contacts' in navigator && 'ContactsManager' in window) {
        // API Contact moderne (Chrome Android)
        const properties = ['name', 'tel'];
        const options = { multiple: false };

        const contacts = await navigator.contacts.select(properties, options);

        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          if (contact.tel && contact.tel.length > 0) {
            const phoneNumber = contact.tel[0];
            setPhoneNumber(phoneNumber);
          } else {
            setError('Aucun numéro de téléphone trouvé pour ce contact');
          }
        }
      } else {
        // Fallback : ouvrir l'application contacts du système
        if (navigator.userAgent.includes('Mobile')) {
          // Mobile : essayer d'ouvrir l'app contacts
          const isMobile =
            /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
              navigator.userAgent
            );

          if (isMobile) {
            setError('Veuillez copier-coller le numéro depuis vos contacts');
            // Optionnel : ouvrir l'app contacts
            // window.open('tel:', '_system');
          } else {
            setError('Fonctionnalité non disponible sur cet appareil');
          }
        } else {
          setError(
            'Accès aux contacts non supporté sur cet appareil. Veuillez saisir le numéro manuellement.'
          );
        }
      }
    } catch (error) {
      console.warn('Erreur accès contacts:', error);

      if (error.name === 'AbortError') {
        // L'utilisateur a annulé
        setError('');
      } else if (error.name === 'NotSupportedError') {
        setError('Accès aux contacts non supporté sur cet appareil');
      } else if (error.name === 'NotAllowedError') {
        setError(
          "Permission refusée. Veuillez autoriser l'accès aux contacts dans les paramètres du navigateur."
        );
      } else {
        setError(
          "Impossible d'accéder aux contacts. Veuillez saisir le numéro manuellement."
        );
      }
    } finally {
      setIsAccessingContacts(false);
    }
  };

  const handleAddByPhone = async () => {
    if (!phoneNumber.trim()) {
      setError('Veuillez saisir un numéro de téléphone');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Nettoyer le numéro
      const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');

      // Ajouter +33 si le numéro commence par 0
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '+33' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('+')) {
        formattedPhone = '+33' + cleanPhone;
      }

      const result = await onAddFriend(formattedPhone);
      if (result && result.invitationSent) {
        setSuccess(
          `Invitation envoyée à ${result.name || 'cet utilisateur'} !`
        );
      } else {
        setSuccess(`${result?.name || 'Ami'} ajouté avec succès !`);
      }
      setPhoneNumber('');

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (error) {
      setError(error.message || "Erreur lors de l'ajout de l'ami");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label
          className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
        >
          Numéro de téléphone
        </label>
        <div className="relative">
          <input
            type="tel"
            placeholder="Numéro de téléphone"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className={`w-full pl-4 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isAccessingContacts ? 'opacity-50' : ''
            } ${
              darkMode
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            disabled={loading || isAccessingContacts}
          />

          {/* Bouton d'accès aux contacts */}
          <button
            type="button"
            onClick={handleAccessContacts}
            disabled={isAccessingContacts}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Accéder aux contacts"
          >
            {isAccessingContacts ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            ) : (
              <Contact size={20} />
            )}
          </button>
        </div>

        <div className="mt-2 space-y-1">
          <p
            className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Format accepté : +33612345678 ou 0612345678
          </p>
          <p
            className={`text-xs flex items-center ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
          >
            <Users size={12} className="mr-1" />
            Cliquez sur l'icône contact pour choisir depuis vos contacts
          </p>
          <p
            className={`text-xs p-2 rounded ${
              darkMode
                ? 'text-amber-300 bg-amber-900/20'
                : 'text-amber-600 bg-amber-50'
            }`}
          >
            ⚠️ Votre ami doit s'être connecté au moins une fois à l'application
            pour être trouvable
          </p>
        </div>
      </div>

      <button
        onClick={handleAddByPhone}
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
        ) : (
          'Ajouter par téléphone'
        )}
      </button>
    </div>
  );
};

export default PhoneSearch;
