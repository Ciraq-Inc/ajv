# Quick Setup Guide - Admin Authentication

## 🚀 Getting Started (5 Minutes)

Follow these steps to set up and test the admin authentication system.

---

## Step 1: Configuration

### Add API Base URL to nuxt.config.ts

Open `nuxt.config.ts` and ensure you have:

```typescript
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      apiBase: process.env.API_BASE_URL || 'http://localhost:3000'
    }
  }
})
```

### Create .env file (if not exists)

Create a `.env` file in the root directory:

```bash
API_BASE_URL=http://localhost:3000
```

---

## Step 2: Install Dependencies (if needed)

The implementation uses Pinia which should already be installed. If not:

```bash
npm install pinia
```

---

## Step 3: Restart Development Server

```bash
npm run dev
```

---

## Step 4: Test the Implementation

### Test 1: Access Protected Page
1. Navigate to: `http://localhost:3000/admin/data`
2. ✅ You should be redirected to `/admin/login`

### Test 2: Login
1. On the login page, enter:
   - **Username:** `super_admin`
   - **Password:** `Admin@123`
2. Click "Sign in"
3. ✅ You should be redirected back to `/admin/data`

### Test 3: Admin Header
1. On the data page, you should see:
   - Admin header with your name
   - Role displayed
   - Logout button
2. ✅ Header should show "Welcome, [Your Name]"

### Test 4: Session Persistence
1. While logged in, refresh the page (F5)
2. ✅ You should remain logged in

### Test 5: Logout
1. Click the "Logout" button
2. ✅ You should be redirected to login page
3. ✅ localStorage should be cleared

### Test 6: Try to Access Without Login
1. After logout, try to navigate to `/admin/data`
2. ✅ You should be redirected to login

---

## Step 5: Verify Files Created

Check that these files exist:

```
✅ stores/admin.js
✅ middleware/adminAuth.js
✅ pages/admin/login.vue
✅ pages/admin/unauthorized.vue
✅ pages/admin/ADMIN_AUTH_IMPLEMENTATION.md
✅ pages/admin/ADMIN_STORE_EXAMPLES.md
✅ pages/admin/IMPLEMENTATION_SUMMARY.md
```

And these files were modified:

```
✅ pages/admin/data.vue
✅ pages/admin/orders.vue
✅ plugins/init-stores.js
```

---

## Troubleshooting

### Issue: Login page doesn't show
**Solution:** Make sure the file `pages/admin/login.vue` exists and restart the dev server.

### Issue: Redirects not working
**Solution:** Check browser console for errors. Ensure middleware file `middleware/adminAuth.js` exists.

### Issue: "Cannot find module '~/stores/admin'"
**Solution:** Make sure `stores/admin.js` exists and restart the dev server.

### Issue: API errors (CORS, 404, etc.)
**Solution:** 
- Ensure your backend API is running on `http://localhost:3000`
- Check that the API endpoints match those in `ADMIN_AUTH_QUICK_REF.md`
- Verify the `API_BASE_URL` in your `.env` file

### Issue: Token not persisting
**Solution:** 
- Check browser console for localStorage errors
- Make sure you're not in incognito/private mode
- Clear browser cache and try again

### Issue: Middleware not running
**Solution:**
- Check that `definePageMeta({ middleware: ['admin-auth'] })` is in your page
- Restart the dev server
- Check browser console for errors

---

## Browser Console Checks

Open browser DevTools (F12) and check:

### 1. localStorage
In the Console tab, type:
```javascript
localStorage.getItem('adminToken')
localStorage.getItem('adminUser')
```

After login, you should see values.

### 2. Network Requests
In the Network tab:
- Login request should go to `/api/admin/login`
- Token verification should go to `/api/admin/profile`
- All requests should include `Authorization: Bearer [token]` header

### 3. Console Errors
Check for any red error messages. Common ones:
- CORS errors → Check API server configuration
- 404 errors → Verify API endpoints exist
- Auth errors → Verify credentials and token

---

## Customization

### Change API Base URL
Edit `.env`:
```bash
API_BASE_URL=https://your-api-domain.com
```

### Add More Protected Routes
In any page, add:
```javascript
definePageMeta({
  middleware: ['admin-auth']
});
```

### Require Specific Role
```javascript
definePageMeta({
  middleware: ['admin-auth'],
  requiredRole: 'super_admin'
});
```

### Custom Logout Behavior
Edit `stores/admin.js` → `logout()` method

---

## Production Checklist

Before deploying to production:

- [ ] Change `API_BASE_URL` to production URL
- [ ] Enable HTTPS
- [ ] Remove demo credentials from login page
- [ ] Implement token refresh mechanism
- [ ] Add rate limiting
- [ ] Enable security headers
- [ ] Add CSRF protection
- [ ] Implement audit logging
- [ ] Add proper error tracking
- [ ] Test all authentication flows

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run lint
```

---

## Need Help?

Check these files for more information:

1. **IMPLEMENTATION_SUMMARY.md** - Overview of what was implemented
2. **ADMIN_AUTH_IMPLEMENTATION.md** - Detailed documentation
3. **ADMIN_STORE_EXAMPLES.md** - Code examples
4. **ADMIN_AUTH_QUICK_REF.md** - API reference

---

## ✅ You're All Set!

If all tests pass, your admin authentication system is working correctly!

**Demo Login:**
- URL: `http://localhost:3000/admin/login`
- Username: `super_admin`
- Password: `Admin@123`

Happy coding! 🚀
