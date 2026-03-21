## ADDED Requirements

### Requirement: README reflects actual implementation technology

The README SHALL accurately describe the window management technology as PowerShell Win32 P/Invoke, not node-window-manager.

#### Scenario: Architecture diagram accuracy

- **WHEN** a contributor reads the README architecture diagram
- **THEN** it references PowerShell Win32 P/Invoke for window management, not node-window-manager

#### Scenario: Tech stack table accuracy

- **WHEN** a contributor reads the tech stack table
- **THEN** the window management row describes PowerShell Win32 P/Invoke, not node-window-manager

#### Scenario: Windows integrations table accuracy

- **WHEN** a contributor reads the Windows integrations table
- **THEN** window resize/position and snapshot detection rows reference PowerShell, not node-window-manager
