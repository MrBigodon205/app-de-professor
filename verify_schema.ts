
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://znvcxbcuctyeaylttbfr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpudmN4YmN1Y3R5ZWF5bHR0YmZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyNzk2ODcsImV4cCI6MjA4MTg1NTY4N30.OtLz1dNQlFRDsS_RuCtCSkhAP6GEkJ0Qy65RZqkOH5k';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
    console.log("Checking PLANS table schema...");

    // Try to select 'subject' from plans.
    // If column doesn't exist, it should error.
    const { data, error } = await supabase
        .from('plans')
        .select('id, subject')
        .limit(1);

    if (error) {
        console.error('Error fetching plans subject:', error.message);
        // Code PGRST100? or "Could not find column"
    } else {
        console.log("Plans table HAS 'subject' column.");
    }

    console.log("Checking ACTIVITIES table schema...");
    const { data: actData, error: actError } = await supabase
        .from('activities')
        .select('id, subject')
        .limit(1);

    if (actError) {
        console.error('Error fetching activities subject:', actError.message);
    } else {
        console.log("Activities table HAS 'subject' column.");
    }
}

verify();
