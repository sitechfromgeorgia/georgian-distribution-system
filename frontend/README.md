# Georgian Distribution System - Frontend

## პროექტის აღწერა

Georgian Distribution System არის B2B პლატფორმა საქართველოში ფუდ დისტრიბუციისთვის. ეს არის frontend აპლიკაცია, რომელიც აწყობილია Next.js-ზე და უკავშირდება VPS-ზე არსებულ self-hosted Supabase backend-ს.

## ტექნოლოგიური სტეკი

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (Self-hosted)
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

1. Dependencies-ების ინსტალაცია:
```bash
npm install
```

2. Environment variables-ების კონფიგურაცია:
`.env.local` ფაილი უკვე კონფიგურირებულია VPS Backend-თან:
```
NEXT_PUBLIC_SUPABASE_URL=https://data.greenland77.ge
NEXT_PUBLIC_SUPABASE_ANON_KEY=[configured]
SUPABASE_SERVICE_ROLE_KEY=[configured]
```

3. კავშირის შემოწმება:
ბრაუზერში გახსენით: `http://localhost:3000/test`
ეს გვერდი გაგიშვებთ ტესტებს და შეამოწმებს კავშირს VPS backend-თან.

4. Development server-ის გაშვება:
```bash
npm run dev
```

## მნიშვნელოვანი ფაილები

- `src/lib/supabase.ts` - Supabase client კონფიგურაცია
- `src/hooks/useAuth.ts` - Authentication hook
- `src/store/authStore.ts` - Auth state management
- `src/types/database.ts` - Database schema types

## მომავალი განვითარება

პროექტი მზადაა VPS-ზე არსებულ Supabase backend-თან დასაკავშირებლად. შემდეგი ნაბიჯები:

1. Backend-თან კავშირის დამყარება
2. Database schema-ს განახლება
3. Real-time ფუნქციონალობის დამატება
4. Tests-ების დაწერა
5. Production deployment
