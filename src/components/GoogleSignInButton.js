import React, { useEffect, useRef } from 'react';

const GoogleSignInButton = ({
  onSignIn,
  type = 'standard', // 'standard' ou 'icon'
  theme = 'outline', // 'outline', 'filled_blue', 'filled_black'
  size = 'large', // 'large', 'medium', 'small'
  text = 'signin_with', // 'signin_with', 'signup_with', 'continue_with', 'signin'
  shape = 'rectangular', // 'rectangular', 'pill', 'circle', 'square'
  logo_alignment = 'left', // 'left', 'center'
  width = '300',
  locale = 'fr',
  disabled = false,
  className = '',
}) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    // Attendre que la librairie Google soit chargée
    const initializeGoogleButton = () => {
      if (
        window.google &&
        window.google.accounts &&
        window.google.accounts.id
      ) {
        try {
          // Configurer le callback global pour cette instance
          window.handleGoogleSignIn = credentialResponse => {
            console.log(
              '✅ Google Sign-In credential received:',
              credentialResponse
            );

            // Décoder le JWT pour obtenir les informations utilisateur
            if (credentialResponse.credential) {
              try {
                const payload = JSON.parse(
                  atob(credentialResponse.credential.split('.')[1])
                );
                console.log('📋 User info from credential:', payload);

                // Appeler le callback avec les données
                onSignIn({
                  credential: credentialResponse.credential,
                  user: payload,
                  select_by: credentialResponse.select_by,
                });
              } catch (decodeError) {
                console.error('❌ Error decoding credential:', decodeError);
                onSignIn({ error: 'Erreur lors du décodage des informations' });
              }
            }
          };

          // Rendre le bouton Google
          if (buttonRef.current && !disabled) {
            // Nettoyer le contenu précédent
            buttonRef.current.innerHTML = '';

            window.google.accounts.id.renderButton(buttonRef.current, {
              type: type,
              theme: theme,
              size: size,
              text: text,
              shape: shape,
              logo_alignment: logo_alignment,
              width: width,
              locale: locale,
            });
          }
        } catch (error) {
          console.error('❌ Error initializing Google Sign-In button:', error);
        }
      } else {
        // Réessayer après un court délai si la librairie n'est pas encore chargée
        setTimeout(initializeGoogleButton, 100);
      }
    };

    initializeGoogleButton();

    // Cleanup
    return () => {
      if (window.handleGoogleSignIn) {
        delete window.handleGoogleSignIn;
      }
    };
  }, [
    onSignIn,
    type,
    theme,
    size,
    text,
    shape,
    logo_alignment,
    width,
    locale,
    disabled,
  ]);

  return (
    <div className={`google-signin-button ${className}`}>
      {disabled ? (
        <div className="flex items-center justify-center bg-gray-100 text-gray-400 py-3 px-6 rounded-lg">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
          Connexion en cours...
        </div>
      ) : (
        <div ref={buttonRef}></div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
