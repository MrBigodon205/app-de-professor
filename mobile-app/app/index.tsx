import { View, StyleSheet, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import Constants from 'expo-constants';

// ⚠️ CHANGE THIS URL TO YOUR PUBLISHED WEB APP URL (Vercel/Netlify)
const WEB_APP_URL = 'https://app-de-professor.vercel.app';

export default function App() {
    const [isLoading, setIsLoading] = useState(true);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
            <WebView
                source={{ uri: WEB_APP_URL }}
                style={styles.webview}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                    </View>
                )}
                onLoadEnd={() => setIsLoading(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
        paddingTop: Constants.statusBarHeight, // Avoid notch overlap
    },
    webview: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    loadingContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
