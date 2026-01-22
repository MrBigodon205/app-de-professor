import { View, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, Users, Calendar, ClipboardCheck, Shield, Award, BookCheck } from 'lucide-react-native';
import { useThemeContext } from '../../contexts/ThemeContext';
import { ClassProvider } from '../../contexts/ClassContext';

export default function AppLayout() {
    const theme = useThemeContext();

    return (
        <ClassProvider>
            <Tabs screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: theme.primaryColorHex,
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderTopWidth: 0,
                    height: Platform.OS === 'ios' ? 92 : 72,
                    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
                    paddingTop: 12,
                    shadowColor: '#4f46e5',
                    shadowOffset: { width: 0, height: -8 },
                    shadowOpacity: 0.1,
                    shadowRadius: 15,
                    elevation: 20,
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    position: 'absolute',
                },
                tabBarLabelStyle: {
                    fontWeight: '900',
                    fontSize: 10,
                    letterSpacing: 0.2,
                }
            }}>
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Início',
                        tabBarIcon: ({ color }) => <Home size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="students"
                    options={{
                        title: 'Alunos',
                        tabBarIcon: ({ color }) => <Users size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="grades"
                    options={{
                        title: 'Notas',
                        tabBarIcon: ({ color }) => <Award size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="attendance"
                    options={{
                        title: 'Frequência',
                        tabBarIcon: ({ color }) => <ClipboardCheck size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="activities"
                    options={{
                        title: 'Atividades',
                        tabBarIcon: ({ color }) => <BookCheck size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="observations"
                    options={{
                        title: 'Ocorrências',
                        tabBarIcon: ({ color }) => <Shield size={24} color={color} />,
                    }}
                />
                <Tabs.Screen
                    name="planning"
                    options={{
                        title: 'Planos',
                        tabBarIcon: ({ color }) => <Calendar size={24} color={color} />,
                    }}
                />
            </Tabs>
        </ClassProvider>
    );
}
