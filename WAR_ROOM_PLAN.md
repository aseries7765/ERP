# War Room Plan

## Staffing (launch day)
- Launch commander (acts as IC for any incident, per INCIDENT_RUNBOOK.md)
- Technical leads from each major module (foundation, business, AI,
  security, K8s/observability)
- Communications lead
- Scribe

## Location
Dedicated video call kept open for the duration + `#war-room` Slack
channel for async updates and the scribe's running log.

## Big-screen dashboards
- Error rate / latency (M14)
- Security anomaly dashboard (this module's `SecurityAnomalyEvent`
  data, once a dashboard UI exists to render it — not built in this
  slice)
- Active user count / onboarding funnel

## Exit criteria
War room stands down after the monitoring period defined in
GO_LIVE_PLAN.md (T+24h health review, extended if any issues are
still being actively worked).

## Status: staffing plan only — no real launch has occurred, no one
has actually been assigned to these roles.
