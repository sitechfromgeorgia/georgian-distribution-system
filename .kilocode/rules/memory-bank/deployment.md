# Deployment Architecture - Georgian Distribution System

**Document Version:** 1.0  
**Last Updated:** 2025-11-01 08:15 UTC+4  
**Purpose:** Comprehensive deployment documentation for Georgian Distribution System

---

## Overview

The Georgian Distribution System uses a **dual-environment architecture** with development on the official Supabase platform and production deployment on a self-hosted VPS infrastructure. This approach provides flexibility for development while maintaining full control over production deployment.

---

## VPS Configuration Details

### Infrastructure Provider

**Contabo Cloud Hosting Infrastructure**
- **Platform**: Professional cloud hosting optimized for containerized applications
- **Purpose**: Production-grade hosting for self-hosted Supabase deployment
- **Capabilities**: High-performance containerized applications with reliable uptime
- **Region**: Optimized for European markets with excellent connectivity to Georgia
- **Uptime**: Enterprise-grade reliability with 99.9% uptime guarantee

### Deployment Manager

**Dockploy Container Orchestration Platform**
- **Purpose**: Streamlined deployment and management of the complete Supabase stack
- **Container Prefix**: `distribution-supabase-yzoh2u-supabase`
- **Features**:
  - Automated Docker container deployment and management
  - Health monitoring and auto-recovery systems
  - Automated SSL certificate provisioning and management
  - Environment variable management across containers
  - One-click scaling capabilities
  - Rolling updates with zero-downtime deployments

### Production Domain Configuration

**Backend Domain**: https://data.greenland77.ge
- **Service**: Self-hosted Supabase backend
- **SSL**: Automated certificate management via Dockploy
- **DNS**: Custom DNS records pointing to VPS infrastructure

**Frontend Domain**: https://greenland77.ge
- **Service**: Production Next.js application
- **SSL**: Automated certificate provisioning
- **CDN**: Optimized delivery for Georgian market

---

## Self-Hosted Supabase Services Overview

### Core Supabase Stack Components

**Database (PostgreSQL)**
- **Container Service**: `db` (PostgreSQL 15+)
- **Database Name**: `postgres`
- **Connection**: Internal container networking
- **Persistence**: Persistent volume storage
- **Backup**: Automated backup scheduling

**API Gateway (Kong)**
- **Service**: `kong` (Kong API Gateway)
- **HTTP Port**: 8000
- **HTTPS Port**: 8443
- **Purpose**: Request routing, authentication, rate limiting
- **SSL Termination**: Automatic SSL/TLS termination

**Authentication Service (GoTrue)**
- **Service**: `auth` (Supabase Auth)
- **Email Verification**: Enabled with manual confirmation
- **Phone Authentication**: Enabled with auto-confirmation
- **SMTP Configuration**: Custom SMTP setup for Georgian market
- **JWT Management**: Secure token generation and validation

**Database API (PostgREST)**
- **Service**: `rest` (PostgREST)
- **Purpose**: Auto-generated RESTful API from database schema
- **Security**: Row Level Security integration
- **Real-time**: WebSocket support for live updates

**Real-time Engine (Supabase Realtime)**
- **Service**: `realtime` (WebSocket server)
- **Purpose**: Live data synchronization and notifications
- **Use Cases**: Order status updates, chat notifications, analytics

**File Storage (Supabase Storage)**
- **Service**: `storage` (Object storage)
- **Purpose**: Product images, user uploads, file management
- **Integration**: Database policy-based access control

### Additional Services

**Email Service (SMTP)**
- **Service**: `supabase-mail`
- **Purpose**: Transactional emails and notifications
- **Configuration**: Custom SMTP settings for Georgian market

**Studio Dashboard**
- **Service**: `studio` (Supabase Studio)
- **Port**: 3000
- **Purpose**: Database management, API testing, user administration
- **Access**: Secure web interface with authentication

**Connection Pooler (Supavisor)**
- **Service**: `supavisor` (PgBouncer)
- **Transaction Port**: 6543
- **Pool Size**: 20 connections (configurable)
- **Max Client Connections**: 100
- **Purpose**: Connection pooling and load management

---

## Environment Configuration

### Production Environment Variables

**Core Supabase Configuration**
```bash
# URL Configuration
SUPABASE_PUBLIC_URL=https://data.greenland77.ge
API_EXTERNAL_URL=https://data.greenland77.ge
SITE_URL=https://data.greenland77.ge

# JWT Configuration
JWT_SECRET=1a7tzs6y7ffxfipaj9muf6bhnafxqwf1
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_EXPIRY=360

# Database Configuration
POSTGRES_HOST=db
POSTGRES_DB=postgres
POSTGRES_PORT=5432
POSTGRES_PASSWORD=d5zvvwy8y9kn80w2eid7qjhj21g6e4ia

# Connection Pooling
POOLER_PROXY_PORT_TRANSACTION=6543
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
```

**Authentication Configuration**
```bash
# User Management
ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
ENABLE_PHONE_SIGNUP=true
ENABLE_PHONE_AUTOCONFIRM=true

# SMTP Settings
SMTP_HOST=supabase-mail
SMTP_PORT=2500
SMTP_ADMIN_EMAIL=admin@example.com
SMTP_USER=fake_mail_user
SMTP_PASS=fake_mail_password
SMTP_SENDER_NAME=fake_sender
```

**Security Configuration**
```bash
# CORS and Redirects
ADDITIONAL_REDIRECT_URLS=https://data.greenland77.ge/*,http://localhost:3000/*

# Studio Access
DASHBOARD_USERNAME=supabase
DASHBOARD_PASSWORD=y8d8mtm3x30gv4jz5wvxc3exxbqcgav2
STUDIO_PORT=3000
```

---

## Migration Checklist and Procedures

### Pre-Migration Checklist

**Environment Preparation**
- [ ] Verify VPS infrastructure is operational
- [ ] Confirm Dockploy deployment manager is running
- [ ] Validate SSL certificates for production domains
- [ ] Test DNS resolution for data.greenland77.ge
- [ ] Verify all environment variables are configured

**Database Preparation**
- [ ] Confirm self-hosted PostgreSQL is operational
- [ ] Validate disk space (minimum 2x current database size)
- [ ] Test network connectivity between environments
- [ ] Verify PostgreSQL client tools availability

**Application Preparation**
- [ ] Test application builds in both environments
- [ ] Validate environment variable switching
- [ ] Confirm frontend can connect to both backends
- [ ] Test all critical user workflows

### Migration Execution Procedures

**Phase 1: Data Export (Cloud to Local)**
```bash
# Execute export script
cd database/migration-tools
./export-from-cloud.sh

# Verify export integrity
./verify-migration.sh --validate-export
```

**Phase 2: Data Import (Local to Self-hosted)**
```bash
# Import to production
./import-to-selfhosted.sh --target=production

# Validate import
./verify-migration.sh --validate-import
```

**Phase 3: Application Switchover**
1. Update frontend environment variables
2. Deploy application to production
3. Test critical functionality
4. Update DNS records if needed
5. Monitor system for 48 hours

### Post-Migration Validation

**System Validation**
- [ ] Database integrity check (foreign keys, constraints)
- [ ] Authentication system verification
- [ ] File storage functionality test
- [ ] Real-time features verification
- [ ] Performance baseline comparison

**Business Logic Validation**
- [ ] Order workflow testing
- [ ] Role-based access control verification
- [ ] Georgian language support confirmation
- [ ] Analytics dashboard functionality
- [ ] User experience flow validation

---

## Environment Variable Management Strategy

### Development Environment
- **File**: `frontend/.env.local`
- **Backend**: Official Supabase (akxmacfsltzhbnunoepb.supabase.co)
- **Configuration**: Development-ready with managed hosting
- **Features**: Full MCP integration, managed scaling

### Production Environment
- **Management**: Dockploy environment variable system
- **Backend**: Self-hosted Supabase (data.greenland77.ge)
- **Configuration**: Production-grade with full security
- **Features**: Custom SMTP, enterprise security

### Environment Detection
```typescript
// Environment-agnostic configuration
const isProduction = process.env.NODE_ENV === 'production';
const supabaseUrl = isProduction 
  ? 'https://data.greenland77.ge'
  : 'https://akxmacfsltzhbnunoepb.supabase.co';

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: isProduction 
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_PROD
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_DEV
};
```

---

## DNS and SSL Configuration Notes

### DNS Configuration
- **Primary Domain**: greenland77.ge
- **Backend Subdomain**: data.greenland77.ge
- **Frontend**: greenland77.ge (root domain)
- **TTL**: 300 seconds for rapid changes
- **Records**: A records pointing to VPS IP addresses

### SSL Certificate Management
- **Provider**: Let's Encrypt via Dockploy
- **Auto-renewal**: Enabled with 30-day renewal window
- **SSL Monitoring**: Automated certificate health checks
- **Certificate Types**: 
  - Wildcard: *.greenland77.ge
  - Root domain: greenland77.ge
  - Backend: data.greenland77.ge

### Security Considerations
- **HTTPS Enforcement**: All traffic redirected to HTTPS
- **HSTS Headers**: Implemented for security
- **Certificate Transparency**: Monitored for security compliance
- **Renewal Alerts**: Automated notifications for certificate expiry

---

## Monitoring and Maintenance

### Health Monitoring
- **Application Health**: HTTP endpoint monitoring
- **Database Health**: Connection pool and query performance
- **Container Health**: Docker container status monitoring
- **SSL Certificate**: Automated certificate expiry monitoring

### Backup Strategy
- **Database Backups**: Automated daily backups with 7-day retention
- **File Storage Backups**: Weekly full backups with incremental daily
- **Configuration Backups**: Version-controlled environment configurations
- **Disaster Recovery**: Off-site backup storage with 30-day retention

### Scaling Considerations
- **Horizontal Scaling**: Multiple Supabase instances support
- **Vertical Scaling**: Resource allocation adjustments via Dockploy
- **Database Scaling**: Read replicas and connection pooling
- **CDN Integration**: Geographic distribution for Georgian market

---

## Troubleshooting Guide

### Common Issues

**Database Connection Issues**
- Verify PostgreSQL service status
- Check connection pool limits
- Validate network connectivity
- Review SSL certificate configuration

**Authentication Problems**
- Confirm JWT secret configuration
- Verify SMTP settings
- Check email delivery configuration
- Validate user registration settings

**Performance Issues**
- Monitor connection pool utilization
- Check database query performance
- Validate container resource allocation
- Review real-time subscription limits

### Emergency Procedures
- **Database Recovery**: Restore from latest backup
- **SSL Issues**: Emergency certificate regeneration
- **Service Outage**: Container restart via Dockploy
- **DNS Issues**: Emergency DNS record update

---

*This deployment documentation ensures reliable, scalable, and maintainable production operations for the Georgian Distribution System.*