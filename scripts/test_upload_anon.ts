import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://znvcxbcuctyeaylttbfr.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
    console.error('VITE_SUPABASE_ANON_KEY not found!');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
    console.log('Testing upload with ANON KEY (should satisfy policies)...');

    // Attempt to upload a small file
    const { data, error } = await supabase.storage
        .from('planning-templates')
        .upload('test_permissions.txt', 'This is a test file to verify RLS policies.', {
            upsert: true
        });

    if (error) {
        console.log(`[EXPECTED FAIL] Upload failed as expected (Missing Policies): ${error.message}`);
    } else {
        console.log(`[UNEXPECTED SUCCESS] Upload worked! Policies might be open? Path: ${data.path}`);
    }
}

testUpload();
