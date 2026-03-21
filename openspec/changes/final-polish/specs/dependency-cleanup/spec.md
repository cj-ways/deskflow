## ADDED Requirements

### Requirement: No unused production dependencies

package.json SHALL NOT contain production dependencies that have zero imports in the source code.

#### Scenario: Remove @cj-ways/orgclone

- **WHEN** a developer runs `npm install`
- **THEN** `@cj-ways/orgclone` is NOT installed because it has been removed from package.json

#### Scenario: Build still succeeds after removal

- **WHEN** the unused dependency is removed and `npm run lint` and `tsc --noEmit` are run
- **THEN** both pass with zero errors
