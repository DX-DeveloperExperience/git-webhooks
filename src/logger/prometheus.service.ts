import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PrometheusService {
  checkoutsTotal;
  httpRequestDurationMicroseconds;
  Prometheus;

  constructor() {
    this.Prometheus = require('prom-client');
    try {
      this.Prometheus.collectDefaultMetrics();
    } catch (err) {
      Logger.error(err, 'collectDefaultMetrics');
    }

    try {
      this.httpRequestDurationMicroseconds = new this.Prometheus.Histogram({
        name: 'http_request_duration_ms',
        help: 'Duration of HTTP requests in ms',
        labelNames: ['method', 'route', 'code'],
        buckets: [50, 100, 200, 300, 400, 500, 750, 1000], // buckets for response time from 50ms to 1000ms
      });
    } catch (e) {
      Logger.error(e, 'Prometheus.Histogram');
    }
  }
}
