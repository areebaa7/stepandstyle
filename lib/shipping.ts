import { prisma } from '@/lib/prisma';

export const DEFAULT_MANUAL_SHIPPING_COST = 350;
export const MAX_SHIPPING_LOCATION_LENGTH = 80;

const SHIPPING_LOCATION_PATTERN = /^[\p{L}\p{M}\d][\p{L}\p{M}\d .,'()&/-]*$/u;

export type ResolvedShippingLocation = {
  region: string;
  city: string;
  shippingCost: number;
  source: 'configured' | 'manual-region' | 'manual-default';
};

export type ShippingLocationResolution =
  | { success: true; location: ResolvedShippingLocation }
  | { success: false; code: 'INVALID_SHIPPING_LOCATION'; error: string };

function normalizeLocationName(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ');
}

function isValidLocationName(value: string) {
  return value.length >= 2 &&
    value.length <= MAX_SHIPPING_LOCATION_LENGTH &&
    SHIPPING_LOCATION_PATTERN.test(value);
}

function validShippingCost(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function invalidLocation(error: string): ShippingLocationResolution {
  return { success: false, code: 'INVALID_SHIPPING_LOCATION', error };
}

export async function resolveShippingLocation(input: {
  mode?: unknown;
  regionId?: unknown;
  cityId?: unknown;
  regionName?: unknown;
  cityName?: unknown;
}): Promise<ShippingLocationResolution> {
  const mode = input.mode === 'configured' || input.mode === 'manual' ? input.mode : null;
  const regionId = typeof input.regionId === 'string' ? input.regionId.trim() : '';
  const cityId = typeof input.cityId === 'string' ? input.cityId.trim() : '';
  const regionName = normalizeLocationName(input.regionName);
  const cityName = normalizeLocationName(input.cityName);

  if (!isValidLocationName(regionName) || !isValidLocationName(cityName)) {
    return invalidLocation('Enter a valid shipping region and city.');
  }

  if (mode === 'configured' || (regionId && cityId)) {
    if (!regionId || !cityId) {
      return invalidLocation('Select a valid configured shipping region and city.');
    }
    const city = await prisma.shippingCity.findFirst({
      where: { id: cityId, regionId },
      include: { region: true },
    });
    if (!city || !validShippingCost(city.region.shippingCost)) {
      return invalidLocation('The selected shipping location is no longer available.');
    }
    return {
      success: true,
      location: {
        region: city.region.name,
        city: city.name,
        shippingCost: city.region.shippingCost,
        source: 'configured',
      },
    };
  }

  if (cityId || (regionId && mode !== 'manual')) {
    return invalidLocation('The selected shipping region and city do not match.');
  }

  // Preserve compatibility with older checkout clients while ensuring configured
  // names still receive the database-authoritative regional rate.
  if (!regionId) {
    const configuredCity = await prisma.shippingCity.findFirst({
      where: {
        name: cityName,
        region: { name: regionName },
      },
      include: { region: true },
    });
    if (configuredCity && validShippingCost(configuredCity.region.shippingCost)) {
      return {
        success: true,
        location: {
          region: configuredCity.region.name,
          city: configuredCity.name,
          shippingCost: configuredCity.region.shippingCost,
          source: 'configured',
        },
      };
    }
  }

  if (regionId) {
    const configuredRegion = await prisma.shippingRegion.findUnique({ where: { id: regionId } });
    if (!configuredRegion || !validShippingCost(configuredRegion.shippingCost)) {
      return invalidLocation('The selected shipping region is no longer available.');
    }
    return {
      success: true,
      location: {
        region: configuredRegion.name,
        city: cityName,
        shippingCost: configuredRegion.shippingCost,
        source: 'manual-region',
      },
    };
  }

  return {
    success: true,
    location: {
      region: regionName,
      city: cityName,
      shippingCost: DEFAULT_MANUAL_SHIPPING_COST,
      source: 'manual-default',
    },
  };
}
