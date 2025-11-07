# SMS Settings API Documentation

This document provides an overview of the SMS Settings API endpoints available in the Rigel Medsgh application. These endpoints manage global SMS provider settings and rates for the system.

## Base URL
All endpoints are prefixed with `/api/sms-settings` (assuming the routes are mounted under `/api`).

## Authentication
All SMS Settings endpoints require **super_admin** role authentication. Requests must include valid admin authentication headers.

## Endpoints

### Get Active SMS Settings
- **Method**: GET
- **Path**: `/active`
- **Description**: Retrieve the currently active SMS settings (provider and rate)
- **Authentication**: Required (super_admin role)
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "data": {
        "id": 1,
        "active_provider": "nalo",
        "sms_rate": 0.05,
        "created_at": "2025-01-01T00:00:00.000Z",
        "updated_at": "2025-01-01T00:00:00.000Z"
      }
    }
    ```
  - **Not Found (404)**:
    ```json
    {
      "success": false,
      "message": "SMS settings not configured"
    }
    ```

### Get All SMS Settings History
- **Method**: GET
- **Path**: `/`
- **Description**: Retrieve all SMS settings records (historical data)
- **Authentication**: Required (super_admin role)
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": 1,
          "active_provider": "nalo",
          "sms_rate": 0.05,
          "created_at": "2025-01-01T00:00:00.000Z",
          "updated_at": "2025-01-01T00:00:00.000Z"
        }
      ],
      "count": 1
    }
    ```

### Initialize SMS Settings
- **Method**: POST
- **Path**: `/initialize`
- **Description**: Initialize SMS settings for first-time setup (can only be called once)
- **Authentication**: Required (super_admin role)
- **Request Body**:
  ```json
  {
    "provider": "nalo",
    "rate": 0.05
  }
  ```
- **Parameters**:
  - `provider` (optional): SMS provider name. Valid values: `"nalo"`, `"mnotify"`. Default: `"nalo"`
  - `rate` (optional): SMS rate per message. Must be a positive number. Default: `0.05`
- **Response**:
  - **Success (201)**:
    ```json
    {
      "success": true,
      "message": "SMS settings initialized successfully",
      "data": {
        "id": 1,
        "active_provider": "nalo",
        "sms_rate": 0.05
      }
    }
    ```
  - **Bad Request (400)**: Settings already exist or invalid parameters
  - **Validation Errors**:
    - Invalid provider (must be "nalo" or "mnotify")
    - Invalid rate (must be a positive number)

### Update SMS Settings
- **Method**: PUT
- **Path**: `/`
- **Description**: Update both SMS provider and rate settings together
- **Authentication**: Required (super_admin role)
- **Request Body**:
  ```json
  {
    "provider": "mnotify",
    "rate": 0.08
  }
  ```
- **Parameters**:
  - `provider` (optional): SMS provider name. Valid values: `"nalo"`, `"mnotify"`
  - `rate` (optional): SMS rate per message. Must be a positive number
- **Notes**: At least one parameter must be provided
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "SMS settings updated successfully",
      "data": {
        "active_provider": "mnotify",
        "sms_rate": 0.08
      }
    }
    ```
  - **Bad Request (400)**: Invalid parameters or no fields to update
  - **Not Found (404)**: SMS settings not found
  - **Validation Errors**:
    - Invalid provider (must be "nalo" or "mnotify")
    - Invalid rate (must be a positive number)

### Update Active SMS Provider
- **Method**: PUT
- **Path**: `/provider`
- **Description**: Update only the active SMS provider
- **Authentication**: Required (super_admin role)
- **Request Body**:
  ```json
  {
    "provider": "mnotify"
  }
  ```
- **Parameters**:
  - `provider` (required): SMS provider name. Valid values: `"nalo"`, `"mnotify"`
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "SMS provider updated to mnotify",
      "data": {
        "active_provider": "mnotify"
      }
    }
    ```
  - **Bad Request (400)**: Invalid provider
  - **Not Found (404)**: SMS settings not found

### Update SMS Rate
- **Method**: PUT
- **Path**: `/rate`
- **Description**: Update only the SMS rate per message
- **Authentication**: Required (super_admin role)
- **Request Body**:
  ```json
  {
    "rate": 0.08
  }
  ```
- **Parameters**:
  - `rate` (required): SMS rate per message. Must be a positive number
- **Response**:
  - **Success (200)**:
    ```json
    {
      "success": true,
      "message": "SMS rate updated to 0.08",
      "data": {
        "sms_rate": 0.08
      }
    }
    ```
  - **Bad Request (400)**: Invalid rate
  - **Not Found (404)**: SMS settings not found

## Error Response Format
All error responses follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (only in development)"
}
```

## Common HTTP Status Codes
- **200**: Success
- **201**: Created (for initialization)
- **400**: Bad Request (validation errors)
- **404**: Not Found
- **500**: Internal Server Error

## Notes
- SMS settings are global and affect the entire system
- Only one active SMS settings record exists at a time
- Historical settings are preserved for audit purposes
- All monetary values (rates) are in the system's base currency
- Provider options: `nalo` and `mnotify`