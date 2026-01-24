import Dexie, { Table } from 'dexie';

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
        });
    }
}

export const db = new ProfAcertaDB();
