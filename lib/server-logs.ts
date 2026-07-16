import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { SeverityNumber } from '@opentelemetry/api-logs'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { after } from 'next/server'

let provider: LoggerProvider | null = null

export function getLoggerProvider(): LoggerProvider {
  if (!provider) {
    provider = new LoggerProvider({
      resource: resourceFromAttributes({ 'service.name': 'stash' }),
      processors: [
        new BatchLogRecordProcessor({
          exporter: new OTLPLogExporter({
            url: `${process.env.NEXT_PUBLIC_POSTHOG_HOST}/i/v1/logs`,
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_POSTHOG_KEY}`,
              'Content-Type': 'application/json',
            },
          }),
        }),
      ],
    })
  }
  return provider
}

// Include posthogDistinctId in attributes to link the log to a PostHog person.
type LogAttributes = Record<string, string | number | boolean | null | undefined>

function emit(severityNumber: SeverityNumber, severityText: string, message: string, attributes: LogAttributes) {
  const clean = Object.fromEntries(
    Object.entries(attributes).filter(([, v]) => v !== null && v !== undefined)
  ) as Record<string, string | number | boolean>

  getLoggerProvider().getLogger('stash').emit({ body: message, severityNumber, severityText, attributes: clean })
  scheduleFlush()
}

// Route handlers can freeze before the batch processor sends, so flush after the
// response. after() throws outside a request scope (e.g. onRequestError) — fall
// back to a fire-and-forget flush there.
function scheduleFlush() {
  const p = getLoggerProvider()
  try {
    after(() => p.forceFlush().catch(() => {}))
  } catch {
    void p.forceFlush().catch(() => {})
  }
}

export const serverLog = {
  info: (message: string, attributes: LogAttributes = {}) => emit(SeverityNumber.INFO, 'INFO', message, attributes),
  warn: (message: string, attributes: LogAttributes = {}) => emit(SeverityNumber.WARN, 'WARN', message, attributes),
  error: (message: string, attributes: LogAttributes = {}) => emit(SeverityNumber.ERROR, 'ERROR', message, attributes),
}
