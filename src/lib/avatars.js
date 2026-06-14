import { supabase } from './supabase.js'

// Upload a custom portrait to the public `avatars` Supabase Storage bucket and
// return its public URL. Returns { url } or { error }.
export async function uploadAvatar(file) {
  if (!file) return { error: new Error('No file selected.') }
  const ext = (file.name?.split('.').pop() || 'png').toLowerCase()
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { contentType: file.type || 'image/png', upsert: false })
  if (error) {
    console.error('[uploadAvatar]', error.message)
    return { error }
  }
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return { url: data.publicUrl }
}
