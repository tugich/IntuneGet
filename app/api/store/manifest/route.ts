import { NextRequest, NextResponse } from 'next/server';
import type { StoreManifestResponse } from '@/types/winget';

const MANIFEST_API = 'https://storeedgefd.dsx.mp.microsoft.com/v9.0/packageManifests';
const DISPLAY_CATALOG_API = 'https://displaycatalog.mp.microsoft.com/v7.0/products';

// Microsoft Store product IDs are alphanumeric, typically 12 chars (e.g. 9WZDNCRFJ3PZ)
const STORE_ID_PATTERN = /^[A-Z0-9]{9,20}$/;

const ALLOWED_IMAGE_HOSTS = new Set([
  'store-images.s-microsoft.com',
  'store-images.microsoft.com',
]);

function extractIconUrl(catalogData: Record<string, unknown>): string | undefined {
  try {
    const product = catalogData?.Product as Record<string, unknown> | undefined;
    const localizedProps = (product?.LocalizedProperties as Record<string, unknown>[]) ?? [];
    const images = (localizedProps[0]?.Images as Record<string, unknown>[]) ?? [];

    // Filter for Logo images
    const logos = images.filter((img) => img.ImagePurpose === 'Logo');
    if (logos.length === 0) return undefined;

    // Pick the one closest to 100px wide
    const best = logos.reduce((prev, curr) => {
      const prevW = typeof prev.Width === 'number' ? prev.Width : Infinity;
      const currW = typeof curr.Width === 'number' ? curr.Width : Infinity;
      return Math.abs(currW - 100) < Math.abs(prevW - 100) ? curr : prev;
    });

    let uri = best.Uri as string;
    if (!uri) return undefined;

    // Protocol-relative URLs from the catalog
    if (uri.startsWith('//')) {
      uri = 'https:' + uri;
    }

    const parsed = new URL(uri);
    if (parsed.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.has(parsed.hostname)) {
      return uri;
    }
  } catch {
    // Malformed data, leave iconUrl undefined
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Missing required parameter: id' },
      { status: 400 }
    );
  }

  if (!STORE_ID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: 'Invalid store product identifier format' },
      { status: 400 }
    );
  }

  try {
    // Fetch both APIs in parallel
    const [manifestRes, catalogRes] = await Promise.allSettled([
      fetch(`${MANIFEST_API}/${encodeURIComponent(id)}`, {
        next: { revalidate: 3600 },
      }),
      fetch(
        `${DISPLAY_CATALOG_API}/${encodeURIComponent(id)}?languages=en-US&market=US`,
        { next: { revalidate: 3600 } }
      ),
    ]);

    // Parse manifest response
    let packageName = '';
    let publisher = '';
    let description = '';
    let shortDescription = '';
    let packageFamilyName: string | undefined;
    let architectures: string[] = [];

    if (manifestRes.status === 'fulfilled' && manifestRes.value.ok) {
      const manifestData = await manifestRes.value.json();

      // The manifest API returns nested data under Data.Versions[].DefaultLocale / Installers
      const data = manifestData?.Data;
      if (data) {
        packageName = data.PackageName || '';
        publisher = data.Publisher || '';

        // Extract from versions array (latest first)
        const versions = data.Versions;
        if (Array.isArray(versions) && versions.length > 0) {
          const latest = versions[0];
          const defaultLocale = latest.DefaultLocale;
          if (defaultLocale) {
            packageName = defaultLocale.PackageName || packageName;
            publisher = defaultLocale.Publisher || publisher;
            description = defaultLocale.Description || '';
            shortDescription = defaultLocale.ShortDescription || '';
          }

          // Extract architectures and PackageFamilyName from installers
          const installers = latest.Installers;
          if (Array.isArray(installers)) {
            const archSet = new Set<string>();
            for (const installer of installers) {
              if (installer.Architecture) {
                archSet.add(installer.Architecture);
              }
              if (installer.PackageFamilyName && !packageFamilyName) {
                packageFamilyName = installer.PackageFamilyName;
              }
            }
            architectures = Array.from(archSet);
          }
        }
      }
    }

    // Parse Display Catalog response for icon URL
    let iconUrl: string | undefined;
    if (catalogRes.status === 'fulfilled' && catalogRes.value.ok) {
      const catalogData = await catalogRes.value.json();
      iconUrl = extractIconUrl(catalogData);
    }

    // If manifest fetch failed entirely (no name), return 404
    if (!packageName) {
      return NextResponse.json(
        { error: 'Store manifest not found for this package identifier' },
        { status: 404 }
      );
    }

    const result: StoreManifestResponse = {
      packageIdentifier: id,
      packageName,
      publisher,
      description,
      shortDescription,
      packageFamilyName,
      architectures,
      iconUrl,
    };

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch store manifest' },
      { status: 502 }
    );
  }
}
