## ADDED Requirements

### Requirement: All modals render correctly in dark mode

All modal components (AppEntryModal, LaunchProgressModal) SHALL use dark background, border, and text classes so they are legible when the app is in dark mode.

#### Scenario: AppEntryModal in dark mode

- **WHEN** theme is set to dark and user opens the Add/Edit App modal
- **THEN** the modal has a dark background, readable text, and visible borders — not a white box on a dark page

#### Scenario: LaunchProgressModal in dark mode

- **WHEN** theme is set to dark and user launches a profile
- **THEN** the progress modal has a dark background with readable status text and progress indicators

### Requirement: All cards and rows render correctly in dark mode

DesktopCard, AppEntryRow, and ErrorToast components SHALL use dark mode classes for backgrounds, borders, and text.

#### Scenario: DesktopCard in dark mode

- **WHEN** theme is set to dark and user is editing a profile
- **THEN** desktop cards have dark backgrounds and visible borders

#### Scenario: ErrorToast in dark mode

- **WHEN** theme is set to dark and an error toast appears
- **THEN** the toast is visible and readable against the dark page background

### Requirement: All form inputs render correctly in dark mode

All form components (IdeForm, BrowserForm, TerminalForm, AppForm) SHALL have dark background inputs with readable text and visible borders.

#### Scenario: Form inputs in dark mode

- **WHEN** theme is set to dark and user is filling out any app entry form
- **THEN** input fields have dark backgrounds, light text, and visible borders

### Requirement: PositionPicker and UpdateBanner render correctly in dark mode

Utility components SHALL be styled for dark mode.

#### Scenario: PositionPicker in dark mode

- **WHEN** theme is set to dark and user is selecting a window position
- **THEN** the grid cells and preset buttons are visible with appropriate contrast

#### Scenario: UpdateBanner in dark mode

- **WHEN** theme is set to dark and an update is available
- **THEN** the update banner is visible and readable

### Requirement: Settings page sections render correctly in dark mode

Settings page section headers, labels, descriptions, toggles, and inputs SHALL use dark mode classes.

#### Scenario: Settings page in dark mode

- **WHEN** theme is set to dark and user opens Settings
- **THEN** all section borders, labels, descriptions, inputs, and toggles are readable with appropriate contrast
