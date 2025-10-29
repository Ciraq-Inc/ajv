# Billing Reconciliation API Documentation

**Base Path:** `/api/admin/billing`  
**Authentication:** Required (Admin/Super Admin role)  
**Content-Type:** `application/json`

## Overview

The Billing Reconciliation API provides endpoints for monitoring billing health, running reconciliation processes, and managing billing issues across the system. All endpoints require admin authentication.

---

## Table of Contents

1. [Billing Health Monitoring](#billing-health-monitoring)
2. [Reconciliation](#reconciliation)
3. [Reconciliation Issues](#reconciliation-issues)
4. [Audit Log](#audit-log)
5. [Error Responses](#error-responses)
6. [Examples](#examples)

---

## Billing Health Monitoring

### Get Billing Health Overview

Get a comprehensive health overview for all companies' billing systems.

**Endpoint:** `GET /api/admin/billing/health`

**Authentication:** Super Admin required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Number of results (default: 50, max: 1000) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "company_id": 88,
      "company_name": "Company Name",
      "billing_status": "healthy",
      "sms_balance": 500,
      "money_balance": "1600.00",
      "total_sms_sent": 1200,
      "total_money_loaded": "1600.00",
      "total_spent": "1200.00",
      "pending_issues": 0,
      "last_topup_date": "2025-10-27T10:30:00Z",
      "last_usage_date": "2025-10-27T14:22:15Z",
      "created_at": "2025-01-15T08:00:00Z",
      "updated_at": "2025-10-27T14:22:15Z"
    },
    {
      "company_id": 99,
      "company_name": "Another Company",
      "billing_status": "warning",
      "sms_balance": 10,
      "money_balance": "50.00",
      "pending_issues": 2,
      "last_topup_date": "2025-10-20T12:00:00Z",
      "last_usage_date": "2025-10-27T11:45:30Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 50,
    "offset": 0
  }
}
```

**Billing Status Values:**
- `healthy` - No issues, balances match expectations
- `warning` - Minor discrepancies detected
- `critical` - Significant billing issues detected
- `inactive` - No billing activity

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "message": "Insufficient permissions. Super Admin role required."
}
```

---

### Get Company Billing Health

Get billing health for a specific company.

**Endpoint:** `GET /api/admin/billing/health/:companyId`

**Authentication:** Super Admin required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | integer | Yes | Company ID |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "company_id": 265,
    "company_name": "Longview Pharmaceutical Ltd",
    "billing_status": "healthy",
    "sms_balance": 0,
    "sms_credit_balance": 0,
    "money_balance": "100.00",
    "total_sms_loaded": 0,
    "total_sms_sent": 0,
    "total_money_loaded": "100.00",
    "total_spent": "0.00",
    "pending_issues": 0,
    "last_topup_date": "2025-10-27T04:51:00Z",
    "last_usage_date": null,
    "issue_summary": {
      "open": 0,
      "investigating": 0,
      "resolved": 0,
      "ignored": 0
    },
    "health_score": 100,
    "last_reconciliation": "2025-10-27T04:45:00Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Company not found"
}
```

---

## Reconciliation

### Run Daily Reconciliation

Execute reconciliation process for all companies to detect billing discrepancies.

**Endpoint:** `POST /api/admin/billing/reconcile`

**Authentication:** Super Admin required

**Request Body:**
```json
{
  "batch_size": 100,
  "dry_run": false,
  "notify_on_issues": true
}
```

**Request Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `batch_size` | integer | No | 100 | Number of companies to process per batch |
| `dry_run` | boolean | No | false | Run without making changes |
| `notify_on_issues` | boolean | No | true | Send notifications for issues found |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Daily reconciliation completed",
  "data": {
    "companies_processed": 15,
    "issues_found": 3,
    "issues_auto_fixed": 1,
    "issues_requiring_review": 2,
    "processing_time_ms": 2450,
    "started_at": "2025-10-27T05:00:00Z",
    "completed_at": "2025-10-27T05:00:02.450Z",
    "summary": {
      "healthy": 12,
      "warning": 2,
      "critical": 1
    }
  }
}
```

**Error Response:** `409 Conflict`
```json
{
  "success": false,
  "message": "Reconciliation already in progress. Please wait."
}
```

---

### Run Company Reconciliation

Execute reconciliation for a specific company.

**Endpoint:** `POST /api/admin/billing/reconcile/:companyId`

**Authentication:** Super Admin required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `companyId` | integer | Yes | Company ID |

**Request Body:**
```json
{
  "auto_fix": false,
  "include_transactions": true
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Reconciliation completed for company 265",
  "data": {
    "company_id": 265,
    "company_name": "Longview Pharmaceutical Ltd",
    "reconciliation_status": "passed",
    "issues_found": 0,
    "balance_validation": {
      "sms_balance": {
        "expected": 0,
        "actual": 0,
        "status": "match"
      },
      "money_balance": {
        "expected": "100.00",
        "actual": "100.00",
        "status": "match"
      }
    },
    "transaction_summary": {
      "total_transactions": 1,
      "transactions_audited": 1,
      "discrepancies": 0
    },
    "processing_time_ms": 125,
    "completed_at": "2025-10-27T05:05:30Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "Company not found"
}
```

---

## Reconciliation Issues

### Get Reconciliation Issues

Retrieve all billing reconciliation issues with optional filtering.

**Endpoint:** `GET /api/admin/billing/issues`

**Authentication:** Super Admin required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_id` | integer | No | Filter by company |
| `status` | string | No | Filter by status (open, investigating, resolved, ignored) |
| `severity` | string | No | Filter by severity (low, medium, high, critical) |
| `issue_type` | string | No | Filter by type (balance_mismatch, transaction_orphan, duplicate_transaction, rate_mismatch) |
| `limit` | integer | No | Results per page (default: 50, max: 500) |
| `offset` | integer | No | Pagination offset (default: 0) |
| `sort_by` | string | No | Sort field (created_at, severity, company_id) |
| `sort_order` | string | No | Sort order (asc, desc) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "issue_id": 42,
      "company_id": 265,
      "company_name": "Longview Pharmaceutical Ltd",
      "issue_type": "balance_mismatch",
      "severity": "high",
      "status": "open",
      "title": "SMS Balance Mismatch",
      "description": "Actual SMS balance (500) does not match expected balance (450). Difference: 50 SMS",
      "balance_difference": {
        "type": "sms",
        "expected": 450,
        "actual": 500,
        "difference": 50
      },
      "auto_fixable": true,
      "created_at": "2025-10-27T03:15:00Z",
      "updated_at": "2025-10-27T04:30:00Z",
      "created_by": "system",
      "investigation_notes": null
    },
    {
      "issue_id": 43,
      "company_id": 99,
      "company_name": "Another Company",
      "issue_type": "transaction_orphan",
      "severity": "medium",
      "status": "investigating",
      "title": "Orphaned Transaction",
      "description": "Transaction ID 5678 has no corresponding campaign or topup record",
      "auto_fixable": false,
      "created_at": "2025-10-27T02:00:00Z",
      "updated_at": "2025-10-27T04:15:00Z",
      "created_by": "system",
      "investigation_notes": "Investigating if this is from deleted campaign"
    }
  ],
  "pagination": {
    "total": 47,
    "limit": 50,
    "offset": 0
  }
}
```

**Issue Types:**
- `balance_mismatch` - SMS or money balance doesn't match calculations
- `transaction_orphan` - Transaction with no corresponding record
- `duplicate_transaction` - Duplicate transactions detected
- `rate_mismatch` - SMS rate changed mid-transaction

**Severity Levels:**
- `low` - Minor discrepancy, no financial impact
- `medium` - Moderate issue, potential data inconsistency
- `high` - Significant issue, financial discrepancy detected
- `critical` - Major issue, immediate attention required

---

### Get Issue Details

Get detailed information about a specific reconciliation issue.

**Endpoint:** `GET /api/admin/billing/issues/:issueId`

**Authentication:** Super Admin required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueId` | integer | Yes | Issue ID |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "issue_id": 42,
    "company_id": 265,
    "company_name": "Longview Pharmaceutical Ltd",
    "issue_type": "balance_mismatch",
    "severity": "high",
    "status": "open",
    "title": "SMS Balance Mismatch",
    "description": "Actual SMS balance (500) does not match expected balance (450). Difference: 50 SMS",
    "balance_difference": {
      "type": "sms",
      "expected": 450,
      "actual": 500,
      "difference": 50
    },
    "affected_transactions": [
      {
        "transaction_id": 1234,
        "transaction_type": "topup",
        "amount": 50,
        "sms_count": 50,
        "created_at": "2025-10-27T03:10:00Z"
      }
    ],
    "suggested_resolution": "Add 50 SMS to correct balance. This appears to be from transaction ID 1234 that wasn't properly processed.",
    "auto_fixable": true,
    "auto_fix_action": "Deduct 50 SMS from balance to match expected value",
    "previous_resolutions": [
      {
        "resolution_id": 5,
        "status": "ignored",
        "resolution_notes": "Investigated - potential timing issue",
        "resolved_by": "admin_user",
        "resolved_at": "2025-10-26T15:00:00Z"
      }
    ],
    "history": [
      {
        "timestamp": "2025-10-27T03:15:00Z",
        "action": "detected",
        "details": "Issue detected during reconciliation"
      },
      {
        "timestamp": "2025-10-27T04:30:00Z",
        "action": "status_changed",
        "details": "Status changed from new to open"
      }
    ],
    "created_at": "2025-10-27T03:15:00Z",
    "updated_at": "2025-10-27T04:30:00Z"
  }
}
```

---

### Auto-Fix Issue

Attempt to automatically fix a billing issue.

**Endpoint:** `POST /api/admin/billing/issues/:issueId/autofix`

**Authentication:** Super Admin required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueId` | integer | Yes | Issue ID |

**Request Body:**
```json
{
  "confirm": true,
  "reason": "Auto-fixing as per reconciliation protocol"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issue auto-fixed successfully",
  "data": {
    "issue_id": 42,
    "company_id": 265,
    "status": "resolved",
    "previous_status": "open",
    "auto_fix_applied": {
      "action": "deduct_sms",
      "amount": 50,
      "timestamp": "2025-10-27T05:00:00Z"
    },
    "balance_after_fix": {
      "sms_balance": 450,
      "money_balance": "100.00"
    },
    "audit_log_entry": 156,
    "resolved_at": "2025-10-27T05:00:00Z"
  }
}
```

**Error Response:** `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Issue cannot be auto-fixed",
  "error": "This issue type requires manual review"
}
```

---

### Resolve Issue

Manually resolve a billing issue with investigation notes.

**Endpoint:** `POST /api/admin/billing/issues/:issueId/resolve`

**Authentication:** Super Admin required

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `issueId` | integer | Yes | Issue ID |

**Request Body:**
```json
{
  "status": "resolved",
  "resolution": "Balance mismatch was due to timing issue between transactions. Manual adjustment completed.",
  "action_taken": "Manual SMS credit adjustment",
  "adjustment": {
    "type": "sms",
    "amount": -50,
    "reason": "Correction for orphaned transaction"
  }
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `status` | string | Yes | Resolution status (investigating, resolved, ignored) |
| `resolution` | string | Yes | Detailed resolution notes (min 10 chars) |
| `action_taken` | string | No | Action taken to resolve |
| `adjustment` | object | No | Optional balance adjustment |

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Issue resolved successfully",
  "data": {
    "issue_id": 42,
    "company_id": 265,
    "status": "resolved",
    "previous_status": "open",
    "resolution_details": {
      "status": "resolved",
      "notes": "Balance mismatch was due to timing issue...",
      "action_taken": "Manual SMS credit adjustment",
      "resolved_by": "admin_user_id",
      "resolved_at": "2025-10-27T05:10:00Z"
    },
    "balance_after_resolution": {
      "sms_balance": 450,
      "money_balance": "100.00"
    },
    "audit_log_entry": 157
  }
}
```

---

## Audit Log

### Get Audit Log

Retrieve billing audit log entries with optional filtering.

**Endpoint:** `GET /api/admin/billing/audit`

**Authentication:** Super Admin required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_id` | integer | No | Filter by company |
| `changed_by` | string | No | Filter by user who made changes |
| `action_type` | string | No | Filter by action (topup, deduction, refund, adjustment, reconciliation) |
| `start_date` | string | No | Filter from date (ISO 8601: YYYY-MM-DD) |
| `end_date` | string | No | Filter to date (ISO 8601: YYYY-MM-DD) |
| `limit` | integer | No | Results per page (default: 50, max: 500) |
| `offset` | integer | No | Pagination offset (default: 0) |

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "log_id": 156,
      "company_id": 265,
      "company_name": "Longview Pharmaceutical Ltd",
      "operation": "adjustment",
      "amount": -50,
      "balance_type": "sms",
      "balance_before": 500,
      "balance_after": 450,
      "reason": "Manual adjustment - billing reconciliation",
      "changed_by": "super_admin",
      "reference_type": "billing_issue",
      "reference_id": "42",
      "metadata": {
        "issue_id": 42,
        "reconciliation_round": 1
      },
      "created_at": "2025-10-27T05:00:00Z"
    },
    {
      "log_id": 155,
      "company_id": 265,
      "company_name": "Longview Pharmaceutical Ltd",
      "operation": "topup",
      "amount": 100,
      "balance_type": "money",
      "balance_before": 0.00,
      "balance_after": 100.00,
      "reason": "Admin top-up",
      "changed_by": "super_admin",
      "reference_type": "transaction",
      "reference_id": "1234",
      "metadata": {
        "transaction_id": 1234,
        "description": "Balance top-up"
      },
      "created_at": "2025-10-27T04:51:00Z"
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 50,
    "offset": 0
  }
}
```

---

### Create Audit Log Entry

Manually create an audit log entry for manual adjustments.

**Endpoint:** `POST /api/admin/billing/audit`

**Authentication:** Super Admin required

**Request Body:**
```json
{
  "company_id": 265,
  "operation": "adjustment",
  "amount": -50,
  "balance_type": "sms",
  "reason": "Manual correction for billing discrepancy",
  "notes": "Investigated and confirmed balance mismatch from orphaned transaction"
}
```

**Request Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `company_id` | integer | Yes | Company ID |
| `operation` | string | Yes | Operation type (topup, deduction, refund, adjustment, reconciliation) |
| `amount` | number | Yes | Amount of change |
| `balance_type` | string | Yes | Balance type affected (sms, money) |
| `reason` | string | Yes | Reason for audit entry |
| `notes` | string | No | Additional notes |

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Audit log entry created",
  "data": {
    "log_id": 258,
    "company_id": 265,
    "operation": "adjustment",
    "amount": -50,
    "balance_type": "sms",
    "reason": "Manual correction for billing discrepancy",
    "notes": "Investigated and confirmed balance mismatch from orphaned transaction",
    "created_by": "current_admin_user",
    "created_at": "2025-10-27T05:15:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request parameters",
  "errors": {
    "limit": "Must be between 1 and 1000"
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "No valid authentication token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "error": "Super Admin role required for this operation"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found",
  "error": "Issue ID 999 does not exist"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Operation conflict",
  "error": "Reconciliation already in progress"
}
```

### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "Unable to process request",
  "error": "Issue cannot be auto-fixed - manual review required"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "An unexpected error occurred"
}
```

---

## Examples

### Example 1: Check Billing Health

```bash
curl -X GET "http://localhost:3000/api/admin/billing/health" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Example 2: Run Reconciliation for Specific Company

```bash
curl -X POST "http://localhost:3000/api/admin/billing/reconcile/265" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_fix": false,
    "include_transactions": true
  }'
```

### Example 3: Get Reconciliation Issues with Filters

```bash
curl -X GET "http://localhost:3000/api/admin/billing/issues?status=open&severity=high&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

### Example 4: Resolve a Billing Issue

```bash
curl -X POST "http://localhost:3000/api/admin/billing/issues/42/resolve" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "resolution": "Balance mismatch corrected - was due to timing issue in transaction processing",
    "action_taken": "Manual verification and record update"
  }'
```

### Example 5: Get Audit Log for Company

```bash
curl -X GET "http://localhost:3000/api/admin/billing/audit?company_id=265&start_date=2025-10-01&end_date=2025-10-31&limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Rate Limiting

- **Standard requests:** 100 requests per minute
- **Reconciliation requests:** 5 per minute (resource-intensive)
- **Audit log queries:** 50 per minute

---

## Best Practices

1. **Always verify before auto-fixing:** Review issue details before applying automatic fixes
2. **Document manual resolutions:** Provide clear notes when manually resolving issues
3. **Schedule reconciliations:** Run daily reconciliation during off-peak hours
4. **Monitor health scores:** Keep track of health trends for early issue detection
5. **Archive resolved issues:** Periodically archive resolved issues for performance
6. **Review audit logs:** Regularly review audit logs for anomalies

---

## Related Documentation

- [SMS Credits API](./sms-credits-api.md)
- [Companies API](./companies-api.md)
- [API Authentication](./authentication.md)
