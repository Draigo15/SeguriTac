import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import Constants from 'expo-constants';

const useGoogleAuth = () => {
  const webClientId = '361203563970-p4e3vf7koe2buno2rurqbsnutek8gi8p.apps.googleusercontent.com';
  const androidClientId = '361203563970-v0kv953f57q7atunputfnof8l268ru9v.apps.googleusercontent.com';

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: Constants.appOwnership === 'expo' ? webClientId : androidClientId,
    redirectUri: AuthSession.makeRedirectUri({ useProxy: true } as any),
    scopes: ['profile', 'email'],
  });

  const handleLogin = async () => {
    if (response?.type === 'success') {
      const userInfoResponse = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${response.authentication?.accessToken}` },
      });
      const user = await userInfoResponse.json();
      return user;
    }
    return null;
  };

  return { promptAsync, handleLogin };
};

export default useGoogleAuth;
