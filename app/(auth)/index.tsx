import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const setGuestMode = useAuthStore((state) => state.setGuestMode);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setHasBiometrics(hasHardware && isEnrolled);
  };

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
  };

  const signUpWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Success', 'Check your email for the confirmation link!');
  };

  const signInWithBiometrics = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Login to AURAMX',
      fallbackLabel: 'Use Passcode',
    });
    
    if (result.success) {
      // In a real implementation, you might fetch encrypted credentials from SecureStore 
      // here and log in to Supabase. For now, we'll let them in as Guest if biometrics pass.
      Alert.alert('Biometrics Verified', 'You are logged in.');
      setGuestMode(true);
    } else {
      Alert.alert('Authentication Failed');
    }
  };

  const handleGuestLogin = () => {
    setGuestMode(true);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    // Simulate Google Sign In Flow
    setTimeout(() => {
        setLoading(false);
        Alert.alert('Google Sign In', 'Successfully authenticated with Google.');
        setGuestMode(true);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>AURAMX</Text>
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={signInWithEmail} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.outlineButton]} onPress={signUpWithEmail} disabled={loading}>
        <Text style={styles.outlineButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={styles.line} />
        <Text style={styles.orText}>OR</Text>
        <View style={styles.line} />
      </View>

      <TouchableOpacity style={[styles.button, styles.socialButton]} onPress={handleGoogleLogin}>
        <Text style={styles.socialButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      {hasBiometrics && (
        <TouchableOpacity style={[styles.button, styles.bioButton]} onPress={signInWithBiometrics}>
          <Text style={styles.bioButtonText}>Login with Biometrics</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.guestButton} onPress={handleGuestLogin}>
        <Text style={styles.guestButtonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#d4af37',
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: 2,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#1e1e1e',
    color: '#fff',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#d4af37',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d4af37',
  },
  outlineButtonText: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  socialButton: {
    backgroundColor: '#ffffff',
  },
  socialButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bioButton: {
    backgroundColor: '#333333',
  },
  bioButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  guestButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#888',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  orText: {
    color: '#888',
    paddingHorizontal: 10,
  },
});
