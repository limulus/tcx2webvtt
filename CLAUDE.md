# tcx2webvtt Helper Guide

## Software Development Methodology

- Use Test Driven Development:
  1. Write tests
  2. Run tests to ensure they fail the expected way
  3. Write minimal production code to make tests pass
  4. Refactor production code
  5. Run tests again to ensure tests continue to pass

## Code Style Guidelines

- **ESM**: Use ES Modules (`import/export` not `require()`)
- **File Extensions**: Always include `.js` in imports (e.g., `import x from './x.js'`)
- **Typing**: Use strict TypeScript typing, prefer interfaces for object types
- **Semicolons**: Do not use semicolons to end statements (rely on ASI)
- **Naming**:
  - Classes: PascalCase
  - Methods/variables: camelCase
  - Files: kebab-case for modules
- **Testing**: 100% coverage required (functions, branches, lines, statements)
- **Error Handling**: Use typed errors and proper propagation
- **Comments**:
  - Only add comments to explain _why_ code is doing something unusual or non-obvious
  - Avoid comments that merely describe _what_ the code is doing (the code already shows that)
  - Use JSDoc for public API documentation where appropriate
- **Project Structure**:
  - `src/lib/` - Core functionality
  - `src/bin/` - CLI entry points
  - `src/mocks/` - Test mocks
- **Type Safety**:
  - Avoid the use of the `any` type in implementation code. Prefer `unknown` when the type is not known. It can be ok to use `any` in edge-case tests.
- **Error Handling and Assertions**:
  - Prefer runtime assertions over defensive conditionals that are difficult to test and tedious to cover.

## Commands

- Build: `npm run build`
- Clean: `npm run clean`
- Lint: `npm run lint`
- Fix linting: `npm run lint:fix`
- Type check: `npm run tscc`
- Test (all): `npm run test`
- Test (single file): `npm test -- src/path/to/file.spec.ts`
- Verify (lint+test+typecheck): `npm run verify`

## Commit Message Guidelines

Versions of this software are automatically determined by `semantic-release`. Follow
`conventionalcommits.org` standard, specifically the `@commitlint/config-conventional`
format.

- `feat: msg`: features
- `fix: msg`: bug fixes
- `refactor: msg`: code improvements that do not affect functionality
- `test: msg`: changes in tests only, does not affect functionality
- `docs: msg`: changes to documentation
- `ci: msg`: build pipeline
- `chore: msg`: updating dependencies, miscellany
- Breaking changes to exposed APIs surfaces must be documented with a footer/trailer. For
  example:

  ```
  feat: remove the `POST /api/spline/reticulate` endpoint

  BREAKING CHANGE: Support for previously deprecated spline reticulation
    has been removed. Use `POST /api/spline/frobnicate` instead.
  ```

- Scopes may also be used:
  - `feat(ui): increase button roundness`
  - `docs(readme): add frobnication section`
  - `chore(dev-deps): update dev dependencies`
  - `chore(deps): update dependencies`

Only certain commit messages will trigger changes to the semantic version of the software:

- A breaking change will trigger a major version bump, regardless of the prefix
- The `feat` prefix bumps the minor version
- The `fix` prefix bumps the patch version
- All other commit messages have no effect on the version

- Do not include the string `Breaking change:` in a commit message unless there is a breaking change.