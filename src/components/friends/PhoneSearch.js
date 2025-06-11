import React, { useState } from 'react';

const PhoneSearch = ({
  onAddFriend,
  loading,
  setLoading,
  setError,
  setSuccess,
  onClose,
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');

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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Numéro de téléphone
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={e => setPhoneNumber(e.target.value)}
          placeholder="+33 6 12 34 56 78"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Format accepté : +33612345678 ou 0612345678
        </p>
        <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-2 rounded">
          ⚠️ Votre ami doit s'être connecté au moins une fois à l'application
          pour être trouvable
        </p>
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
