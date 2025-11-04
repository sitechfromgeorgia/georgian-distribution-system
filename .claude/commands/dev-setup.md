# /dev-setup - Development Environment Setup

> Quick command to setup development environment

---

## 🚀 What This Command Does

Sets up your local development environment for the Georgian Distribution Management System.

---

## ✅ Prerequisites Check

Before running, ensure you have:
- [ ] Node.js 20+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Code editor (VS Code recommended)
- [ ] Internet connection for package installation

---

## 📋 Setup Steps

### 1. Clone Repository (if not already)

```bash
# If starting fresh
git clone <repository-url> georgian-distribution
cd georgian-distribution
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
```

### 3. Verify Installation

```bash
# Check TypeScript
npm run type-check

# Run linter
npm run lint

# Run tests
npm test

# Start development server
npm run dev
```

### 4. Open in Browser

```
http://localhost:3000
```

---

## 🧪 Test Accounts

### Development Environment Test Accounts

**Admin:**
- Email: `admin@test.com`
- Password: `password123`

**Restaurant:**
- Email: `restaurant@test.com`
- Password: `password123`

**Driver:**
- Email: `driver@test.com`
- Password: `password123`

**Demo:**
- Email: `demo@test.com`
- Password: `password123`

---

## 🔧 Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "vitest.explorer"
  ]
}
```

---

## ✅ Verification Checklist

After setup, verify:
- [ ] Development server starts without errors
- [ ] You can login with test accounts
- [ ] Database connection works
- [ ] Real-time updates working
- [ ] Tests pass (`npm test`)
- [ ] TypeScript compiles (`npm run type-check`)
- [ ] Linter passes (`npm run lint`)

---

## 🐛 Common Issues

### Port 3000 already in use
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Supabase connection errors
- Verify `.env.local` has correct Supabase URL and key
- Check internet connection
- Verify Supabase project is active

---

## 📚 Next Steps

After setup:
1. Read `.claude/instructions.md` for project overview
2. Review `.claude/architecture.md` for system design
3. Check `.claude/workflows/feature-development.md` for development process
4. Start working on your first task!

---

**Setup Time:** ~10 minutes
**Last Updated:** 2025-11-03
