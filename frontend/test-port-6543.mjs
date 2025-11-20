import pg from 'pg'
const { Client } = pg

const config = {
    user: 'postgres',
    host: 'data.greenland77.ge',
    database: 'postgres',
    password: '3mppdicb2bihqjmjs3ks20xfdxydppxm',
    port: 6543, // Trying PgBouncer port
    ssl: false
}

async function run() {
    const client = new Client(config)
    try {
        console.log('Testing connection to port 6543...')
        await client.connect()
        console.log('✅ Connected to Postgres on port 6543!')
    } catch (err) {
        console.error('❌ Connection error on 6543:', err.message)
    } finally {
        await client.end()
    }
}

run()
