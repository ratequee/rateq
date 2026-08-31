import type { FirebaseOptions } from 'firebase/app';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

export interface FirebaseRecaptchaVerifierModalHandle {
  type: 'recaptcha';
  verify: () => Promise<string>;
}

interface FirebaseRecaptchaVerifierModalProps {
  firebaseConfig: FirebaseOptions;
  attemptInvisibleVerification?: boolean;
  title?: string;
  cancelLabel?: string;
}

function getWebviewSource(
  firebaseConfig: FirebaseOptions,
  invisible: boolean,
  languageCode?: string,
) {
  const firebaseVersion = '10.14.1';

  return {
    baseUrl: `https://${firebaseConfig.authDomain}`,
    html: `<!DOCTYPE html><html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth-compat.js"></script>
  <script>firebase.initializeApp(${JSON.stringify(firebaseConfig)});</script>
  <style>
    html, body { height: 100%; ${invisible ? 'padding:0;margin:0;' : ''} }
    #recaptcha-btn { width:100%; height:100%; padding:0; margin:0; border:0; }
  </style>
</head>
<body>
  ${
    invisible
      ? '<button id="recaptcha-btn" type="button" onclick="onClickButton()">Confirm reCAPTCHA</button>'
      : '<div id="recaptcha-cont"></div>'
  }
  <script>
    var fullChallengeTimer;
    function onVerify(token) {
      if (fullChallengeTimer) { clearInterval(fullChallengeTimer); fullChallengeTimer = undefined; }
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'verify', token: token }));
    }
    function onLoad() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'load' }));
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier("${
        invisible ? 'recaptcha-btn' : 'recaptcha-cont'
      }", {
        size: "${invisible ? 'invisible' : 'normal'}",
        callback: onVerify
      });
      window.recaptchaVerifier.render();
    }
    function onError() {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error' }));
    }
    function onClickButton() {
      if (!fullChallengeTimer) {
        fullChallengeTimer = setInterval(function() {
          var iframes = document.getElementsByTagName('iframe');
          for (var i = 0; i < iframes.length; i++) {
            var parentWindow = iframes[i].parentNode ? iframes[i].parentNode.parentNode : undefined;
            var isHidden = parentWindow && parentWindow.style.opacity == 0;
            var isFullChallenge = !isHidden && (
              (iframes[i].title === 'recaptcha challenge') ||
              (iframes[i].src.indexOf('google.com/recaptcha/api2/bframe') >= 0)
            );
            if (isFullChallenge) {
              clearInterval(fullChallengeTimer);
              fullChallengeTimer = undefined;
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'fullChallenge' }));
              return;
            }
          }
        }, 100);
      }
    }
    window.addEventListener('message', function(event) {
      if (event.data.verify) {
        document.getElementById('recaptcha-btn').click();
      }
    });
  </script>
  <script src="https://www.google.com/recaptcha/api.js?onload=onLoad&render=explicit${
    languageCode ? `&hl=${languageCode}` : ''
  }" onerror="onError()"></script>
</body></html>`,
  };
}

function RecaptchaWebView({
  firebaseConfig,
  invisible,
  verify,
  onLoad,
  onError,
  onVerify,
  onFullChallenge,
  style,
}: {
  firebaseConfig: FirebaseOptions;
  invisible?: boolean;
  verify?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  onVerify: (token: string) => void;
  onFullChallenge?: () => void;
  style?: ViewStyle;
}) {
  const webviewRef = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (webviewRef.current && loaded && verify) {
      webviewRef.current.injectJavaScript(`
        (function(){
          window.dispatchEvent(new MessageEvent('message', { data: { verify: true } }));
        })();
        true;
      `);
    }
  }, [loaded, verify]);

  const handleMessage = (event: WebViewMessageEvent) => {
    const data = JSON.parse(event.nativeEvent.data) as {
      type: 'load' | 'error' | 'verify' | 'fullChallenge';
      token?: string;
    };

    switch (data.type) {
      case 'load':
        setLoaded(true);
        onLoad?.();
        break;
      case 'error':
        onError?.();
        break;
      case 'verify':
        if (data.token) onVerify(data.token);
        break;
      case 'fullChallenge':
        onFullChallenge?.();
        break;
      default:
        break;
    }
  };

  return (
    <WebView
      ref={webviewRef}
      style={style}
      javaScriptEnabled
      automaticallyAdjustContentInsets
      scalesPageToFit
      mixedContentMode="always"
      source={getWebviewSource(firebaseConfig, Boolean(invisible))}
      onError={onError}
      onMessage={handleMessage}
    />
  );
}

export const FirebaseRecaptchaVerifierModal = forwardRef<
  FirebaseRecaptchaVerifierModalHandle,
  FirebaseRecaptchaVerifierModalProps
>(function FirebaseRecaptchaVerifierModal(
  {
    firebaseConfig,
    attemptInvisibleVerification = true,
    title = 'reCAPTCHA',
    cancelLabel = 'Cancel',
  },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const [visibleLoaded, setVisibleLoaded] = useState(false);
  const [invisibleLoaded, setInvisibleLoaded] = useState(false);
  const [invisibleVerify, setInvisibleVerify] = useState(false);
  const [invisibleKey, setInvisibleKey] = useState(1);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);

  useImperativeHandle(ref, () => ({
    type: 'recaptcha' as const,
    verify: () =>
      new Promise<string>((resolve, reject) => {
        resolveRef.current = resolve;
        rejectRef.current = reject;

        if (attemptInvisibleVerification) {
          setInvisibleVerify(true);
        } else {
          setVisible(true);
          setVisibleLoaded(false);
        }
      }),
  }));

  const finishWithToken = (token: string) => {
    resolveRef.current?.(token);
    resolveRef.current = null;
    rejectRef.current = null;
    setVisible(false);
    setInvisibleVerify(false);
    setInvisibleLoaded(false);
    setInvisibleKey((key) => key + 1);
  };

  const finishWithError = (message: string) => {
    rejectRef.current?.(new Error(message));
    resolveRef.current = null;
    rejectRef.current = null;
    setVisible(false);
    setInvisibleVerify(false);
  };

  const cancel = () => finishWithError('Cancelled by user');

  return (
    <View style={styles.container}>
      {attemptInvisibleVerification ? (
        <RecaptchaWebView
          key={`invisible-${invisibleKey}`}
          firebaseConfig={firebaseConfig}
          invisible
          verify={invisibleLoaded && invisibleVerify}
          style={styles.invisible}
          onLoad={() => setInvisibleLoaded(true)}
          onError={() => finishWithError('Failed to load reCAPTCHA')}
          onVerify={finishWithToken}
          onFullChallenge={() => {
            setInvisibleVerify(false);
            setVisible(true);
          }}
        />
      ) : null}

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancel}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.cancel}>
              <Button title={cancelLabel} onPress={cancel} />
            </View>
          </View>
          <View style={styles.content}>
            <RecaptchaWebView
              firebaseConfig={firebaseConfig}
              style={styles.content}
              onLoad={() => setVisibleLoaded(true)}
              onError={() => finishWithError('Failed to load reCAPTCHA')}
              onVerify={finishWithToken}
            />
            {!visibleLoaded ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" />
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 0,
    height: 0,
  },
  invisible: {
    width: 300,
    height: 300,
  },
  modalContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FBFBFB',
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomColor: '#CECECE',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: {
    position: 'absolute',
    left: 8,
    justifyContent: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    paddingTop: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
});
