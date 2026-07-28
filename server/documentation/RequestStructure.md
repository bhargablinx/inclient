# API Request & Payload Structure Specification

Base URL: `/api/v1`

This document defines request parameters, body shapes, query parameters, and response structures for integration.

---

## 1. System Health Check

### `GET /healthcheck`
* **Params**: None
* **Query**: None
* **Body**: None
* **Success Response (200)**:
```json
{
  "statusCode": 200,
  "data": null,
  "message": "Health check successful"
}
```

---

## 2. Authentication & Sessions (`/auth`)

### `POST /auth/signup`
* **Content-Type**: `multipart/form-data`
* **Body (form fields)**:
  * `name`: string (required)
  * `email`: string (required)
  * `password`: string (required)
  * `avatar`: file (optional)

### `POST /auth/login`
* **Body**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

### `POST /auth/logout`
* **Auth**: JWT required
* **Body**: None

### `POST /auth/change-password`
* **Auth**: JWT required
* **Body**:
```json
{
  "oldPassword": "CurrentPassword123",
  "newPassword": "NewPassword123"
}
```

### `POST /auth/forgot-password`
* **Body**:
```json
{
  "email": "user@example.com"
}
```

### `POST /auth/reset-password/:token`
* **Params**:
  * `token`: string (reset token)
* **Body**:
```json
{
  "newPassword": "NewPassword123"
}
```

### `GET /auth/verify-email/:token`
* **Params**:
  * `token`: string (verification token)
* **Body**: None

### `POST /auth/resend-email`
* **Body**:
```json
{
  "email": "user@example.com"
}
```

### `GET /auth/me`
* **Auth**: JWT required
* **Body**: None

### `POST /auth/refresh-token`
* **Body**:
```json
{
  "refreshToken": "optional-if-supplied-via-cookie"
}
```

### `DELETE /auth/delete`
* **Auth**: JWT required
* **Body**: None

---

## 3. Organizations Module (`/organizations`)

### `POST /organizations`
* **Auth**: JWT required
* **Content-Type**: `multipart/form-data`
* **Body (form fields)**:
  * `name`: string (required)
  * `email`: string (optional)
  * `phone`: string (optional)
  * `website`: string (optional)
  * `address`: string (optional)
  * `taxId`: string (optional)
  * `currency`: string (optional, default `"USD"`)
  * `timezone`: string (optional, default `"UTC"`)
  * `logo`: file (optional)

### `GET /organizations`
* **Auth**: JWT required
* **Body**: None

### `GET /organizations/:organizationId`
* **Auth**: JWT + Member role check
* **Params**:
  * `organizationId`: string (Organization ID)

### `PATCH /organizations/:organizationId`
* **Auth**: JWT + Owner check
* **Params**:
  * `organizationId`: string
* **Content-Type**: `multipart/form-data`
* **Body (form fields)**: (all optional)
  * `name`, `email`, `phone`, `website`, `address`, `taxId`, `currency`, `timezone`, `logo`

### `DELETE /organizations/:organizationId`
* **Auth**: JWT + Owner check
* **Params**:
  * `organizationId`: string

---

## 4. Tenant-Scoped Sub-Resources

### 4.1 Clients (`/organizations/:organizationId/clients`)

### `POST /`
* **Auth**: JWT + Member check
* **Body**:
```json
{
  "name": "Jane Customer",
  "email": "jane.cust@example.com",
  "phone": "+91-9876543211",
  "companyName": "Acme Ventures",
  "address": "San Francisco, CA",
  "taxId": "TAX-US-555"
}
```

### `GET /`
* **Auth**: JWT + Member check
* **Query**:
  * `page`: integer (optional, default `1`)
  * `limit`: integer (optional, default `10`)
  * `search`: string (optional, searches name, email, company)

### `GET /:clientId`
* **Auth**: JWT + Member check
* **Params**:
  * `clientId`: string

### `PATCH /:clientId`
* **Auth**: JWT + Member check
* **Params**:
  * `clientId`: string
* **Body**: (all fields optional)
  * `name`, `email`, `phone`, `companyName`, `address`, `taxId`

### `DELETE /:clientId`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `clientId`: string

### `GET /:clientId/invoices`
* **Auth**: JWT + Member check
* **Params**:
  * `clientId`: string

### `GET /:clientId/stats`
* **Auth**: JWT + Member check
* **Params**:
  * `clientId`: string

---

### 4.2 Invoices (`/organizations/:organizationId/invoices`)

### `POST /`
* **Auth**: JWT + Member check
* **Body**:
```json
{
  "client": "60c72b2f9b1d8e2b8c8d8f99",
  "invoiceNumber": "INV-2026-001",
  "dueDate": "2026-08-30T00:00:00.000Z",
  "currency": "USD",
  "notes": "Payment due within 30 days.",
  "items": [
    {
      "service": "60c72b2f9b1d8e2b8c8d8f00",
      "description": "Custom CRM Integration",
      "quantity": 10,
      "unitPrice": 150,
      "taxRate": 10,
      "discountAmount": 50
    }
  ],
  "taxAmount": 150,
  "discountAmount": 50
}
```

### `GET /`
* **Auth**: JWT + Member check
* **Query**:
  * `page`, `limit`, `search` (optional)
  * `status`: string (optional, e.g. `draft`, `sent`, `paid`, `overdue`)
  * `client`: string (optional, client ID filter)

### `GET /:invoiceId`
* **Auth**: JWT + Member check
* **Params**:
  * `invoiceId`: string

### `PATCH /:invoiceId`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `invoiceId`: string
* **Body**: (all fields optional, matches POST format)

### `DELETE /:invoiceId`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `invoiceId`: string

### `PATCH /:invoiceId/status`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `invoiceId`: string
* **Body**:
```json
{
  "status": "sent"
}
```

### `GET /:invoiceId/pdf`
* **Auth**: JWT + Member check
* **Params**:
  * `invoiceId`: string

### `POST /:invoiceId/send`
* **Auth**: JWT + Member check
* **Params**:
  * `invoiceId`: string

---

### 4.3 Payments (`/organizations/:organizationId`)

### `GET /payments` (Org-wide)
* **Auth**: JWT + Member check
* **Params**: None (queries all payments of organization)

### `POST /invoices/:invoiceId/payments` (Record Payment)
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `invoiceId`: string
* **Body**:
```json
{
  "amount": 1000,
  "paymentDate": "2026-07-28T18:00:00.000Z",
  "paymentMethod": "bank_transfer",
  "referenceNumber": "UTR998877665",
  "notes": "First partial payment."
}
```

### `GET /invoices/:invoiceId/payments` (List payments)
* **Auth**: JWT + Member check
* **Params**:
  * `invoiceId`: string

### `GET /invoices/:invoiceId/payments/:paymentId`
* **Auth**: JWT + Member check
* **Params**:
  * `invoiceId`: string
  * `paymentId`: string

### `DELETE /invoices/:invoiceId/payments/:paymentId`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `invoiceId`: string
  * `paymentId`: string

---

### 4.4 Service Catalog (`/organizations/:organizationId/services`)

### `POST /`
* **Auth**: JWT + Owner/Admin check
* **Body**:
```json
{
  "name": "Backend Consulting",
  "description": "Express and Node API architecture services.",
  "unitPrice": 120,
  "unit": "hour",
  "taxRate": 18
}
```

### `GET /`
* **Auth**: JWT + Member check
* **Query**:
  * `page`, `limit`, `search` (optional)
  * `active`: string (`"true"` or `"false"`, optional)

### `GET /:serviceId`
* **Auth**: JWT + Member check
* **Params**:
  * `serviceId`: string

### `PATCH /:serviceId`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `serviceId`: string
* **Body**: (all fields optional)
  * `name`, `description`, `unitPrice`, `unit`, `taxRate`, `isActive`

### `DELETE /:serviceId`
* **Auth**: JWT + Owner/Admin check
* **Params**:
  * `serviceId`: string

---

### 4.5 Memberships & Invitations (`/organizations/:organizationId`)

### `GET /members`
* **Auth**: JWT + Member check

### `PATCH /members/:userId`
* **Auth**: JWT + Owner check
* **Params**:
  * `userId`: string
* **Body**:
```json
{
  "role": "admin"
}
```

### `DELETE /members/:userId`
* **Auth**: JWT + Owner check
* **Params**:
  * `userId`: string

### `POST /invitations`
* **Auth**: JWT + Owner/Admin check
* **Body**:
```json
{
  "email": "invitee@example.com",
  "role": "member"
}
```

### `GET /invitations`
* **Auth**: JWT + Owner/Admin check
* **Query**:
  * `status`: string (optional, e.g. `pending`, `accepted`, `rejected`)

---

## 5. Standalone Invitations

### `POST /invitations/:token/accept`
* **Auth**: JWT required
* **Params**:
  * `token`: string

### `POST /invitations/:token/reject`
* **Auth**: JWT required
* **Params**:
  * `token`: string

---

## 6. Dashboard Metrics (`/dashboard/:organizationId`)

### `GET /dashboard/:organizationId/overview`
* **Auth**: JWT + Member check
* **Params**:
  * `organizationId`: string

### `GET /dashboard/:organizationId/monthly-revenue`
* **Auth**: JWT + Member check
* **Params**:
  * `organizationId`: string

### `GET /dashboard/:organizationId/recent-invoices`
* **Auth**: JWT + Member check
* **Params**:
  * `organizationId`: string

### `GET /dashboard/:organizationId/top-clients`
* **Auth**: JWT + Member check
* **Params**:
  * `organizationId`: string
