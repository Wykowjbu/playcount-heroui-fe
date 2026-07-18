# PlayCourt Admin UI Audit Design

## Goal

Make the five admin screens accurate, compact, accessible, and efficient for reviewing operational queues. All interactive controls use HeroUI v3 compound components; all icons use `@gravity-ui/icons`.

## Constraints

- Preserve the existing Next.js App Router structure and API client.
- Match frontend DTOs to the backend source and `FE_API_INTEGRATION_REPORT.md`.
- Do not add dependencies or speculative features.
- Do not wrap HeroUI tables in decorative `Card` containers.
- Remove controls that have no connected behavior, including the fake global search and notification count.
- Keep native layout elements for structure; do not recreate HeroUI controls with custom HTML.

## Shell

The sidebar remains the primary navigation with Gravity UI icons. The top bar contains only the sidebar toggle, the product area label, and the admin avatar. Each page owns its single title and description. The content width and spacing remain responsive without duplicating headings.

## Overview

Lead with the actual operational job: pending venue and owner reviews. Present those two pending counts as the primary queue actions. Show approved venues, sports, and amenities as compact secondary metrics. Remove the duplicate quick-action grid and unsupported notification/search UI.

## Approval Lists

Use direct HeroUI tables with status filters above them.

- Venues: name/address, status, created date, and detail action. Do not render owner name or court count because the admin venue list DTO does not provide them.
- Court owners: full name/email, business name/phone, verification status, registration date, and a details action. The list uses `CourtOwnerListItemDto`; detail data is fetched only when required.
- Every table identifies a semantic row-header column with `isRowHeader`, uses stable row IDs, and uses HeroUI empty/loading states.

Owner approval and rejection happen only after opening a HeroUI modal containing the detail endpoint's available identity and business fields. Rejection requires a reason.

## Reference Data

- Sports: direct HeroUI table with code, name, description, status, and actions. Keep the existing HeroUI create/edit modal and activation action.
- Amenities: direct HeroUI table with name and actions only, matching the backend's actual `AmenityDto`. Keep HeroUI create/edit and delete-confirmation modals; do not display unsupported description/date fields.

## Venue Detail

Show the venue identity, status actions, contact information, owner profile ID, dates, amenities, images, opening hours, and courts fetched from the existing venue-courts endpoint. Time-only strings such as `06:00:00` render as `06:00`; ISO datetimes retain the existing localized time behavior. Rejection and suspension use a HeroUI modal, and rejection requires a reason.

## Data and Error Handling

Correct TypeScript contracts to match backend DTOs instead of inventing fallback fields. Keep API errors visible in-page and replace browser `alert` calls only where the touched flow already has a HeroUI modal surface. After successful mutations, refresh the affected data or return to the relevant list.

## Verification

- Add focused tests for DTO-to-view data decisions and time-only formatting before implementation.
- Run those tests red then green.
- Run ESLint and the production build.
- Re-preview all five admin screens plus venue detail and check that Next DevTools reports no HeroUI table accessibility issue.

