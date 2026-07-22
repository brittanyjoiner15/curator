import posthog from 'posthog-js'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30',
  capture_exceptions: true,
  // Web vitals autocapture is opt-in (not enabled by `defaults`); turn it on so
  // Core Web Vitals (LCP/INP/CLS/FCP) populate the web analytics dashboard.
  capture_performance: { web_vitals: true },
})
