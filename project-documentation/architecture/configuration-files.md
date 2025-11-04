# Configuration Files Documentation

**Documented:** 2025-10-31  
**Project:** Georgian Distribution System Frontend

## Overview

This document provides comprehensive documentation of all configuration files in the Georgian Distribution System, covering build tools, linting, styling, development environment, and AI-assisted development setups.

## Build Configuration

### Next.js Configuration
**File:** `frontend/next.config.ts`  
**Purpose:** Next.js application configuration for production-ready deployment

#### Key Configuration Sections

**Image Optimization:**
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'akxmacfsltzhbnunoepb.supabase.co',
      port: '',
      pathname: '/storage/v1/object/public/**',
    },
  ],
}
```
- **Purpose:** Allow images from Supabase storage for product photos and user avatars
- **Security:** Restricts to specific Supabase instance and public storage paths
- **Performance:** Enables Next.js image optimization for remote images

**CORS Headers:**
```typescript
async headers() {
  const allowedOrigins = (process.env.NEXT_PUBLIC_CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());
  const primaryOrigin = allowedOrigins[0] || 'http://localhost:3000';
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Vary', value: 'Origin' },
        { key: 'Access-Control-Allow-Origin', value: primaryOrigin },
        { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
      ],
    },
  ];
}
```
- **Purpose:** Configure API route CORS for cross-origin requests
- **Security:** Restricts origins and headers for API endpoints
- **Flexibility:** Environment-based origin configuration

**Server External Packages:**
```typescript
serverExternalPackages: ["@supabase/supabase-js"]
```
- **Purpose:** Prevents Supabase client from bundling in server components
- **Performance:** Reduces bundle size and improves server-side rendering

**Experimental Features:**
```typescript
experimental: {
  serverActions: {
    allowedOrigins: ['localhost:3000', 'akxmacfsltzhbnunoepb.supabase.co'],
  },
  optimizePackageImports: [
    'lucide-react',
    'recharts',
    'date-fns'
  ],
}
```
- **Server Actions:** Enables server-side actions with trusted origins
- **Package Optimization:** Optimizes imports for commonly used UI libraries

**Webpack Configuration:**
```typescript
webpack: (config, { dev, isServer }) => {
  // Fix for React Server Components module resolution
  if (isServer) {
    config.externals.push('node:crypto', 'node:fs', 'node:path', 'node:buffer')
  }

  // Production optimizations
  if (!dev) {
    config.devtool = 'source-map'
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors', chunks: 'all' },
        supabase: { test: /[\\/]node_modules[\\/]@supabase[\\/]/, name: 'supabase', chunks: 'all', priority: 20 },
        ui: { test: /[\\/]node_modules[\\/](lucide-react|recharts|date-fns)[\\/]/, name: 'ui-libs', chunks: 'all', priority: 15 },
      },
    }
  }

  // Fix for development hot module replacement
  if (dev && !isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    }
  }
}
```
- **Performance:** Code splitting for vendor, Supabase, and UI libraries
- **Development:** Hot module replacement fixes
- **Server Components:** External node modules handling

**Production Optimizations:**
```typescript
compress: true,
poweredByHeader: false,
typescript: { ignoreBuildErrors: false },
eslint: { ignoreDuringBuilds: false },
```
- **Compression:** Enable gzip compression for better performance
- **Security:** Remove powered-by header
- **Quality:** Enforce TypeScript and ESLint in production builds

## Code Quality Configuration

### ESLint Configuration
**File:** `frontend/eslint.config.mjs`  
**Purpose:** Code quality enforcement and consistency

#### Configuration Rules
```typescript
export default [
  // Next.js core web vitals rules
  {
    name: "next/core-web-vitals",
    plugins: { "@next/next": nextPlugin },
    rules: { ...nextPlugin.configs["core-web-vitals"].rules },
  },
  // Basic TS support without project inference
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: 'module', ecmaFeatures: { jsx: true } },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: { /* keep defaults */ },
  },
  // Ignores
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts"],
  },
];
```

**Features:**
- **Next.js Integration:** Core web vitals and React best practices
- **TypeScript Support:** Full TypeScript ESLint integration
- **Smart Ignoring:** Excludes build artifacts and generated files
- **Default Rules:** Keeps default ESLint rules for consistency

### TypeScript Configuration
**File:** `frontend/tsconfig.json`  
**Purpose:** TypeScript compiler configuration for strict type checking

#### Key Settings
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Key Features:**
- **Strict Mode:** Enables all strict TypeScript checking options
- **Path Mapping:** `@/*` maps to `./src/*` for clean imports
- **Next.js Integration:** Next.js plugin for better React Server Component support
- **Modern Targets:** ES2017 target with next-generation modules

## Styling Configuration

### PostCSS Configuration
**File:** `frontend/postcss.config.mjs`  
**Purpose:** PostCSS processor configuration for Tailwind CSS v4

#### Configuration
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

**Features:**
- **Tailwind CSS v4:** Uses new Tailwind CSS PostCSS plugin
- **Minimal Configuration:** Clean setup for modern Tailwind development
- **Plugin System:** Extensible plugin architecture for additional processing

## Environment Configuration

### Local Environment Variables
**File:** `frontend/.env.local`  
**Purpose:** Development environment variables for local development

#### Configuration Categories

**Supabase Configuration (Development):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://akxmacfsltzhbnunoepb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Purpose:** Connect to official Supabase platform for development
- **Security:** Public keys only (safe for client-side usage)
- **Environment:** Official Supabase hosted platform with MCP integration

**Application Configuration:**
```bash
NEXT_PUBLIC_APP_NAME="Georgian Distribution System"
NEXT_PUBLIC_APP_VERSION="2.1-dev"
NEXT_PUBLIC_ENVIRONMENT="development"
```
- **Branding:** Application name and version for UI display
- **Environment Tracking:** Clear environment identification

**Site Configuration:**
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
- **Local Development:** Configured for localhost development
- **Redirect Handling:** Used for authentication redirects

**Development Settings:**
```bash
NODE_ENV=development
ENV=development
```
- **Development Mode:** Enables development features and debugging
- **Build Configuration:** Node.js environment for development

**Debug Settings:**
```bash
NEXT_PUBLIC_DEBUG=true
NEXT_PUBLIC_LOG_LEVEL=debug
NEXT_PUBLIC_VERBOSE_LOGGING=true
```
- **Enhanced Debugging:** Detailed logging and debug information
- **Development Tools:** Additional debug features for troubleshooting

## Development Environment Configuration

### VS Code Workspace Settings
**File:** `.vscode/settings.json`  
**Purpose:** VS Code workspace-specific settings for .speckit integration

#### Configuration
```json
{
    "chat.promptFilesRecommendations": {
        "speckit.constitution": true,
        "speckit.specify": true,
        "speckit.plan": true,
        "speckit.tasks": true,
        "speckit.implement": true
    },
    "chat.tools.terminal.autoApprove": {
        ".specify/scripts/bash/": true,
        ".specify/scripts/powershell/": true
    }
}
```

**Features:**
- **Speckit Integration:** Enables .speckit template recommendations in VS Code chat
- **Terminal Auto-Approval:** Automatically approves terminal commands in speckit scripts
- **Workflow Enhancement:** Streamlines .speckit workflow usage within VS Code

### MCP Server Configuration
**File:** `.kilocode/mcp.json`  
**Purpose:** Model Context Protocol server configuration for AI-assisted development

#### Available Servers
- **Perplexity AI:** Research and web search capabilities
- **Filesystem:** File system access and management
- **GitHub:** Repository management and integration
- **Sentry:** Error monitoring and performance tracking
- **Supabase:** Database and backend management
- **Context7:** Library documentation lookup
- **Sequential Thinking:** Step-by-step reasoning and planning
- **Chrome DevTools:** Browser automation
- **Shadcn:** UI component library integration

## Security and Best Practices

### Environment Security
- **Secret Management:** Only public keys in `.env.local`
- **Local Only:** `.env.local` is git-ignored for security
- **Development Focus:** Optimized for local development workflow

### Build Security
- **CORS Protection:** Restrict origins and methods for API endpoints
- **Bundle Security:** External packages for sensitive dependencies
- **Type Safety:** Strict TypeScript configuration for runtime safety

### Code Quality Security
- **ESLint Enforcement:** Consistent code quality across the codebase
- **TypeScript Strict Mode:** Prevents common runtime errors
- **Development Optimizations:** Hot reload and debugging features

## Development Workflow Integration

### Local Development Setup
1. **Environment:** Configure `.env.local` with Supabase credentials
2. **VS Code:** Workspace settings enable .speckit workflow integration
3. **MCP Servers:** AI-assisted development tools available
4. **Quality Gates:** ESLint and TypeScript enforce code standards

### Production Deployment
1. **Build Optimization:** Webpack configuration for production
2. **Security Headers:** CORS and security header configuration
3. **Performance:** Compression and code splitting enabled
4. **Monitoring:** Error tracking and performance monitoring ready

This configuration ecosystem ensures consistent, secure, and efficient development workflow for the Georgian Distribution System while maintaining high code quality standards and performance optimization.