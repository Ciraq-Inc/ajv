# Company User Access Management

## Overview
This feature allows companies to manage which of their users can access the online services portal (SMS campaigns, billing, etc.). Companies can enable or disable online access for individual users or perform bulk operations.

## Features

### 1. User Access Page
**Location:** `/[pharmacy]/services/user-access`

**Features:**
- View all company users in a searchable, filterable table
- Statistics dashboard showing:
  - Total users
  - Users with online access enabled
  - Users with online access disabled
  - Users who have recently logged in
- Individual toggle switches to enable/disable online access for each user
- Bulk operations (coming soon)
- Export user list to CSV
- Search and filter capabilities

### 2. Component Structure

#### Main Component
**File:** `components/access/companyUserAccess.vue`

**Responsibilities:**
- Fetches user list from API
- Displays user table with access controls
- Handles individual and bulk access updates
- Provides search and filtering functionality
- Exports user data to CSV

#### Store Integration
**File:** `stores/company.js`

**New Method:** `makeAuthRequest(url, options)`
- Handles authenticated API requests for company users
- Automatically includes company domain and authorization headers
- Used by the user access component to communicate with backend

### 3. API Endpoints

#### Get Company Users with Access Status
```
GET /api/company/users/access
Headers:
  - Authorization: Bearer {token}
  - x-company-domain: {companyDomain}

Response:
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 123,
        "userid": "USER001",
        "username": "jdoe",
        "lname": "Doe",
        "sname": "John",
        "mname": "M",
        "email": "jdoe@example.com",
        "tel": "233241234567",
        "userrole": "Manager",
        "isactive": true,
        "allowed_online_access": true,
        "password_hash": true,
        "phone_verified": true,
        "last_login": "2024-12-01T10:30:00Z",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "stats": {
      "total": 50,
      "with_access": 35,
      "without_access": 15,
      "recent_logins": 20
    }
  }
}
```

#### Update Individual User Access
```
PUT /api/company/users/{userId}/access
Headers:
  - Authorization: Bearer {token}
  - x-company-domain: {companyDomain}
  - Content-Type: application/json

Body:
{
  "allowed_online_access": true
}

Response:
{
  "success": true,
  "message": "User access updated successfully"
}
```

#### Bulk Update User Access (Future)
```
PUT /api/company/users/bulk-access
Headers:
  - Authorization: Bearer {token}
  - x-company-domain: {companyDomain}
  - Content-Type: application/json

Body:
{
  "user_ids": [123, 456, 789],
  "allowed_online_access": true
}

Response:
{
  "success": true,
  "data": {
    "updated": 3
  },
  "message": "Successfully updated access for 3 users"
}
```

### 4. Navigation

The "User Access" link has been added to the company services navigation menu in the sidebar.

**Location:** `layouts/company.vue`

**Route:** `/[pharmacy]/services/user-access`

**Icon:** UserGroupIcon (HeroIcons)

### 5. Authentication & Middleware

**Middleware:** `companyAuth`
- Ensures user is logged in as a company user
- Redirects to login if not authenticated
- Prevents access to login page if already authenticated

**Layout:** `company`
- Provides consistent navigation and branding
- Shows company name and user information
- Includes logout functionality

### 6. User Experience

#### Access Toggle
- Visual toggle switch for each user
- Shows "Enabled" or "Disabled" status with color coding
- Disabled state while update is in progress
- Immediate feedback on success/failure

#### Statistics Dashboard
- Real-time counts of user access status
- Color-coded cards for easy scanning
- Updates automatically after changes

#### Search & Filters
- Search by name, phone, email, or username
- Filter by access status (enabled/disabled)
- Filter by user status (active/inactive)
- Results update instantly

#### Export Functionality
- Export filtered results to CSV
- Includes all relevant user information
- Filename includes current date

### 7. Permissions

Company users who can access the services portal can manage user access for their own company only. They cannot:
- View users from other companies
- Modify access for users from other companies
- Access admin-level features

### 8. Security Considerations

1. **Company Isolation:** Users can only manage access for their own company
2. **Authentication Required:** All requests require valid JWT token
3. **Company Domain Validation:** Server validates company domain matches user's company
4. **Audit Trail:** (Recommended) Track who enabled/disabled access and when

### 9. Future Enhancements

- [ ] Bulk enable/disable for selected users
- [ ] Email notifications when access is enabled
- [ ] Access history/audit log
- [ ] User role management
- [ ] Invite new users via email
- [ ] Password reset functionality for users
- [ ] Two-factor authentication setup

### 10. Testing

To test the feature:

1. Login as a company user at `/[pharmacy]/services/login`
2. Navigate to "User Access" in the sidebar
3. View the list of company users
4. Toggle online access for a user
5. Test search and filter functionality
6. Export users to CSV
7. Logout and verify the user's access status

### 11. Related Files

```
ajv/
├── components/
│   └── access/
│       └── companyUserAccess.vue     # Main user access component
├── pages/
│   └── [pharmacy]/
│       └── services/
│           └── user-access.vue       # Page wrapper
├── layouts/
│   └── company.vue                   # Layout with navigation
├── middleware/
│   └── companyAuth.js                # Authentication middleware
├── stores/
│   └── company.js                    # Company store with makeAuthRequest
└── docs/
    └── company-user-access.md        # This file
```

## Backend Requirements

The backend needs to implement these endpoints:

1. `GET /api/company/users/access` - Return users for the authenticated company
2. `PUT /api/company/users/{id}/access` - Update access for a specific user
3. `PUT /api/company/users/bulk-access` - Bulk update access (optional)

**Backend should:**
- Validate user is authenticated
- Extract company ID from JWT token or x-company-domain header
- Only return/update users belonging to that company
- Return proper error messages for unauthorized access
- Log access changes for audit purposes
