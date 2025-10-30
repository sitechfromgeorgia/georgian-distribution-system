"""
Generate Supabase JWT Tokens
This script generates proper ANON_KEY and SERVICE_ROLE_KEY for Supabase
"""

import jwt
import datetime

# Your JWT_SECRET from VPS .env
JWT_SECRET = "1a7tzs6y7ffxfipaj9muf6bhnafxqwf1"

# Token expiry (year 2030)
EXPIRY = int(datetime.datetime(2030, 1, 1).timestamp())

# Current timestamp
IAT = int(datetime.datetime.now().timestamp())

# Generate ANON_KEY (public, limited permissions)
anon_payload = {
    "role": "anon",
    "iss": "supabase",
    "iat": IAT,
    "exp": EXPIRY
}

anon_key = jwt.encode(anon_payload, JWT_SECRET, algorithm="HS256")

# Generate SERVICE_ROLE_KEY (private, full permissions)
service_payload = {
    "role": "service_role",
    "iss": "supabase",
    "iat": IAT,
    "exp": EXPIRY
}

service_role_key = jwt.encode(service_payload, JWT_SECRET, algorithm="HS256")

print("=" * 80)
print("SUPABASE JWT TOKENS")
print("=" * 80)
print("\n✅ ANON_KEY (Public - for client-side use):")
print("-" * 80)
print(anon_key)
print("\n✅ SERVICE_ROLE_KEY (Secret - for server-side use only):")
print("-" * 80)
print(service_role_key)
print("\n" + "=" * 80)
print("\n📝 Instructions:")
print("-" * 80)
print("1. Update VPS .env file:")
print(f"   ANON_KEY={anon_key}")
print(f"   SERVICE_ROLE_KEY={service_role_key}")
print("\n2. Update frontend/.env.local:")
print(f"   NEXT_PUBLIC_SUPABASE_ANON_KEY={anon_key}")
print(f"   SUPABASE_SERVICE_ROLE_KEY={service_role_key}")
print("\n3. Restart Supabase containers on VPS:")
print("   docker-compose down && docker-compose up -d")
print("\n" + "=" * 80)

# Save to file
with open("supabase_jwt_keys.txt", "w") as f:
    f.write("SUPABASE JWT TOKENS\n")
    f.write("=" * 80 + "\n\n")
    f.write("ANON_KEY (Public):\n")
    f.write(anon_key + "\n\n")
    f.write("SERVICE_ROLE_KEY (Secret):\n")
    f.write(service_role_key + "\n\n")
    f.write("=" * 80 + "\n")

print(f"\n💾 Keys saved to: supabase_jwt_keys.txt")
print("=" * 80)
