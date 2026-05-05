/* ============================================================
   ANALYTICS — PostHog wrapper for ES module consumers
   ============================================================ */

/**
 * Fire a PostHog event. Safe to call before posthog is fully loaded
 * because the CDN snippet stubs the queue until the library arrives.
 *
 * @param {string} event  - snake_case event name
 * @param {object} props  - additional properties (no PII)
 */
export function capture(event, props = {}) {
  window.posthog?.capture(event, props);
}
