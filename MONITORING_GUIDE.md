# Monitoring & Observability Guide

Complete guide for monitoring and observing the Dernek Yönetim Sistemi in production.

## Overview

Monitoring strategy covers three pillars:
1. **Logs** - Event tracking
2. **Metrics** - Performance data
3. **Traces** - Distributed tracing

## Logging Strategy

### Log Levels

```typescript
import logger from '@/lib/logger'

logger.info('User logged in', { userId: user.id })      // Informational
logger.warn('Rate limit approaching', { count: 95 })    // Warning
logger.error('Database connection failed', error)        // Error
logger.debug('Query executed', { query, duration })      // Debug
```

### Log Aggregation

#### ELK Stack (Self-hosted)

```yaml
# docker-compose.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.0.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5000:5000"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.0.0
    ports:
      - "5601:5601"
```

#### Managed Services

**Datadog**
```typescript
import { Datadog } from '@datadog/browser-rum'

Datadog.init({
  applicationId: process.env.NEXT_PUBLIC_DATADOG_APP_ID,
  clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN,
  site: 'datadoghq.com',
  service: 'dernek-nextjs',
  env: process.env.NODE_ENV,
  sessionSampleRate: 100,
})
```

**LogRocket**
```typescript
import LogRocket from 'logrocket'

LogRocket.init(process.env.NEXT_PUBLIC_LOGROCKET_ID)
```

### Log Queries

#### Find errors in last hour
```
level:error AND timestamp:[now-1h TO now]
```

#### Track API endpoint issues
```
endpoint:/api/users AND statusCode:500
```

#### Monitor authentication
```
endpoint:/api/auth/login AND (statusCode:401 OR statusCode:403)
```

## Metrics & Performance

### Key Performance Indicators (KPIs)

| Metric | Target | Priority |
|--------|--------|----------|
| Response Time (p95) | <500ms | Critical |
| Error Rate | <0.1% | Critical |
| Uptime | 99.9% | Critical |
| API Success Rate | >99% | High |
| Database Query Time | <50ms | High |
| Build Time | <60s | Medium |

### Prometheus Metrics

```typescript
// Setup Prometheus
import { register, Counter, Histogram, Gauge } from 'prom-client'

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'endpoint', 'status_code'],
})

const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['endpoint', 'error_type'],
})

const activeConnections = new Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
})

// Middleware
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    httpRequestDuration
      .labels(req.method, req.path, res.statusCode)
      .observe(duration)
  })
  
  next()
}

// Expose metrics
app.get('/metrics', (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(register.metrics())
})
```

### Grafana Dashboards

**Dashboard 1: API Performance**
- Response time trends
- Error rate by endpoint
- Request volume
- Latency percentiles

**Dashboard 2: Database Performance**
- Query execution time
- Connection pool status
- Slow query logs
- Index usage

**Dashboard 3: System Health**
- CPU utilization
- Memory usage
- Disk space
- Network bandwidth

**Dashboard 4: Business Metrics**
- User signups
- Active users
- Feature usage
- Donation amounts

## Error Tracking

### Sentry Setup

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof NetworkError) {
        return null // Don't send network errors
      }
    }
    return event
  },
})

// Manual error tracking
try {
  await riskyOperation()
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'user_signup' },
    level: 'error',
  })
}
```

### Error Patterns to Monitor

```typescript
// High-priority patterns
const criticalPatterns = [
  'DatabaseConnectionError',
  'AuthenticationError',
  'PaymentProcessingError',
  'DataValidationError',
]

// Set up alerts for these
```

## Distributed Tracing

### OpenTelemetry Integration

```typescript
import { NodeTracerProvider } from '@opentelemetry/node'
import { SimpleSpanProcessor } from '@opentelemetry/tracing'
import { JaegerExporter } from '@opentelemetry/exporter-jaeger'

const jaegerExporter = new JaegerExporter({
  endpoint: 'http://localhost:14268/api/traces',
})

const provider = new NodeTracerProvider()
provider.addSpanProcessor(new SimpleSpanProcessor(jaegerExporter))

// Track database queries
const tracer = provider.getTracer('database')

async function queryDatabase(sql) {
  const span = tracer.startSpan('db.query')
  span.setAttributes({
    'db.system': 'mongodb',
    'db.statement': sql,
  })
  
  try {
    const result = await db.execute(sql)
    return result
  } finally {
    span.end()
  }
}
```

## Real-time Monitoring Dashboard

### Components to Monitor

```typescript
// Real-time API dashboard
- Active requests
- Request latency
- Error counts
- Users online
- Recent errors
- System load
```

### WebSocket Updates

```typescript
// Server: Emit metrics every 5 seconds
setInterval(() => {
  io.emit('metrics', {
    requests: getRecentRequests(),
    errors: getRecentErrors(),
    latency: getAverageLatency(),
    uptime: getUptime(),
  })
}, 5000)

// Client: Update dashboard
socket.on('metrics', (data) => {
  updateDashboard(data)
})
```

## Alert Management

### Alert Routing

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
    - match:
        severity: warning
      receiver: 'slack'

receivers:
  - name: 'default'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK'
        channel: '#alerts'
  
  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

### Alert Examples

```yaml
groups:
  - name: api_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(api_errors_total[5m]) > 0.001
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowAPI
        expr: histogram_quantile(0.95, api_request_duration) > 0.5
        for: 10m
        annotations:
          summary: "API response time is high"
          
      - alert: HighMemory
        expr: memory_usage_percent > 85
        for: 5m
        annotations:
          summary: "High memory usage"
```

## Health Checks

### Liveness Probe

```typescript
// /api/health/live
export const GET = async () => {
  // Check if app is running
  return NextResponse.json({ status: 'alive' })
}
```

### Readiness Probe

```typescript
// /api/health/ready
export const GET = async () => {
  try {
    // Check database connection
    await database.ping()
    
    // Check Appwrite connection
    await appwrite.health.get()
    
    return NextResponse.json({ status: 'ready' })
  } catch (error) {
    return NextResponse.json(
      { status: 'not ready', error: error.message },
      { status: 503 }
    )
  }
}
```

### Kubernetes Probes

```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Performance Profiling

### Node.js Profiling

```typescript
// Using clinic.js
import clinic from '@nearform/clinic'

const collect = clinic.collect()
// Run application with profiler
```

### Flame Graphs

```bash
# Generate flame graphs
npm install -g 0x

0x ./node_modules/.bin/next start
# Visit http://localhost:7002
```

## Database Monitoring

### Query Monitoring

```typescript
// Monitor slow queries
const SLOW_QUERY_THRESHOLD = 100 // ms

db.on('query', (event) => {
  if (event.duration > SLOW_QUERY_THRESHOLD) {
    logger.warn('Slow query detected', {
      query: event.query,
      duration: event.duration,
    })
  }
})
```

### Connection Pool Monitoring

```typescript
// Monitor connection pool
const poolStats = {
  maxConnections: 100,
  activeConnections: 45,
  idleConnections: 55,
  waitingRequests: 2,
}
```

## Synthetic Monitoring

### Uptime Checks

```typescript
// Regular health checks
setInterval(async () => {
  try {
    const res = await fetch('https://your-domain.com/api/health/ready')
    if (!res.ok) {
      alert('Service unhealthy')
    }
  } catch (error) {
    alert('Service unreachable')
  }
}, 60000) // Every minute
```

### User Journey Monitoring

```typescript
// Monitor critical user flows
const flows = [
  'User Registration',
  'User Login',
  'Create Beneficiary',
  'Submit Donation',
  'Download Report',
]

// Synthetic tests for each flow
```

## Incident Response

### On-Call Rotation

- Team member on-call 24/7
- Escalation after 15 minutes no response
- Incident commander coordinates response

### Incident Runbooks

**High Error Rate**
1. Check Sentry dashboard
2. Identify affected endpoints
3. Check recent deployments
4. Rollback if needed
5. Monitor for resolution

**Database Down**
1. Check database connection status
2. Check Appwrite dashboard
3. Contact Appwrite support
4. Switch to backup database if available
5. Monitor recovery

## Compliance & Audit Logging

### Audit Trail

```typescript
import { AuditLogger } from '@/lib/audit-logger'

AuditLogger.log({
  action: 'user.created',
  actor: req.user.id,
  resource: 'users',
  resourceId: newUser.id,
  timestamp: new Date(),
  changes: {
    email: { before: null, after: newUser.email },
  },
})
```

### Data Access Logging

```typescript
// Log all data access for compliance
AuditLogger.log({
  action: 'data.accessed',
  actor: req.user.id,
  dataType: 'beneficiary',
  recordId: '123',
  timestamp: new Date(),
  ipAddress: req.ip,
})
```

## Tools Recommendation

### Recommended Stack

- **Logs**: ELK or Datadog
- **Metrics**: Prometheus + Grafana
- **Errors**: Sentry
- **Tracing**: Jaeger or Datadog APM
- **Uptime**: Pingdom or UptimeRobot
- **Performance**: Lighthouse CI
- **Alerts**: PagerDuty or Opsgenie

### Free/Open Source

- Prometheus (metrics)
- Grafana (dashboards)
- Jaeger (tracing)
- ELK (logs)
- AlertManager (alerts)

### Enterprise (Paid)

- Datadog (all-in-one)
- New Relic (APM)
- Elastic Cloud (ELK)
- Splunk (logs)

## Best Practices

1. **Log Early, Log Often**: Capture important events
2. **Centralize Logs**: Use log aggregation
3. **Meaningful Metrics**: Focus on business impact
4. **Alert Fatigue**: Avoid over-alerting
5. **Documentation**: Keep runbooks updated
6. **Regular Reviews**: Analyze trends
7. **Automation**: Alert-driven remediation
8. **Privacy**: Mask sensitive data in logs

---

**Status**: Ready for implementation
**Priority**: High
**Complexity**: Medium
