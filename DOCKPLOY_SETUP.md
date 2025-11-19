# 🚀 Dockploy Configuration

## ახალი Supabase Credentials განახლება
**თარიღი:** 2025-11-19

---

## 📋 Dockploy Environment Variables

### ნაბიჯები Dockploy-ში შესვლა:
1. გადადი: https://dockploy.greenland77.ge
2. შედი შენი project-ის dashboard-ში
3. Settings → Environment Variables

---

## 🔧 Environment Variables დამატება

შემდეგი environment variables უნდა დაამატო/განაახლო:

```bash
# Supabase URLs
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
SUPABASE_URL=https://data.greenland77.ge

# Supabase Keys
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.DpZQyX183OgnIZzMVof65-tHkpoLVCXH80uI4qW5KsA

SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.rOrZDuWapczQ1csuTdm3uFEL2y_LEolqGR3ppWmuzA0

SUPABASE_JWT_SECRET=5cx2hkyzmxkk9rhw0gjtwstm6idvqal0

# Application
NEXT_PUBLIC_APP_URL=https://greenland77.ge
NEXT_PUBLIC_ENVIRONMENT=production

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
```

---

## 📝 Copy-Paste Ready Format

თუ Dockploy იღებს multi-line env input-ს, დააკოპირე ეს მთლიანად:

```
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6ImFub24iLCJpc3MiOiJzdXBhYmFzZSJ9.DpZQyX183OgnIZzMVof65-tHkpoLVCXH80uI4qW5KsA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3NjM1NzEwOTYsImV4cCI6MTg5MzQ1NjAwMCwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlzcyI6InN1cGFiYXNlIn0.rOrZDuWapczQ1csuTdm3uFEL2y_LEolqGR3ppWmuzA0
SUPABASE_JWT_SECRET=5cx2hkyzmxkk9rhw0gjtwstm6idvqal0
NEXT_PUBLIC_APP_URL=https://greenland77.ge
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_DEMO_MODE=true
NEXT_PUBLIC_ENABLE_PWA=true
```

---

## 🔄 Redeploy Steps

Environment variables განახლების შემდეგ:

1. **Save Changes** - დაარწმუნდი რომ შეინახე ყველა ცვლილება
2. **Redeploy** - დააჭირე "Deploy" ან "Redeploy" ღილაკს
3. **Monitor Logs** - ნახე build logs რომ ყველაფერი კარგად მიდის
4. **Verify** - მოინახულე https://greenland77.ge და გადაამოწმე

---

## ✅ Verification Checklist

Deployment-ის შემდეგ გადაამოწმე:

- [ ] Application იხსნება https://greenland77.ge
- [ ] Login მუშაობს
- [ ] Supabase connection აქტიურია
- [ ] Real-time features მუშაობს
- [ ] Admin dashboard ხელმისაწვდომია
- [ ] PWA install prompt ჩნდება mobile-ზე

---

## 🐛 Troubleshooting

### თუ build ვერ მუშაობს:

1. **Check Build Logs:**
   - Dockploy Dashboard → Logs
   - ეძებე errors/warnings

2. **Verify Environment Variables:**
   - Settings → Environment Variables
   - დარწმუნდი რომ ყველა დამატებულია

3. **Common Issues:**
   - ❌ Missing SUPABASE_SERVICE_ROLE_KEY → Check it's set
   - ❌ Invalid URL format → Must be `https://data.greenland77.ge`
   - ❌ CORS errors → Check Supabase CORS settings

### თუ runtime errors ხდება:

1. **Browser Console:**
   - F12 → Console tab
   - ეძებე Supabase connection errors

2. **Network Tab:**
   - F12 → Network tab
   - ნახე Supabase API calls
   - Check status codes (200 = OK, 401 = Auth issue)

3. **Supabase Dashboard:**
   - https://data.greenland77.ge/studio
   - Auth → Users (check if users exist)
   - Table Editor → Check RLS policies

---

## 📊 Health Check Endpoints

Deployment-ის შემდეგ გადაამოწმე:

```bash
# Application health
curl https://greenland77.ge/api/health

# Supabase connection
curl https://data.greenland77.ge/rest/v1/

# Expected: 200 OK status
```

---

**შექმნილია:** Claude Code  
**თარიღი:** 2025-11-19  
**ვერსია:** 1.0
