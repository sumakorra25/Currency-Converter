# Currency Flow API

## Authentication

### Register

`POST /api/auth/register`

Request body:

```json
{
  "name": "Asha Kumar",
  "email": "asha@example.com",
  "password": "secret123"
}
```

Success response (`201`):

```json
{
  "message": "User registered successfully",
  "user": {
    "id": "generated-mongodb-id",
    "name": "Asha Kumar",
    "email": "asha@example.com"
  }
}
```

Invalid input returns `400`. An email that is already registered returns `409`.

### Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "asha@example.com",
  "password": "secret123"
}
```

Success response (`200`):

```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": "generated-mongodb-id",
    "name": "Asha Kumar",
    "email": "asha@example.com"
  }
}
```

Invalid input returns `400`. Incorrect credentials return `401`.

### Request Password Reset

`POST /api/auth/forgot-password`

Request body:

```json
{
  "email": "asha@example.com"
}
```

The endpoint returns a generic success message whether or not the email exists.
In local development only, the response also includes a reset token. The token
expires after 15 minutes. Production email delivery should replace this local
token display before deployment.

### Reset Password

`POST /api/auth/reset-password`

Request body:

```json
{
  "token": "reset-token",
  "password": "newsecret123"
}
```

Successful password resets return `200`. Invalid or expired tokens return `400`.

### Current User

`GET /api/auth/me`

Headers:

```text
Authorization: Bearer <jwt-token>
```

Success response (`200`):

```json
{
  "user": {
    "id": "generated-mongodb-id",
    "name": "Asha Kumar",
    "email": "asha@example.com"
  }
}
```

Missing, invalid, or expired tokens return `401`.

## Currencies

### Supported currencies

`GET /api/currencies`

This public endpoint uses the Frankfurter API, which currently documents
`GET https://api.frankfurter.dev/v2/currencies` and requires no API key. The
server caches a successful response for 24 hours.

Success response (`200`):

```json
[
  { "code": "INR", "name": "Indian Rupee" },
  { "code": "USD", "name": "United States Dollar" }
]
```

If the provider is unavailable, the server returns `503` with a JSON message.

### Latest rates

`GET /api/rates/latest?base=INR`

The `base` query parameter is optional and defaults to `USD`. The server
validates the currency, fetches rates from Frankfurter, and caches each base
currency's result for five minutes.

Success response (`200`):

```json
{
  "base": "INR",
  "date": "2026-09-24",
  "rates": {
    "INR": 1,
    "USD": 0.0107,
    "EUR": 0.0091
  }
}
```

An unsupported base returns `400`. Provider failures return `502`.

## Conversion

### Convert an amount

`GET /api/convert?from=INR&to=USD&amount=1000`

This endpoint calculates a conversion without saving anything to MongoDB. The
rate and result are calculated on the server.

Success response (`200`):

```json
{
  "from": "INR",
  "to": "USD",
  "amount": 1000,
  "rate": 0.01044,
  "result": 10.44,
  "date": "2026-09-24"
}
```

Both currencies must be supported and the amount must be greater than zero.
Invalid input returns `400`. Provider failures return `502`.

## Saved conversions

### Create a conversion

`POST /api/conversions`

Authentication is required:

```text
Authorization: Bearer <jwt-token>
```

Request body:

```json
{
  "from": "INR",
  "to": "USD",
  "amount": 1000
}
```

The server obtains the current rate, calculates the result, and saves the
conversion for the authenticated user. Client-provided `rate` and `result`
values are ignored.

Success returns `201` with the saved conversion. Missing or invalid tokens
return `401`; invalid input returns `400`.

### List my conversions

`GET /api/conversions?page=1&limit=10`

Authentication is required. Results belong only to the authenticated user and
are ordered newest first. `page` defaults to `1`; `limit` defaults to `10` and
cannot exceed `50`.

Success response (`200`):

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 0,
  "totalPages": 0
}
```

Invalid pagination parameters return `400`; missing or invalid tokens return
`401`.

### Delete a favourite pair

`DELETE /api/pairs/:id`

Authentication is required. The server validates the ObjectId and deletes only
when the pair belongs to the authenticated user.

Success response (`200`):

```json
{
  "message": "Pair deleted"
}
```

Missing or non-owned pairs return `404`; invalid IDs return `400`.

### Final API inventory

| API | Method | URL | Auth | Main statuses |
| --- | --- | --- | --- | --- |
| 1 | POST | `/api/auth/register` | No | 201, 400, 409 |
| 2 | POST | `/api/auth/login` | No | 200, 400, 401 |
| 3 | GET | `/api/auth/me` | Yes | 200, 401 |
| 4 | POST | `/api/conversions` | Yes | 201, 400, 401, 502 |
| 5 | GET | `/api/conversions` | Yes | 200, 400, 401 |
| 6 | GET | `/api/conversions/:id` | Yes | 200, 400, 401, 404 |
| 7 | PUT | `/api/conversions/:id` | Yes | 200, 400, 401, 404, 502 |
| 8 | DELETE | `/api/conversions/:id` | Yes | 200, 400, 401, 404 |
| 9 | POST | `/api/pairs` | Yes | 201, 400, 401, 409 |
| 10 | GET | `/api/pairs` | Yes | 200, 400, 401 |
| 11 | GET | `/api/pairs/:id` | Yes | 200, 400, 401, 404 |
| 12 | PUT | `/api/pairs/:id` | Yes | 200, 400, 401, 404, 409 |
| 13 | DELETE | `/api/pairs/:id` | Yes | 200, 400, 401, 404 |
| 14 | GET | `/api/rates/latest?base=INR` | No | 200, 400, 502 |
| 15 | GET | `/api/convert?from=INR&to=USD&amount=1000` | No | 200, 400, 502 |
| 16 | GET | `/api/currencies` | No | 200, 503 |
| 17 | GET | `/api/conversions/stats` | Yes | 200, 401 |

## Final review

The login endpoint from API 2 has not yet been implemented, so protected API
success paths cannot be exercised until that route exists and MongoDB is
running. The Postman collection includes the planned login request so the
collection contract remains complete.

Before production, replace the development JWT secret, restrict CORS to known
frontend origins, and consider a shared cache instead of process-local memory
when running multiple server instances. Malformed JSON should also be handled
as a `400` client error rather than the current generic error response.

For a viva, be ready to explain JWT authentication, password hashing, Mongoose
references and indexes, ownership filtering, pagination, aggregation stages,
external API caching, and why rate/result values are calculated server-side.

### Update a favourite pair

`PUT /api/pairs/:id`

Authentication is required. Send at least one of `from` or `to`; both must be
supported currencies and must be different.

```json
{
  "to": "EUR"
}
```

Success returns `200` with the updated pair. Invalid input returns `400`, a
missing or non-owned pair returns `404`, and a duplicate pair returns `409`.
The unique compound index protects this rule even when concurrent requests
attempt the same update.

### Get one favourite pair

`GET /api/pairs/:id`

Authentication is required. The `id` must be a valid MongoDB ObjectId, and the
pair must belong to the authenticated user.

Success returns `200` with the pair. Invalid IDs return `400`; missing or
non-owned pairs return `404`.

### Get one conversion

`GET /api/conversions/:id`

Authentication is required. The `id` must be a valid MongoDB ObjectId, and the
conversion must belong to the authenticated user.

Success returns `200` with the conversion. An invalid ObjectId returns `400`;
missing, invalid, or unauthorized ownership returns `404` to avoid revealing
whether another user owns that conversion.

### Update a conversion

`PUT /api/conversions/:id`

Authentication is required. Send at least one of `from`, `to`, or `amount`.
The server fetches the current rate again and recalculates `rate` and `result`;
client-provided rate and result values are ignored.

```json
{
  "amount": 1500
}
```

Success returns `200` with the updated conversion. Invalid input returns `400`;
another user's conversion returns `404`.

### Delete a conversion

`DELETE /api/conversions/:id`

Authentication is required. The server validates the ObjectId and deletes only
when the conversion belongs to the authenticated user.

Success response (`200`):

```json
{
  "message": "Conversion deleted"
}
```

Missing or non-owned conversions return `404`; invalid IDs return `400`.

The conversion APIs cover CRUD: `POST` creates, `GET` reads, `PUT` updates,
and `DELETE` removes conversions.

### Conversion statistics

`GET /api/conversions/stats`

Authentication is required. The endpoint groups only the authenticated user’s
conversions by source and target currency, sorts by frequency, and returns the
top five pairs.

Success response (`200`):

```json
[
  { "from": "INR", "to": "USD", "count": 8 },
  { "from": "USD", "to": "EUR", "count": 3 }
]
```

This route is declared before `/api/conversions/:id` so Express treats
`stats` as a fixed route instead of an ObjectId parameter.

## Favourite pairs

### Create a favourite pair

`POST /api/pairs`

Authentication is required.

```json
{
  "from": "INR",
  "to": "USD"
}
```

Both currencies must be supported and different. Success returns `201` with
the saved pair. Invalid input returns `400`; an existing pair for the same
user returns `409`.

### List my favourite pairs

`GET /api/pairs?page=1&limit=10`

Authentication is required. Results belong only to the authenticated user and
are ordered newest first. `page` defaults to `1`; `limit` defaults to `10` and
cannot exceed `50`.

Success response (`200`):

```json
{
  "data": [],
  "page": 1,
  "limit": 10,
  "total": 0,
  "totalPages": 0
}
```

Invalid pagination parameters return `400`; missing or invalid tokens return
`401`.
