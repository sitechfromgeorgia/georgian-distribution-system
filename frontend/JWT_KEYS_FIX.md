# JWT Keys Generator for Supabase

## ⚠️ ᲞᲠᲝᲑᲚᲔᲛᲐ ᲐᲦᲛᲝᲩᲔᲜᲘᲚᲘᲐ!

თქვენს VPS `.env` ფაილში:
```
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**ორივე KEY იდენტურია!** ეს არის უსაფრთხოების სერიოზული პრობლემა.

## 🔐 როგორ გავასწოროთ:

### ნაბიჯი 1: Generate ახალი JWT Tokens

გადადით: https://supabase.com/docs/guides/self-hosting/docker#api-keys

ან გამოიყენეთ ეს სკრიპტი:

```bash
# შენახეთ თქვენი JWT_SECRET
JWT_SECRET="1a7tzs6y7ffxfipaj9muf6bhnafxqwf1"

# Generate ANON_KEY (role: anon)
docker run --rm supabase/gotrue:latest generate jwt --secret "$JWT_SECRET" --role anon --expiry 2147483647

# Generate SERVICE_ROLE_KEY (role: service_role)
docker run --rm supabase/gotrue:latest generate jwt --secret "$JWT_SECRET" --role service_role --expiry 2147483647
```

### ნაბიჯი 2: განაახლეთ VPS .env

VPS-ზე `.env` ფაილში შეცვალეთ:
```bash
ANON_KEY=<ახალი_anon_key>
SERVICE_ROLE_KEY=<ახალი_service_role_key>
```

### ნაბიჯი 3: Restart Supabase Containers

```bash
docker-compose down
docker-compose up -d
```

### ნაბიჯი 4: განაახლეთ Frontend .env.local

ამ ფოლდერში: `frontend/.env.local`
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ახალი_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<ახალი_service_role_key>
```

## 📝 JWT Token-ების განსხვავება:

### ANON_KEY (Public)
- **გამოყენება**: Client-side (Browser)
- **Permissions**: შეზღუდული (მხოლოდ Row Level Security rules)
- **Exposed**: დიახ, ეს key ვებ აპლიკაციაში ჩანს

### SERVICE_ROLE_KEY (Secret)
- **გამოყენება**: Server-side (API Routes, Admin operations)
- **Permissions**: სრული (bypasses RLS)
- **Exposed**: არა, მხოლოდ server-ზე

## 🔍 როგორ შევამოწმოთ:

JWT tokens შეგიძლიათ decode გაუკეთოთ: https://jwt.io

თითოეულ token-ში უნდა ჩანდეს:
- **ANON_KEY**: `"role": "anon"`
- **SERVICE_ROLE_KEY**: `"role": "service_role"`

## ⚡ დროებითი გადაწყვეტა (მხოლოდ Development-ისთვის):

თუ ახლავე არ შეგიძლიათ VPS-ის განახლება, შეგიძლიათ გამოიყენოთ არსებული keys, მაგრამ **არა production-ში**!

Frontend-ში:
```env
# TEMPORARY - არ გამოიყენოთ production-ში!
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1Mzg1MTcsImV4cCI6MTg5MzQ1NjAwMCwiaXNzIjoiZG9rcGxveSJ9.H6yK0iElM0fRBKcQs_KIIDy4Zjj_fKOpx7QEibXVBsc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjE1Mzg1MTcsImV4cCI6MTg5MzQ1NjAwMCwiaXNzIjoiZG9rcGxveSJ9.H6yK0iElM0fRBKcQs_KIIDy4Zjj_fKOpx7QEibXVBsc
```

⚠️ **გაფრთხილება**: ორივე key იდენტური იქნება, რაც ნიშნავს რომ client-side code-ს ექნება service_role permissions, რაც უსაფრთხოების რისკია!