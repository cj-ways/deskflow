## ADDED Requirements

### Requirement: Users can edit detected app entries before saving

The Snapshot Review page SHALL allow users to edit any detected app entry by opening the existing AppEntryModal in edit mode with the entry's current values pre-filled.

#### Scenario: Edit a detected app entry

- **WHEN** user clicks the Edit button on a detected app row in the Snapshot Review page
- **THEN** the AppEntryModal opens in edit mode with the entry's current type, paths, position, and delay pre-filled
- **AND WHEN** user modifies fields and clicks Save
- **THEN** the entry is updated in the draft and the Snapshot Review page reflects the changes

#### Scenario: Edit preserves entry type

- **WHEN** user edits a detected app entry
- **THEN** the type selection step is skipped (same as editing in the profile editor) since the type is already determined

### Requirement: Users can delete detected app entries before saving

The Snapshot Review page SHALL allow users to remove unwanted detected entries from the draft before saving.

#### Scenario: Delete a detected app entry

- **WHEN** user clicks the Delete button on a detected app row
- **THEN** the entry is removed from the draft immediately (no confirmation needed since this is a draft, not saved data)
- **AND** the app count in the header updates to reflect the removal

#### Scenario: Delete all apps from a desktop

- **WHEN** user deletes all app entries from a desktop in the snapshot draft
- **THEN** the desktop remains visible with an "No apps" empty state (desktop is not auto-removed)

#### Scenario: Saved profile reflects edits

- **WHEN** user edits and/or deletes entries and then clicks "Save as Profile"
- **THEN** the saved profile contains only the entries as they were after editing/deleting, not the original detected values
