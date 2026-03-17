## ADDED Requirements

### Requirement: Start with Windows toggle controls login item registration

The system SHALL call `app.setLoginItemSettings({ openAtLogin: value })` whenever the `startWithWindows` setting is saved, so that DeskFlow is registered or unregistered as a Windows login item accordingly. This SHALL only take effect when `app.isPackaged` is true (not in development mode).

#### Scenario: User enables Start with Windows

- **WHEN** user toggles "Start with Windows" to ON and saves settings
- **THEN** `app.setLoginItemSettings({ openAtLogin: true })` is called and DeskFlow launches automatically on next Windows sign-in

#### Scenario: User disables Start with Windows

- **WHEN** user toggles "Start with Windows" to OFF and saves settings
- **THEN** `app.setLoginItemSettings({ openAtLogin: false })` is called and DeskFlow no longer launches on sign-in

#### Scenario: Development mode skips login item

- **WHEN** settings are saved with `startWithWindows: true` but `app.isPackaged` is false
- **THEN** `setLoginItemSettings` is NOT called (no-op in development)

#### Scenario: Setting applied on app startup

- **WHEN** DeskFlow starts and loads settings from disk
- **THEN** the `startWithWindows` value is applied via `setLoginItemSettings` to ensure the login item state matches the saved setting
