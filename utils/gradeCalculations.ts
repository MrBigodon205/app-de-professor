
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
    // If we pass in a raw units object instead of a full student, handle it
    const unitsData = (student as any).units ? student.units : student;
    const grades = unitsData?.[unit] || {};

    // Safety check if grades is undefined
    if (!grades) return 0;

    const total = Object.entries(grades).reduce((a: number, [key, b]: [string, any]) => {
        // Skip 'observation' or other non-numeric fields if they exist
        if (key === 'observation' || typeof b !== 'number') return a;
        return a + (Number(b) || 0);
    }, 0);

    // Average 0-10 only for units 1, 2, 3 (sum of max is 20)
    if (unit === '1' || unit === '2' || unit === '3') return total / 2;
    return total; // Final/Recovery sum of max is 10, no division needed
};

export const calculateAnnualSummary = (student: Student) => {
    const u1 = calculateUnitTotal(student, '1');
    const u2 = calculateUnitTotal(student, '2');
    const u3 = calculateUnitTotal(student, '3');
    const annualTotal = u1 + u2 + u3; // Max 30

    // Match the UI display exactly (8.0 must be 8.0)
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

        // Logic: Fail Final -> Go to Recovery (only if a grade is present)
        const rawFinal = student.units?.['final']?.['final_exam'];
        if (rawFinal !== undefined && rawFinal !== null && rawFinal !== '') {
            const finalExam = Number(rawFinal);
            finalExamPoints = finalExam;
            if (finalExam < needed) {
                status = 'RECOVERY';
                needed = 6; // Rule: Previous grade zeroed, needs min 6.0 in Recovery
            } else {
                status = 'APPROVED'; // Passed Final
            }
        }
    } else {
        status = 'RECOVERY';
        needed = 6; // Direct to Recovery: Previous grade zeroed, needs 6.0
        finalNeeded = 0;
    }

    // Adjust annual total display based on current phase
    let finalAnnualTotal = displayTotal + finalExamPoints;

    if (status === 'RECOVERY') {
        const rawRec = student.units?.['recovery']?.['recovery_exam'];
        // If in recovery, the previous points are "zeroed". We only show the recovery exam grade.
        if (rawRec !== undefined && rawRec !== null && rawRec !== '') {
            finalAnnualTotal = Number(rawRec);
        } else {
            finalAnnualTotal = 0; // "Zerado"
        }
    }

    return { annualTotal: finalAnnualTotal, baseTotal: displayTotal, status, needed, finalNeeded };
};

export const getStatusResult = (student: Student, unitContext: string = 'results') => {
    const { status, needed, finalNeeded } = calculateAnnualSummary(student);

    if (status === 'APPROVED') {
        if (finalNeeded > 0) return { text: 'Aprovado por prova final', color: 'text-emerald-600', bg: 'bg-emerald-100', val: 'aprovado' };
        return { text: 'Aprovado', color: 'text-emerald-600', bg: 'bg-emerald-100', val: 'aprovado' };
    }

    if (status === 'FINAL' || (unitContext === 'final' && status === 'RECOVERY' && finalNeeded > 0)) {
        const rawFinal = student.units?.['final']?.['final_exam'];
        const targetScore = unitContext === 'final' ? finalNeeded : needed;
        const needsText = `Prova Final (Precisa: ${targetScore.toFixed(1)})`;

        if (rawFinal !== undefined && rawFinal !== null && rawFinal !== '') {
            const finalExam = Number(rawFinal);
            if (finalExam >= targetScore) return { text: 'Aprovado por prova final', color: 'text-emerald-600', bg: 'bg-emerald-100', val: 'aprovado' };

            return { text: 'Perdeu na Prova Final', color: 'text-red-600', bg: 'bg-red-100', val: 'reprovado' };
        }
        return { text: needsText, color: 'text-amber-600', bg: 'bg-amber-100', val: 'final' };
    }

    if (status === 'RECOVERY') {
        const rawRec = student.units?.['recovery']?.['recovery_exam'];
        if (rawRec !== undefined && rawRec !== null && rawRec !== '') {
            const recoveryExam = Number(rawRec);
            if (recoveryExam >= 6.0) return { text: 'Aprovado (Rec)', color: 'text-emerald-600', bg: 'bg-emerald-100', val: 'aprovado' };
            return { text: 'Reprovado', color: 'text-red-600', bg: 'bg-red-100', val: 'reprovado' };
        }
        return { text: 'Recuperação (Min: 6.0)', color: 'text-rose-600', bg: 'bg-rose-100', val: 'recuperacao' };
    }

    return { text: '-', color: 'text-slate-500', bg: 'bg-slate-100', val: 'indefinido' };
}
