import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'server', 'db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// Common Brazilian Data
const firstNames = [
    "Ana", "Bruno", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Julia",
    "Kaique", "Larissa", "Mateus", "Natalia", "Otavio", "Paula", "Rafael", "Sabrina", "Thiago", "Vitoria",
    "Arthur", "Beatriz", "Caio", "Diana", "Enzo", "Fabiana", "Guilherme", "Isabela", "Joao", "Karina",
    "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro", "Quezia", "Rodrigo", "Sofia", "Tiago", "Vanessa",
    "Alice", "Bernardo", "Clara", "Davi", "Elisa", "Felipe", "Gabriela", "Heitor", "Isadora", "Jorge",
    "Laura", "Miguel", "Nicole", "Olavo", "Pietra", "Renan", "Sarah", "Tales", "Valentina", "Yuri"
];

const lastNames = [
    "Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Rodrigues", "Almeida", "Nascimento", "Lima",
    "Araujo", "Fernandes", "Carvalho", "Gomes", "Martins", "Rocha", "Ribeiro", "Alves", "Monteiro", "Mendes",
    "Barros", "Freitas", "Barbosa", "Pinto", "Moura", "Cavalcanti", "Dias", "Castro", "Campos", "Cardoso"
];

const colors = [
    "from-pink-400 to-rose-500",
    "from-blue-400 to-indigo-500",
    "from-green-400 to-emerald-500",
    "from-purple-400 to-violet-500",
    "from-yellow-400 to-orange-500",
    "from-cyan-400 to-teal-500",
    "from-red-400 to-orange-500",
    "from-indigo-400 to-purple-500"
];

function getRandomName() {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function generateStudents() {
    let allStudents = [];
    let globalId = 1;

    db.classes.forEach(cls => {
        cls.sections.forEach(section => {
            // Generate 30 students per section
            for (let i = 1; i <= 30; i++) {
                const name = getRandomName();
                const student = {
                    id: String(globalId++),
                    name: name,
                    number: String(i).padStart(2, '0'),
                    classId: cls.id,    // Link to Series
                    section: section,   // Link to Section
                    initials: getInitials(name),
                    color: colors[Math.floor(Math.random() * colors.length)],
                    units: {} // Empty grades for now
                };
                allStudents.push(student);
            }
        });
    });

    return allStudents;
}

// Update DB
console.log("Generating students...");
const newStudents = generateStudents();
db.students = newStudents;

console.log(`Generated ${newStudents.length} students across all classes.`);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log("Database updated successfully.");
