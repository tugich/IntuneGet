-- Remove Store apps that already exist as Win32/WinGet packages in the catalog.
-- These duplicates cause confusion since users can already deploy them via WinGet.
--
-- Removed:
--   Windows Terminal  (9N0DX20HK701) -> Microsoft.WindowsTerminal
--   Python 3          (9NRWMJP3717K) -> Python.Python.3.12
--   Skype             (9WZDNCRFJ364) -> Microsoft.Skype
--   Sysinternals Suite(9P7KNL5RWT25) -> Microsoft.Sysinternals.Suite
--   Microsoft 365     (9WZDNCRD29V9) -> Microsoft.Office
--
-- Kept (Store-only):
--   Company Portal    (9WZDNCRFJ3PZ) - Intune enrollment, no WinGet equivalent
--   Microsoft To Do   (9NBLGGH5R558) - No WinGet package
--   Microsoft Whiteboard (9MSPC6MP8FM4) - No WinGet package
--   Mail and Calendar (9WZDNCRFHVQM) - No WinGet package
--   WhatsApp          (9NKSQGP7F2NH) - No WinGet package

DELETE FROM curated_apps
WHERE app_source = 'store'
  AND store_package_id IN (
    '9N0DX20HK701',  -- Windows Terminal
    '9NRWMJP3717K',  -- Python 3
    '9WZDNCRFJ364',  -- Skype
    '9P7KNL5RWT25',  -- Sysinternals Suite
    '9WZDNCRD29V9'   -- Microsoft 365 (Office)
  );
