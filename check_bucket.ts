import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv'; // npx tsx -r dotenv/config check_bucket.ts

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BUCKETS = [
    'planning-templates'
];

async function fixBucketMimeTypes() {
    console.log('Relaxing MIME types for planning-templates...');

    for (const bucketName of BUCKETS) {
        const { data: bucket, error } = await supabase.storage.getBucket(bucketName);

        if (error) {
            console.error(`Bucket '${bucketName}' not found.`);
            return;
        }

        console.log(`Bucket '${bucketName}' found. Current public: ${bucket.public}`);

        // Update to allow ANY mime type (null)
        const { data: updated, error: updateError } = await supabase.storage.updateBucket(bucketName, {
            public: true,
            allowedMimeTypes: null
        });

        if (updateError) {
            console.error(`Failed to update '${bucketName}':`, updateError.message);
        } else {
            console.log(`Bucket '${bucketName}' updated! Allowed MIME types: ALL.`);
        }
    }
}

fixBucketMimeTypes();
