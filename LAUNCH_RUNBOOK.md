# Launch Runbook

Step-by-step operator instructions for the go-live sequence described
in GO_LIVE_PLAN.md.

## Pre-flight (T-24h)
```
[ ] Confirm LAUNCH_CHECKLIST.md pre-launch section 100% complete
[ ] Confirm on-call rotation staffed for the launch window + 48h after
[ ] Confirm rollback path tested in staging within the last week
[ ] Freeze non-critical deploys to main until launch completes
```

## Launch window (T-0)
```
[ ] Announce launch start in #war-room (see WAR_ROOM_PLAN.md)
[ ] Deploy: <exact CD command — depends on M14's pipeline, not specified here>
[ ] Verify deployment health check green
[ ] Run smoke test suite: auth login, one core business transaction,
    verify security headers present (curl -I against the live URL,
    check for Strict-Transport-Security, Content-Security-Policy, etc.
    per docs/security/OWASP_TOP_10.md A05 section)
[ ] Verify security anomaly dashboard shows no unexpected spike
[ ] Announce launch complete in #war-room
```

## Rollback trigger
If any smoke test fails or a CRITICAL issue surfaces, invoke
ROLLBACK_PLAN.md immediately — don't wait for war-room consensus,
the on-duty IC can call it.

## Status: procedural template; exact deploy commands depend on
infrastructure decided outside this module (M14/S1), not filled in
here.
