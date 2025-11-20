import { createClient } from '@supabase/supabase-js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('Testing Supabase Connection...')
console.log('URL:', SUPABASE_URL)
console.log('Key exists:', !!SUPABASE_KEY)

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing credentials')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function test() {
    try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        if (error) {
            console.error('Connection failed with error:', error.message)
        } else {
            console.log('Connection successful! Data:', data)
        }
    } catch (e) {
        console.error('Connection failed with exception:', e.message)
        if (e.cause) console.error('Cause:', e.cause)
    }
}

test()
