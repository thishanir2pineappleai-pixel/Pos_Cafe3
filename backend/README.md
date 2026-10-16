# POS Cafe backend: Menu, Sales, Settings, Authentication, Dashboard and Staff Management

Node.js + Express (CommonJS). **Development only: no database. Authentication exists for Settings and Dashboard; the Menu
and Sales endpoints are still open and not shop-scoped (see "What is and is not protected").**

> **All data is kept in memory and is lost when the server restarts.** Every collection starts empty and nothing is
> seeded. MySQL (mysql2) is the planned final store; it is not connected yet. Uploaded image files are written to
> `backend/uploads/products/` and survive a restart, but the products that point at them do not.

## Start

```
pnpm install                      # once, from the project root
pnpm --filter ./backend dev       # or: pnpm dev:backend   (restarts on file changes)
pnpm --filter ./backend start     # plain start
pnpm --filter ./backend test      # automated API tests (no database needed)
```

The server listens on `http://127.0.0.1:4000` (change with `PORT` in `backend/.env`; see `.env.example`).
It refuses to start if `HOST` is anything other than a loopback address. CORS allows only the local Vite origins
(`http://localhost:5173`, `http://127.0.0.1:5173`; override with `CORS_ORIGIN`).
**Not ready for deployment** (see "Before deployment" below).

## Responses

Success: `{ "success": true, "message"?, "data"?, "meta"? }`
Error: `{ "success": false, "code", "message", "errors"?: [{ "field", "message" }] }`
Codes: `VALIDATION_ERROR` (400), `NOT_FOUND` (404), `DUPLICATE` (409), `IMAGE_TOO_LARGE` (413),
`UNSUPPORTED_IMAGE` (415), `INTERNAL_ERROR` (500).

## Endpoints (`/api/v1`)

| Method and path | Purpose |
|---|---|
| `GET /products?search&status&categoryId&sort&page&limit` | Paged list. `status`: `in_stock`, `low_stock`, `out_of_stock`. `sort`: `price_asc`, `price_desc`. Search covers name, code (`#PRD1`), category name and status text. |
| `GET /products/summary` | `{ total, active, outOfStock, categories }` |
| `GET /products/:id` | Details, including `ingredients` |
| `POST /products` | Create (JSON). Unknown ingredient names are created automatically. |
| `PUT /products/:id` | Replace a product and its ingredient list |
| `DELETE /products/:id` | Permanent delete (product, its ingredient links and its image file only) |
| `PATCH /products/:id/ingredients/:ingredientId` | Body `{ "quantity": "55 g" }` |
| `POST /products/:id/image` | `multipart/form-data`, one file in field `image`. JPEG or PNG only, at most 2 MB. |
| `GET /categories`, `POST /categories` | List / create `{ "name" }` |
| `GET /ingredients?search=`, `POST /ingredients` | Autocomplete / create `{ "name" }` |
| `GET /discounts`, `POST /discounts` | Discount definitions `{ "name", "percentage" }` |

Product body: `name`, `categoryId`, `costPrice?`, `sellingPrice`, `quantity`, `lowStockAlert?`, `discountId?`,
`ingredients?: [{ "name", "quantity" }]`. Product output adds `code`, `category`, `status`, `discountType`
(the discount's name), `discountPercentage` and `image` (a `/uploads/products/<generated name>` URL).

Images: file size is limited by Multer, the real type is decided from the file's bytes (the client's name and
Content-Type are ignored), and files are stored under a generated `<uuid>.png|jpg` name. Uploaded files are ignored by
Git (`backend/uploads/*`). The checks catch fake and truncated files but do not decode the pixels.

## Rules that still need approval

Confirmed by the owner or the Figma: cost price and discount are optional; photo is JPG/PNG up to 2 MB;
quantity 0 is "Out of stock"; delete is permanent; discounts here are only a name and a percentage.

**Provisional (change them in one place: `middleware/validation/munuValidation.js`, `utils/pagination.js`,
`config/constants/status.js`):**

- Required fields: `name`, `categoryId`, `sellingPrice`, `quantity`. `lowStockAlert` is optional and **has no default**
  (without one a product is only In Stock or Out of stock).
- Low Stock means quantity strictly below the alert (Figma wording "When Quantity goes below"). The frontend mock
  uses "at or below".
- Max lengths (name 150, category/ingredient/discount name 100, ingredient quantity text 50), money with at most 2
  decimals, percentage 0-100 with at most 2 decimals, at most 100 ingredients, no repeated ingredient on one product.
- Category, ingredient and discount names are unique ignoring case; product names may repeat.
- "Active" means not out of stock. Default list order is newest first. Page size defaults to 10 (max 100).
- Product codes are `#PRD<id>` / `#ING<id>` with ids starting at 1.

Not built: discount price calculations, Sales discount applications, authentication, category/discount edit or delete.
Deleting a product never touches order or payment records (none exist yet; future order items must keep a snapshot
and use `ON DELETE SET NULL`, never `CASCADE`).

## Sales Management (also `/api/v1`)

| Method and path | Purpose |
|---|---|
| `GET /orders?from&to&search&page&limit` | Order Details table. Newest first. `from`/`to` are `YYYY-MM-DD`, inclusive; a single day is `from = to`; leave both out for every date. Search covers order id, type, customer, items, status and time. |
| `GET /orders/export?from&to&search&format=csv` | CSV of **all** rows matching the same filters. `format=pdf` or `xls` answer `501 NOT_IMPLEMENTED` (the Figma menu shows them, but they need a format decision and a library). |
| `GET /reports/sales/summary?from&to` | `{ range, totalRevenue, totalOrders, newCustomers, peakHour }` for the four cards. |
| `GET /discounts/applications?search&page&limit` | Discount applications (the Manage Discount table), newest first. |
| `POST /discounts/applications` | Create `{ discountId, startDate, endDate, status?, appliesToAll, productIds? }` |
| `GET /discounts/applications/:id` | One application |
| `PUT /discounts/applications/:id` | Replace discount, period and products (status kept unless sent) |
| `PATCH /discounts/applications/:id/status` | `{ "status": "Active" \| "Inactive" }` (exact labels) |
| `DELETE /discounts/applications/:id` | Delete the application only (never a discount definition or a product) |

An application holds only a `discountId`. Its name and percentage always come from the Menu discount definitions
(`GET/POST /discounts`), so there is one discount-name store. The product picker and the discount dropdown use the
existing `GET /products` and `GET /discounts`. `productIds` must be empty when `appliesToAll` is true and must list
at least one existing product when it is false. A product deleted in Menu Management drops out of selected
applications automatically. **No price is calculated**: how a product's own Menu discount and a dated application
combine (stacking or priority) has not been approved.

**Orders are read-only and always empty for now.** There is no order-creation feature and no customer data, so
`GET /orders` returns an empty list, the CSV has only its header row, and the summary is
`totalRevenue 0, totalOrders 0, newCustomers 0, peakHour null`. Nothing is invented or seeded. The tests put
temporary rows in memory to prove the logic works. Meaningful numbers need the future orders and customers tables:
- `totalRevenue`, `totalOrders`, `peakHour`: ready as soon as orders exist.
- `newCustomers`: needs a `customerId` on orders (a customer's first order inside the range); it stays 0 without one.
- There is no Peak Hour Analysis design, so no hourly-breakdown endpoint exists; only the card value is served.

**Provisional Sales rules (need approval):** revenue excludes Cancelled orders; Total Order counts every order in
range; "new customer" as described above; peak hour is the clock hour with the most orders (ties go to the earlier
hour); order times are naive business-local times; items are written `<qty>x <name>`; newest first; a new application
is Active; an application's start and end may be the same day; applications of one discount may overlap; at least one
product when not "All Products"; page size defaults to 10 (max 100).

## Settings (also `/api/v1/settings`)

| Method and path | Purpose |
|---|---|
| `GET /timezones` | The five Timezone dropdown options from the design |
| `GET /shops`, `POST /shops` | List / create a shop profile `{ name, address, phone, email?, website?, timezone }` |
| `GET /shops/:id`, `PUT /shops/:id` | View / replace (an absent `email` or `website` is cleared) |
| `POST /shops/:id/image` | Upload the shop logo |
| `GET /admins`, `POST /admins` | List / create an admin profile `{ firstName, lastName, phone, email, password }` |
| `GET /admins/:id`, `PUT /admins/:id` | View / edit `{ firstName, lastName, phone, email }` (a `password` here is refused with 400) |
| `PUT /admins/:id/password` | Body `{ "password" }`; the response contains no password data |
| `POST /admins/:id/image` | Upload the admin picture |

There is no delete: the Settings designs show none. Shop `status` is the design's constant "Active" badge and admin
`role` is the constant "Admin" badge; neither can be changed because no rules are designed. `updatedAt` is the
"Updated on ..." date. Shop and admin profiles live in memory (starting empty, lost on restart, never seeded).
There is no limit of one profile per type: the designs hide the create card after the first profile, but state no rule.

**Images** use the same safe upload pipeline as product photos (Multer in memory, real type read from the bytes,
generated `<uuid>.png|jpg` names, the client's filename ignored) but are stored in `backend/uploads/settings/` and
served from `/uploads/settings/`, separate from `uploads/products/`. Uploads are ignored by Git. The Settings designs
state no formats or size, so the existing JPG/PNG, 2 MB rule is reused (**decision needed**).

**Passwords.** They are hashed with `services/auth/bcryptService.js` before any repository sees them: salted `scrypt`
from Node's `crypto` (no package added; the file name is kept from the project structure). API output lists its fields
explicitly, so no password or hash is ever returned, errors never echo a password, nothing is written to the console,
and admin responses are sent with `Cache-Control: no-store`. Passwords are stored exactly as typed (never trimmed).

**Settings now needs a signed-in user and is scoped to that user's account** (see the next sections). A shop or admin of
another account answers 404, exactly like one that does not exist. Only the account's **owner** creates shops and admins
(403 for an admin); the owner may edit anyone in the account, an admin only their own profile. `role`, `status`,
verification times, `accountId` and `id` are always set by the server and are ignored if sent. Changing a password
signs that user out everywhere (your own current session stays). Passwords now follow the same rule as signup and reset.
There is still no "current password" check, because the Settings design has no such field.

**Provisional Settings rules (need approval):** required fields are `name`, `address`, `phone` and `timezone` for a shop
and all five fields for an admin (only Email and Website on the shop form are marked optional in the design); maximum
lengths (shop name 150, address 255, phone 30, website 255, names 100, email 254); no phone or website format; email
must look like an address; `timezone` must be one of the five options; admin emails are unique ignoring case across the
whole system; invited admins have no email verification (not designed).

## Authentication, signup and password recovery (`/api/v1/auth`)

Everything below is stored in memory (lost on restart) behind the same repository boundary as the rest.

| Method and path | Purpose |
|---|---|
| `POST /login` | `{ email, password, keepSignedIn? }` -> `{ token, tokenType: 'Bearer', expiresAt, user }`. Every failure is the same 401. |
| `POST /logout` | Needs a token. Revokes that session; the token stops working at once. |
| `GET /me` | Needs a token. The user and the shops of their account. |
| `POST /signup/credentials` | Step 1 `{ email, username, password, acceptTerms: true }` -> `{ registrationToken, nextStep, delivery }`; creates an unfinished **registration** (not a user) and requests an email code. |
| `POST /signup/email/verify`, `/email/resend` | Step 2 `{ registrationToken, code }` / `{ registrationToken }` |
| `POST /signup/owner` | Step 3 `{ registrationToken, ownerName, phone }`; requests a phone code. A wrong phone can be corrected until the phone is verified. |
| `POST /signup/phone/verify`, `/phone/resend` | Step 4 |
| `POST /signup/business` | Step 5 `{ registrationToken, businessName, address }`; issues the access key |
| `POST /signup/activate` | `{ email, accessKey }` -> `{ activated: true }`; creates the account, its owner and first shop in one atomic step |
| `POST /signup/access-key/resend` | `{ email }`; the same answer whether or not a signup exists |
| `POST /forgot-password` | `{ email }`; the same answer for every email |
| `POST /forgot-password/verify` | `{ email, code }` -> `{ resetToken, expiresInSeconds }` |
| `POST /reset-password` | `{ resetToken, password, confirmPassword }` |

**Tokens.** Access tokens are HS256-signed (Node `crypto`, no JWT package), checked for signature, issuer and expiry, and
tied to a server-side session, so logout, password change and password reset really end sessions. Send
`Authorization: Bearer <token>`. Without `JWT_SECRET` a temporary key is generated at start-up (every sign-in then ends on
restart); `NODE_ENV=production` refuses to start without a secret of at least 32 characters.

**Signup status machine.** `email_pending` -> `owner_pending` -> `phone_pending` -> `business_pending` ->
`awaiting_activation` -> `activated`. A step out of order answers `409 WRONG_STEP` with the step to do. Before activation a
registration can do nothing except these steps, it can not sign in, and no user row exists. Nothing is marked verified
until the server-side check passed. Duplicate emails (and phones) of existing users are refused with 409; an unfinished
signup for the same email is replaced. Activation re-checks both. After activation the secrets are wiped from the
registration. The activated user is the account's `owner`; the first shop gets the business name and address, the owner's
phone and no timezone yet (Settings asks for both when the shop is edited).

**One-time codes** are six digits from `crypto.randomInt`, stored only as keyed HMAC hashes, expire after 3 minutes (the
design's 02:59), lock after 5 wrong guesses, work once, and a new code replaces the old one. Resends need a 60 second gap
and at most 5 per hour (429 with `Retry-After`).

**Access key** (policy undefined by the designs, so provisional): 16 characters `XXXX-XXXX-XXXX-XXXX`, stored as a keyed
hash, single use, expires after 72 hours, locks after 5 wrong attempts until a new key is requested. Every failure is the
same 400 `INVALID_ACCESS_KEY`.

**Password recovery.** The forgot-password answer is identical for registered and unknown emails (the cooldown of a real
account is swallowed so it can not be told apart), failures of the code check are one generic 400, a correct code returns a
10 minute single-use reset token, and a reset ends **every** session of that user. The new password must follow the
design's rule and differ from the old one; a rejected attempt does not spend the token.

**Passwords** (signup, reset, Settings): at least 8 characters with uppercase, lowercase, number and symbol, no spaces, at
most 128. They are hashed with the same salted scrypt as before, so hashes created by Settings and by signup are
interchangeable.

**Rate limits** (per process, in memory): login 10 per 15 min per IP+email; signup 10 per hour per IP; code checks 30 per
15 min per IP; resends 10 per hour; activation 10 per 15 min per IP+email; forgot-password 5 per hour per email and 20 per
hour per IP, applied to unknown emails too; reset 10 per 15 min.

### Email and SMS delivery (not available yet)

**No email or SMS provider is configured or implemented**, so no code or key is ever really sent. Responses say so:
`delivery: { channel, delivered: false, reason: 'not_configured' }` (and `deliveryConfigured: false` on the public
forgot-password and resend answers). The provider boundary is `services/integration/emailProvider.js` and
`smsProvider.js`: `send({ to, ... })` must resolve `{ delivered: true }` only after a provider accepted the message.
A real provider needs credentials (SMTP or email API; for SMS the structure mentions Notify.lk) in `.env` and, for SMTP,
a package that is not approved yet. Until then a signup can not be finished without reading the codes.

For **local testing only**, `MESSAGE_DELIVERY=dev-outbox` keeps the messages (with the raw codes) in memory and adds
`GET /api/v1/dev/outbox`. That route does not exist in any other mode, and the setting is refused when
`NODE_ENV=production`. Codes are never logged and never appear in API responses.

## Dashboard (`/api/v1/dashboard`, signed-in users only)

All GET, all limited to **one shop of the caller's account**: `?shopId=` must be the caller's shop (404 otherwise; no
shop of theirs means empty results, never other people's orders), default their first shop. `?date=YYYY-MM-DD` defaults
to today on the server. They return real calculated numbers; with no data the same structure comes back with zeros,
empty lists and nulls.

| Path | Response `data` |
|---|---|
| `/summary` | `{ date, shopId, sales: { value, changePercent }, orders: {...}, newCustomers: {...}, peakHours: { startHour, endHour, orders, label } \| null }`; `changePercent` is versus the day before, `null` if that day had none |
| `/sales-trend?period=today\|week\|month` | `{ period, date, shopId, points: [{ label, value }], total }` |
| `/top-selling?period&limit` | `{ period, date, shopId, items: [{ productId, name, category, image, sold, price }] }` (default 4) |
| `/order-status` | `{ date, shopId, statuses: [{ status, count }] }` (all five statuses always present) |
| `/stock?limit` | `{ source: 'menu_products', counts: { outOfStock, lowStock, inStock }, items: [{ id, code, name, category, quantity, lowStockAlert, status }] }` (default 4) |
| `/recent-orders?limit` | `{ shopId, orders: [{ id, orderId, tableId, type, status, total, itemsText, time, date }] }` (default 5) |

Order rows need `shopId`, `tableId` and, per item, `productId` and `unitPrice` (see `repositories/memory/store.js`); the
future orders tables must provide them. **Limits:** there are no orders or customers yet, so every sales number is 0
today. The design's Stock Details lists *ingredients with units*, which belong to a missing Inventory module; `/stock`
reports Menu *products* instead and says so in `source`. Menu products have no shop yet, so stock covers the whole
catalogue. The header's "Cashier / Login time / Shop open" needs staff and shift data that does not exist, so it has no
endpoint. Pending: sales-trend buckets (today: the seven drawn labels, each three hours; month: the whole year), the
top-selling period, and the default row counts.

## Staff Management (`/api/v1/staff`, `/roles`, `/teams`, `/permissions`, `/shifts`, `/attendance`, `/payroll`)

**Storage: in memory, NOT MySQL.** MySQL is not configured (`.env`, `config/database/mysql.js` and `database/schema.sql` are empty), so
this module uses the same temporary repository layer as the rest (`repositories/memory/*`, lost on restart, nothing seeded). The
schema it needs is proposed, not created, in [docs/staff-management-schema.md](docs/staff-management-schema.md). Everything below is
signed-in users only and limited to ONE shop of the caller's account: `?shopId=N` must be the caller's own shop (404 otherwise),
default their first shop; with no shop, reads return empty structures and writes answer 409. `shopId`, `accountId`, the employee
code, ids, hashes and file names in a request body are ignored. All responses are `Cache-Control: no-store`.

**Who may do what** (enforced on the server, `config/constants/roles.js`):

| Account role | Staff, shifts, attendance, leave | Roles / teams / permission matrix | Salary, EPF/ETF, documents, **all Payroll** | Delete / restore staff, delete shift or leave |
|---|---|---|---|---|
| Owner | everything | create, edit, delete | yes | yes |
| Admin | view, add, edit | read only | no (403, and the fields are absent from responses) | no (403) |

A staff member can only be given a role whose permissions the caller holds, so nobody can hand out more than they have (403).
Staff *roles* (Cashier, Manager, ...) are labels with a permission matrix; staff cannot sign in yet, so nothing reads them at login.

| Method and path | Purpose |
|---|---|
| `GET /staff/summary` | `{ totalStaff, activeStaff, inactiveStaff, staffOnDuty, activeShift: { id, name, startTime, endTime } \| null }` (zeros/null when empty) |
| `GET /staff` | `?q&roleId&teamId&shiftId&status=active\|inactive&page&limit&shopId` -> `{ data: [item], meta: { total, page, limit, totalPages } }`; item = `{ id, code, name, image, role, team, shift, phone, email, lastLogin, status, active }`, newest first. `q` searches name, email, phone digits, and the code (`STF0012`, `#STF12`) |
| `POST /staff` | create (below) -> 201 with the detail. Rate limited: 120 per hour per user |
| `GET /staff/:id` | detail: item fields plus `gender, nic, dob, address, emergencyContact, employment { joinDate, employmentType, inactiveReason, workingDays, hoursPerWeek, username }`; the **owner** also gets `salary`, `epf`, `documents` |
| `PATCH /staff/:id` | change any of the personal / employment / `salary` / `epf` fields (only what is sent); `emergencyContact`, `salary` and `epf` are replaced as a whole section |
| `PUT /staff/:id/status` | `{ active, inactiveReason }` (the reason is required when `active` is false) |
| `DELETE /staff/:id`, `POST /staff/:id/restore` | **reversible removal** (owner only): see "Removal" |
| `POST /staff/:id/image`, `GET /staff/:id/image` | multipart field `image`, JPG/PNG, 2 MB, real content checked; stored in `uploads/staff/` under a generated name and served only through this authenticated route |
| `POST /staff/:id/documents/:slot`, `GET ...` | owner only. `slot` = `cv` (PDF/DOC/DOCX), `idCopy` (JPG/PNG/PDF), `agreement` (PDF); multipart field `file`, 5 MB, real content checked |
| `GET /permissions` | the module and action catalogue |
| `GET/POST /roles`, `GET/PUT/DELETE /roles/:id`, `PUT /roles/:id/permissions` | roles with `staffCount` and the whole matrix `[{ module, view, add, edit, delete }]`; the matrix is saved all at once `{ permissions: [{ module, view, add, ... }] }`; a role in use cannot be deleted (409) |
| `GET/POST /teams`, `GET/PUT/DELETE /teams/:id` | teams (`{ name }`), same rules; no permissions |
| `GET/POST /shifts`, `PUT /shifts/:id`, `PUT /shifts/:id/status`, `DELETE /shifts/:id` | shifts `{ name, startTime: 'HH:mm', endTime }` (an end before the start runs past midnight), turned on/off with `{ active }`, `staffCount`; in-use shifts cannot be deleted |
| `GET /shifts/roster`, `GET /shifts/roster/export?format=csv` | the weekly table: `?q&shift=<id\|off>&day=mon..sun&page&limit` -> `{ staff, days: { mon: { type: 'shift', shiftId, name, startTime, endTime } \| { type: 'off' } \| null, ... } }` |
| `PUT /shifts/roster/:staffId`, `DELETE /shifts/roster/:staffId?day=` | `{ shiftId \| off: true, applyTo: 'day' \| 'week_without_off' \| 'week', day }`; DELETE clears one day or the week |
| `GET /attendance`, `/attendance/summary`, `/attendance/export?format=csv` | `?date=YYYY-MM-DD` (default today) `&q&roleId&staffId&status&page&limit`; summary `{ date, totalStaff, present, late, absent, leave }` |
| `POST /attendance/check-in`, `POST /attendance/check-out` | `{ staffId }`; the time is the **server clock** |
| `GET /attendance/staff/:staffId?date=` | status and timeline (`check_in`, `hour_permission`, `returned`, `half_day_leave`, `check_out`) |
| `GET/POST /attendance/leaves`, `GET/PUT/DELETE /attendance/leaves/:id`, `GET /attendance/leaves/summary`, `.../export?format=csv` | leave `{ staffId, type: 'hour_permission'\|'half_day'\|'full_day', date, startTime, endTime, half: 'first'\|'second', reason }`; summary `{ totalLeave, hourPermission, halfDay, fullDay }` |
| `GET /payroll/summary?month=`, `GET /payroll/overview?month=&months=` | the four cards (with `changePercent` versus the previous month, `null` when it had none), upcoming payroll, status counts; chart points per month |
| `GET/POST /payroll/records`, `GET/PUT /payroll/records/:id`, `POST /payroll/records/:id/pay`, `GET /payroll/records/export?format=csv` | records `{ staffId, payDate, basicSalary? }`; list filters `status, month, roleId, staffId, q`; detail adds `financialSummary`, the month's reward/deduction entries and `paymentHistory` |
| `GET/POST /payroll/rewards`, `.../deductions` (+ `/:id` GET, PUT, DELETE, `/export`) | reward `{ staffId, date, reason, specificReason (when 'Other'), amount }`; deduction the same with `totalAmount` and `monthlyAmount` |

**Create body** (`POST /staff`): `name, gender (Male|Female|Others), phone, email, nic, dob, address, emergencyContact { name, relationship, phone },
joinDate, roleId, teamId, employmentType (Fulltime|Part time|Contract|Intern), active (default true), inactiveReason, shiftId, workingDays
(default mon-fri), hoursPerWeek, username, password`, and optionally the owner-only `salary { type, basic, overtime, otRate, paymentMethod,
bankName, accountNumber }` and `epf { allowed, employerNumber, employeeNumber, employeeRate, employerRate, etfRate }`. Dates are `YYYY-MM-DD`,
amounts plain numbers (`60000.50`, no thousands separators). The server makes the code `STF0001, STF0002, ...` per shop, lower-cases the
email, strips spaces from the NIC, hashes the password (salted scrypt) and builds the weekly roster from the shift and working days
(working days get the shift, the rest are `off`). Email, phone, NIC (per shop) and username (per account) must be unique: 409 `DUPLICATE`
with the field name. Files are uploaded afterwards with the image/document routes. Nothing in the response can contain a password, hash,
stored file name or internal path.

**Removal.** The Figma toast says "deleted permanently", but payroll, attendance and leave records point at staff, and the project rule
is to prefer reversible actions. So `DELETE` only hides the staff member (every list, summary, lookup and the roster skip it); the record,
and its email/phone/NIC/code/username, stay reserved and the **owner can restore it**. **PENDING APPROVAL:** confirm whether a real purge is wanted.

### Provisional rules (the designs do not define them: please confirm)
- Required fields: the Figma marks none optional, so all Personal and Employment fields are required; Employment Records (salary, EPF/ETF,
  documents) are optional on the API so the owner can complete them later. Phone 9-15 digits, NIC 12 digits or 9 digits + V/X, username
  3-50 characters without spaces, password the same rule as signup.
- Admin permissions (view/add/edit, no delete, no Employment Records, no payroll) and the owner-only role editing are a security default.
  Only 9 of the "25 permissions" are visible in the Figma, so only those 9 modules exist.
- Staff cannot sign in: username and a password hash are stored, nothing uses them. No role, team, shift or permission is seeded.
- Shifts: a person has one entry per weekday (assigning replaces it). Shifts with overlapping times are allowed. Turning a shift off keeps the
  people on it and only blocks new assignments. "Now" is the server's local time (the shop time zone is not used yet). Active shift = the first
  active shift containing the current time; staff on duty = active staff rostered on it today (a past-midnight shift belongs to the day it started).
- Attendance: owner/admin records check-in/out; once per staff member and day; Late = check-in after the rostered shift start (no grace period);
  a leave overrides the status; Absent = rostered, shift started, no check-in, no leave; overnight shifts are not handled (the date is the check-in date).
  One leave per staff member and date. Not built: yearly leave balance (no allowance is defined), half-day hours, PDF/XLS export (CSV only).
- Payroll: Net Pay = basic + rewards - deductions (as the Figma rows add up). A record belongs to the month of its pay date, one per staff member
  and month; its rewards are those dated in that month and its deductions are the **monthly** amounts dated in that month (how a total is spread
  over later months is undefined). Pending = unpaid, pay date today or later; Overdue = unpaid, earlier. **Pay** only records "paid" with the time
  and freezes the amounts: nothing is processed or sent. Status counts cover all of the shop's records. Not built: "Process Payroll" for everyone,
  the EPF/ETF totals card, tax, approvals, PDF/XLS export.

## What is and is not protected

Protected (sign-in required and scoped to the caller's account or shop): all of `/settings`, all of `/dashboard`, all of Staff
Management (`/staff`, `/roles`, `/teams`, `/permissions`, `/shifts`, `/attendance`, `/payroll`), `/auth/me`, `/auth/logout`. **Still open and not shop-scoped:** every Menu endpoint (products, categories, ingredients,
discount definitions, product images) and every Sales endpoint (orders, summary, export, discount applications), because
their data has no shop or owner column yet. Protecting them means adding `authenticate`, a `shopId` on products, categories,
ingredients, discounts and applications, and filtering every query by it; that is a follow-up that needs approval.

### Before deployment
Set `NODE_ENV=production` and a real `JWT_SECRET`; add a real email/SMS provider; protect and shop-scope Menu and Sales;
replace the in-memory repositories (data, sessions and rate limits are lost on restart and are per process); put the API
behind HTTPS; decide the pending rules; keep the server on a private interface (it only accepts a loopback `HOST`).

## Proposed MySQL tables (NOT created: `database/schema.sql` is untouched)

`accounts(id)`; `shops(id, account_id FK, owner_user_id, name, address, phone, email, website, timezone, image_path, ...)`;
`users(id, account_id FK, role ENUM('owner','admin'), status ENUM('active','disabled'), username, first_name, last_name, phone,
phone_normalized UNIQUE, email UNIQUE, password_hash, email_verified_at, phone_verified_at, image_path, last_login_at, ...)`;
`registrations(id, token_hash UNIQUE, token_expires_at, email, username, password_hash, terms_accepted_at, status, email_verified_at,
owner_name, phone, phone_normalized, phone_verified_at, business_name, address, access_key_hash, access_key_expires_at,
access_key_attempts, access_key_sends JSON, activated_at, created_at)`;
`otps(id, purpose, subject, hash, expires_at, attempts, used_at, invalidated_at, created_at, INDEX(purpose, subject), INDEX(purpose, hash))`;
`sessions(sid UNIQUE, user_id FK, account_id, expires_at, revoked_at, created_at)`; rate limits move to Redis or a table.
Activation (account + owner + shop) and password reset (hash update + token use + session revocation) are single
transactions. Menu and Sales tables later get `shop_id`; `orders.shop_id`, `orders.table_id` and
`order_items(product_id NULL ON DELETE SET NULL, name, quantity, unit_price)` feed the Dashboard. What is still missing for a
database: connection variables in `.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`), the database itself,
and the schema file.

## Moving to MySQL later

Only `repositories/` changes: create `repositories/mysql/{menuRepository,categoryRepository,ingredientRepository,
discountRepository,orderRepository,discountApplicationRepository,businessProfileRepository,
adminProfileRepository,registrationRepository,otpRepository,sessionRepository,accountRepository,staffRepository,staffRoleRepository,shiftRepository,attendanceRepository,payrollRepository}.js` with the same method names as
`repositories/memory/*` (parameterized mysql2 queries; wrap `create`/`update` of a product and its ingredient rows, and
of a discount application and its product rows, in one transaction) and point `repositories/index.js` at them.
Services, controllers, routes and validation stay as they are.
