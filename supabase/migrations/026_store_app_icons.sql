-- Seed icon_path for Microsoft Store apps with verified Display Catalog CDN URLs.
-- These icons appear on catalog cards without requiring a runtime API call.
-- Only sets icon_path when NULL to avoid overwriting runtime-updated values.

-- Also fixes app names that were incorrect in the 025 seed:
--   9WZDNCRFHVQM is "Mail and Calendar" (was seeded as "Microsoft Outlook")
--   9WZDNCRFJ364 is "Skype" (was seeded as "Microsoft Power Automate")

UPDATE curated_apps SET
  name = 'Mail and Calendar',
  description = 'Built-in Mail and Calendar app for Windows.',
  icon_path = 'https://store-images.s-microsoft.com/image/apps.28355.9007199266248608.6a399a57-b260-4ce9-b265-c47558f755e1.b4124129-26e8-401d-9989-f8689f69fa3a'
WHERE store_package_id = '9WZDNCRFHVQM';

UPDATE curated_apps SET
  name = 'Skype',
  description = 'Stay connected with free video calls, messaging, and screen sharing.',
  icon_path = 'https://store-images.s-microsoft.com/image/apps.25631.9007199266245651.4814b832-0dd8-4d65-bd41-00e99d820f30.c66bc735-6539-42fb-901b-1691a304c303'
WHERE store_package_id = '9WZDNCRFJ364';

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.10769.9007199266246184.7b7dea7e-e480-4008-b420-a807cc23c9cf.4d0fe093-40ab-4d97-8baf-c5263a583e14'
WHERE store_package_id = '9WZDNCRFJ3PZ' AND icon_path IS NULL; -- Company Portal

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.8232.13926773940052066.8978812d-6c65-429b-835d-2cecd178e2d7.7cb2976d-0593-49c3-8ab7-8bce4a09d750'
WHERE store_package_id = '9N0DX20HK701' AND icon_path IS NULL; -- Windows Terminal

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.26308.14374839563883736.98eac5ce-53c8-45b6-9ba3-7f6a7e9c0f4b.18f4b512-8c8b-41a9-9872-5819ca7f4a5a'
WHERE store_package_id = '9NRWMJP3717K' AND icon_path IS NULL; -- Python 3

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.19449.13510798887304077.23063538-cc5b-48a6-877b-3b83e2722bce.a2a2a9ec-fa0d-4f57-912d-c4f1d8fac407'
WHERE store_package_id = '9NBLGGH5R558' AND icon_path IS NULL; -- Microsoft To Do

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.1155.13824105887454405.4132b91c-7a9c-494e-b21d-fcef1f82a553.93460950-e7b0-4133-a05a-3bec4fb0d3bd'
WHERE store_package_id = '9MSPC6MP8FM4' AND icon_path IS NULL; -- Microsoft Whiteboard

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.24455.13655054093851568.071e6e08-08c8-4d08-9362-1638010148d9.ce8cbd38-7d95-4777-9550-59bff487fac3'
WHERE store_package_id = '9NKSQGP7F2NH' AND icon_path IS NULL; -- WhatsApp

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.42486.14106055032135034.107f3197-03b3-4b1d-8806-e3f6b8c92a35.8c4d8440-7293-4dec-a6d3-13e3e65c3c72'
WHERE store_package_id = '9P7KNL5RWT25' AND icon_path IS NULL; -- Sysinternals Suite

UPDATE curated_apps SET icon_path = 'https://store-images.s-microsoft.com/image/apps.63005.9007199267161390.afb6b8cd-d194-4a99-b633-03cd80118a21.b285711d-cdd2-4b00-9599-773750d905e0'
WHERE store_package_id = '9WZDNCRD29V9' AND icon_path IS NULL; -- Microsoft 365 Copilot
