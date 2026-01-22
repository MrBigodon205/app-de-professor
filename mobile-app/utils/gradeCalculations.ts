import { Student } from '../types';

export const UNIT_CONFIGS: any = {
    '1': {
        columns: [
            { key: 'qualitative', label: 'Qualitativo', max: 2.0 },
            { key: 'simulado', label: 'Simulado', max: 2.0 },
            { key: 'test', label: 'Teste', max: 4.0 },
            { key: 'workshop', label: 'Workshop', max: 2.0 },
            { key: 'exam', label: 'Prova', max: 10.0 },
        ],
    },
    '2': {
        columns: [
            { key: 'qualitative', label: 'Qualitativo', max: 2.0 },
            { key: 'simulado', label: 'Simulado', max: 2.0 },
            { key: 'test', label: 'Teste', max: 4.0 },
            { key: 'scienceFair', label: 'Feira de Ciências', max: 2.0 },
            { key: 'exam', label: 'Prova', max: 10.0 },
        ],
    },
    '3': {
        columns: [
            { key: 'qualitative', label: 'Qualitativo', max: 2.0 },
            { key: 'simulado', label: 'Simulado', max: 2.0 },
            { key: 'test', label: 'Teste', max: 4.0 },
            { key: 'gincana', label: 'Gincana', max: 2.0 },
            { key: 'talentShow', label: 'Amostra de Talentos', max: 2.0 },
            { key: 'exam', label: 'Prova', max: 10.0 },
        ],
    },
    'final': {
        columns: [
            { key: 'final_exam', label: 'Prova Final', max: 10.0 },
        ],
    },
    'recovery': {
        columns: [
            { key: 'recovery_exam', label: 'Recuperação', max: 10.0 },
        ],
    },
    'results': {
        columns: []
    }
};

export const calculateUnitTotal = (student: Student, unit: string) => {
    const unitsData = (student as any).units ? student.units : student;
    const grades = (unitsData as any)?.[unit] || {};

    if (!grades) return 0;

    const total = Object.entries(grades).reduce((a: number, [key, b]: [string, any]) => {
        if (key === 'observation' || typeof b !== 'number') return a;
        return a + (Number(b) || 0);
    }, 0);

    if (unit === '1' || unit === '2' || unit === '3') return total / 2;
    return total;
};

export const calculateAnnualSummary = (student: Student) => {
    const u1 = calculateUnitTotal(student, '1');
    const u2 = calculateUnitTotal(student, '2');
    const u3 = calculateUnitTotal(student, '3');
    const annualTotal = u1 + u2 + u3;

    const displayTotal = Number(annualTotal.toFixed(1));

    let status: 'APPROVED' | 'FINAL' | 'RECOVERY' | 'FAILED' = 'APPROVED';
    let needed = 0;
    let finalNeeded = 0;
    let finalExamPoints = 0;

    if (displayTotal >= 18.0) {
        status = 'APPROVED';
    } else if (displayTotal >= 8.0) {
        status = 'FINAL';
        finalNeeded = 18.0 - displayTotal;
        needed = finalNeeded;

        const rawFinal = (student as any).units?.['final']?.['final_exam'];
        if (rawFinal !== undefined && rawFinal !== null && rawFinal !== '') {
            const finalExam = Number(rawFinal);
            finalExamPoints = finalExam;
            if (finalExam < needed) {
                status = 'RECOVERY';
                needed = 6;
            } else {
                status = 'APPROVED';
            }
        }
    } else {
        status = 'RECOVERY';
        needed = 6;
        finalNeeded = 0;
    }

    let finalAnnualTotal = displayTotal + finalExamPoints;

    if (status === 'RECOVERY') {
        const rawRec = (student as any).units?.['recovery']?.['recovery_exam'];
        if (rawRec !== undefined && rawRec !== null && rawRec !== '') {
            finalAnnualTotal = Number(rawRec);
        } else {
            finalAnnualTotal = 0;
        }
    }

    return { annualTotal: finalAnnualTotal, baseTotal: displayTotal, status, needed, finalNeeded };
};

export const getStatusResult = (student: Student, unitContext: string = 'results') => {
    const { status, needed, finalNeeded } = calculateAnnualSummary(student);

    if (status === 'APPROVED') {
        if (finalNeeded > 0) return { text: 'Aprovado por prova final', color: '#10b981', bg: '#ecfdf5', val: 'aprovado' };
        return { text: 'Aprovado', color: '#10b981', bg: '#ecfdf5', val: 'aprovado' };
    }

    if (status === 'FINAL' || (unitContext === 'final' && status === 'RECOVERY' && finalNeeded > 0)) {
        const rawFinal = (student as any).units?.['final']?.['final_exam'];
        const targetScore = unitContext === 'final' ? finalNeeded : needed;
        const needsText = `Prova Final (Precisa: ${targetScore.toFixed(1)})`;

        if (rawFinal !== undefined && rawFinal !== null && rawFinal !== '') {
            const finalExam = Number(rawFinal);
            if (finalExam >= targetScore) return { text: 'Aprovado por prova final', color: '#10b981', bg: '#ecfdf5', val: 'aprovado' };

            return { text: 'Perdeu na Prova Final', color: '#f43f5e', bg: '#fff1f2', val: 'reprovado' };
        }
        return { text: needsText, color: '#f59e0b', bg: '#fffbeb', val: 'final' };
    }

    if (status === 'RECOVERY') {
        const rawRec = (student as any).units?.['recovery']?.['recovery_exam'];
        if (rawRec !== undefined && rawRec !== null && rawRec !== '') {
            const recoveryExam = Number(rawRec);
            if (recoveryExam >= 6.0) return { text: 'Aprovado (Rec)', color: '#10b981', bg: '#ecfdf5', val: 'aprovado' };
            return { text: 'Reprovado', color: '#f43f5e', bg: '#fff1f2', val: 'reprovado' };
        }
        return { text: 'Recuperação (Min: 6.0)', color: '#f43f5e', bg: '#fff1f2', val: 'recuperacao' };
    }

    return { text: '-', color: '#64748b', bg: '#f1f5f9', val: 'indefinido' };
};
