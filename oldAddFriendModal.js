import { motion } from 'framer-motion';
import { Mail, Phone, QrCode, Share2, UserPlus, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

const AddFriendModal = ({ isOpen, onClose, onAddFriend, currentUser }) => {
  const [method, setMethod] = useState('phone'); // 'phone', 'qr', 'mail', ou 'share'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // QR Code data pour que d'autres puissent scanner
  const userQRData = currentUser
    ? JSON.stringify({
        type: 'add_friend',
        userId: currentUser.uid,
        name: currentUser.displayName || 'Utilisateur',
        avatar: currentUser.photoURL || '',
      })
    : '';

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

  // Initialiser le scanner QR
  useEffect(() => {
    if (method === 'qr' && isScanning && videoRef.current) {
      import('qr-scanner').then(({ default: QrScanner }) => {
        if (scannerRef.current) {
          scannerRef.current.destroy();
        }

        scannerRef.current = new QrScanner(
          videoRef.current,
          result => {
            handleQRScan(result.data);
          },
          {
            highlightScanRegion: true,
            highlightCodeOutline: true,
          }
        );

        scannerRef.current.start().catch(err => {
          setError("Impossible d'accéder à la caméra");
          // eslint-disable-next-line no-console
          console.error('QR Scanner error:', err);
        });
      });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [method, isScanning]);

  // Initialiser le message d'invitation
  useEffect(() => {
    if (method === 'mail' && !inviteMessage) {
      setInviteMessage(defaultInviteMessage);
    }
  }, [method, inviteMessage, defaultInviteMessage]);

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

  const handleQRScan = async data => {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'add_friend' && parsed.userId) {
        if (parsed.userId === currentUser?.uid) {
          setError('Vous ne pouvez pas vous ajouter vous-même !');
          return;
        }

        setLoading(true);
        await onAddFriend(parsed.userId);
        setSuccess(`${parsed.name || 'Ami'} ajouté avec succès !`);
        setIsScanning(false);

        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      } else {
        setError('QR Code invalide');
      }
    } catch (error) {
      setError('QR Code invalide');
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

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <UserPlus className="mr-2" size={24} />
            Ajouter un ami
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* Method Selection */}
        <div className="grid grid-cols-4 mb-6 bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => {
              setMethod('phone');
              setIsScanning(false);
              setError('');
              setSuccess('');
            }}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'phone'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <Phone size={16} className="mb-1" />
            Téléphone
          </button>
          <button
            onClick={() => {
              setMethod('mail');
              setError('');
              setSuccess('');
              setIsScanning(false);
            }}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'mail'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <Mail size={16} className="mb-1" />
            Email
          </button>
          <button
            onClick={() => {
              setMethod('qr');
              setError('');
              setSuccess('');
            }}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'qr'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <QrCode size={16} className="mb-1" />
            QR Code
          </button>
          <button
            onClick={() => {
              setMethod('share');
              setError('');
              setSuccess('');
              setIsScanning(false);
            }}
            className={`py-2 px-2 rounded-md flex flex-col items-center justify-center transition-colors text-xs ${
              method === 'share'
                ? 'bg-white shadow text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <Share2 size={16} className="mb-1" />
            Partager
          </button>
        </div>

        {/* Content */}
        {method === 'phone' ? (
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
                ⚠️ Votre ami doit s'être connecté au moins une fois à
                l'application pour être trouvable
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
        ) : method === 'mail' ? (
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
        ) : method === 'share' ? (
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
                📱 Partagez facilement sur WhatsApp, Instagram, Facebook,
                Twitter et plus encore !
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!isScanning ? (
              <>
                {/* Mon QR Code */}
                <div className="text-center">
                  <h3 className="font-semibold mb-3">Mon QR Code</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Faites scanner ce code pour qu'on vous ajoute
                  </p>
                  <div className="bg-white p-4 rounded-lg border inline-block">
                    <QRCode value={userQRData} size={150} level="M" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <button
                    onClick={() => setIsScanning(true)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                  >
                    Scanner un QR Code
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Scanner */}
                <div className="text-center">
                  <h3 className="font-semibold mb-3">Scanner un QR Code</h3>
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-white border-dashed m-8 rounded-lg"></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Pointez la caméra vers le QR code de votre ami
                  </p>
                </div>

                <button
                  onClick={() => setIsScanning(false)}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Arrêter le scan
                </button>
              </>
            )}
          </div>
        )}

        {/* Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg"
          >
            <p className="text-red-700 text-sm">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg"
          >
            <p className="text-green-700 text-sm">{success}</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default AddFriendModal;
