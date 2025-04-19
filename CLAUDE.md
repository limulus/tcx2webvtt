# tcx2webvtt Helper Guide

See `PLAN.md` to learn what the purpose and plan is for this project.

## Software Development Methodology

- Use Test Driven Development:
  - Write tests first
  - Ensure new tests fail
  - Write minimal production code to make tests pass
  - Consider refactoring production code
  - Ensure tests continue to pass

## Commands

- Build: `npm run build`
- Clean: `npm run clean`
- Lint: `npm run lint`
- Fix linting: `npm run lint:fix`
- Type check: `npm run tscc`
- Test (all): `npm run test`
- Test (single file): `npm test -- src/path/to/file.spec.ts`
- Verify (lint+test+typecheck): `npm run verify`

## Code Style Guidelines

- **ESM**: Use ES Modules (`import/export` not `require()`)
- **File Extensions**: Always include `.js` in imports (e.g., `import x from './x.js'`)
- **Typing**: Use strict TypeScript typing, prefer interfaces for object types
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
