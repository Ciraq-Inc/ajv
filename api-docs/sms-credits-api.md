# SMS Credits API Documentation

## Overview

The SMS Credits API manages company SMS credit balances, money balances, transactions, and billing operations. It provides endpoints for companies to purchase credits, check balances, and view transaction history, as well as admin endpoints for managing company credits and billing oversight.

**Base URL**: `/api/sms-credits`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Company Endpoints](#company-endpoints)
3. [Admin Endpoints](#admin-endpoints)
4. [Error Handling](#error-handling)
5. [Response Format](#response-format)

---

## Authentication

All endpoints require authentication via one of the following:

- **Company Authentication**: Bearer token in `Authorization` header for company-scoped operations
- **Admin Authentication**: Bearer token with `super_admin` role for admin operations

### Middleware

- `authenticateCompany`: Validates company token and extracts `company_id`
- `requireAdminRole('super_admin')`: Validates admin role
- `validateCompanyAccess`: Ensures company user can only access their own data
- `verifyAdminToken`: Additional admin token verification

---

## Company Endpoints

### Get Company Credit Balance

Get the current SMS credit and money balance for the authenticated company.

```
GET /balance
```

**Authentication**: Required (Company)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sms_credit_balance": 500,
    "money_balance": 1250.50,
    "total_sms_loaded": 5000,
    "total_sms_sent": 4500,
    "total_money_loaded": 5000.00
  }
}
```

**Error Responses**:
- `403`: Company ID not found in request
- `404`: Credit account not found
- `500`: Internal server error

---

### Get Billing Overview

Get comprehensive billing overview including current balance, recent activity, and statistics.

```
GET /overview
```

**Authentication**: Required (Company)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "current_balance": 500,
    "money_balance": 1250.50,
    "recent_transactions": [...],
    "daily_summary": [...],
    "statistics": {...}
  }
}
```

**Error Responses**:
- `403`: Company ID not found in request
- `500`: Internal server error

---

### Get Transaction History

Retrieve paginated transaction history with optional filters.

```
GET /transactions?transaction_type=purchase&start_date=2025-01-01&end_date=2025-12-31&limit=50&offset=0
```

**Authentication**: Required (Company)

**Query Parameters**:
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `transaction_type` | string | Filter by transaction type (e.g., 'purchase', 'sent', 'topup') | No |
| `start_date` | string | Filter transactions from this date (YYYY-MM-DD) | No |
| `end_date` | string | Filter transactions until this date (YYYY-MM-DD) | No |
| `limit` | integer | Number of records per page (default: 50) | No |
| `offset` | integer | Number of records to skip (default: 0) | No |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "company_id": 5,
      "transaction_type": "purchase",
      "sms_count": 100,
      "money_amount": 5.00,
      "description": "SMS credit purchase",
      "created_at": "2025-10-26T10:30:00Z"
    },
    {
      "id": 2,
      "company_id": 5,
      "transaction_type": "sent",
      "sms_count": 50,
      "money_amount": 2.50,
      "description": "SMS campaign",
      "created_at": "2025-10-26T09:15:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Error Responses**:
- `403`: Company ID not found in request
- `500`: Internal server error

---

### Get Transaction Statistics

Get aggregated transaction statistics by type and daily summary.

```
GET /stats?start_date=2025-01-01&end_date=2025-12-31
```

**Authentication**: Required (Company)

**Query Parameters**:
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `start_date` | string | Statistics from this date (YYYY-MM-DD) | No |
| `end_date` | string | Statistics until this date (YYYY-MM-DD) | No |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "by_type": [
      {
        "transaction_type": "purchase",
        "count": 45,
        "total_sms": 4500,
        "total_money": 225.00
      },
      {
        "transaction_type": "sent",
        "count": 150,
        "total_sms": 4500,
        "total_money": 225.00
      }
    ],
    "totals": {
      "total_transactions": 195,
      "total_sms_in": 4500,
      "total_sms_out": 4500,
      "total_money_in": 225.00,
      "total_money_out": 225.00
    },
    "daily_summary": [
      {
        "date": "2025-10-26",
        "transaction_count": 12,
        "sms_sent": 320,
        "money_spent": 16.00
      }
    ]
  }
}
```

**Error Responses**:
- `403`: Company ID not found in request
- `500`: Internal server error

---

### Purchase SMS Credits

Purchase SMS credits using the company's money balance.

```
POST /purchase
Content-Type: application/json

{
  "sms_count": 1000
}
```

**Authentication**: Required (Company)

**Request Body**:
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `sms_count` | integer | Number of SMS credits to purchase (must be > 0) | Yes |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "SMS credits purchased successfully",
  "data": {
    "sms_credits_added": 1000,
    "money_deducted": 50.00,
    "sms_balance": 1500,
    "money_balance": 1200.50
  }
}
```

**Error Responses**:
- `400`: Invalid `sms_count` or insufficient money balance
- `403`: Company ID not found in request
- `500`: Internal server error

---

### Estimate Campaign Cost

Get a cost estimate for sending SMS to a specific number of recipients.

```
POST /estimate
Content-Type: application/json

{
  "recipient_count": 500
}
```

**Authentication**: Required (Company)

**Request Body**:
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `recipient_count` | integer | Number of recipients (must be > 0) | Yes |

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "recipient_count": 500,
    "sms_rate_per_unit": 0.05,
    "estimated_total_cost": 25.00,
    "estimated_sms_credits": 500
  }
}
```

**Error Responses**:
- `400`: Invalid `recipient_count`
- `500`: Internal server error

---

### Get Current SMS Rate

Retrieve the current SMS rate per unit.

```
GET /rate
```

**Authentication**: Required (Company)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sms_rate_per_unit": 0.05,
    "currency": "GHS"
  }
}
```

**Error Responses**:
- `500`: Internal server error

---

### Get Company Sender ID

Retrieve the SMS sender ID configured for the company.

```
GET /sender-id
```

**Authentication**: Required (Company)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "sender_id": "RIGEL_MED",
    "is_active": true
  }
}
```

**Error Responses**:
- `403`: Company ID not found in request
- `404`: Company SMS settings not found
- `500`: Internal server error

---

### Update Company Sender ID

Update or set the SMS sender ID for the company (requires admin role).

```
PUT /sender-id
Content-Type: application/json

{
  "sender_id": "NEW_SENDER_ID"
}
```

**Authentication**: Required (Admin - super_admin)

**Request Body**:
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `sender_id` | string | New sender ID (non-empty string, max 11 chars typically) | Yes |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Sender ID updated successfully",
  "data": {
    "sender_id": "NEW_SENDER_ID"
  }
}
```

**Error Responses**:
- `400`: Invalid `sender_id` or sender ID already in use
- `403`: Company ID not found or unauthorized
- `500`: Internal server error

---

## Admin Endpoints

All admin endpoints require `super_admin` role.

### Get All Companies Credit Overview

Get credit overview for all companies with optional filters.

```
GET /admin/overview?low_balance=500&search=company_name&limit=50&offset=0
```

**Authentication**: Required (Admin - super_admin)

**Query Parameters**:
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `low_balance` | integer | Filter companies with balance below this threshold | No |
| `search` | string | Search companies by name or ID | No |
| `limit` | integer | Number of records per page (default: 50) | No |
| `offset` | integer | Number of records to skip (default: 0) | No |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "company_id": 1,
      "company_name": "Medical Group A",
      "sms_balance": 1000,
      "money_balance": 5000.00,
      "total_sent": 10000,
      "last_transaction": "2025-10-26T15:30:00Z"
    },
    {
      "company_id": 2,
      "company_name": "Health Partners",
      "sms_balance": 50,
      "money_balance": 250.00,
      "total_sent": 5000,
      "last_transaction": "2025-10-25T10:00:00Z"
    }
  ],
  "count": 2
}
```

**Error Responses**:
- `500`: Internal server error

---

### Get Low Balance Companies

Get list of companies with SMS credit balance below a threshold.

```
GET /admin/low-balance?threshold=100
```

**Authentication**: Required (Admin - super_admin)

**Query Parameters**:
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `threshold` | integer | Balance threshold (default: 100) | No |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "company_id": 2,
      "company_name": "Health Partners",
      "sms_balance": 50,
      "money_balance": 250.00
    },
    {
      "company_id": 5,
      "company_name": "Clinic Network",
      "sms_balance": 75,
      "money_balance": 100.00
    }
  ],
  "count": 2
}
```

**Error Responses**:
- `500`: Internal server error

---

### Top Up Company Money Balance

Add funds to a company's money balance (admin only operation).

```
POST /admin/topup-money
Content-Type: application/json

{
  "company_id": 5,
  "amount": 1000.00,
  "description": "Annual subscription payment"
}
```

**Authentication**: Required (Admin - super_admin)

**Request Body**:
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `company_id` | integer | Target company ID (must be > 0) | Yes |
| `amount` | number | Amount to add (must be > 0) | Yes |
| `description` | string | Transaction description (default: "Admin top-up") | No |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Money balance topped up successfully",
  "data": {
    "transaction_id": 1234,
    "new_balance": 2250.00
  }
}
```

**Error Responses**:
- `400`: Invalid `company_id` or `amount`
- `500`: Internal server error

---

### Top Up Company SMS Credits

Add SMS credits to a company's balance (admin only operation).

```
POST /admin/topup-sms
Content-Type: application/json

{
  "company_id": 5,
  "sms_count": 5000,
  "description": "Promotional SMS credits"
}
```

**Authentication**: Required (Admin - super_admin)

**Request Body**:
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `company_id` | integer | Target company ID (must be > 0) | Yes |
| `sms_count` | integer | Number of SMS credits to add (must be > 0) | Yes |
| `description` | string | Transaction description (default: "Admin SMS credit top-up") | No |

**Response** (200 OK):
```json
{
  "success": true,
  "message": "SMS credits topped up successfully",
  "data": {
    "transaction_id": 1235,
    "new_balance": 6000
  }
}
```

**Error Responses**:
- `400`: Invalid `company_id` or `sms_count`
- `500`: Internal server error

---

### Get Company Transaction History (Admin)

Retrieve transaction history for a specific company (admin view).

```
GET /admin/transactions/:companyId?transaction_type=sent&start_date=2025-01-01&limit=50&offset=0
```

**Authentication**: Required (Admin - super_admin)

**Path Parameters**:
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `companyId` | integer | ID of the company | Yes |

**Query Parameters**:
| Parameter | Type | Description | Required |
|-----------|------|-------------|----------|
| `transaction_type` | string | Filter by transaction type | No |
| `start_date` | string | Filter from this date (YYYY-MM-DD) | No |
| `end_date` | string | Filter until this date (YYYY-MM-DD) | No |
| `limit` | integer | Number of records per page (default: 50) | No |
| `offset` | integer | Number of records to skip (default: 0) | No |

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 100,
      "company_id": 5,
      "transaction_type": "sent",
      "sms_count": 250,
      "money_amount": 12.50,
      "description": "SMS campaign",
      "created_at": "2025-10-26T14:20:00Z"
    }
  ],
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Error Responses**:
- `400`: Invalid company ID
- `500`: Internal server error

---

## Error Handling

All error responses follow the standard format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error information (when applicable)"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid parameters) |
| 403 | Forbidden (unauthorized access) |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Response Format

All successful responses use the following structure:

```json
{
  "success": true,
  "message": "Optional message describing the operation",
  "data": {
    // Response data specific to the endpoint
  },
  "pagination": {
    // Only for paginated endpoints
    "total": 100,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

---

## Examples

### Example 1: Check Balance

```bash
curl -X GET https://api.example.com/api/sms-credits/balance \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN"
```

### Example 2: Purchase SMS Credits

```bash
curl -X POST https://api.example.com/api/sms-credits/purchase \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sms_count": 1000
  }'
```

### Example 3: Admin Top-Up SMS (Admin Only)

```bash
curl -X POST https://api.example.com/api/sms-credits/admin/topup-sms \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": 5,
    "sms_count": 10000,
    "description": "Promotional credits"
  }'
```

### Example 4: Get Transaction History with Filters

```bash
curl -X GET "https://api.example.com/api/sms-credits/transactions?transaction_type=sent&start_date=2025-10-01&limit=100&offset=0" \
  -H "Authorization: Bearer YOUR_COMPANY_TOKEN"
```

---

## Rate Limiting

SMS Credits API endpoints follow standard rate limiting policies. Check response headers for:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Support

For questions or issues with the SMS Credits API, please contact the development team or refer to the main API documentation.

---

**Last Updated**: October 26, 2025  
**API Version**: 1.0
