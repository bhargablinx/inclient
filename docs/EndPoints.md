# InClient API Endpoints Reference

All API routes are prefixed with `/api/v1`.

---

## 1. System Endpoints

### Health Check
* **GET `/healthcheck`**: Public route to verify the server status.

---

## 2. Authentication & Session Module
Endpoints for onboarding users, session handshakes, and account configuration.

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/auth/signup` | Register a new user account (avatar upload optional). | No |
| **POST** | `/auth/login` | Authenticate credentials and return access + refresh tokens. | No |
| **POST** | `/auth/logout` | Revoke user sessions and clear browser cookies. | Yes |
| **GET** | `/auth/me` | Fetch detailed profile data for the active user session. | Yes |
| **DELETE** | `/auth/delete` | Mark user account as deleted (soft delete). | Yes |
| **POST** | `/auth/change-password` | Update current password securely. | Yes |
| **POST** | `/auth/forgot-password` | Send verification reset links to target email. | No |
| **POST** | `/auth/reset-password/:token` | Complete password reset using token validation. | No |
| **GET** | `/auth/verify-email/:token` | Verify and activate user accounts. | No |
| **POST** | `/auth/resend-email` | Dispatch a fresh activation link. | No |
| **POST** | `/auth/refresh-token` | Renew expired access tokens using refresh tokens. | No |

---

## 3. Organizations Module
Manage tenant properties.

| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **POST** | `/organizations` | Create a new organization and upload its logo. | Logged in user |
| **GET** | `/organizations` | Fetch all organizations current user belongs to. | Logged in user |
| **GET** | `/organizations/:organizationId` | Retrieve organization meta data. | `owner`, `admin`, `member` |
| **PATCH** | `/organizations/:organizationId` | Modify organization details. | `owner` |
| **DELETE** | `/organizations/:organizationId` | Remove organization and delete data. | `owner` |

---

## 4. Tenant-Scoped Sub-Resources
These endpoints are nested under the organization context to ensure strict multi-tenant boundary containment.

### Client Management (`/organizations/:organizationId/clients`)
| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Create a client profile. | `owner`, `admin`, `member` |
| **GET** | `/` | Query client list (supports search & page flags). | `owner`, `admin`, `member` |
| **GET** | `/:clientId` | Retrieve detailed client record. | `owner`, `admin`, `member` |
| **PATCH** | `/:clientId` | Update client details. | `owner`, `admin`, `member` |
| **DELETE** | `/:clientId` | Remove client record. | `owner`, `admin` |
| **GET** | `/:clientId/invoices` | List invoices associated with the client. | `owner`, `admin`, `member` |
| **GET** | `/:clientId/stats` | Retrieve revenue and payment statistics for client. | `owner`, `admin`, `member` |

### Invoice Management (`/organizations/:organizationId/invoices`)
| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Create a new draft/sent invoice with item rows. | `owner`, `admin`, `member` |
| **GET** | `/` | Query invoice list (supports status & client filtering). | `owner`, `admin`, `member` |
| **GET** | `/:invoiceId` | Retrieve complete invoice and line items. | `owner`, `admin`, `member` |
| **PATCH** | `/:invoiceId` | Edit fields/items of unpaid invoices. | `owner`, `admin` |
| **DELETE** | `/:invoiceId` | Delete invoice from records. | `owner`, `admin` |
| **PATCH** | `/:invoiceId/status` | Update invoice state (e.g. sent, paid, cancelled). | `owner`, `admin` |
| **GET** | `/:invoiceId/pdf` | Generate PDF compilation binary of invoice. | `owner`, `admin`, `member` |
| **POST** | `/:invoiceId/send` | Send invoice via email (integrates with mail templates). | `owner`, `admin`, `member` |

### Payment Tracking (`/organizations/:organizationId`)
| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **GET** | `/payments` | Query organization-wide recorded payments. | `owner`, `admin`, `member` |
| **POST** | `/invoices/:invoiceId/payments` | Record a partial or full payment for an invoice. | `owner`, `admin` |
| **GET** | `/invoices/:invoiceId/payments` | Fetch payments history for an invoice. | `owner`, `admin`, `member` |
| **GET** | `/invoices/:invoiceId/payments/:paymentId` | Retrieve details of a recorded payment. | `owner`, `admin`, `member` |
| **DELETE** | `/invoices/:invoiceId/payments/:paymentId` | Delete recorded payment (and recalculate invoice balance). | `owner`, `admin` |

### Service Catalog (`/organizations/:organizationId/services`)
| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **POST** | `/` | Register a reusable product/service. | `owner`, `admin` |
| **GET** | `/` | List catalog items. | `owner`, `admin`, `member` |
| **GET** | `/:serviceId` | Retrieve details of a catalog service. | `owner`, `admin`, `member` |
| **PATCH** | `/:serviceId` | Edit name, pricing, tax rate or active state. | `owner`, `admin` |
| **DELETE** | `/:serviceId` | Remove item from service catalog. | `owner`, `admin` |

### Team Memberships & Invitations (`/organizations/:organizationId`)
| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **GET** | `/members` | List active organization members and roles. | `owner`, `admin`, `member` |
| **PATCH** | `/members/:userId` | Promote or demote user roles. | `owner` |
| **DELETE** | `/members/:userId` | Remove user from organization membership. | `owner` |
| **POST** | `/invitations` | Issue invitation to join organization by email. | `owner`, `admin` |
| **GET** | `/invitations` | List sent invitations and status tracking. | `owner`, `admin` |

---

## 5. Standalone Onboarding
Used when resolving invitation tokens outside organization contexts.

| Method | Route | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| **POST** | `/invitations/:token/accept` | Accept an invitation and join organization. | Yes |
| **POST** | `/invitations/:token/reject` | Decline invitation. | Yes |

---

## 6. Organization Dashboards (`/dashboard/:organizationId`)
Fetch aggregates and charts metrics.

| Method | Route | Description | Allowed Roles |
| :--- | :--- | :--- | :--- |
| **GET** | `/overview` | Retrieve summary totals (clients, revenues, outstandings). | `owner`, `admin`, `member` |
| **GET** | `/monthly-revenue` | Retrieve monthly revenue split trends. | `owner`, `admin`, `member` |
| **GET** | `/recent-invoices` | Retrieve a short list of newly created invoices. | `owner`, `admin`, `member` |
| **GET** | `/top-clients` | Retrieve clients ranked by total billed value. | `owner`, `admin`, `member` |
