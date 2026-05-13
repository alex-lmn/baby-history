// OpenTelemetry : tracing + métriques exposées au format Prometheus
// Doit être chargé AVANT express pour instrumenter automatiquement HTTP/Express/PG.
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { Resource } = require('@opentelemetry/resources');
const {
  SemanticResourceAttributes,
} = require('@opentelemetry/semantic-conventions');
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const PROM_PORT = parseInt(process.env.OTEL_PROM_PORT || '9464', 10);

const prometheusExporter = new PrometheusExporter(
  { host: '0.0.0.0', port: PROM_PORT, endpoint: '/metrics' },
  () => {
    console.log(
      `[otel] métriques Prometheus disponibles sur :${PROM_PORT}/metrics`
    );
  }
);

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME || 'baby-backend',
  }),
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // on désactive fs (trop de bruit)
      '@opentelemetry/instrumentation-fs': { enabled: false },
    }),
  ],
});

sdk.start();
console.log('[otel] SDK démarré');

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
