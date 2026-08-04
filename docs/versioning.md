# Versioning And Changelog

LOR tracks project versions starting from `1.0.0`.

## Source Of Truth

- `VERSION`: current project version.
- `CHANGELOG.md`: notable changes by version.

## Versioning Rules

Use Semantic Versioning:

- `MAJOR`: incompatible changes to MCP tool contracts, persisted catalog
  compatibility, runtime setup, or documented user workflows.
- `MINOR`: backward-compatible tools, features, catalog behavior, or workflow
  additions.
- `PATCH`: backward-compatible fixes, internal cleanup, and documentation
  corrections.

## Changelog Rules

- Keep an `[Unreleased]` section at the top.
- Add user-visible changes under `Added`, `Changed`, `Fixed`, `Deprecated`,
  `Removed`, or `Security`.
- Move unreleased entries into a dated version section when cutting a version.
- Mention verification in commit messages or release notes, not in every
  changelog entry.

## Release Checklist

1. Decide the next Semantic Versioning bump.
2. Update `VERSION`.
3. Move relevant `CHANGELOG.md` entries from `[Unreleased]` to the new dated
   version section.
4. Run the project verification commands.
5. Commit the version and changelog update.
