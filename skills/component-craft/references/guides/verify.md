# Prove

## Matrix

Build a preview that shows, at once or through controls:
- every variant × every size
- every state from the state matrix, plus the risky combinations
- edge-case content (empty, long, pasted)
- each theme, `dir="rtl"`, and a narrow container

Use component-lab when available; otherwise the project's playground or
Storybook. Show the user the matrix, not a single happy-path screenshot.

Done when: the user has seen the matrix and approved or commented on it.

## Tests

Test behavior a consumer relies on, following the project's test conventions:
- keyboard map rows
- controlled and uncontrolled value changes
- form submission, reset, and error association
- focus return after overlays close
- accessible role and name queries (`getByRole`) rather than class names

Avoid snapshot tests of markup; they lock in implementation, not behavior.
Add visual regression only if the project already has it.

Done when: tests cover the keyboard map and value flow, and pass.

## Docs

Write short usage docs next to the component or where the project keeps them:
- when to use it and when to use something else
- a basic example, a form example, and one composition example
- props table or typed props with comments
- accessibility notes consumers must handle (for example, an icon-only
  variant needs `aria-label`)

Done when: a new teammate could use the component correctly from the docs alone.
