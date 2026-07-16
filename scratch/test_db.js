const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data, error } = await supabase
    .from('materials')
    .select('id, title, ai_title')
    .limit(1);
  
  if (error) {
    console.error('Error selecting ai_title:', error.message);
  } else {
    console.log('Success! columns exist. Data:', data);
  }
}

check();
