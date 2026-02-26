-- Add additional Store-only enterprise apps that have no WinGet equivalent.

INSERT INTO curated_apps (winget_id, name, publisher, latest_version, description, category, app_source, store_package_id, icon_path, is_verified, popularity_rank)
VALUES
  ('9MZ95KL8MR0L', 'Snipping Tool', 'Microsoft Corporation', '1.0',
   'Capture, annotate, and share screenshots and screen recordings.',
   'Utilities', 'store', '9MZ95KL8MR0L',
   'https://store-images.s-microsoft.com/image/apps.39793.13878650002538161.3f27413b-237a-452f-a9d4-28acfb7ff8a3.bbcbcce7-586d-4cfa-ab27-e9edccb8df41',
   TRUE, 1055),

  ('9NBLGGH4QGHW', 'Microsoft Sticky Notes', 'Microsoft Corporation', '1.0',
   'Quick notes that sync across your devices via Microsoft 365.',
   'Productivity', 'store', '9NBLGGH4QGHW',
   'https://store-images.s-microsoft.com/image/apps.9812.13510798887395106.c059f161-f43c-4084-b47e-8036e0b7e1ae.b456746b-669b-49e9-bfd5-6183e2c7883f',
   TRUE, 1060),

  ('9PM860492SZD', 'Microsoft PC Manager', 'Microsoft Corporation', '1.0',
   'Utility app that enhances PC performance with one-click cleanup, storage management, and security checks.',
   'Utilities', 'store', '9PM860492SZD',
   'https://store-images.s-microsoft.com/image/apps.30182.14298090620665013.5f51c563-124d-42ac-b2db-46d92223b052.ec196487-683c-47b3-aba5-47cc47815c97',
   TRUE, 1065),

  ('9NP83LWLPZ9K', 'Apple Devices', 'Apple Inc.', '1.0',
   'Manage and sync iPhone, iPad, and iPod touch from Windows. Replaces iTunes for device management.',
   'Utilities', 'store', '9NP83LWLPZ9K',
   'https://store-images.s-microsoft.com/image/apps.61849.13723399820527564.6739a27d-6f12-4766-bf40-4157b3a81254.6fc73e86-7f71-4ed5-81cb-57cf0b19634a',
   TRUE, 1070),

  ('9WZDNCRFJ4MV', 'Lenovo Vantage', 'Lenovo Group Ltd.', '1.0',
   'Manage Lenovo device settings, run diagnostics, update drivers, and optimize performance.',
   'Utilities', 'store', '9WZDNCRFJ4MV',
   'https://store-images.s-microsoft.com/image/apps.56007.9007199266245619.fdfb1c62-4857-4684-bb35-f6ee88fcca67.8e1bd370-5179-450e-84b0-fc8354d7b145',
   TRUE, 1075),

  ('9WZDNCRFJ3PS', 'Microsoft Remote Desktop', 'Microsoft Corporation', '1.0',
   'Connect to remote PCs and desktops with the modern Remote Desktop client.',
   'Networking', 'store', '9WZDNCRFJ3PS',
   'https://store-images.s-microsoft.com/image/apps.10633.9007199266246189.0f9b9d85-2b2c-41d1-8d5b-613399fdbc72.e7f1d76a-d2ab-4e10-aec0-0331716683e4',
   TRUE, 1080)

ON CONFLICT (winget_id) DO UPDATE SET
  app_source = EXCLUDED.app_source,
  store_package_id = EXCLUDED.store_package_id,
  icon_path = EXCLUDED.icon_path,
  popularity_rank = EXCLUDED.popularity_rank;
