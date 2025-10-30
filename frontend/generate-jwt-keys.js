// Generate Supabase JWT Tokens
// Run with: node generate-jwt-keys.js

const crypto = require('crypto');

const JWT_SECRET = '1a7tzs6y7ffxfipaj9muf6bhnafxqwf1';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();
  
  const encodedSignature = base64url(signature);
  
  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

const now = Math.floor(Date.now() / 1000);
const expiry = 1893456000; // Year 2030

// Generate ANON_KEY
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: now,
  exp: expiry
};

const anonKey = generateJWT(anonPayload, JWT_SECRET);

// Generate SERVICE_ROLE_KEY
const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: now,
  exp: expiry
};

const serviceRoleKey = generateJWT(servicePayload, JWT_SECRET);

console.log('='.repeat(80));
console.log('SUPABASE JWT TOKENS');
console.log('='.repeat(80));
console.log('\n✅ ANON_KEY (Public - for client-side use):');
console.log('-'.repeat(80));
console.log(anonKey);
console.log('\n✅ SERVICE_ROLE_KEY (Secret - for server-side use only):');
console.log('-'.repeat(80));
console.log(serviceRoleKey);
console.log('\n' + '='.repeat(80));
console.log('\n📝 Instructions:');
console.log('-'.repeat(80));
console.log('1. Update VPS .env file:');
console.log(`   ANON_KEY=${anonKey}`);
console.log(`   SERVICE_ROLE_KEY=${serviceRoleKey}`);
console.log('\n2. Update frontend/.env.local:');
console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}`);
console.log('\n3. Restart Supabase containers on VPS:');
console.log('   docker-compose down && docker-compose up -d');
console.log('\n' + '='.repeat(80));

// Save to file
const fs = require('fs');
const content = `SUPABASE JWT TOKENS
${'='.repeat(80)}

ANON_KEY (Public):
${anonKey}

SERVICE_ROLE_KEY (Secret):
${serviceRoleKey}

${'='.repeat(80)}

VPS .env update:
ANON_KEY=${anonKey}
SERVICE_ROLE_KEY=${serviceRoleKey}

Frontend .env.local update:
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}
`;

fs.writeFileSync('supabase_jwt_keys.txt', content);
console.log('\n💾 Keys saved to: supabase_jwt_keys.txt');
console.log('='.repeat(80));
