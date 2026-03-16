# ─── DeskFlow Custom NSIS Installer ────────────────────────────────────────────
# Included by electron-builder via the nsis.include option.
# Macros here are called by the builder's template at specific hook points.
# See: node_modules/app-builder-lib/templates/nsis/installer.nsi

!include "LogicLib.nsh"
!include "nsDialogs.nsh"
!include "WinMessages.nsh"

# ─── MUI2 Branding & Colors ─────────────────────────────────────────────────

!macro customHeader
  # Welcome page
  !define MUI_WELCOMEPAGE_TITLE "Welcome to DeskFlow ${VERSION}"
  !define MUI_WELCOMEPAGE_TEXT \
    "DeskFlow is a Windows desktop session manager that restores your \
    entire workspace in one click.$\r$\n$\r$\n\
      >Launch IDE, browser, terminal & apps together$\r$\n\
      >Arrange windows across virtual desktops$\r$\n\
      >Snapshot your current layout to save it$\r$\n$\r$\n\
    Click Next to continue."

  # Finish page
  !define MUI_FINISHPAGE_TITLE "DeskFlow Installed Successfully"
  !define MUI_FINISHPAGE_TEXT \
    "DeskFlow has been installed on your computer.$\r$\n$\r$\n\
    Click Launch DeskFlow to start managing your workspace.$\r$\n$\r$\n\
    You can also access DeskFlow from the system tray at any time."
  !define MUI_FINISHPAGE_LINK_COLOR "4F46E5"
!macroend

# ─── Welcome Page ────────────────────────────────────────────────────────────

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend

# ─── Ready to Install — Custom Summary Page ─────────────────────────────────
# Shows installation summary between directory selection and file extraction.
# Uses nsDialogs since this is a custom page (not an MUI page).

!ifndef BUILD_UNINSTALLER

Var ReadyDialog
Var ReadyTmp

!macro customPageAfterChangeDir
  Page custom ReadyPageCreate ReadyPageLeave
!macroend

Function ReadyPageCreate
  nsDialogs::Create 1018
  Pop $ReadyDialog
  ${If} $ReadyDialog == error
    Abort
  ${EndIf}

  # Title
  ${NSD_CreateLabel} 0u 0u 100% 16u "Ready to Install DeskFlow ${VERSION}"
  Pop $ReadyTmp
  CreateFont $1 "Segoe UI" 11 700
  SendMessage $ReadyTmp ${WM_SETFONT} $1 0

  # Separator
  ${NSD_CreateHLine} 0u 20u 100% 1u ""
  Pop $ReadyTmp

  # Install path
  ${NSD_CreateLabel} 0u 28u 100% 12u "Installation folder:"
  Pop $ReadyTmp
  CreateFont $1 "Segoe UI" 9 700
  SendMessage $ReadyTmp ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 12u 42u 100% 12u "$INSTDIR"
  Pop $ReadyTmp

  # What gets installed
  ${NSD_CreateLabel} 0u 62u 100% 12u "Components:"
  Pop $ReadyTmp
  CreateFont $1 "Segoe UI" 9 700
  SendMessage $ReadyTmp ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 12u 76u 100% 12u "  >DeskFlow application"
  Pop $ReadyTmp
  ${NSD_CreateLabel} 12u 90u 100% 12u "  >Virtual desktop manager"
  Pop $ReadyTmp
  ${NSD_CreateLabel} 12u 104u 100% 12u "  >Desktop and Start Menu shortcuts"
  Pop $ReadyTmp

  # Separator
  ${NSD_CreateHLine} 0u 122u 100% 1u ""
  Pop $ReadyTmp

  # Key features
  ${NSD_CreateLabel} 0u 130u 100% 12u "Key features:"
  Pop $ReadyTmp
  CreateFont $1 "Segoe UI" 9 700
  SendMessage $ReadyTmp ${WM_SETFONT} $1 0

  ${NSD_CreateLabel} 12u 144u 100% 12u "  >Restore your full workspace with one click"
  Pop $ReadyTmp
  ${NSD_CreateLabel} 12u 158u 100% 12u "  >Manage apps across virtual desktops"
  Pop $ReadyTmp
  ${NSD_CreateLabel} 12u 172u 100% 12u "  >Snapshot current layout to create profiles"
  Pop $ReadyTmp
  ${NSD_CreateLabel} 12u 186u 100% 12u "  >Runs quietly in the system tray"
  Pop $ReadyTmp

  # Bottom note
  ${NSD_CreateLabel} 0u 210u 100% 24u "Click Install to begin, or Back to change settings."
  Pop $ReadyTmp

  nsDialogs::Show
FunctionEnd

Function ReadyPageLeave
  # Proceed to install
FunctionEnd

!endif ; !BUILD_UNINSTALLER

# ─── Finish Page ─────────────────────────────────────────────────────────────
# Defines our own StartApp function since the template only defines it for the
# default finish page (which we override). Uses StdUtils.ExecShellAsUser for
# proper launch without elevation/stall issues.

!macro customFinishPage
  Function StartApp
    ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" ""
  FunctionEnd

  !define MUI_FINISHPAGE_RUN
  !define MUI_FINISHPAGE_RUN_TEXT "Launch DeskFlow"
  !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !define MUI_FINISHPAGE_LINK "View release notes on GitHub"
  !define MUI_FINISHPAGE_LINK_LOCATION "https://github.com/deskflow/deskflow/releases"
  !insertmacro MUI_PAGE_FINISH
!macroend

# ─── Uninstaller Welcome Page ────────────────────────────────────────────────

!macro customUnWelcomePage
  !define MUI_UNWELCOMEPAGE_TITLE "Uninstall DeskFlow"
  !define MUI_UNWELCOMEPAGE_TEXT \
    "This wizard will remove DeskFlow from your computer.$\r$\n$\r$\n\
    Your profiles, settings, and logs in %APPDATA%\DeskFlow will be \
    kept unless you choose to remove them.$\r$\n$\r$\n\
    Click Next to continue."
  !insertmacro MUI_UNPAGE_WELCOME
!macroend

# ─── Uninstaller: Ask About User Data ───────────────────────────────────────

!macro customUnInstall
  ${ifNot} ${isUpdated}
    MessageBox MB_YESNO|MB_ICONQUESTION \
      "Would you also like to remove your DeskFlow profiles, settings, and logs?$\r$\n$\r$\n($APPDATA\DeskFlow)" \
      IDYES removeUserData IDNO skipUserData
    removeUserData:
      RMDir /r "$APPDATA\DeskFlow"
    skipUserData:
  ${endIf}
!macroend
