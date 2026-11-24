// Auth Guard: Redirect to login if user is not authenticated or not an admin
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://csrumkbqvshuusxlweox.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iKHDTW34ryUmqqhEMY2q6A_ezubm1x3';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function checkAdminAuth() {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        window.location.href = '/admin/login.html';
        return null;
    }

    // Verify admin role via profile
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (error || !profile?.is_admin) {
        window.location.href = '/admin/login.html';
        return null;
    }

    return session;
}

export async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/admin/login.html';
}
