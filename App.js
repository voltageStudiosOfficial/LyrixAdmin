import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Provider as PaperProvider, TextInput, Button, Title, Snackbar } from 'react-native-paper';

export default function App() {
  const [artist, setArtist] = useState('');
  const [song, setSong] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const [adminURL, setAdminURL] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const url = await SecureStore.getItemAsync('ADMIN_URL');
      const token = await SecureStore.getItemAsync('ADMIN_SECRET');
      if (url && token) {
        setAdminURL(url);
        setAdminToken(token);
        setConfigured(true);
      }
    };
    loadConfig();
  }, []);

  const showSnackbar = (text) => {
    setMessage(text);
    setVisible(true);
  };

  const saveConfig = async () => {
    if (!adminURL || !adminToken) {
      showSnackbar('Please fill both fields');
      return;
    }
    await SecureStore.setItemAsync('ADMIN_URL', adminURL);
    await SecureStore.setItemAsync('ADMIN_SECRET', adminToken);
    setConfigured(true);
    showSnackbar('Configuration saved securely ✅');
  };

  const sendRequest = async (actionType) => {
    try {
      const res = await fetch(adminURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminToken },
        body: JSON.stringify({ action: actionType, artist, song, lyrics: lyrics.split('\n') })
      });
      const data = await res.json();
      if (data.success) showSnackbar(`✅ ${actionType} successful!`);
      else showSnackbar(`❌ ${data.error || 'Failed'}`);
    } catch (e) {
      showSnackbar(`❌ ${e.message}`);
    }
  };

  if (!configured) {
    return (
      <PaperProvider>
        <SafeAreaView style={styles.container}>
          <ScrollView>
            <Title style={styles.title}>Lyrix Admin Setup</Title>
            <TextInput label="Admin URL" value={adminURL} onChangeText={setAdminURL} mode="outlined" style={styles.input} />
            <TextInput label="Admin Secret" value={adminToken} onChangeText={setAdminToken} mode="outlined" secureTextEntry style={styles.input} />
            <Button mode="contained" onPress={saveConfig} style={styles.button}>Save</Button>
            <Snackbar visible={visible} onDismiss={() => setVisible(false)} duration={3000}>{message}</Snackbar>
          </ScrollView>
        </SafeAreaView>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <Title style={styles.title}>Lyrix Admin</Title>
          <TextInput label="Artist" value={artist} onChangeText={setArtist} mode="outlined" style={styles.input} />
          <TextInput label="Song" value={song} onChangeText={setSong} mode="outlined" style={styles.input} />
          <TextInput label="Lyrics (one line per timestamp)" value={lyrics} onChangeText={setLyrics} mode="outlined" multiline numberOfLines={10} style={styles.input} />
          <Button mode="contained" onPress={() => sendRequest('add')} style={styles.button}>Add / Update</Button>
          <Button mode="outlined" onPress={() => sendRequest('delete')} style={styles.button}>Delete</Button>
          <Snackbar visible={visible} onDismiss={() => setVisible(false)} duration={3000}>{message}</Snackbar>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  title: { marginBottom:16, textAlign:'center' },
  input: { marginBottom:12 },
  button: { marginVertical:6 }
});
