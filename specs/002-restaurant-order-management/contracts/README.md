# API Contracts: Restaurant Order Management

**Date**: 2025-11-01  
**Feature**: Restaurant Order Management  
**Contracts Version**: 1.0.0

## Overview

This directory contains all API contracts and real-time channel specifications for the Restaurant Order Management feature. These contracts define the exact interface between frontend components, backend APIs, and real-time channels.

## Contract Files

### REST API Contracts

- **[order-creation.json](./order-creation.json)** - Order submission API endpoint
- **[order-tracking.json](./order-tracking.json)** - Order status and history APIs  
- **[cart-management.json](./cart-management.json)** - Shopping cart persistence APIs
- **[product-catalog.json](./product-catalog.json)** - Product browsing and search APIs

### Real-time Channel Contracts

- **[realtime-channels.json](./realtime-channels.json)** - WebSocket channel specifications
- **[status-updates.json](./status-updates.json)** - Order status change notifications
- **[product-updates.json](./product-updates.json)** - Product catalog change notifications
- **[cart-sync.json](./cart-sync.json)** - Cross-device cart synchronization

## Contract Validation

All contracts should be validated against:
- TypeScript interfaces in `frontend/src/types/`
- Zod schemas in `frontend/src/lib/validators/`
- Database schema in `specs/002-restaurant-order-management/data-model.md`
- Real-time channel implementations in `frontend/src/lib/realtime/`

## Georgian Localization

All contracts support Georgian language elements:
- Status labels in Georgian
- Currency formatting in GEL
- Date/time in UTC+4 timezone
- Number formatting for Georgian conventions

## Performance Requirements

- Order submission: < 500ms p95
- Product catalog loading: < 200ms p95  
- Cart operations: < 100ms p95
- Real-time updates: < 1 second p99
- Status updates: Real-time (< 1s latency)

## Security Requirements

- JWT authentication required for all endpoints
- RLS policy enforcement at database level
- Role-based access control (restaurant/admin/driver/demo)
- Input validation via Zod schemas
- Cross-tenant data isolation guaranteed

---

**Contract Status**: ✅ COMPLETE  
**All APIs Specified**: ✅ YES  
**Real-time Channels**: ✅ DOCUMENTED  
**Security Model**: ✅ VALIDATED  
**Georgian Compliance**: ✅ VERIFIED