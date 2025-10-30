# VPS Backend Connection Guide

## 📡 კავშირის კონფიგურაცია

თქვენი Frontend აპლიკაცია დაკავშირებულია VPS-ზე არსებულ Supabase Backend-თან.

### Backend დეტალები:
- **URL**: `https://data.greenland77.ge`
- **Host**: data.greenland77.ge
- **Environment**: Production (Self-hosted Supabase)

## 🔐 Authentication Flow

1. **Frontend** (localhost:3000) → იწყებს authentication-ს
2. **VPS Backend** (data.greenland77.ge) → ამოწმებს credentials
3. **JWT Tokens** → ინახება browser-ის localStorage-ში
4. **API Calls** → ყველა მოთხოვნა მიდის VPS-ზე

## ✅ კავშირის შემოწმება

### Browser-ში:
```
http://localhost:3000/test
```

ეს გვერდი ატარებს სრულ health check-ს:
- ✓ Database connection
- ✓ Authentication system
- ✓ Storage access
- ✓ Realtime capabilities

### Console-ში:
```javascript
// Browser DevTools Console
console.log('Backend URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
```

## 🔄 Realtime კავშირი

Supabase Realtime WebSocket connection:
- **Protocol**: WSS (Secure WebSocket)
- **Endpoint**: `wss://data.greenland77.ge/realtime/v1`
- **Auto-reconnect**: დიახ
- **Events**: Order status, notifications, live updates

## 🛡️ CORS & Security

Frontend უსაფრთხოდ უკავშირდება Backend-ს:

```env
# Backend CORS configuration (in VPS)
ADDITIONAL_REDIRECT_URLS=http://localhost:3000/*
SITE_URL=https://data.greenland77.ge
```

## 📊 Backend Status Indicator

აპლიკაციის ქვედა მარჯვენა კუთხეში ჩანს real-time status indicator:
- 🟢 **Green** - Backend healthy (კავშირი სრულად მუშაობს)
- 🔴 **Red** - Backend unhealthy (პრობლემა არის)
- 🟡 **Yellow** - Unknown status (შემოწმება მიმდინარეობს)

## 🚀 Production Deployment

როცა მზად იქნებით production-ისთვის:

1. განაახლეთ CORS settings VPS-ზე:
```bash
ADDITIONAL_REDIRECT_URLS=https://yourdomain.com/*
```

2. დააყენეთ production URL frontend-ში:
```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. Build production version:
```bash
npm run build
npm start
```

## 🔍 Debugging

### Backend არ პასუხობს?
1. შეამოწმეთ VPS status
2. შეამოწმეთ `https://data.greenland77.ge/rest/v1/` browser-ში
3. გახსენით DevTools Network tab და ნახეთ failed requests

### Authentication არ მუშაობს?
1. შეამოწმეთ JWT_SECRET VPS-ზე
2. დარწმუნდით რომ ANON_KEY სწორია
3. შეამოწმეთ CORS settings

### Realtime events არ მოდის?
1. შეამოწმეთ WebSocket connection DevTools-ში
2. დარწმუნდით რომ Row Level Security policies არ აბლოკავს
3. ნახეთ Supabase realtime logs VPS-ზე

## 📝 Environment Variables Checklist

Frontend `.env.local`:
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY

Backend VPS (უკვე კონფიგურირებული):
- ✅ SUPABASE_HOST=data.greenland77.ge
- ✅ JWT_SECRET
- ✅ ANON_KEY
- ✅ SERVICE_ROLE_KEY
- ✅ ADDITIONAL_REDIRECT_URLS

## 🎯 მომდევნო ნაბიჯები

1. ✅ Frontend დაკავშირებულია VPS-თან
2. ⏳ შექმენით database schema
3. ⏳ დააყენეთ Row Level Security policies
4. ⏳ ატვირთეთ initial data
5. ⏳ დატესტეთ authentication flow
6. ⏳ დაიწყეთ feature development