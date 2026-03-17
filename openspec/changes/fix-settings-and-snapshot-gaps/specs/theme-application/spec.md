## ADDED Requirements

### Requirement: Theme setting controls application appearance

The system SHALL apply the saved `theme` setting (`system`, `light`, or `dark`) to both Electron's native theme and the renderer's CSS.

#### Scenario: Theme set to system

- **WHEN** theme is set to `system`
- **THEN** `nativeTheme.themeSource` is set to `'system'` and the renderer follows the OS dark/light preference

#### Scenario: Theme set to dark

- **WHEN** theme is set to `dark`
- **THEN** `nativeTheme.themeSource` is set to `'dark'` and the renderer adds a `dark` class to the `<html>` element for Tailwind dark mode styling

#### Scenario: Theme set to light

- **WHEN** theme is set to `light`
- **THEN** `nativeTheme.themeSource` is set to `'light'` and the renderer removes the `dark` class from the `<html>` element

#### Scenario: Theme applied on startup

- **WHEN** DeskFlow launches and loads settings
- **THEN** the saved theme is applied before the renderer window is shown

#### Scenario: Theme change takes effect immediately

- **WHEN** user changes the theme in Settings and saves
- **THEN** the appearance updates immediately without requiring an app restart

### Requirement: Renderer receives theme state via IPC

The renderer SHALL be able to query the current effective theme (dark or light) and receive updates when it changes, so it can toggle the `dark` CSS class on the `<html>` element.

#### Scenario: Renderer queries effective theme

- **WHEN** the renderer loads or the theme changes
- **THEN** the renderer receives whether the current effective theme is dark and updates the `dark` class accordingly

#### Scenario: System theme changes while app is running

- **WHEN** theme is set to `system` and the user changes the OS dark/light mode
- **THEN** the renderer updates its `dark` class to match the new OS preference
