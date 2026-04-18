# Teamwork Continuation

- In multi-agent work, preserve continuity with a compact handoff instead of relying on long transcript history.
- Every serious handoff should capture: objective, acceptance criteria, active files, completed work, remaining work, blockers, verification state, and next step.
- If implementation is blocked by context or model limits, switch to the backup implementation path using the handoff packet.
- Do not restart discovery unless the handoff is materially incomplete or stale.
- After compaction, treat the compacted state as the new source of truth for continuation.
