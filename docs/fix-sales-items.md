# Fix Sales Items Frontend

A user-friendly web interface to fix sales items with missing product information and dates.

## Overview

This feature provides an admin interface to:
- Fix sales items with NULL `product_id`, `product_description`, `ddate`, or `actual_date`
- Match products using fuzzy matching algorithms
- Generate random dates within a specified date and time range
- Process specific companies or all companies at once

## Access

- **URL**: `/admin/fix-sales-items`
- **Layout**: Admin Layout
- **Middleware**: Admin Authentication Required
- **Role**: Auditor or higher

## Features

### 1. Configuration Form
- **Date Range**: Set start and end dates for generated timestamps
- **Time Range**: Specify business hours (default: 8 AM - 6 PM)
- **Company Filter**: Process specific company or all companies
- **Validation**: Real-time form validation

### 2. Pre-Check
- **Check Items Count**: Preview how many items will be affected
- **Company-Specific**: See counts for specific companies

### 3. Processing
- **Real-Time Progress**: Visual feedback during processing
- **Detailed Statistics**:
  - Total items processed
  - Successfully updated
  - Products matched
  - Products not matched
  - Errors encountered

### 4. Results Dashboard
- **Summary Cards**: Visual representation of results
- **Error Reporting**: Detailed error messages for failed items
- **Success Confirmation**: Clear success messaging

### 5. History Tracking
- **Recent Runs**: Last 10 executions
- **Timestamp**: When the fix was run
- **Configuration**: Date range and company used
- **Results**: Updated count and errors
- **Local Storage**: History persists across sessions

## Usage

### Basic Usage (All Companies)
1. Navigate to `/admin/fix-sales-items`
2. Set the date range (e.g., 2024-01-01 to 2024-12-31)
3. Set time range (e.g., 8 to 18 for business hours)
4. Leave Company ID empty
5. Click "Check Items Count" to preview
6. Click "Fix Sales Items" to process

### Company-Specific Usage
1. Follow steps 1-3 above
2. Enter specific Company ID (e.g., 8)
3. Click "Check Items Count"
4. Click "Fix Sales Items" to process

### Custom Time Ranges
Common scenarios:
- **Business Hours**: 8 to 18 (8 AM - 6 PM)
- **Extended Hours**: 6 to 22 (6 AM - 10 PM)
- **Morning Only**: 6 to 12 (6 AM - 12 PM)
- **Evening Only**: 18 to 23 (6 PM - 11 PM)
- **Full Day**: 0 to 23 (Midnight to 11 PM)

## Backend Integration

### API Endpoints

#### Check Count
```
GET /api/sync/admin/sales-items/count
Query Params:
  - companyId (optional): Filter by company

Response:
{
  "success": true,
  "count": 150,
  "companyId": 8
}
```

#### Fix Sales Items
```
POST /api/sync/admin/fix-sales-items
Body:
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "startHour": 8,
  "endHour": 18,
  "companyId": 8  // optional
}

Response:
{
  "success": true,
  "message": "Sales items fix completed",
  "stats": {
    "total": 150,
    "updated": 145,
    "matched": 140,
    "notMatched": 5,
    "errors": 0
  },
  "errors": []
}
```

## How It Works

### Product Matching Algorithm
The system uses fuzzy matching to find products:

1. **Match Criteria** (2 or more must match):
   - Unit (`unit`)
   - Strength (`strength`)
   - Cost Price (`cost_price`)
   - Selling Price (`selling_price`)

2. **Data Sources**:
   - Products table
   - Purchase items table

3. **Scoring**: Higher matches take precedence

### Date Generation
- Random dates within specified date range
- Random times within specified hour range
- Business hours distribution (configurable)
- `ddate` and `actual_date` use same timestamp

### Update Strategy
- Only updates NULL fields
- Preserves existing data
- Atomic operations
- Error handling per item

## Technical Details

### Frontend Stack
- **Framework**: Nuxt 3 + Vue 3
- **Styling**: Tailwind CSS
- **State Management**: Vue Composition API
- **Storage**: LocalStorage for history

### Backend Stack
- **Runtime**: Node.js
- **Database**: MySQL
- **ORM**: Custom query builder
- **Script**: `scripts/fix-sales-items.js`

### Files
```
Frontend:
├── pages/admin/fix-sales-items.vue    # Main UI component

Backend:
├── scripts/fix-sales-items.js         # Core fix script
├── src/routes/sync.js                 # API routes
├── src/controllers/syncController.js  # API controllers
└── src/db/sales.js                    # Database queries
```

## Error Handling

### Frontend
- Form validation before submission
- Clear error messages
- Non-blocking errors (continue processing)
- Error list for failed items

### Backend
- Input validation
- Database transaction safety
- Per-item error catching
- Comprehensive error logging

## Security

- **Authentication**: Required admin authentication
- **Authorization**: Auditor role or higher
- **Validation**: Input sanitization
- **Rate Limiting**: Consider adding for production

## Troubleshooting

### No Items Found
- Check date range is reasonable
- Verify company ID exists
- Ensure database connection

### Matching Issues
- Review product data quality
- Check unit/strength consistency
- Verify cost/selling prices

### Performance
- Process in smaller batches for large datasets
- Consider adding pagination
- Monitor database load

## Future Enhancements

Potential improvements:
- [ ] Batch processing with progress bar
- [ ] Export results to CSV
- [ ] Schedule automated fixes
- [ ] Custom matching rules
- [ ] Undo functionality
- [ ] Email notifications
- [ ] Audit trail logging

## Support

For issues or questions:
1. Check console logs (browser and server)
2. Review history for patterns
3. Test with small company first
4. Contact development team

## License

Internal tool - Company proprietary
