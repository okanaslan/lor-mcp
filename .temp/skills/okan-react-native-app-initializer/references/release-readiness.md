# Release Readiness

Before handoff, verify:
- App display name, slug, Android package ID, and iOS bundle ID are final for the first release.
- Typecheck command exists and passes, or the gap is documented.
- Lint command exists and passes, or the gap is documented.
- Test command exists if the template or project includes tests.
- Expo start command is documented.
- EAS build commands are documented for Android and iOS.
- Manual credential steps are separate from repo-tracked files.
- No signing files, secrets, build artifacts, or local env files are staged.

Suggested handoff summary:
- Files created or changed
- Commands run and their result
- Manual setup still required
- Known risks or intentionally deferred setup
