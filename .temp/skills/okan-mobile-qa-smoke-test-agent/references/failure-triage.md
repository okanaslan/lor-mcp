# Mobile QA Failure Triage

Use this reference after failed automated checks or manual smoke failures.

## Automated Failure Summary

For each failing command, capture:

- Command.
- First failing test or error block.
- Likely affected feature or file.
- Whether failure is deterministic or likely environment-related.
- Minimal rerun command.

Avoid pasting long logs; include only the lines needed to identify cause.

## Manual Failure Summary

Capture:

- Device, OS, build type, and account state.
- Exact reproduction steps.
- Expected result.
- Actual result.
- Screenshots/logs if available.
- Whether the issue blocks release or is a recommended follow-up.

## Classification

- `Blocking`: app crash, unusable primary flow, auth/session broken, data loss, paid access broken, submission-blocking native issue.
- `Recommended`: visible regression with workaround, flaky but important flow, degraded error/loading/empty state.
- `Optional`: polish, copy, minor layout, or low-risk edge case.

## Fix Direction

Give one concrete next step:

- Code area to inspect.
- Test to add or update.
- Config/env/device state to correct.
- Backend/API dependency to verify.
- Manual rerun step after fix.
