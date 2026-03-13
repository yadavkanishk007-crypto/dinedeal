import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.log('Missing env variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  // We can't use admin api with anon key.
  
  // Let's just fetch all rewards and transactions to see what's in the DB.
  const { data: rewards } = await supabase.from('rewards').select('*').limit(5);
  console.log('Rewards:', rewards);
  
  const { data: txs } = await supabase.from('transactions').select('id, user_id, final_amount, rewards_earned').limit(5);
  console.log('Transactions:', txs);
}

main().catch(console.error);
