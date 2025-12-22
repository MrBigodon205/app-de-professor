
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://znvcxbcuctyeaylttbfr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN4YmN1Y3R5ZWF5bHR0YmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzk2ODcsImV4cCI6MjA4MTg1NTY4N30.OtLz1dNQlFRDsS_RuCtCSkhAP6GEkJ0Qy65RZqkOH5k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    console.log(`Checking ALL classes (limit 50)...`);

    const { data, error } = await supabase
        .from('classes')
        .select('id, name, subject, user_id')
        .limit(50);

    if (error) {
        console.error('Error fetching classes:', error);
        return;
    }

    console.log(`Found ${data?.length || 0} classes total:`);
    console.table(data);
}

verify();
