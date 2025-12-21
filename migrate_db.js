const fs = require('fs');
const path = 'C:\\Users\\Chinc\\Downloads\\prof.-acerta+-3.1\\server\\db.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));
const userId = '7c8f823f-cd22-426e-998e-5a655b6450ac';

['classes', 'students', 'activities', 'plans', 'attendance', 'occurrences'].forEach(key => {
    if (data[key]) {
        data[key] = data[key].map(item => ({ ...item, userId }));
    }
});

fs.writeFileSync(path, JSON.stringify(data, null, 2));
console.log('Migration complete');
