import Dexie, { Table } from 'dexie';
<<<<<<< HEAD

export interface StudentDB {
    id: string; // UUID from Supabase
    name: string;
    number: string;
    seriesId: string; // mapped from series_id
    section: string;
    userId: string;
    syncStatus: 'synced' | 'pending_update' | 'pending_create' | 'pending_delete';
    updatedAt: string;
}

export interface ClassDB {
    id: string;
    name: string;
    sections: string[]; // Stored as array, Dexie handles this
    userId: string;
    syncStatus: 'synced' | 'pending';
}

export class ProfAcertaDB extends Dexie {
    students!: Table<StudentDB>;
    classes!: Table<ClassDB>;

    constructor() {
        super('ProfAcertaDatabase');

        // Define Schema
        this.version(1).stores({
            students: 'id, name, seriesId, section, userId, syncStatus', // primary key + indexes
            classes: 'id, name, userId'
=======
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
    table: 'attendance' | 'grades' | 'occurrences' | 'students' | 'activities';
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
    plans!: Table<any>; // Using any for simplicity or define LocalPlan
    activities!: Table<any>; // Using any for simplicity or define LocalActivity
    syncQueue!: Table<SyncQueueItem>;
    schedules!: Table<any>; // LocalSchedule

    constructor() {
        super('ProfAcertaDB');
        this.version(1).stores({
            students: 'id, series_id, section, user_id',
            attendance: '[studentId+date+subject+unit], date, syncStatus, user_id',
            grades: '[student_id+unit+subject], syncStatus, user_id',
            occurrences: 'id, studentId, syncStatus, user_id',
            syncQueue: '++id, table, status, createdAt'
        });

        // Version 2: Add classes caching
        this.version(2).stores({
            classes: 'id, user_id'
        });

        // Version 3: Add plans and activities for Dashboard caching
        this.version(3).stores({
            plans: 'id, user_id, series_id, start_date, end_date',
            activities: 'id, user_id, series_id, date, start_date, end_date'
        });

        // Version 4: Timetable (Schedules)
        this.version(4).stores({
            schedules: 'id, user_id, day_of_week'
>>>>>>> 5caaa26adfac974c18011977d16101f607965507
        });
    }
}

export const db = new ProfAcertaDB();
