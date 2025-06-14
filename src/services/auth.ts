import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase'; // Asegúrate que exportas auth desde firebase.ts

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
        const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: '361203563970-rcbmdv594v32ogibodvepihq13giusq8.apps.googleusercontent.com',
        androidClientId: '361203563970-rcbmdv594v32ogibodvepihq13giusq8.apps.googleusercontent.com',
        webClientId: '361203563970-rcbmdv594v32ogibodvepihq13giusq8.apps.googleusercontent.com',
        expoClientId: '361203563970-rcbmdv594v32ogibodvepihq13giusq8.apps.googleusercontent.com',
        } as any);

    const handleLogin = async () => {
    if (response?.type === 'success' && response.authentication?.idToken) {
        const id_token = response.authentication.idToken;

        const credential = GoogleAuthProvider.credential(id_token);
        const userCredential = await signInWithCredential(auth, credential);
        return userCredential.user;
    }
    };

  return { request, response, promptAsync, handleLogin };
};
