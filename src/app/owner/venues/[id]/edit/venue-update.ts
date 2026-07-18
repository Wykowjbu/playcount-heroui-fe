import type { UpdateVenueRequestDto } from "@/lib/types/api";

type PreservedVenueFields = Pick<
  UpdateVenueRequestDto,
  "latitude" | "longitude" | "openTime" | "closeTime"
> & { status: string };

type EditableVenueFields = Pick<
  UpdateVenueRequestDto,
  "name" | "address"
> & { description: string; phone: string };

export function buildVenueUpdateRequest(
  venue: PreservedVenueFields,
  fields: EditableVenueFields,
): UpdateVenueRequestDto {
  return {
    name: fields.name.trim(),
    address: fields.address.trim(),
    description: fields.description.trim() || undefined,
    phone: fields.phone.trim() || undefined,
    latitude: venue.latitude,
    longitude: venue.longitude,
    openTime: venue.openTime,
    closeTime: venue.closeTime,
  };
}
