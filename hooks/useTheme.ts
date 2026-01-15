import { useThemeContext } from '../contexts/ThemeContext';

/**
 * Hook to consume the centralized theme context.
 * This ensures that all components share the same memoized theme object
 * and update instantly/synchronously across the app.
 */
export const useTheme = () => {
    return useThemeContext();
};
