# Health Check System Documentation

## Overview

The Georgian Distribution System includes a comprehensive health monitoring infrastructure designed to ensure optimal performance, reliability, and user experience. This system provides real-time monitoring, performance analysis, and proactive issue detection across all critical components.

## Architecture

### Components

1. **Health Check Dashboard** - Main monitoring interface
2. **Database Health Checker** - Connection and query performance monitoring
3. **Performance Monitor** - Response time and throughput tracking
4. **Connection Pool Manager** - Database connection optimization
5. **API Tester** - Endpoint and functionality verification
6. **Real-time Tester** - WebSocket and notification monitoring

### Key Features

- **Real-time Monitoring**: Auto-refresh every 30 seconds
- **Multi-tab Interface**: Overview, Performance, Database, System tabs
- **Status Indicators**: Visual health status with color coding
- **Performance Metrics**: Response times, success rates, error tracking
- **Connection Pool Analytics**: Pool utilization and optimization
- **Historical Data**: Trend analysis and pattern recognition

## Dashboard Components

### System Overview Cards

1. **Database Health**: Connection status and response times
2. **Performance**: Average response time and success rates
3. **Connections**: Active connections and pool utilization
4. **System Status**: Overall uptime and memory usage

### Detailed Tabs

#### Overview Tab
- Service health status for all components
- Key metrics summary
- Status badges and icons

#### Performance Tab
- Response time trends
- Operations per second
- Error rate analysis
- Success rate metrics

#### Database Tab
- Connection health
- Pool utilization metrics
- Database performance indicators
- Query performance analysis

#### System Tab
- Overall system health
- Uptime metrics
- Memory usage
- Resource utilization

## Health Check Utilities

### Database Health Check (`runHealthCheck`)

```typescript
import { runHealthCheck } from '@/lib/supabase/health-check';

const healthResult = await runHealthCheck();
console.log(healthResult);
// Output: { healthy: boolean, message: string, timestamp: string }
```

**Features:**
- Database connection validation
- Query performance testing
- Connection timeout detection
- Error rate monitoring

### Performance Monitoring (`performance.ts`)

```typescript
import { recordPerformance } from '@/lib/monitoring/performance';

recordPerformance('operation_name', responseTime, 'success', {
  additional: 'metrics'
});
```

**Capabilities:**
- Response time tracking
- Error rate calculation
- Success rate monitoring
- Performance trend analysis

### Connection Pool Management (`connection-pool.ts`)

```typescript
import { getConnectionHealth, monitorPoolPerformance } from '@/lib/testing/connection-pool';

const health = getConnectionHealth();
const stats = await monitorPoolPerformance();
```

**Features:**
- Pool utilization monitoring
- Connection time tracking
- Circuit breaker pattern
- Automatic retry logic
- Performance optimization recommendations

### API Testing (`api-tester.ts`)

```typescript
import { runAPITests } from '@/lib/testing/api-tester';

const results = await runAPITests();
console.log(results);
// Output: { passed: number, failed: number, total: number, results: [] }
```

**Tests Include:**
- Supabase client initialization
- Authentication endpoints
- Database query operations
- Real-time connections
- Storage operations

## Health Status Levels

### 🟢 Healthy (Green)
- **Database**: Response time < 100ms
- **Performance**: Avg response time < 200ms
- **Connections**: Pool utilization < 70%
- **System**: All metrics within optimal ranges

### 🟡 Warning (Yellow)
- **Database**: Response time 100-300ms
- **Performance**: Avg response time 200-500ms
- **Connections**: Pool utilization 70-90%
- **System**: Some metrics elevated but manageable

### 🔴 Critical (Red)
- **Database**: Response time > 300ms
- **Performance**: Avg response time > 500ms
- **Connections**: Pool utilization > 90%
- **System**: Critical issues requiring immediate attention

## Usage Guide

### Accessing the Dashboard

1. Navigate to `/health` in your browser
2. Dashboard loads with current system status
3. Auto-refreshes every 30 seconds
4. Use "Refresh" button for manual updates

### Understanding Metrics

#### Response Time
- **Excellent**: < 100ms
- **Good**: 100-300ms  
- **Needs Attention**: > 300ms

#### Pool Utilization
- **Optimal**: 50-70%
- **High**: 70-90%
- **Critical**: > 90%

#### Success Rate
- **Excellent**: > 99%
- **Good**: 95-99%
- **Poor**: < 95%

### Interpreting Alerts

#### Database Connection Issues
- Check Supabase project status
- Verify network connectivity
- Review connection timeout settings
- Monitor pool utilization

#### Performance Degradation
- Identify slow operations
- Check for resource constraints
- Review recent deployments
- Analyze query patterns

#### Connection Pool Exhaustion
- Increase pool size
- Optimize connection handling
- Review timeout settings
- Implement connection recycling

## Configuration

### Environment Variables

```bash
# Health Check Intervals
NEXT_PUBLIC_HEALTH_CHECK_INTERVAL=30000  # 30 seconds

# Performance Thresholds
NEXT_PUBLIC_PERF_THRESHOLD_GOOD=200      # milliseconds
NEXT_PUBLIC_PERF_THRESHOLD_WARNING=500   # milliseconds

# Connection Pool Settings
NEXT_PUBLIC_POOL_SIZE=10
NEXT_PUBLIC_POOL_TIMEOUT=30000
```

### Custom Thresholds

You can customize health check thresholds by modifying the dashboard component:

```typescript
// In HealthCheckDashboard.tsx
const getStatusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'critical': return 'text-red-600';
    default: return 'text-gray-600';
  }
};
```

## Best Practices

### Regular Monitoring
- Check dashboard during business hours
- Monitor trends over time
- Set up alerts for critical issues
- Review performance metrics weekly

### Performance Optimization
- Monitor response time trends
- Optimize slow queries
- Tune connection pool settings
- Implement caching strategies

### Troubleshooting
1. **Check Overall Status**: Start with the main status badge
2. **Review Critical Services**: Focus on red/critical items first
3. **Analyze Trends**: Look at historical data patterns
4. **Check Logs**: Review console output for errors
5. **Validate Configuration**: Ensure proper environment setup

## Integration with External Systems

### Alerting
The health check system can integrate with external alerting systems:

```typescript
// Example: Send alerts to monitoring service
const alertConfig = {
  enabled: true,
  webhookUrl: process.env.ALERT_WEBHOOK_URL,
  criticalOnly: true
};
```

### Export Data
Export health data for external analysis:

```typescript
const exportHealthData = () => {
  const data = {
    timestamp: new Date().toISOString(),
    system: getOverallSystemHealth(),
    metrics: collectAllMetrics()
  };
  
  // Export to CSV, JSON, or monitoring service
  return data;
};
```

## Troubleshooting

### Common Issues

#### Dashboard Not Loading
- Check if all dependencies are installed
- Verify Supabase connection
- Review browser console for errors
- Ensure proper environment variables

#### Inconsistent Data
- Check network connectivity
- Verify Supabase project status
- Review rate limiting settings
- Monitor API quotas

#### Performance Issues
- Check database connection pool
- Review query performance
- Monitor resource usage
- Validate network latency

### Error Messages

#### "Circuit Breaker is Open"
- Database connections failing repeatedly
- Check network connectivity
- Review database server status
- Increase circuit breaker timeout

#### "High Pool Utilization"
- Too many concurrent connections
- Increase pool size or optimize queries
- Review connection lifecycle management
- Implement connection pooling improvements

#### "Database Connection Failed"
- Verify Supabase credentials
- Check project status
- Review network firewall rules
- Validate SSL/TLS configuration

## API Reference

### Health Check Functions

#### `runHealthCheck()`
Checks database connectivity and basic operations.

**Returns:**
```typescript
{
  healthy: boolean;
  message: string;
  timestamp: string;
  details?: any;
}
```

#### `recordPerformance()`
Records performance metrics for analysis.

**Parameters:**
- `operation`: string - Operation name
- `duration`: number - Duration in milliseconds
- `status`: 'success' | 'error' - Operation status
- `metadata`: object - Additional metrics

#### `getConnectionHealth()`
Returns current connection pool health status.

**Returns:**
```typescript
{
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics: ConnectionPoolMetrics;
  recommendations: string[];
}
```

## Security Considerations

### Access Control
- Health dashboard is publicly accessible
- Contains system metrics only (no sensitive data)
- No authentication required for monitoring
- Sensitive operations are not exposed

### Data Protection
- Performance metrics are anonymized
- No user data in health checks
- Database queries use read-only operations
- Temporary data is automatically cleaned up

## Performance Impact

### Resource Usage
- **Memory**: ~5MB for dashboard component
- **Network**: Minimal - only essential health checks
- **Database**: Lightweight queries for health verification
- **CPU**: Low impact from monitoring operations

### Optimization
- Health checks are throttled to prevent overload
- Database queries use efficient, minimal operations
- Real-time updates use WebSocket connections efficiently
- Historical data is automatically trimmed

## Future Enhancements

### Planned Features
- Custom alert thresholds per component
- Historical data visualization
- Integration with external monitoring services
- Automated remediation actions
- Predictive health analysis

### Roadmap
1. **Short-term**: Enhanced alerting and notifications
2. **Medium-term**: Machine learning for anomaly detection
3. **Long-term**: Predictive maintenance and auto-scaling

---

*Last Updated: November 1, 2025*  
*Version: 1.0.0*  
*System: Georgian Distribution Platform*