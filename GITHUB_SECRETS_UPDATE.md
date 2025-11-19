# 🔐 GitHub Secrets განახლება

## თარიღი: 2025-11-19
## მიზეზი: ახალი Supabase deployment-ის შემდეგ credentials-ების განახლება

---

## 📋 საჭირო GitHub Secrets

შენ უნდა დააყენო ეს secrets GitHub-ზე:

**Repository:** `sitechfromgeorgia/georgian-distribution-system`
**Path:** Settings → Secrets and variables → Actions → Repository secrets

---

### 1️⃣ SUPABASE_URL
```
https://data.greenland77.ge
```

### 2️⃣ SUPABASE_ANON_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.DpZQyX183OgnIZzMVof65-tHkpoLVCXH80uI4qW5KsA
```

### 3️⃣ SUPABASE_SERVICE_ROLE_KEY
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.rOrZDuWapczQ1csuTdm3uFEL2y_LEolqGR3ppWmuzA0
```

### 4️⃣ SUPABASE_JWT_SECRET
```
5cx2hkyzmxkk9rhw0gjtwstm6idvqal0
```

---

## 🚀 როგორ დავაყენო GitHub Secrets

### ნაბიჯი 1: GitHub Repository-ში შესვლა
1. გადადი: https://github.com/sitechfromgeorgia/georgian-distribution-system
2. დააჭირე **Settings** ღილაკს (ზედა მარჯვენა კუთხე)

### ნაბიჯი 2: Secrets Section-ში შესვლა
1. მარცხენა sidebar-ში დააჭირე **Secrets and variables**
2. შემდეგ დააჭირე **Actions**

### ნაბიჯი 3: თითოეული Secret-ის დამატება
თითოეული secret-ისთვის:

1. დააჭირე **New repository secret** ღილაკს
2. **Name:** შეიყვანე secret-ის სახელი (ზუსტად როგორც ზემოთ არის)
3. **Secret:** დააკოპირე შესაბამისი მნიშვნელობა ზემოდან
4. დააჭირე **Add secret**

კონკრეტულად:

#### Secret 1:
- Name: `SUPABASE_URL`
- Value: `https://data.greenland77.ge`

#### Secret 2:
- Name: `SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.DpZQyX183OgnIZzMVof65-tHkpoLVCXH80uI4qW5KsA`

#### Secret 3:
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.rOrZDuWapczQ1csuTdm3uFEL2y_LEolqGR3ppWmuzA0`

#### Secret 4:
- Name: `SUPABASE_JWT_SECRET`
- Value: `5cx2hkyzmxkk9rhw0gjtwstm6idvqal0`

---

## ✅ ვერიფიკაცია

Secrets დამატების შემდეგ, შეამოწმე:

1. **Settings → Secrets and variables → Actions → Repository secrets**
2. უნდა ჩანდეს 4 secret:
   - ✅ SUPABASE_URL
   - ✅ SUPABASE_ANON_KEY
   - ✅ SUPABASE_SERVICE_ROLE_KEY
   - ✅ SUPABASE_JWT_SECRET

**შენიშვნა:** GitHub არ გაჩვენებს secret-ის მნიშვნელობას უსაფრთხოების მიზნით, მხოლოდ სახელს დაინახავ.

---

## 🔄 Dockploy Environment Variables

თუ იყენებ Dockploy-ს deployment-ისთვის, დაამატე იგივე environment variables:

**Dockploy Dashboard:** https://dockploy.greenland77.ge

### ნაბიჯები:
1. გადადი შენს project-ში
2. Settings → Environment Variables
3. დაამატე:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.DpZQyX183OgnIZzMVof65-tHkpoLVCXH80uI4qW5KsA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.rOrZDuWapczQ1csuTdm3uFEL2y_LEolqGR3ppWmuzA0
SUPABASE_JWT_SECRET=5cx2hkyzmxkk9rhw0gjtwstm6idvqal0
NEXT_PUBLIC_APP_URL=https://greenland77.ge
NEXT_PUBLIC_ENVIRONMENT=production
```

---

## 📝 დამატებითი ინფორმაცია

### Supabase Dashboard Access
- **URL:** https://data.greenland77.ge/studio
- **Username:** supabase
- **Password:** axekpz4pb7vudrxwkipmkinrw1luqv1f

### Database Direct Connection (თუ საჭიროა)
```
Host: data.greenland77.ge
Port: 5432
Database: postgres
Username: postgres
Password: 3mppdicb2bihqjmjs3ks20xfdxydppxm
```

---

## 🎯 შემდეგი ნაბიჯები

1. ✅ GitHub Secrets დამატება (ზემოთ აღწერილი)
2. ✅ Dockploy Environment Variables დამატება
3. ✅ Local development-ისთვის გადაარქმე `.env.local.new` → `.env.local`
4. ✅ Production-ისთვის გადაარქმე `.env.production.new` → `.env.production`
5. 🚀 Deploy და ტესტირება!

---

**შექმნილია:** Claude Code
**თარიღი:** 2025-11-19
**ვერსია:** 1.0
