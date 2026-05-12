import React from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { HOST_IP } from '../api/api';

export default function FullWebApp() {
  // Use the dynamically resolved IP to access the locally running React Web app
  // React default port is 3000
  const webAppUrl = `http://${HOST_IP}:3000`;

  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{ uri: webAppUrl }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator size="large" color="#6c5ce7" style={styles.loader} />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
  },
});
