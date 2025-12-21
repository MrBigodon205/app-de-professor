import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(
    envContent.split('\n')
        .map(l => l.trim())
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => {
            const [key, ...rest] = l.split('=');
            return [key, rest.join('=')];
        })
);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const dbPath = './server/db.json';
const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// The actual ID from Supabase
const correctUserId = 'bd2081e8-880b-45bd-ba38-4e4ab18d6858';
// The old ID from db.json
const oldUserId = '7c8f823f-cd22-426e-998e-5a655b6450ac';

async function migrate() {
    console.log('Starting migration for user:', correctUserId);

    // 0. Cleanup existing data to avoid duplicates
    console.log('Cleaning up existing data for user...');
    await supabase.from('attendance').delete().eq('user_id', correctUserId);
    await supabase.from('occurrences').delete().eq('user_id', correctUserId);
    await supabase.from('activities').delete().eq('user_id', correctUserId);
    await supabase.from('plans').delete().eq('user_id', correctUserId);
    await supabase.from('students').delete().eq('user_id', correctUserId);
    await supabase.from('classes').delete().eq('user_id', correctUserId);
    console.log('Cleanup complete.');

    // 1. Update Profile Photo
    const user = dbData.users.find(u => u.email === 'slayertargeryen@gmail.com');
    if (user && user.photoUrl) {
        console.log('Updating profile photo...');
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ photo_url: user.photoUrl })
            .eq('id', correctUserId);
        if (profileError) console.error('Error updating profile:', profileError.message);
    }

    // 2. Migrate Classes
    console.log('Migrating classes...');
    const userClasses = dbData.classes.filter(c => c.userId === oldUserId);
    for (const cls of userClasses) {
        const { data: savedClass, error: classError } = await supabase
            .from('classes')
            .insert({
                name: cls.name,
                sections: cls.sections,
                user_id: correctUserId
            })
            .select()
            .single();

        if (classError) {
            console.error('Error migrating class:', cls.name, classError.message);
            continue;
        }

        const newClassId = savedClass.id;
        const oldClassId = cls.id;

        // 3. Migrate Students for this class
        const students = dbData.students.filter(s => s.classId === oldClassId && s.userId === oldUserId);
        console.log(`Migrating ${students.length} students for class ${cls.name}...`);

        for (const student of students) {
            const { data: savedStudent, error: studentError } = await supabase
                .from('students')
                .insert({
                    name: student.name,
                    number: student.number,
                    initials: student.initials,
                    color: student.color,
                    photo_url: student.photoUrl,
                    series_id: newClassId,
                    section: student.section,
                    units: student.units,
                    user_id: correctUserId
                })
                .select()
                .single();

            if (studentError) {
                console.error('Error migrating student:', student.name, studentError.message);
                continue;
            }

            const newStudentId = savedStudent.id;
            const oldStudentId = student.id;

            // 4. Migrate Occurrences for this student
            const occurrences = dbData.occurrences.filter(o => o.studentId === oldStudentId && o.userId === oldUserId);
            if (occurrences.length > 0) {
                const { error: occError } = await supabase
                    .from('occurrences')
                    .insert(occurrences.map(o => ({
                        student_id: newStudentId,
                        type: o.type,
                        description: o.description,
                        date: o.date,
                        user_id: correctUserId
                    })));
                if (occError) console.error('Error migrating occurrences:', student.name, occError.message);
            }

            // 5. Migrate Attendance for this student
            const attendance = dbData.attendance.filter(a => a.studentId === oldStudentId && a.userId === oldUserId);
            if (attendance.length > 0) {
                const { error: attError } = await supabase
                    .from('attendance')
                    .insert(attendance.map(a => ({
                        student_id: newStudentId,
                        date: a.date,
                        status: a.status,
                        user_id: correctUserId
                    })));
                if (attError) console.error('Error migrating attendance:', student.name, attError.message);
            }
        }

        // 6. Migrate Plans for this class
        const plans = dbData.plans.filter(p => p.seriesId === oldClassId && p.userId === oldUserId);
        if (plans.length > 0) {
            const { error: planError } = await supabase
                .from('plans')
                .insert(plans.map(p => ({
                    title: p.title,
                    series_id: newClassId,
                    start_date: p.startDate,
                    end_date: p.endDate,
                    description: p.description,
                    files: p.files,
                    user_id: correctUserId
                })));
            if (planError) console.error('Error migrating plans for class:', cls.name, planError.message);
        }

        // 7. Migrate Activities for this class
        const activities = dbData.activities.filter(a => a.seriesId === oldClassId && a.userId === oldUserId);
        if (activities.length > 0) {
            const { error: actError } = await supabase
                .from('activities')
                .insert(activities.map(a => ({
                    title: a.title,
                    type: a.type,
                    series_id: newClassId,
                    section: a.section,
                    date: a.date,
                    description: a.description,
                    files: a.files,
                    completions: a.completions,
                    user_id: correctUserId
                })));
            if (actError) console.error('Error migrating activities for class:', cls.name, actError.message);
        }
    }

    console.log('Migration finished!');
}

migrate();
