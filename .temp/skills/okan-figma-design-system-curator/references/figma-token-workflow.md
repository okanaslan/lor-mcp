# Figma Token Workflow

Use this workflow for Figma variables, token values, and theme work.

## Inspect

- Find the existing variable collections and modes before proposing token changes.
- Record current values for affected tokens and confirm which family is in scope.
- Check representative bound UI so token changes do not accidentally affect unrelated surfaces.

## Propose

- For exploratory work, use local fills in review frames and label values clearly.
- Keep alternatives scoped to the token family under discussion, such as shell colors or urgency surfaces.
- Do not imply that exploratory values are active tokens until the user chooses them.

## Apply

- Update existing variables directly only after the user approves a direction.
- Do not create new variables, aliases, collections, or modes unless explicitly requested.
- Keep unrelated token families unchanged.
- Prefer variable bindings over manual recoloring of bound product layers.

## Validate

- Verify exact target values on all affected variables.
- Verify excluded variables remain unchanged.
- Check representative bound frames for visual coherence.
- Check for hardcoded colors where token binding is expected.
- Report any risk caused by missing variables, missing modes, or ambiguous token names.
