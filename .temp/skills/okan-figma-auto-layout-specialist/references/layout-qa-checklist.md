# Layout QA Checklist

Run this checklist before reporting layout work complete.

## Structural Checks

- Target frames are not collapsed.
- No intended content is hidden by clipping.
- Text is not clipped after font, copy, or sizing changes.
- Children do not overflow unexpectedly.
- Parent and child Auto Layout directions match the intended visual structure.

## Sizing Checks

- Content-led rows, cards, buttons, chips, forms, and text groups use `Hug contents` where appropriate.
- Full-width rows, cards, content columns, sheet bodies, and list items use `Fill container` only inside Auto Layout parents.
- Fixed sizing remains only on viewport frames, phone previews, icons, tab bars, and deliberately locked examples.
- Scroll-review documentation frames are tall enough to show intended content.
- No arbitrary fixed vertical heights remain on content-driven cards or rows.

## Preservation Checks

- Visual design, product copy, colors, token bindings, and component intent are unchanged unless explicitly requested.
- Component instances are not broken or detached unexpectedly.
- No token values, component variants, product flows, or page organization changed as a side effect.
- The final report names the repaired frames/components and any fixed dimensions kept intentionally.
