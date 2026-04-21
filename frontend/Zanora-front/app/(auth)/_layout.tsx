import { GoogleOAuthProvider } from '@react-oauth/google';
import { Stack } from 'expo-router';

const WEB_CLIENT_ID = '838764370475-t15eeibsqd7acjqtr9kgaa815c833mg4.apps.googleusercontent.com';
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      
      <GoogleOAuthProvider clientId={WEB_CLIENT_ID}>
        <Stack.Screen name="login" />
      </GoogleOAuthProvider>
      <Stack.Screen name="register" />
    </Stack>
  );
}