# Invoice & Client Management Platform

## Overview

A multi-tenant SaaS-style invoice and client management system where organizations can manage clients, services, invoices, memberships, payments, and team collaboration.

The platform supports:

- User Authentication & Soft Deletes
- Organization Management & Cloudinary Image Uploads
- Team Collaboration & Invitation Lifecycle
- Client Management & Aggregated Customer Stats
- Service Catalog for invoice row auto-completion
- Invoice Management (drafting, tracking, totals calculation)
- Payment Tracking (recording payments, partial credits, balance updates)
- Organization Dashboards & Analytics
- Role-Based Access Control (RBAC) per tenant

---

# Tech Stack

## Backend

- Node.js & Express.js (v5.x Router configuration)
- MongoDB & Mongoose (indexing and schema aggregate queries)
- Cloudinary (Organization Logo and User Avatar uploads)
- Resend API (invitations, resetting credentials, verification link deliveries)

## Authentication

- JWT Access Token
- JWT Refresh Token
- HTTP Only Cookies

---

# Authentication Module
Handles onboarding, profile states, credentials, and verification routines.

### User Registration
`POST /api/v1/auth/signup`
- Creates new account
- Password hashing using bcrypt
- Verification token generation and Resend email transmission

### User Login
`POST /api/v1/auth/login`
- Validates password
- Issues short-lived access and long-lived refresh tokens
- Stores refresh token in DB and sets secure HTTP-only cookies

### Logout
`POST /api/v1/auth/logout`
- Invalidates the active refresh token and clears cookies

### Delete Account
`DELETE /api/v1/auth/delete`
- Performs soft delete by setting `isDeleted: true` and `deletedAt: Date`

### Email Verification
`GET /api/v1/auth/verify-email/:token`
- Confirms email ownership and activates profile (`isEmailVerified: true`)

### Resend Verification Email
`POST /api/v1/auth/resend-email`
- Generates a fresh email token and dispatches activation link

### Password Management
* Change Password: `POST /api/v1/auth/change-password`
* Forgot Password: `POST /api/v1/auth/forgot-password` (issues token link)
* Reset Password: `POST /api/v1/auth/reset-password/:token` (saves new credentials)

---

# Role-Based Access Control (RBAC)
Governs operations inside organizations based on membership role mappings.

### Roles & Permissions Table

| Action | Owner | Admin | Member |
| :--- | :--- | :--- | :--- |
| Delete Organization | ✓ | ✗ | ✗ |
| Modify Organization settings | ✓ | ✗ | ✗ |
| Promote/demote members | ✓ | ✗ | ✗ |
| Remove organization members | ✓ | ✗ | ✗ |
| Manage organization invitations | ✓ | ✓ | ✗ |
| Register Service Catalog items | ✓ | ✓ | ✗ |
| Delete Clients or Invoices | ✓ | ✓ | ✗ |
| Record or Delete Payments | ✓ | ✓ | ✗ |
| View organization details/members | ✓ | ✓ | ✓ |
| Add/Edit Clients | ✓ | ✓ | ✓ |
| Create/View Invoices | ✓ | ✓ | ✓ |
| View recorded Payments | ✓ | ✓ | ✓ |

---

# Organization Module
Enforces the multi-tenancy layer. All core resources are scoped to organizations.

* Create: `POST /api/v1/organizations` (creates membership for creator as `owner`)
* Details: `GET /api/v1/organizations/:organizationId`
* Update: `PATCH /api/v1/organizations/:organizationId`
* Delete: `DELETE /api/v1/organizations/:organizationId`

---

# Membership & Onboarding Modules
Manages team membership levels and invitation workflows.

* List Members: `GET /api/v1/organizations/:organizationId/members`
* Role update: `PATCH /api/v1/organizations/:organizationId/members/:userId`
* Kick member: `DELETE /api/v1/organizations/:organizationId/members/:userId`
* Issue invite: `POST /api/v1/organizations/:organizationId/invitations` (sends Resend token mail)
* List invites: `GET /api/v1/organizations/:organizationId/invitations` (filters: pending, accepted)
* Resolve Invitation:
  * Accept: `POST /api/v1/invitations/:token/accept` (creates Membership record)
  * Reject: `POST /api/v1/invitations/:token/reject`

---

# Client Module
Stores client files.

* Create Client: `POST /api/v1/organizations/:organizationId/clients`
* Query Clients: `GET /api/v1/organizations/:organizationId/clients` (supports paginated search)
* View details: `GET /api/v1/organizations/:organizationId/clients/:clientId`
* Edit client: `PATCH /api/v1/organizations/:organizationId/clients/:clientId`
* Delete client: `DELETE /api/v1/organizations/:organizationId/clients/:clientId`
* Client Invoices: `GET /api/v1/organizations/:organizationId/clients/:clientId/invoices`
* Client Statistics: `GET /api/v1/organizations/:organizationId/clients/:clientId/stats`

---

# Service Catalog Module
Enables product/pricing consistency.

* Create Service: `POST /api/v1/organizations/:organizationId/services`
* Query Services: `GET /api/v1/organizations/:organizationId/services` (filters: active/inactive)
* View Service: `GET /api/v1/organizations/:organizationId/services/:serviceId`
* Edit Service: `PATCH /api/v1/organizations/:organizationId/services/:serviceId`
* Delete Service: `DELETE /api/v1/organizations/:organizationId/services/:serviceId`

---

# Invoice Module
Enables detailed billing calculations, and contains items, discounts, and taxes.

* **Automatic Calculation Logic**: On creation and edits, the server calculates:
  * Subtotal (sum of items quantity × unit price).
  * Line-level tax and discount amounts.
  * Total invoice amount (Subtotal + taxAmount - discountAmount).
  * Outstanding balance (Total Amount - amountPaid).
* **Routes**:
  * Create: `POST /api/v1/organizations/:organizationId/invoices`
  * Query: `GET /api/v1/organizations/:organizationId/invoices`
  * View: `GET /api/v1/organizations/:organizationId/invoices/:invoiceId`
  * Edit: `PATCH /api/v1/organizations/:organizationId/invoices/:invoiceId`
  * Delete: `DELETE /api/v1/organizations/:organizationId/invoices/:invoiceId`
  * Change status: `PATCH /api/v1/organizations/:organizationId/invoices/:invoiceId/status`

---

# Payments Module
Enables credit tracking for outstanding balances.

* **Credit Flow**:
  * Recording a payment reduces the target invoice's `balanceDue` and increases `amountPaid`.
  * If `balanceDue` becomes `0`, status updates to `paid` automatically.
  * If a partial payment is received, status changes to `partially_paid`.
  * Deleting a payment reverts invoice balances.
* **Routes**:
  * Org payments: `GET /api/v1/organizations/:organizationId/payments`
  * Record payment: `POST /api/v1/organizations/:organizationId/invoices/:invoiceId/payments`
  * List payments: `GET /api/v1/organizations/:organizationId/invoices/:invoiceId/payments`
  * View payment: `GET /api/v1/organizations/:organizationId/invoices/:invoiceId/payments/:paymentId`
  * Delete payment: `DELETE /api/v1/organizations/:organizationId/invoices/:invoiceId/payments/:paymentId`

---

# Analytics Module
Aggregates performance stats for organizations.

* Overview: `GET /api/v1/dashboard/:organizationId/overview` (Total clients, gross revenue, collected revenue, outstanding balance, invoice status breakdown)
* Monthly Revenue: `GET /api/v1/dashboard/:organizationId/monthly-revenue` (aggregates billings by calendar month)
* Recent Invoices: `GET /api/v1/dashboard/:organizationId/recent-invoices` (lists last 5 invoices)
* Top Clients: `GET /api/v1/dashboard/:organizationId/top-clients` (ranks clients by invoiced value)

---

# Core Middleware
1. **verifyJWT**: Decodes session JWT and sets `req.user`.
2. **authorizeRoles**: Checks organization parameter `organizationId` and matches user membership roles.
3. **upload**: Configures Multer storage for image assets.
4. **errorHandler**: Standardizes response shapes for API errors.

---

# Development Progress

All core InClient engine capabilities are fully implemented:

| Module | Status | Details |
| :--- | :--- | :--- |
| **Authentication** | ✅ Complete | Email registration, JWT sessions, soft deletion. |
| **Email Verification** | ✅ Complete | Account verification via secure token mails. |
| **Password Management** | ✅ Complete | Hashing, changing, and remote forgot-password resets. |
| **Organization tenantry** | ✅ Complete | Logo upload, currency/timezone parameters. |
| **Membership and RBAC** | ✅ Complete | Role promotion, tenant boundary containment. |
| **Invitation flows** | ✅ Complete | Token generation, acceptance/rejection onboarding. |
| **Client Directories** | ✅ Complete | Searchable details, client invoices, stats. |
| **Service Catalog** | ✅ Complete | Unit metrics, active filters, pricing rows. |
| **Invoices Management** | ✅ Complete | Tax/discount calculations, invoice status lifecycle. |
| **Payments Ledger** | ✅ Complete | Realtime calculations, payment history logs. |
| **Dashboard Analytics** | ✅ Complete | Aggregated charts, client billing rankings. |
