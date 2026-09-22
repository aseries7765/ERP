# Incident Runbook (Launch Window)

During the launch window and the following 48 hours, incident response
follows docs/security/INCIDENT_RESPONSE.md with these launch-specific
additions:

1. Any incident during this window is automatically CRITICAL severity
   for triage purposes (even if it would normally be HIGH) — first
   impressions matter disproportionately at launch, and the team is
   already assembled in the war room.
2. The launch commander (see WAR_ROOM_PLAN.md) acts as Incident
   Commander for any incident during this window, rather than
   following the normal on-call assignment — avoids handoff confusion
   while everyone is already present.
3. Communication cadence tightens to every 15 minutes (vs. the normal
   30 minutes in COMMUNICATION_PLAN.md) given the higher visibility of
   a launch.

After 48 hours with no CRITICAL incidents, revert to normal
INCIDENT_RESPONSE.md procedures and cadence.
