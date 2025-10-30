## ✅ VPS განახლების შემდგომი ნაბიჯები

თქვენ უკვე განაახლეთ VPS `.env` ფაილი სწორი JWT keys-ებით.

### 🔄 აუცილებელი: Restart Supabase Services

SSH-ით შედით VPS-ზე და გაუშვით:

```bash
# Navigate to your Supabase directory
cd /path/to/your/supabase

# Stop all containers
docker-compose down

# Start containers with new configuration
docker-compose up -d

# Verify all services are running
docker-compose ps
```

### ✅ შემოწმება

როცა containers გადაიტვირთება (30-60 წამი), შეამოწმეთ:

```bash
# Check if services are healthy
curl https://data.greenland77.ge/rest/v1/

# You should see a response like:
# {"message":"Welcome to PostgREST"}
```

### 📱 Frontend Test

1. დარწმუნდით რომ dev server მუშაობს
2. გადადით: `http://localhost:3000/test`
3. დააჭირეთ "ტესტების გაშვება" ღილაკს
4. უნდა ნახოთ: ✅ "ყველაფერი მუშაობს!"

### ⚠️ თუ არ მუშაობს:

1. **შეამოწმეთ VPS logs:**
```bash
docker-compose logs -f kong
docker-compose logs -f auth
```

2. **დარწმუნდით რომ CORS კონფიგურაცია სწორია:**
VPS `.env`-ში უნდა იყოს:
```
ADDITIONAL_REDIRECT_URLS=https://data.greenland77.ge/*,http://localhost:3000/*
```

3. **Frontend-ში შეამოწმეთ:**
```bash
# Restart dev server
# Press Ctrl+C to stop current server, then:
npm run dev
```

### 🎯 VPS-ზე რა უნდა იყოს ახლა:

```env
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzYxNzMzODk2LCJleHAiOjE4OTM0NTYwMDB9.8_RBpPhjnSsvDY4GMDddZW9K53yIdWGsiUHp6jM-vA8
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NjE3MzM4OTYsImV4cCI6MTg5MzQ1NjAwMH0.abYfCA4Iibh89d9TJMcPsLuBScfUpwJvgL9mH-SZkm8
```

ეს keys-ები ემთხვევა თქვენს Frontend `.env.local` ფაილში არსებულ keys-ებს ✅