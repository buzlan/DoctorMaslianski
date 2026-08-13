# TASK-002 — Basic UI primitives

Status: NOT STARTED

Milestone: M1 — Application Foundation

## Goal

Tiny shared primitives: `Screen`, `AppText`, and a layout spacer/stack.

No button yet unless TASK-003 cannot ship without one.

## Why this task is needed

Tab screens and later Today should not each invent SafeArea and typography.

## Dependencies

- TASK-001

## Requirements

- Primitives live in `src/shared/ui/`.
- Consume design tokens from TASK-001.
- No business logic. Presentation only.
- Use the primitives from the current screen.

## Out of scope

- Forms
- Cards for every future screen
- Icon set
- Design-system documentation site
- Product functionality
- Environment configuration

## Expected files or areas affected

- `src/shared/ui/*`
- Existing screens that should use the primitives

## New dependencies

No.

## Plan Mode

No, if TASK-001 already settled `shared/` conventions.

## Acceptance criteria

- Primitives are used by the current screen.
- No new product behavior.
- The application remains runnable.

## Verification

```bash
npx tsc --noEmit
npm run lint
```

Manually verify both platforms still launch.
