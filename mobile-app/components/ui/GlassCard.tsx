import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 40, tint = 'light' }) => {
    return (
        <View style={[styles.container, style]}>
            {Platform.OS !== 'web' ? (
                <BlurView intensity={intensity} style={StyleSheet.absoluteFill} tint={tint} />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255, 255, 255, 0.7)' }]} />
            )}
            <View style={styles.inner}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    inner: {
        zIndex: 1,
    }
});
