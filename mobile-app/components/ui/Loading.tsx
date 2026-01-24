import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Loading() {
    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4f46e5" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
    },
});
