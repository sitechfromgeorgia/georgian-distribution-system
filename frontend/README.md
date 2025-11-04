# Georgian Distribution System - Frontend

## პროექტის აღწერა

Georgian Distribution System არის B2B პლატფორმა საქართველოში ფუდ დისტრიბუციისთვის. ეს არის frontend აპლიკაცია, რომელიც აწყობილია Next.js-ზე და უკავშირდება ლოკალურად Supabase backend-ს დეველოპმენტისთვის.

## ტექნოლოგიური სტეკი

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (Local Development + VPS Production)
- **Icons**: Lucide React

## მომხმარებლის როლები

1. **ადმინისტრატორი** - სისტემის სრული კონტროლი
2. **რესტორანი** - შეკვეთების განთავსება და თვალყურის დევნება
3. **მძღოლი** - მიტანების მართვა

## პროექტის სტრუქტურა

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── auth/           # Authentication components
│   └── layout/         # Layout components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── constants/          # Application constants
```

## შურსება და გაშვება

### ნაბიჯი 1: Backend-ის გაშვება (პირველად)

მნიშვნელოვანი: ჯერ უნდა გავუშვათ Supabase backend ლოკალურად!

```bash
# Navigate to supabase-local directory
cd ../supabase-local

# Windows users
start.bat

# Linux/Mac users
chmod +x start.sh
./start.sh
```

### ნაბიჯი 2: Frontend-ის მომზადება

1. **Dependencies-ების ინსტალაცია**:
```bash
npm install
```

2. **Environment variables-ების კონფიგურაცია**:
`.env.local` ფაილი უკვე კონფიგურირებულია Local Supabase-თან:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=[კონფიგურირებულია]
SUPABASE_SERVICE_ROLE_KEY=[კონფიგურირებულია]
```

### ნაბიჯი 3: Development server-ის გაშვება

```bash
# Frontend-ის გაშვება
npm run dev

# ან Windows მომხმარებლებისთვის
start-frontend.bat
```

**Frontend იქნება ხელმისაწვდომი:** http://localhost:3000

## 🌐 Service URLs (ლოკალური დეველოპმენტი)

| Service | URL | აღწერა |
|---------|-----|--------|
| **Frontend** | http://localhost:3000 | Next.js გამოყენება |
| **Supabase Studio** | http://localhost:3001 | Database, Auth, Storage UI |
| **API Gateway** | http://localhost:8000 | Main API endpoint |
| **Database** | localhost:5432 | PostgreSQL database |
| **Mail Service** | http://localhost:8080 | Email testing interface |

## 🔑 მნიშვნელოვანი ფაილები

- `src/lib/supabase.ts` - Supabase client კონფიგურაცია
- `src/hooks/useAuth.ts` - Authentication hook
- `src/store/authStore.ts` - Auth state management
- `src/types/database.ts` - Database schema types
- `.env.local` - Local development environment variables
- `supabase-local/` - Local Supabase backend configuration

## 🛠️ მართვის ბრძანებები

### Backend Management (supabase-local/)

```bash
# სერვისების გაშვება
start.bat (Windows)
./start.sh (Linux/Mac)

# სერვისების გაჩერება
stop.bat (Windows) 
./stop.sh (Linux/Mac)

# ყველაფრის გადატვირთვა (მონაცემების წაშლა)
reset.bat (Windows)
./reset.sh (Linux/Mac)

# ლოგების ნახვა
docker compose logs -f

# კონტეინერების სტატუსი
docker compose ps
```

### Frontend Management

```bash
# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔄 Development Workflow

1. **დაწყება**:
   - Supabase backend: `cd ../supabase-local && start.bat`
   - Frontend: `npm run dev`

2. **დეველოპმენტი**:
   - Frontend კოდის ცვლილებები შეგიძლია პირდაპირ
   - Database ცვლილებები: Supabase Studio-ში (http://localhost:3001)

3. **ტესტირება**:
   - ბრაუზერში: http://localhost:3000
   - Supabase Studio: http://localhost:3001

4. **დასრულება**:
   - Frontend: Ctrl+C
   - Backend: `cd ../supabase-local && stop.bat`

## 🗄️ Database Management

### Supabase Studio გამოყენება
1. გახსენი http://localhost:3001
2. Login: `supabase` / `this_password_is_insecure_and_should_be_updated`
3. Table Editor, SQL Editor, Auth Management, Storage მომხმარებლებისთვის

### Direct Database Connection
```bash
# psql გამოყენებით
psql -h localhost -p 5432 -U postgres -d postgres
```

## 🚨 Troubleshooting

### Backend არ ირთვება:
```bash
# Docker Desktop-ის სტატუსის შემოწმება
docker --version
docker info

# პორტების კონფლიქტის შემოწმება
netstat -an | findstr :8000
netstat -an | findstr :3001
netstat -an | findstr :5432
```

### Frontend არ უკავშირდება backend-ს:
- დარწმუნდი რომ backend მუშაობს: http://localhost:8000
- შეამოწმე `.env.local` კონფიგურაცია
- Frontend შემდეგ backend-ის ცვლილებების შემდეგ გადატვირთე

### Database კავშირის პრობლემები:
```bash
# Database ლოგების ნახვა
cd ../supabase-local
docker compose logs supabase-db

# ყველაფრის გადატვირთვა
reset.bat
```

## 🌍 Production Deployment

ლოკალური დეველოპმენტის შემდეგ პროდაქშენისთვის VPS Supabase-ზე გადასვლა:

1. **VPS-ზე migrations-ის push-ლა**
2. **Environment variables-ის განახლება**
3. **Frontend production build**

დეტალური ინსტრუქციები: `supabase-local-dev-guide.md`

## მომავალი განვითარება

პროექტი მზადაა ლოკალური დეველოპმენტისთვის. შემდეგი ნაბიჯები:

1. Database schema-ს განახლება და გაშვება
2. Authentication flow-ს გაშვება
3. Real-time ფუნქციონალობის დამატება
4. Tests-ების დაწერა
5. Production deployment მომზადება
