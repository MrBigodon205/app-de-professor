import Dexie, { Table } from 'dexie';
import { Student, AttendanceRecord, Occurrence, Grades } from '../types';

// Extend types for local storage (optional fields for sync status)
export interface LocalStudent extends Student {
    syncStatus?: 'synced' | 'pending';
}

export interface LocalAttendance extends AttendanceRecord {
    syncStatus?: 'synced' | 'pending' | 'deleted';
    student_id?: string; // Dexie might prefer flattened keys or we map it
}

export interface LocalGrades {
    student_id: string; // Changed from number in types to string for consistency
    unit: string;
    subject: string;
    user_id: string;
    series_id: string;
    section: string;
    data: Grades;
    syncStatus?: 'synced' | 'pending';
}

export interface LocalOccurrence extends Occurrence {
    syncStatus?: 'synced' | 'pending' | 'deleted';
    student_id?: string;
}

export interface SyncQueueItem {
    id?: number; // Auto-increment
    table: 'attendance' | 'grades' | 'occurrences' | 'students';
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    payload: any;
    status: 'pending' | 'processing' | 'failed';
    createdAt: number;
    retryCount: number;
}

class ProfAcertaDB extends Dexie {
    students!: Table<LocalStudent>;
    attendance!: Table<LocalAttendance>;
    grades!: Table<LocalGrades>;
    occurrences!: Table<LocalOccurrence>;
    syncQueue!: Table<SyncQueueItem>;

    constructor() {
        super('ProfAcertaDB');
        this.version(1).stores({
            students: 'id, series_id, section, user_id',
            attendance: '[studentId+date+subject+unit], date, syncStatus, user_id', // Compound Index for uniqueness
            grades: '[student_id+unit+subject], syncStatus, user_id',
            occurrences: 'id, studentId, syncStatus, user_id',
            syncQueue: '++id, table, status, createdAt'
        });
    }
}

export const db = new ProfAcertaDB();
