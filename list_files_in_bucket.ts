import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listFiles() {
    console.log('Listing files in planning-templates...');

    // List root folder first
    const { data: rootFiles, error: rootError } = await supabase.storage
        .from('planning-templates')
        .list();

    if (rootError) {
        console.error('Error listing root:', rootError);
        return;
    }

    console.log('Root folders/files:', rootFiles);

    // List recursively if possible or just check specific school folder
    // School ID from screenshot: 7374f452-a56a-4f3f-ab41-ca32725b225d
    const schoolId = '7374f452-a56a-4f3f-ab41-ca32725b225d';
    console.log(`Checking folder for school: ${schoolId}`);

    const { data: schoolFiles, error: schoolError } = await supabase.storage
        .from('planning-templates')
        .list(schoolId);

    if (schoolError) {
        console.error('Error listing school folder:', schoolError);
    } else {
        console.log(`Files in ${schoolId}:`, schoolFiles);
    }
}

listFiles();
