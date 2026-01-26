import { db } from '../lib/db';

export const BackupService = {
    // EXPORT ALL DATA TO JSON
    exportData: async () => {
        try {
            const data = {
                timestamp: new Date().toISOString(),
                tables: {
                    students: await db.students.toArray(),
                    attendance: await db.attendance.toArray(),
                    grades: await db.grades.toArray(),
                    occurrences: await db.occurrences.toArray(),
                    // Add other tables as needed
                }
            };
            return JSON.stringify(data);
        } catch (error) {
            console.error("Backup Export Failed:", error);
            throw error;
        }
    },

    // IMPORT DATA FROM JSON
    importData: async (jsonString: string) => {
        try {
            const data = JSON.parse(jsonString);
            if (!data.tables) throw new Error("Invalid backup format");

            await db.transaction('rw', db.students, db.attendance, db.grades, db.occurrences, async () => {
                // Clear current data?? Or Merge? 
                // Strategy: "Restoration" usually implies overwrite or smart merge.
                // For safety/simplicity in V1: Smart Merge (Put)

                if (data.tables.students) await db.students.bulkPut(data.tables.students);
                if (data.tables.attendance) await db.attendance.bulkPut(data.tables.attendance);
                if (data.tables.grades) await db.grades.bulkPut(data.tables.grades);
                if (data.tables.occurrences) await db.occurrences.bulkPut(data.tables.occurrences);
            });

            console.log("Restoration Complete");
            return true;
        } catch (error) {
            console.error("Backup Import Failed:", error);
            return false;
        }
    },

    // AUTO-RUNNER
    performAutoBackup: async () => {
        if (!window.electronAPI) return; // Only on PC

        try {
            console.log("[Backup] Starting auto-backup...");
            const json = await BackupService.exportData();
            const result = await window.electronAPI.saveBackup(json);

            if (result.success) {
                console.log(`[Backup] Success! Saved to: ${result.path}`);
                localStorage.setItem('last_local_backup', new Date().toISOString());
            } else {
                console.error("[Backup] Failed to write file:", result.error);
            }
        } catch (error) {
            console.error("[Backup] Process failed:", error);
        }
    },

    // RESTORE CHECK
    checkAndRestore: async () => {
        if (!window.electronAPI) return;

        try {
            // Check if DB is empty
            const studentCount = await db.students.count();
            if (studentCount === 0) {
                console.log("[Backup] DB is empty. Attempting restore from file...");
                const result = await window.electronAPI.loadBackup();
                if (result.success && result.data) {
                    await BackupService.importData(result.data);
                    console.log("[Backup] Data restored from file!");
                    window.location.reload(); // Refresh to show data
                }
            }
        } catch (e) {
            console.error("[Backup] Restore check failed", e);
        }
    }
};
