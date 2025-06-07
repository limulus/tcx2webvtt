# tcx2webvtt Helper Guide

## Software Development Methodology

- Use Test Driven Development:
  1. Write tests
  2. Run tests to ensure they fail the expected way
  3. Write minimal production code to make tests pass
  4. Refactor production code
  5. Run tests again to ensure tests continue to pass

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
