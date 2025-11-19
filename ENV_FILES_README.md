# 🔐 Environment Files გზამკვლევი

## 📁 შექმნილი ფაილები

### ✅ Local Development
- **File:** `frontend/.env.local.new`
- **Purpose:** Local development-ისთვის
- **Action:** გადაარქმე → `frontend/.env.local`

### ✅ Production
- **File:** `.env.production.new`
- **Purpose:** Production deployment-ისთვის
- **Action:** გადაარქმე → `.env.production`

### 📚 Documentation
- **GITHUB_SECRETS_UPDATE.md** - GitHub Secrets setup გზამკვლევი
- **DOCKPLOY_SETUP.md** - Dockploy configuration გზამკვლევი
- **ENV_FILES_README.md** - ეს ფაილი

---

## 🚀 Quick Setup

### 1️⃣ Local Development Setup
```bash
# Frontend-ში
cd frontend
cp .env.local.new .env.local

# შემდეგ:
npm install
npm run dev
```

### 2️⃣ Production Setup
```bash
# Root-ში
cp .env.production.new .env.production

# რეკომენდაცია: არ დაამატო git-ში!
# უკვე არის .gitignore-ში
```

### 3️⃣ GitHub Secrets
წაიკითხე **GITHUB_SECRETS_UPDATE.md** სრული ინსტრუქციებისთვის

### 4️⃣ Dockploy Configuration
წაიკითხე **DOCKPLOY_SETUP.md** deployment-ის setup-ისთვის

---

## 📋 Environment Variables განმარტება

### 🔒 NEXT_PUBLIC_SUPABASE_URL
```
https://data.greenland77.ge
```
- **Type:** Public
- **Usage:** Client & Server
- **Description:** შენი self-hosted Supabase instance-ის URL

### 🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Type:** Public (Safe for client)
- **Usage:** Client-side authentication
- **Description:** Row Level Security (RLS)-ით დაცული queries

### 🛡️ SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Type:** SECRET - Server Only!
- **Usage:** Admin operations
- **Description:** RLS-ის bypassing, privileged operations

### 🔐 SUPABASE_JWT_SECRET
```
5cx2hkyzmxkk9rhw0gjtwstm6idvqal0
```
- **Type:** SECRET
- **Usage:** JWT token verification
- **Description:** Token signature verification

---

## ⚠️ Security Notes

### ✅ DO:
- ✅ გამოიყენე `NEXT_PUBLIC_*` მხოლოდ public data-სთვის
- ✅ შეინახე `SERVICE_ROLE_KEY` მხოლოდ server-side
- ✅ დაამატე `.env.local` და `.env.production` `.gitignore`-ში
- ✅ გამოიყენე GitHub Secrets production deployment-ისთვის
- ✅ რეგულარულად შეცვალე secrets

### ❌ DON'T:
- ❌ არ commit-ი `.env` ფაილები git-ში
- ❌ არ გამოიყენო `SERVICE_ROLE_KEY` client-side code-ში
- ❌ არ გააზიარო secrets publicly
- ❌ არ hard-code-ო credentials code-ში

---

## 🔍 როგორ ვნახო რომ მუშაობს?

### Development (localhost:3000):
```bash
cd frontend
npm run dev

# Browser-ში გახსენი:
http://localhost:3000

# Console-ში არ უნდა იყოს Supabase connection errors
```

### Production (greenland77.ge):
```bash
# Check application
curl https://greenland77.ge

# Check Supabase
curl https://data.greenland77.ge/rest/v1/

# Both should return 200 OK
```

---

## 📊 File Structure

```
project-root/
├── .env.production.new          ← Production env template (NEW)
├── frontend/
│   └── .env.local.new            ← Development env template (NEW)
│
├── GITHUB_SECRETS_UPDATE.md      ← GitHub setup guide
├── DOCKPLOY_SETUP.md             ← Dockploy setup guide
└── ENV_FILES_README.md           ← This file

Action Required:
├── Rename .env.local.new → .env.local
├── Rename .env.production.new → .env.production
├── Setup GitHub Secrets (see GITHUB_SECRETS_UPDATE.md)
└── Setup Dockploy Env Vars (see DOCKPLOY_SETUP.md)
```

---

## 🎯 Next Steps

### ახლა დაუყონებლივ:
1. ✅ გადაარქმე `.env` ფაილები (remove `.new` extension)
2. ✅ Setup GitHub Secrets ([გზამკვლევი](GITHUB_SECRETS_UPDATE.md))
3. ✅ Configure Dockploy ([გზამკვლევი](DOCKPLOY_SETUP.md))

### შემდეგ:
4. 🧪 ტესტირება local-ზე: `npm run dev`
5. 🏗️ Production build: `npm run build`
6. 🚀 Deploy via Dockploy
7. ✅ ვერიფიკაცია production-ზე

---

## 🆘 დახმარება

### კითხვები?

1. **Local development არ მუშაობს?**
   - შეამოწმე `frontend/.env.local` არსებობს
   - გადაამოწმე URL და keys სწორია
   - ნახე browser console errors

2. **Production build issues?**
   - ვერიფიკაცია: `npm run type-check`
   - Build ლოკალურად: `npm run build`
   - შეამოწმე environment variables

3. **Supabase connection errors?**
   - ტესტი: `curl https://data.greenland77.ge/rest/v1/`
   - შეამოწმე RLS policies: https://data.greenland77.ge/studio
   - ვერიფიკაცია keys: GITHUB_SECRETS_UPDATE.md

---

**შექმნილია:** Claude Code  
**თარიღი:** 2025-11-19  
**განახლდა:** Supabase credentials გადაგენერების შემდეგ  
**ვერსია:** 1.0
