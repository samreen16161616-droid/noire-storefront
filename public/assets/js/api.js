import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// IMPORTANT: Replace these with your project's URL and anon key from the Supabase dashboard
const SUPABASE_URL = 'https://csrumkbqvshuusxlweox.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iKHDTW34ryUmqqhEMY2q6A_ezubm1x3';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Fetches published products from Supabase and maps them to the existing
 * application structure for backward compatibility with components.js
 */
export async function fetchPublishedProducts() {
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('is_published', true);

        if (error) throw error;

        // Map database fields to existing structure expected by components.js
        return data.map(p => ({
            id: p.id,
            name: p.name,
            collection: p.collection,
            price: Number(p.price),
            category: p.category,
            rating: Number(p.rating),
            topNotes: p.top_notes,
            heartNotes: p.heart_notes,
            baseNotes: p.base_notes,
            description: p.description,
            image: p.image_url,
            featured: p.featured,
            bestseller: p.bestseller,
            sizes: p.sizes
        }));
    } catch (err) {
        console.error('Error fetching products from Supabase:', err.message);
        return [];
    }
}

/**
 * Fetches all categories
 */
export async function fetchCategories() {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*');

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('Error fetching categories from Supabase:', err.message);
        return [];
    }
}
