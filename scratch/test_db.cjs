const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse env
const envPath = path.resolve(__dirname, '../.env.local');
const envText = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envText.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
    }
  }
});

const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const tables = ['documents', 'study_kits', 'materials'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    console.log(`Table '${table}' check:`, error ? error.message : 'Exists!');
  }
}

check();
