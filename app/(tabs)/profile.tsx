import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Screen</Text>
      <Button title="Sign Out" onPress={handleSignOut} color="#d4af37" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 }
});
