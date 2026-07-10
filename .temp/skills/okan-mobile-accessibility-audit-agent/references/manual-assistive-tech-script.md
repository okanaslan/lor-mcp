# Manual Assistive-Tech Script

Use this reference to produce concise VoiceOver/TalkBack verification steps.

## Setup

Capture:

- Device and OS version.
- Build type: simulator, dev-client, TestFlight/internal, release.
- App language and theme.
- Account state and test data.
- Assistive tech used: VoiceOver or TalkBack.

## Baseline Flow

1. Launch the app with screen reader enabled.
2. Navigate to the target tab/screen using swipe gestures.
3. Confirm screen title/context is understandable.
4. Swipe through controls in order and note confusing, missing, repeated, or stale announcements.
5. Activate primary actions and confirm state changes are understandable.
6. Open and close any modal/sheet using accessible controls and platform back where relevant.
7. Complete any form fields and trigger validation.
8. Test loading, empty, error, disabled, and pending states when possible.

## Gesture And Custom Control Checks

- For swipe actions, confirm action labels are announced and activation is possible or an alternative exists.
- For segmented controls/tabs, confirm selected state is announced.
- For switches/toggles, confirm checked and disabled states are announced.
- For expand/collapse sections, confirm expanded state changes are announced.
- For charts/status bars, confirm data is available as text or meaningful labels.

## Dynamic Type And Visual Checks

- Increase system text size and revisit the target flow.
- Confirm critical labels, buttons, inputs, and errors are not clipped.
- Confirm content can scroll when larger text increases height.
- Check dark/light mode when color or status meaning is relevant.

## Result Format

For each issue:

- Step.
- Expected announcement/behavior.
- Actual announcement/behavior.
- Severity: Blocking, Recommended, Optional.
- Suggested fix or affected component.
