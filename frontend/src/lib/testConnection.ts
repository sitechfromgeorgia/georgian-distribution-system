import { supabase } from './supabase'

export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    // Test 1: Check if we can reach the API
    const { data, error } = await supabase.from('profiles').select('count')
    
    if (error) {
      console.error('❌ Connection error:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Successfully connected to Supabase!')
    console.log('📊 Connection test passed')
    
    return { success: true, data }
  } catch (err) {
    console.error('❌ Unexpected error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

export async function testAuth() {
  try {
    console.log('🔐 Testing Auth system...')
    
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Auth error:', error.message)
      return { success: false, error: error.message }
    }
    
    console.log('✅ Auth system working!')
    console.log('Session:', session ? 'Active' : 'No active session')
    
    return { success: true, session }
  } catch (err) {
    console.error('❌ Auth test failed:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}