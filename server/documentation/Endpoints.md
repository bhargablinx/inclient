# InClient Backend API Endpoints Specification

Base URL: `/api/v1`

All requests must supply credentials when marked as **Protected** (via cookies or `Authorization: Bearer <token>` header).

---

## 1. System Health Check
* **`GET /healthcheck`**
  * Access: Public

---

## 2. Authentication & Profile Management (`/auth`)
Endpoints handling sessions, activations, and account settings.

* **`POST /auth/signup`**
  * Access: Public
  * Content-Type: `multipart/form-data`
  * Description: Register user account. Supports uploading profile avatar via file field `avatar`.
* **`POST /auth/login`**
  * Access: Public
  * Description: Login user. Responds with access token, refresh token, and cookie configurations.
* **`POST /auth/logout`**
  * Access: Protected
  * Description: Invalidate active user tokens and clear browser cookies.
* **`GET /auth/me`**
  * Access: Protected
  * Description: Return currently authenticated user profile.
* **`DELETE /auth/delete`**
  * Access: Protected
  * Description: Soft delete the user profile (`isDeleted: true`).
* **`POST /auth/change-password`**
  * Access: Protected
  * Description: Replace old password with a new password.
* **`POST /auth/forgot-password`**
  * Access: Public
  * Description: Generate and email a password reset link.
* **`POST /auth/reset-password/:token`**
  * Access: Public
  * Description: Verify reset token and apply new password.
* **`GET /auth/verify-email/:token`**
  * Access: Public
  * Description: Verify email verification token and activate user.
* **`POST /auth/resend-email`**
  * Access: Public
  * Description: Resend verification email to user.
* **`POST /auth/refresh-token`**
  * Access: Public
  * Description: Exchange a valid refresh token for a new short-lived access token.

---

## 3. Organization Administration (`/organizations`)
Top-level routes for organizations management.

* **`POST /organizations`**
  * Access: Protected
  * Content-Type: `multipart/form-data`
  * Description: Register a new organization. Supports logo upload via file field `logo`.
* **`GET /organizations`**
  * Access: Protected
  * Description: Fetch all organizations the logged-in user belongs to.
* **`GET /organizations/:organizationId`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Retrieve details for a specific organization.
* **`PATCH /organizations/:organizationId`**
  * Access: Protected
  * RBAC: `owner`
  * Description: Update organization properties (Name, logo, currency, address, etc.).
* **`DELETE /organizations/:organizationId`**
  * Access: Protected
  * RBAC: `owner`
  * Description: Remove organization profile and clear data.

---

## 4. Nested Organization Services
These routes are nested under the organization context `/organizations/:organizationId` to enforce tenant boundaries.

### 4.1 Client Management (`/organizations/:organizationId/clients`)
* **`POST /`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /:clientId`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`PATCH /:clientId`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`DELETE /:clientId`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`GET /:clientId/invoices`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Fetch invoices issued specifically for this client.
* **`GET /:clientId/stats`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Fetch client stats (Total revenue, invoices, paid and outstanding balances).

### 4.2 Invoice Management (`/organizations/:organizationId/invoices`)
* **`POST /`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /:invoiceId`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`PATCH /:invoiceId`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`DELETE /:invoiceId`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`PATCH /:invoiceId/status`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`GET /:invoiceId/pdf`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Retrieve generated invoice PDF binary (placeholder/WIP).
* **`POST /:invoiceId/send`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Send invoice billing email to client (placeholder/WIP).

### 4.3 Payment Tracking (`/organizations/:organizationId`)
* **`GET /payments`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Retrieve all recorded payments within the organization.
* **`POST /invoices/:invoiceId/payments`**
  * Access: Protected
  * RBAC: `owner`, `admin`
  * Description: Record a payment transaction against an invoice.
* **`GET /invoices/:invoiceId/payments`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Fetch payment logs for a specific invoice.
* **`GET /invoices/:invoiceId/payments/:paymentId`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
  * Description: Fetch details of a recorded payment.
* **`DELETE /invoices/:invoiceId/payments/:paymentId`**
  * Access: Protected
  * RBAC: `owner`, `admin`
  * Description: Delete a payment transaction (restores outstanding balance).

### 4.4 Service Catalog (`/organizations/:organizationId/services`)
* **`POST /`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`GET /`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /:serviceId`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`PATCH /:serviceId`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`DELETE /:serviceId`**
  * Access: Protected
  * RBAC: `owner`, `admin`

### 4.5 Team Collaboration & Onboarding (`/organizations/:organizationId`)
* **`GET /members`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`PATCH /members/:userId`**
  * Access: Protected
  * RBAC: `owner`
* **`DELETE /members/:userId`**
  * Access: Protected
  * RBAC: `owner`
* **`POST /invitations`**
  * Access: Protected
  * RBAC: `owner`, `admin`
* **`GET /invitations`**
  * Access: Protected
  * RBAC: `owner`, `admin`

---

## 5. Standalone Invitations Onboarding
* **`POST /invitations/:token/accept`**
  * Access: Protected
  * Description: Accept invitation. Adds user to organization memberships.
* **`POST /invitations/:token/reject`**
  * Access: Protected
  * Description: Decline invitation.

---

## 6. Organization Metrics Dashboard (`/dashboard/:organizationId`)
* **`GET /dashboard/:organizationId/overview`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /dashboard/:organizationId/monthly-revenue`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /dashboard/:organizationId/recent-invoices`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
* **`GET /dashboard/:organizationId/top-clients`**
  * Access: Protected
  * RBAC: `owner`, `admin`, `member`
