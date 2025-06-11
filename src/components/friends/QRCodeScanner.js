import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'react-qr-code';

const QRCodeScanner = ({
  currentUser,
  onAddFriend,
  loading,
  setLoading,
  setError,
  setSuccess,
  onClose,
}) => {
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

  // Initialiser le scanner QR
  useEffect(() => {
    if (isScanning && videoRef.current) {
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
  }, [isScanning]);

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

  return (
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
              <video ref={videoRef} className="w-full h-64 object-cover" />
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
  );
};

export default QRCodeScanner;
