import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import * as LucideIcons from 'lucide-react-native';
import { useThemeContext } from '../../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const ICON_SIZE = 120; // Larger icons like web

const FloatingIcon = ({ iconName, initialX, initialY, delay, color }: any) => {
    const moveAnim = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const Icon = (LucideIcons as any)[iconName] || LucideIcons.GraduationCap;

    useEffect(() => {
        const animate = () => {
            Animated.parallel([
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(moveAnim, {
                        toValue: {
                            x: initialX + (Math.random() * 60 - 30),
                            y: initialY + (Math.random() * 60 - 30)
                        },
                        duration: 5000 + Math.random() * 3000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(moveAnim, {
                        toValue: { x: initialX, y: initialY },
                        duration: 5000 + Math.random() * 3000,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.loop(
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 20000 + Math.random() * 10000,
                        useNativeDriver: true,
                    })
                )
            ]).start(() => animate());
        };
        animate();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <Animated.View
            style={[
                styles.icon,
                {
                    transform: [
                        { translateX: moveAnim.x },
                        { translateY: moveAnim.y },
                        { rotate: spin }
                    ],
                }
            ]}
        >
            <Icon size={ICON_SIZE} color={color} strokeWidth={1} />
        </Animated.View>
    );
};

export const BackgroundPattern = () => {
    const theme = useThemeContext();
    const icons = theme.illustrations;
    const color = `${theme.primaryColorHex}08`; // Very subtle opacity

    return (
        <View style={styles.container}>
            {icons.map((name, i) => (
                <FloatingIcon
                    key={`${name}-${i}`}
                    iconName={name}
                    initialX={width * (0.1 + (i * 0.2) % 0.8)}
                    initialY={height * (0.1 + (i * 0.15) % 0.8)}
                    delay={i * 500}
                    color={color}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#f8fafc',
        zIndex: -1,
    },
    icon: {
        position: 'absolute',
    },
});
