import { supabase } from '@/integrations/supabase/client';

const BUCKET = 'community-photos';

/**
 * Upload a file to the community-photos bucket and return its public URL.
 * Falls back to a data URL only if the upload fails (network offline etc).
 */
export async function uploadEventMedia(file: File, prefix = 'events'): Promise<string> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const uid = user?.id || 'anon';
    const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
    const path = `${prefix}/${uid}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch (e) {
    console.error('uploadEventMedia failed, falling back to data URL', e);
    return await new Promise<string>((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
}
