import fs from 'fs';

const dbPath = './server/db.json';
const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const correctUserId = 'bd2081e8-880b-45bd-ba38-4e4ab18d6858';
const oldUserId = '7c8f823f-cd22-426e-998e-5a655b6450ac';

// 1. Profile Update (Block 0)
const user = dbData.users.find(u => u.email === 'slayertargeryen@gmail.com');
if (user && user.photoUrl) {
    const profileSql = `UPDATE profiles SET photo_url = '${user.photoUrl}' WHERE id = '${correctUserId}';\n`;
    fs.writeFileSync('block_profile.sql', profileSql);
    console.log('Profile SQL generated');
}

const userClasses = dbData.classes.filter(c => c.userId === oldUserId);
userClasses.forEach((cls, index) => {
    let sql = `DO $$\nDECLARE\n  v_class_id BIGINT;\n  v_student_id BIGINT;\nBEGIN\n`;
    sql += `  -- Class: ${cls.name}\n`;
    // Postgres array format: {"A","B"}
    const sectionsArr = JSON.stringify(cls.sections).replace('[', '{').replace(']', '}');
    sql += `  INSERT INTO classes (name, sections, user_id) VALUES ('${cls.name.replace(/'/g, "''")}', '${sectionsArr}', '${correctUserId}') RETURNING id INTO v_class_id;\n`;

    // Students for this class
    const students = dbData.students.filter(s => s.classId === cls.id && s.userId === oldUserId);
    for (const student of students) {
        sql += `  -- Student: ${student.name}\n`;
        const unitsJson = JSON.stringify(student.units).replace(/'/g, "''");
        sql += `  INSERT INTO students (name, number, initials, color, photo_url, series_id, section, units, user_id) \n`;
        sql += `  VALUES ('${student.name.replace(/'/g, "''")}', '${student.number}', '${student.initials}', '${student.color}', ${student.photoUrl ? `'${student.photoUrl}'` : 'NULL'}, v_class_id, '${student.section}', '${unitsJson}', '${correctUserId}') RETURNING id INTO v_student_id;\n`;

        // Occurrences
        const occurrences = dbData.occurrences.filter(o => o.studentId === student.id && o.userId === oldUserId);
        for (const occ of occurrences) {
            sql += `  INSERT INTO occurrences (student_id, type, description, date, user_id) VALUES (v_student_id, '${occ.type}', '${occ.description.replace(/'/g, "''")}', '${occ.date}', '${correctUserId}');\n`;
        }

        // Attendance
        const attendance = dbData.attendance.filter(a => a.studentId === student.id && a.userId === oldUserId);
        for (const att of attendance) {
            sql += `  INSERT INTO attendance (student_id, date, status, user_id) VALUES (v_student_id, '${att.date}', '${att.status}', '${correctUserId}');\n`;
        }
    }

    // Plans for this class
    const plans = dbData.plans.filter(p => p.seriesId === cls.id && p.userId === oldUserId);
    for (const plan of plans) {
        const filesJson = JSON.stringify(plan.files).replace(/'/g, "''");
        sql += `  INSERT INTO plans (title, series_id, start_date, end_date, description, files, user_id) \n`;
        sql += `  VALUES ('${plan.title.replace(/'/g, "''")}', v_class_id, '${plan.startDate}', '${plan.endDate}', '${plan.description.replace(/'/g, "''")}', '${filesJson}', '${correctUserId}');\n`;
    }

    // Activities for this class
    const activities = dbData.activities.filter(a => a.seriesId === cls.id && a.userId === oldUserId);
    for (const act of activities) {
        const filesJson = JSON.stringify(act.files).replace(/'/g, "''");
        // Postgres array for completions
        const completionsArr = act.completions ? JSON.stringify(act.completions).replace('[', '{').replace(']', '}') : '{}';
        sql += `  INSERT INTO activities (title, type, series_id, section, date, description, files, completions, user_id) \n`;
        sql += `  VALUES ('${act.title.replace(/'/g, "''")}', '${act.type}', v_class_id, '${act.section}', '${act.date}', '${act.description.replace(/'/g, "''")}', '${filesJson}', '${completionsArr}', '${correctUserId}');\n`;
    }

    sql += `END $$;`;
    fs.writeFileSync(`block_${index}.sql`, sql);
    console.log(`Block ${index} generated: block_${index}.sql`);
});
