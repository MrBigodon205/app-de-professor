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

const TEMPLATE_STUDENTS = [
    "Laura Monteiro", "Larissa Campos", "Bernardo Nascimento", "Ana Nascimento", "Karina Oliveira",
    "Mariana Silva", "Carlos Cardoso", "Yuri Monteiro", "Felipe Pereira", "Kaique Mendes",
    "Olavo Freitas", "Sabrina Barbosa", "Vitoria Almeida", "Alice Pinto", "Pedro Fernandes",
    "Caio Fernandes", "Diana Carvalho", "Igor Alves", "Rodrigo Fernandes", "Fernanda Carvalho",
    "Olavo Rodrigues", "Lucas Gomes", "Joao Campos", "Karina Carvalho", "Tiago Pinto",
    "Nicole Pereira", "Vitoria Mendes", "Daniela Ribeiro", "Eduardo Santos", "Gabriel Rodrigues"
];

const COLORS = [
    'from-red-400 to-orange-500',
    'from-blue-400 to-indigo-500',
    'from-yellow-400 to-orange-500',
    'from-cyan-400 to-teal-500',
    'from-purple-400 to-violet-500',
    'from-green-400 to-emerald-500',
    'from-pink-400 to-rose-500'
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
            const { data: classData, error: classError } = await supabase
                .from('classes')
                .insert({
                    name: classTemplate.name,
                    sections: classTemplate.sections,
                    user_id: userId
                })
                .select()
                .single();

            if (classError) throw classError;

            // 2. Create Students for each section
            if (classData) {
                const studentInserts = [];

                for (const section of classTemplate.sections) {
                    // Add 30 students per section
                    for (let i = 0; i < TEMPLATE_STUDENTS.length; i++) {
                        const name = TEMPLATE_STUDENTS[i];
                        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
                        const color = COLORS[i % COLORS.length];
                        const number = (i + 1).toString().padStart(2, '0');

                        studentInserts.push({
                            name,
                            number,
                            initials,
                            color,
                            series_id: classData.id,
                            section,
                            user_id: userId,
                            units: {}
                        });
                    }
                }

                const { error: batchError } = await supabase
                    .from('students')
                    .insert(studentInserts);

                if (batchError) throw batchError;
            }
        }

        console.log(`Seeding completed successfully for user: ${userId}`);
        return true;
    } catch (error) {
        console.error(`Error during seeding for user ${userId}:`, error);
        return false;
    }
};
