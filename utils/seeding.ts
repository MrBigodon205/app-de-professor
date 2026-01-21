import { supabase } from '../lib/supabase';

const TEMPLATE_CLASSES = [
    { name: '6º Ano', sections: ['A', 'B', 'C', 'D'] },
    { name: '7º Ano', sections: ['A', 'B', 'C'] },
    { name: '8º Ano', sections: ['A', 'B'] },
    { name: '9º Ano', sections: ['A', 'B'] },
    { name: '1º Ano Ensino Médio', sections: ['A'] },
    { name: '2º Ano Ensino Médio', sections: ['A'] },
    { name: '3º Ano Ensino Médio', sections: ['A'] }
];

export const seedUserData = async (userId: string) => {
    console.log(`Starting data seeding for user: ${userId}`);

    try {
        // Guard clause: check if user already has classes
        const { count, error: checkError } = await supabase
            .from('classes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (checkError) {
            console.error("Error checking for existing data:", checkError);
        } else if (count && count > 0) {
            console.log(`User ${userId} already has ${count} classes. Skipping seeding.`);
            return true;
        }

        for (const classTemplate of TEMPLATE_CLASSES) {
            // 1. Create Class
            const { error: classError } = await supabase
                .from('classes')
                .insert({
                    name: classTemplate.name,
                    sections: classTemplate.sections,
                    user_id: userId
                });

            if (classError) throw classError;
        }

        console.log(`Seeding completed successfully for user: ${userId}`);
        return true;
    } catch (error) {
        console.error(`Error during seeding for user ${userId}:`, error);
        return false;
    }
};
