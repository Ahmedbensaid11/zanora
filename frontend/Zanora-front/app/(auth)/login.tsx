import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimatedCityscape from '../../components/AnimatedCityscape';
import { Colors } from '../../constants/Colors';
import { loginWithCredentials, loginWithGoogleUserInfo } from '../../services/authService';
import { AuthSessionResult, TokenResponse, AuthError } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// 🔁 Paste your Web Client ID from Google Cloud Console here
const WEB_CLIENT_ID = '838764370475-t15eeibsqd7acjqtr9kgaa815c833mg4.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '838764370475-41gck64nnoc37amedlcao2kpcpqbd5ul.apps.googleusercontent.com';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

export default function LoginScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const [email, setEmail]                 = useState<string>('');
  const [password, setPassword]           = useState<string>('');
  const [loading, setLoading]             = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [error, setError]                 = useState<string>('');

  const isLargeScreen      = width >= 768;
  const isExtraLargeScreen = width >= 1024;



  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: ANDROID_CLIENT_ID,
    clientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
  });



  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response);
    } else if (response?.type === 'error') {
      setError('Google sign-in was cancelled or failed.');
    }
  }, [response]);


  const handleGoogleResponse = async (
    authResponse: Extract<typeof response, { type: 'success' }>
  ) => {
    try {
      setGoogleLoading(true);
      setError('');

      const accessToken = authResponse.authentication?.accessToken
        ?? authResponse.params?.access_token;

      if (!accessToken) throw new Error('No access token received from Google');

      const userInfoRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoRes.ok) throw new Error('Failed to fetch Google user info');

      const userInfo: GoogleUserInfo = await userInfoRes.json();

      if (!userInfo.email) throw new Error('No email returned from Google');

      const data = await loginWithGoogleUserInfo(userInfo);
      await AsyncStorage.setItem('token', data.token);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google sign-in failed. Please try again.';
      setError(message);
    } finally {
      setGoogleLoading(false);
    }
  };

  // --- Email/Password Login ---
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const data = await loginWithCredentials(email.trim(), password);
      await AsyncStorage.setItem('token', data.token);
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => router.push('/(auth)/register');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.cityscapeContainer, isLargeScreen && styles.cityscapeLarge]}>
            <AnimatedCityscape />
          </View>

          <View style={[
            styles.loginContainer,
            isLargeScreen && styles.loginContainerLarge,
            isExtraLargeScreen && styles.loginContainerXLarge,
          ]}>
            <Text style={[styles.title, isLargeScreen && styles.titleLarge]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, isLargeScreen && styles.subtitleLarge]}>
              Sign in to continue
            </Text>

            {/* Error message */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.formContainer}>
              <TextInput
                style={[styles.input, isLargeScreen && styles.inputLarge]}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!loading && !googleLoading}
              />

              <TextInput
                style={[styles.input, isLargeScreen && styles.inputLarge]}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) => { setPassword(text); setError(''); }}
                secureTextEntry
                autoComplete="password"
                editable={!loading && !googleLoading}
              />

              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, isLargeScreen && styles.textLarge]}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                style={[
                  styles.button,
                  isLargeScreen && styles.buttonLarge,
                  (loading || googleLoading) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading || googleLoading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.buttonText, isLargeScreen && styles.buttonTextLarge]}>
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In Button */}
              <TouchableOpacity
                style={[
                  styles.googleButton,
                  isLargeScreen && styles.buttonLarge,
                  (!request || googleLoading || loading) && styles.buttonDisabled,
                ]}
                onPress={() => promptAsync()}
                disabled={!request || googleLoading || loading}
              >
                {googleLoading ? (
                  <ActivityIndicator color={Colors.primary} />
                ) : (
                  <View style={styles.googleButtonInner}>
                    <Text style={styles.googleIcon}>G</Text>
                    <Text style={[styles.googleButtonText, isLargeScreen && styles.buttonTextLarge]}>
                      Continue with Google
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={[styles.registerText, isLargeScreen && styles.textLarge]}>
                  Don't have an account?{' '}
                </Text>
                <TouchableOpacity onPress={handleRegister} disabled={loading || googleLoading}>
                  <Text style={[styles.registerLink, isLargeScreen && styles.textLarge]}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    alignItems: 'center',
  },
  contentWrapper: {
    width: '100%',
    maxWidth: 1200,
    alignItems: 'center',
  },
  cityscapeContainer: { width: '100%' },
  cityscapeLarge: { maxHeight: 300 },
  loginContainer: {
    width: '100%',
    paddingHorizontal: 30,
    marginTop: 40,
    paddingBottom: 40,
  },
  loginContainerLarge: {
    maxWidth: 500,
    paddingHorizontal: 40,
    marginTop: 60,
  },
  loginContainerXLarge: {
    maxWidth: 550,
    paddingHorizontal: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  titleLarge: { fontSize: 40, marginBottom: 12 },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 30,
    textAlign: 'center',
  },
  subtitleLarge: { fontSize: 18, marginBottom: 40 },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    textAlign: 'center',
  },
  formContainer: { marginTop: 10 },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    color: Colors.text,
  },
  inputLarge: {
    padding: 18,
    fontSize: 17,
    marginBottom: 20,
    borderRadius: 14,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonLarge: {
    padding: 18,
    borderRadius: 14,
    marginTop: 15,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextLarge: { fontSize: 18 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: Colors.textSecondary,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  googleButtonText: {
    color: '#3C3C3C',
    fontSize: 15,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  registerText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  textLarge: { fontSize: 16 },
});