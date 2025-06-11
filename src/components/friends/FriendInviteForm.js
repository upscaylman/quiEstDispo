import { Share2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const FriendInviteForm = ({
  method,
  currentUser,
  loading,
  setLoading,
  setError,
  setSuccess,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  // Message d'invitation par défaut avec la bonne URL
  const defaultInviteMessage = `Salut ! Je t'invite à rejoindre "Qui Est Dispo" pour qu'on puisse organiser nos sorties ensemble ! 🎉

C'est une super app pour savoir qui est disponible pour un café, un resto ou juste traîner. 

Télécharge l'app et on pourra se retrouver facilement :
📱 https://qui-est-dispo.vercel.app/

Tu peux même l'installer sur ton téléphone comme une vraie app ! 
Sur Android : Menu → "Ajouter à l'écran d'accueil"
Sur iPhone : Partage → "Ajouter à l'écran d'accueil"

À bientôt !
${currentUser?.displayName || currentUser?.name || 'Ton ami'}`;

  // Message de partage social
  const shareMessage = `🎉 Découvre "Qui Est Dispo" - l'app parfaite pour organiser tes sorties spontanées entre amis !

Coffee • Lunch • Drinks • Chill • Clubbing • Cinema

📱 https://qui-est-dispo.vercel.app/

#QuiEstDispo #SortiesEntreAmis #AppMobile`;

  // Initialiser le message d'invitation
  useEffect(() => {
    if (method === 'mail' && !inviteMessage) {
      setInviteMessage(defaultInviteMessage);
    }
  }, [method, inviteMessage, defaultInviteMessage]);

  const handleSendInviteEmail = async () => {
    if (!email.trim()) {
      setError('Veuillez saisir une adresse email');
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez saisir une adresse email valide');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Créer l'URL mailto avec le message
      const subject = encodeURIComponent(
        'Invitation à rejoindre "Qui Est Dispo" 🎉'
      );
      const body = encodeURIComponent(inviteMessage);
      const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`;

      // Ouvrir le client email
      window.open(mailtoUrl, '_blank');

      setSuccess("Email d'invitation ouvert dans votre client email !");
      setEmail('');

      // Fermer le modal après 3 secondes
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 3000);
    } catch (error) {
      setError("Erreur lors de l'ouverture de l'email");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialShare = async () => {
    try {
      if (navigator.share) {
        // Utiliser l'API de partage native si disponible
        await navigator.share({
          title: 'Qui Est Dispo - App de sorties spontanées',
          text: shareMessage,
          url: 'https://qui-est-dispo.vercel.app/',
        });
        setSuccess('Invitation partagée avec succès !');
      } else {
        // Fallback: copier dans le presse-papier
        await navigator.clipboard.writeText(shareMessage);
        setSuccess("Message d'invitation copié dans le presse-papier !");
      }

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 2000);
    } catch (error) {
      // Si l'utilisateur annule le partage, ne pas afficher d'erreur
      if (error.name !== 'AbortError') {
        setError('Erreur lors du partage');
      }
    }
  };

  if (method === 'mail') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adresse email de votre ami
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="ami@exemple.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message d'invitation
          </label>
          <textarea
            value={inviteMessage}
            onChange={e => setInviteMessage(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
            placeholder="Personnalisez votre message d'invitation..."
          />
          <p className="text-xs text-gray-500 mt-1">
            💡 Personnalisez le message pour rendre l'invitation plus
            chaleureuse
          </p>
        </div>

        <button
          onClick={handleSendInviteEmail}
          disabled={loading}
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-lg font-medium transition-colors"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mx-auto" />
          ) : (
            "Envoyer l'invitation par email"
          )}
        </button>

        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-blue-700 text-sm">
            📧 Cela ouvrira votre client email avec le message pré-rempli
          </p>
        </div>
      </div>
    );
  }

  if (method === 'share') {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <Share2 size={48} className="mx-auto mb-4 text-blue-500" />
          <h3 className="font-semibold mb-2">Partager l'app</h3>
          <p className="text-sm text-gray-600 mb-4">
            Partagez "Qui Est Dispo" sur toutes vos app sociales préférées
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700 mb-2 font-medium">
            Message à partager :
          </p>
          <p className="text-xs text-gray-600 bg-white p-3 rounded border">
            {shareMessage}
          </p>
        </div>

        <button
          onClick={handleSocialShare}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          <Share2 size={20} className="mr-2" />
          Partager sur les réseaux sociaux
        </button>

        <div className="bg-purple-50 p-3 rounded-lg">
          <p className="text-purple-700 text-sm">
            📱 Partagez facilement sur WhatsApp, Instagram, Facebook, Twitter et
            plus encore !
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default FriendInviteForm;
