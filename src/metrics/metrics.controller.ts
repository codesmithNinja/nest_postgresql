import { Controller, Get, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import * as client from 'prom-client';

@ApiTags('Monitoring')
@Controller('metrics')
export class MetricsController {
  private readonly register: client.Registry;

  constructor() {
    this.register = new client.Registry();

    // Add default metrics
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'campaign_service_',
    });

    // Custom metrics - registered but not exposed as properties to avoid unused variable warnings
    new client.Counter({
      name: 'campaign_service_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    new client.Histogram({
      name: 'campaign_service_http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.register],
    });

    new client.Gauge({
      name: 'campaign_service_database_connections',
      help: 'Number of database connections',
      labelNames: ['database_type'],
      registers: [this.register],
    });

    new client.Gauge({
      name: 'campaign_service_active_users',
      help: 'Number of active users',
      registers: [this.register],
    });

    new client.Gauge({
      name: 'campaign_service_campaigns_total',
      help: 'Total number of campaigns',
      labelNames: ['status'],
      registers: [this.register],
    });
  }

  @Get()
  @Public()
  @Header('Content-Type', client.register.contentType)
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({
    status: 200,
    description: 'Prometheus metrics in text format',
    headers: {
      'Content-Type': {
        description: 'Prometheus metrics content type',
        schema: {
          type: 'string',
          example: 'text/plain; version=0.0.4; charset=utf-8',
        },
      },
    },
  })
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
