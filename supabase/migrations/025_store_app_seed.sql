-- Seed Microsoft Store apps into curated_apps
-- These are the most commonly deployed Store apps in enterprise environments.
-- They use app_source='store' and store_package_id for the MS Store product ID.
-- Popularity ranks start at 1001+ to avoid colliding with Win32 app ranks.

INSERT INTO curated_apps (winget_id, name, publisher, latest_version, description, category, app_source, store_package_id, is_verified, popularity_rank)
VALUES
  ('9WZDNCRFJ3PZ', 'Company Portal', 'Microsoft Corporation', '1.0', 'Microsoft Intune Company Portal allows employees to access corporate resources, install apps, and manage device compliance.', 'Business', 'store', '9WZDNCRFJ3PZ', TRUE, 1001),
  ('9N0DX20HK701', 'Windows Terminal', 'Microsoft Corporation', '1.0', 'A modern, rich, and performant terminal application for command-line users.', 'Developer Tools', 'store', '9N0DX20HK701', TRUE, 1005),
  ('9NRWMJP3717K', 'Python 3', 'Python Software Foundation', '1.0', 'Python programming language interpreter from the Microsoft Store.', 'Developer Tools', 'store', '9NRWMJP3717K', TRUE, 1015),
  ('9NBLGGH5R558', 'Microsoft To Do', 'Microsoft Corporation', '1.0', 'A task management app to help you stay organized and manage your day-to-day.', 'Productivity', 'store', '9NBLGGH5R558', TRUE, 1020),
  ('9MSPC6MP8FM4', 'Microsoft Whiteboard', 'Microsoft Corporation', '1.0', 'A freeform digital canvas where ideas, content, and people come together.', 'Productivity', 'store', '9MSPC6MP8FM4', TRUE, 1025),
  ('9WZDNCRFHVQM', 'Microsoft Outlook', 'Microsoft Corporation', '1.0', 'Official Microsoft Outlook email client for Windows.', 'Productivity', 'store', '9WZDNCRFHVQM', TRUE, 1030),
  ('9NKSQGP7F2NH', 'WhatsApp', 'WhatsApp LLC', '1.0', 'Simple, reliable, private messaging and calling for free.', 'Communication', 'store', '9NKSQGP7F2NH', TRUE, 1035),
  ('9WZDNCRFJ364', 'Microsoft Power Automate', 'Microsoft Corporation', '1.0', 'Automate workflows between your favorite apps and services.', 'Business', 'store', '9WZDNCRFJ364', TRUE, 1040),
  ('9P7KNL5RWT25', 'Sysinternals Suite', 'Microsoft Corporation', '1.0', 'Windows system utilities for troubleshooting and diagnostics.', 'Utilities', 'store', '9P7KNL5RWT25', TRUE, 1045),
  ('9WZDNCRD29V9', 'Microsoft 365 (Office)', 'Microsoft Corporation', '1.0', 'Hub for Microsoft 365 apps and documents.', 'Productivity', 'store', '9WZDNCRD29V9', TRUE, 1050)
ON CONFLICT (winget_id) DO UPDATE SET
  app_source = EXCLUDED.app_source,
  store_package_id = EXCLUDED.store_package_id,
  popularity_rank = EXCLUDED.popularity_rank;
