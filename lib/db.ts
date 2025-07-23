import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface EnrolledUser {
  id: string;
  name: string;
  email: string;
  enrolled_at: string;
  location?: string;
  newsletter?: boolean;
  niveau_etudes?: string;
  telephone?: string;
  ecole?: string;
}

export async function getAllUsers(): Promise<EnrolledUser[]> {
  console.log('📋 Fetching all enrolled users from Supabase');
  
  const { data, error } = await supabase
    .from('MASTERCLASS-ENROLLED')
    .select('*')
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching users:', error);
    return [];
  }

  console.log(`✅ Found ${data?.length || 0} users`);
  return data || [];
}

export async function getUserByEmail(email: string): Promise<EnrolledUser | null> {
  console.log('🔍 Checking if user exists:', email);
  
  const { data, error } = await supabase
    .from('MASTERCLASS-ENROLLED')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error checking user:', error);
    return null;
  }

  console.log('👤 User found:', !!data);
  return data;
}

export async function addUser(user: Omit<EnrolledUser, 'enrolled_at'>): Promise<boolean> {
  console.log('➕ Adding new user to Supabase:', { name: user.name, email: user.email });
  
  const { data, error } = await supabase
    .from('MASTERCLASS-ENROLLED')
    .insert({
      id: user.id,
      name: user.name,
      email: user.email,
      location: user.location,
      newsletter: user.newsletter,
      niveau_etudes: user.niveau_etudes,
      telephone: user.telephone,
      ecole: user.ecole
    })
    .select();

  if (error) {
    console.error('❌ Failed to add user:', error);
    return false;
  }

  console.log('✅ User added successfully:', data);
  return true;
}

export async function getUserCount(): Promise<number> {
  const { count, error } = await supabase
    .from('MASTERCLASS-ENROLLED')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('❌ Error getting user count:', error);
    return 0;
  }

  return count || 0;
}