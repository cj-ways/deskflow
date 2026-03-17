## ADDED Requirements

### Requirement: Close behavior respects minimize-to-tray setting

The main window close handler SHALL check the `minimizeToTray` setting to determine whether closing the window hides it to the system tray or quits the application.

#### Scenario: Minimize to tray enabled (default)

- **WHEN** `minimizeToTray` is true and user clicks the window close button
- **THEN** the window is hidden (current behavior preserved) and DeskFlow continues running in the system tray

#### Scenario: Minimize to tray disabled

- **WHEN** `minimizeToTray` is false and user clicks the window close button
- **THEN** the application quits entirely (same as clicking Quit in the tray menu)

#### Scenario: Setting change takes effect immediately

- **WHEN** user changes `minimizeToTray` in Settings and saves
- **THEN** the next window close action uses the updated value without requiring an app restart

#### Scenario: Tray Quit always quits regardless of setting

- **WHEN** user clicks "Quit" in the system tray context menu
- **THEN** the application quits regardless of the `minimizeToTray` setting
