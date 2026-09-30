# Phase Log

## Phase 1: Register

- Added `POST /api/auth/register`.
- Added the User model with a hidden password field.
- Added input validation, bcrypt password hashing, and duplicate-email handling.

## Phase 3: Logged-in user profile

- Added JWT Bearer authentication middleware.
- Added protected `GET /api/auth/me`.
- Confirmed passwords are excluded from the profile response.

## Phase 4: Supported currency list

- Added the public `GET /api/currencies` endpoint.
- Integrated Frankfurter's documented v2 currencies endpoint.
- Added a 24-hour in-memory cache and reusable `isSupportedCurrency` helper.

## Phase 5: Latest rates

- Added public `GET /api/rates/latest` with an optional `base` query parameter.
- Added five-minute per-base rate caching through the rate service.
- Added validation for supported three-letter currency codes.

## Phase 6: Convert an amount

- Added public `GET /api/convert`.
- Added server-side rate lookup and amount calculation without database writes.
- Added validation for currencies and positive amounts.

## Phase 7: Create a conversion

- Added the Conversion model with a User ObjectId reference and user index.
- Added protected `POST /api/conversions`.
- Added server-side rate lookup, result calculation, and persistence.

## Phase 8: List conversions with pagination

- Added protected `GET /api/conversions`.
- Scoped count and results to the authenticated user.
- Added newest-first ordering and page/limit pagination with a maximum limit of 50.

## Phase 9: Get one conversion

- Added protected `GET /api/conversions/:id`.
- Added MongoDB ObjectId validation.
- Enforced ownership by querying with both conversion ID and user ID.

## Phase 10: Update a conversion

- Added protected `PUT /api/conversions/:id`.
- Added partial field validation with at least one editable field required.
- Recalculated the live rate and result on every update.

## Phase 11: Delete a conversion

- Added protected `DELETE /api/conversions/:id`.
- Added ownership-filtered deletion and `404` handling.
- Completed the conversion CRUD routes.

## Phase 12: Most converted pairs

- Added protected `GET /api/conversions/stats`.
- Added a user-scoped aggregation grouped by source and target currencies.
- Sorted and limited the response to the five most frequent pairs.

## Phase 13: Create a favourite pair

- Added the FavouritePair model with a unique user/from/to compound index.
- Added protected `POST /api/pairs`.
- Added supported-currency, distinct-pair, and duplicate-key handling.

## Phase 14: List favourite pairs with pagination

- Added shared pagination helpers in `server/utils/pagination.js`.
- Added protected `GET /api/pairs` with user-scoped newest-first pagination.
- Reused the helper for both pair and conversion list responses.

## Phase 15: Get one favourite pair

- Added protected `GET /api/pairs/:id`.
- Added ObjectId validation and user-scoped ownership filtering.
- Added `404` handling for missing or non-owned pairs.

## Phase 16: Update a favourite pair

- Added protected `PUT /api/pairs/:id`.
- Added ownership, currency, and distinct-pair validation.
- Added duplicate compound-index handling with `409` responses.

## Phase 17: Delete a favourite pair and final review

- Added protected `DELETE /api/pairs/:id` with ownership filtering.
- Completed the API inventory and backend review in `docs/API.md`.
- Added the 17-request Postman collection at
	`postman/currency-flow.postman_collection.json`.
