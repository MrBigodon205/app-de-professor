import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, Animated } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { LinearGradient } from 'expo-linear-gradient';
import { LogIn, KeyRound, ArrowRight, ShieldCheck, Mail, Lock } from 'lucide-react-native';
import { Redirect, Stack } from 'expo-router';
import { BackgroundPattern } from '../components/ui/BackgroundPattern';

export default function LoginScreen() {
    const { login, currentUser, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const pulse = () => {
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 2.2,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ]).start(() => pulse());
        };
        pulse();
    }, []);

    if (loading) return null; // Or loading screen
    if (currentUser) return <Redirect href="/(app)/dashboard" />;

    const handleLogin = async () => {
        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }
        setIsLoggingIn(true);
        const result = await login(trimmedEmail, trimmedPassword);
        setIsLoggingIn(false);
        if (!result.success) {
            Alert.alert('Falha no Login', 'E-mail ou senha incorretos.');
        }
    };

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <BackgroundPattern />
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View style={styles.brandingBox}>
                    <View style={styles.versionBadgeRow}>
                        <View style={styles.pulseContainer}>
                            <View style={styles.badgePulse} />
                            <Animated.View
                                style={[
                                    styles.badgePulse,
                                    styles.badgePulseOuter,
                                    {
                                        transform: [{ scale: pulseAnim }],
                                        opacity: pulseAnim.interpolate({
                                            inputRange: [1, 2.2],
                                            outputRange: [0.6, 0]
                                        })
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.badgeText}>INTELLIGENCE v3.1</Text>
                    </View>

                    <View style={styles.logoFlex}>
                        <View style={styles.shieldWrapper}>
                            <ShieldCheck size={40} color="#4f46e5" />
                        </View>
                        <View>
                            <Text style={styles.brandTitle}>Prof. Acerta<Text style={{ color: '#10b981' }}>+</Text></Text>
                            <Text style={styles.brandTag}>SISTEMA CORE INTEGRADO</Text>
                        </View>
                    </View>
                </View>

                <GlassCard style={styles.glassPortal}>
                    <View style={styles.portalHeader}>
                        <Text style={styles.portalTitle}>Acesso Restrito</Text>
                        <Text style={styles.portalSubtitle}>Identifique-se para acessar o painel</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>E-mail</Text>
                            <View style={styles.inputContainer}>
                                <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="professor@escola.com"
                                    placeholderTextColor="#94a3b8"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View style={styles.inputWrapper}>
                            <Text style={styles.label}>Senha</Text>
                            <View style={styles.inputContainer}>
                                <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.button, isLoggingIn && { opacity: 0.7 }]}
                            onPress={handleLogin}
                            disabled={isLoggingIn}
                        >
                            <LinearGradient
                                colors={['#4f46e5', '#3b82f6']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.buttonText}>{isLoggingIn ? 'Autenticando...' : 'Entrar no Sistema'}</Text>
                            <ArrowRight size={18} color="#fff" />
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.lostPassButton}>
                            <Text style={styles.lostPassText}>Esqueci minha senha</Text>
                        </TouchableOpacity>

                        <View style={styles.dividerBox}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerLabel}>OU CONTINUE COM</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity style={styles.googleButton}>
                            <Image
                                source={{ uri: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png' }}
                                style={styles.googleIcon}
                            />
                            <Text style={styles.googleText}>Conta Google Workspace</Text>
                        </TouchableOpacity>
                    </View>
                </GlassCard>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>© 2026 PROF. ACERTA+ CORE</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    brandingBox: {
        alignItems: 'center',
        marginBottom: 32,
        gap: 20,
    },
    versionBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(79, 70, 229, 0.12)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 100,
        gap: 10,
        borderWidth: 1.5,
        borderColor: 'rgba(79, 70, 229, 0.2)',
    },
    pulseContainer: {
        width: 10,
        height: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgePulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4f46e5',
    },
    badgePulseOuter: {
        position: 'absolute',
        opacity: 0.6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#4f46e5',
        letterSpacing: 2,
    },
    logoFlex: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    shieldWrapper: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
        elevation: 10,
    },
    brandTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: '#1e293b',
        letterSpacing: -1,
    },
    brandTag: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1.5,
        marginTop: -2,
    },
    glassPortal: {
        padding: 32,
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    portalHeader: {
        marginBottom: 32,
    },
    portalTitle: {
        fontSize: 26,
        fontWeight: '900',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    portalSubtitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 4,
        lineHeight: 20,
    },
    form: {
        gap: 20,
    },
    inputWrapper: {
        gap: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '900',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        fontWeight: '600',
    },
    button: {
        height: 60,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 4,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#4f46e5',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    buttonText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 0.5,
    },
    lostPassButton: {
        alignItems: 'center',
        marginTop: 4,
    },
    lostPassText: {
        color: '#64748b',
        fontWeight: '700',
        fontSize: 13,
    },
    dividerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginVertical: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    googleButton: {
        height: 56,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#f1f5f9',
        backgroundColor: 'white',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    googleIcon: {
        width: 20,
        height: 20,
    },
    googleText: {
        color: '#1e293b',
        fontWeight: '900',
        fontSize: 14,
    },
    footer: {
        marginTop: 40,
        bottom: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 2,
    },
});
