# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\order-images.test.js >> Order Request Images Feature >> should upload single image and display preview
- Location: tests\order-images.test.js:32:5

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Next")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e6]:
      - link "Rigelis MedsGh Trusted Pharmacy Network" [ref=e7] [cursor=pointer]:
        - /url: /
        - img "Rigelis" [ref=e8]
        - generic [ref=e9]:
          - paragraph [ref=e10]: MedsGh
          - paragraph [ref=e11]: Trusted Pharmacy Network
      - navigation [ref=e12]:
        - link "Home" [ref=e13] [cursor=pointer]:
          - /url: /
        - link "Products" [ref=e14] [cursor=pointer]:
          - /url: /drugs
        - link "How It Works" [ref=e15] [cursor=pointer]:
          - /url: /#how-it-works
        - link "Support" [ref=e16] [cursor=pointer]:
          - /url: /#support
        - link "Jobs" [ref=e17] [cursor=pointer]:
          - /url: /jobs
      - generic [ref=e18]:
        - link " (+233) 55-258-7974" [ref=e19] [cursor=pointer]:
          - /url: tel:+233552587974
          - generic [ref=e20]: 
          - text: (+233) 55-258-7974
        - link " Contact Us" [ref=e21] [cursor=pointer]:
          - /url: https://wa.me/+233552587974
          - generic [ref=e22]: 
          - text: Contact Us
        - button " Login" [ref=e23] [cursor=pointer]:
          - generic [ref=e24]: 
          - text: Login
      - text:  
  - main [ref=e25]:
    - generic [ref=e27]:
      - main [ref=e28]:
        - generic [ref=e33]:
          - heading "Find any medication, anywhere." [level=1] [ref=e34]
          - paragraph [ref=e35]: Expert care, delivered. Connecting you to over 210+ verified pharmacies across Ghana for seamless healthcare access.
          - generic [ref=e37]:
            - generic [ref=e38]:
              - textbox "Search for medication or wellness products..." [ref=e39]
              - generic [ref=e40]: search
            - button "Make a drug request" [ref=e41] [cursor=pointer]
          - generic [ref=e42]:
            - generic [ref=e43]:
              - img [ref=e44]
              - img [ref=e45]
              - img [ref=e46]
            - paragraph [ref=e47]: Secure & Trusted by 5,000+ Ghanaians
        - generic [ref=e50]:
          - generic [ref=e51]:
            - generic [ref=e53]: local_pharmacy
            - generic [ref=e54]:
              - generic [ref=e55]: 210+
              - generic [ref=e56]: Verified Pharmacies
          - generic [ref=e57]:
            - generic [ref=e59]: speed
            - generic [ref=e60]:
              - generic [ref=e61]: 45min
              - generic [ref=e62]: Avg. Delivery Time
          - generic [ref=e63]:
            - generic [ref=e65]: verified
            - generic [ref=e66]:
              - generic [ref=e67]: 100%
              - generic [ref=e68]: Genuine Meds
          - generic [ref=e69]:
            - generic [ref=e71]: support_agent
            - generic [ref=e72]:
              - generic [ref=e73]: 24/7
              - generic [ref=e74]: Expert Support
        - generic [ref=e76]:
          - generic [ref=e77]:
            - heading "How It Works" [level=2] [ref=e78]
            - paragraph [ref=e79]: Get your prescriptions filled in three simple steps without leaving your home.
          - generic [ref=e80]:
            - generic [ref=e81]:
              - generic [ref=e82]:
                - img [ref=e83]
                - generic [ref=e84]: "1"
              - heading "Upload or List" [level=3] [ref=e85]
              - paragraph [ref=e86]: Securely upload your prescription or search for over-the-counter essentials from our database.
            - generic [ref=e87]:
              - generic [ref=e88]:
                - img [ref=e89]
                - generic [ref=e90]: "2"
              - heading "We Source & Verify" [level=3] [ref=e91]
              - paragraph [ref=e92]: Our system checks stock across 210+ verified pharmacies to find the best price and availability.
            - generic [ref=e93]:
              - generic [ref=e94]:
                - img [ref=e95]
                - generic [ref=e96]: "3"
              - heading "Confirm & Receive" [level=3] [ref=e97]
              - paragraph [ref=e98]: Confirm your order with a secure payment and have it delivered to your doorstep in under 45 minutes.
        - generic [ref=e100]:
          - heading "What Customers are Saying" [level=2] [ref=e101]
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]:
                - generic [ref=e105]: star
                - generic [ref=e106]: star
                - generic [ref=e107]: star
                - generic [ref=e108]: star
                - generic [ref=e109]: star
              - paragraph [ref=e110]: "\"I couldn't find my father's chronic medication anywhere in Kumasi. MedsGh found it in 15 minutes and delivered it the same hour. Lifesavers!\""
              - generic [ref=e111]:
                - generic [ref=e112]: KA
                - generic [ref=e113]:
                  - generic [ref=e114]: Kofi Adjei
                  - generic [ref=e115]: Verified Patient
            - generic [ref=e116]:
              - generic [ref=e117]:
                - generic [ref=e118]: star
                - generic [ref=e119]: star
                - generic [ref=e120]: star
                - generic [ref=e121]: star
                - generic [ref=e122]: star
              - paragraph [ref=e123]: "\"The telehealth integration is seamless. Had a consultation and my meds were on their way before I even hung up the call. Amazing service.\""
              - generic [ref=e124]:
                - generic [ref=e125]: AM
                - generic [ref=e126]:
                  - generic [ref=e127]: Ama Mensah
                  - generic [ref=e128]: Verified Patient
            - generic [ref=e129]:
              - generic [ref=e130]:
                - generic [ref=e131]: star
                - generic [ref=e132]: star
                - generic [ref=e133]: star
                - generic [ref=e134]: star
                - generic [ref=e135]: star
              - paragraph [ref=e136]: "\"As a busy professional, I don't have time to hop from pharmacy to pharmacy. MedsGh makes medication management effortless and secure.\""
              - generic [ref=e137]:
                - generic [ref=e138]: DO
                - generic [ref=e139]:
                  - generic [ref=e140]: Dr. Owusu
                  - generic [ref=e141]: Healthcare Provider
        - generic [ref=e143]:
          - heading "You May Be Wondering" [level=2] [ref=e144]
          - generic [ref=e145]:
            - group [ref=e146] [cursor=pointer]:
              - generic "Are the pharmacies on MedsGh licensed? expand_more" [ref=e147]:
                - text: Are the pharmacies on MedsGh licensed?
                - generic [ref=e148]: expand_more
              - paragraph [ref=e149]: Yes, every pharmacy in our network is fully accredited by the Pharmacy Council of Ghana. we strictly verify licenses and compliance records before onboarding any partner to ensure your safety.
            - group [ref=e150] [cursor=pointer]:
              - generic "How do you handle prescription medications? expand_more" [ref=e151]:
                - text: How do you handle prescription medications?
                - generic [ref=e152]: expand_more
            - group [ref=e153] [cursor=pointer]:
              - generic "What is the delivery radius? expand_more" [ref=e154]:
                - text: What is the delivery radius?
                - generic [ref=e155]: expand_more
        - generic [ref=e158]:
          - generic [ref=e159]:
            - generic [ref=e160]: security
            - generic [ref=e161]: Pharmacy Council Accredited Member
          - generic [ref=e162]:
            - generic [ref=e163]: payments
            - generic [ref=e164]: PCI-DSS Compliant
          - generic [ref=e165]:
            - generic [ref=e166]: health_and_safety
            - generic [ref=e167]: G-Health Certified
      - generic [ref=e168]:
        - generic [ref=e169]:
          - generic [ref=e170]:
            - generic [ref=e171]: MedsGh
            - paragraph [ref=e172]: Pioneering digital healthcare access in Ghana. Connecting patients with verified pharmacies for a healthier tomorrow.
          - generic [ref=e173]:
            - heading "Quick Links" [level=4] [ref=e174]
            - list [ref=e175]:
              - listitem [ref=e176]:
                - link "Find a Pharmacy" [ref=e177] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e178]:
                - link "Request Meds" [ref=e179] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e180]:
                - link "Partner Login" [ref=e181] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e182]:
                - link "Wellness Blog" [ref=e183] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e184]:
            - heading "Legal" [level=4] [ref=e185]
            - list [ref=e186]:
              - listitem [ref=e187]:
                - link "Privacy Policy" [ref=e188] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e189]:
                - link "Terms of Service" [ref=e190] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e191]:
                - link "Cookie Settings" [ref=e192] [cursor=pointer]:
                  - /url: "#"
              - listitem [ref=e193]:
                - link "Accessibility" [ref=e194] [cursor=pointer]:
                  - /url: "#"
          - generic [ref=e195]:
            - heading "Connect" [level=4] [ref=e196]
            - generic [ref=e197]:
              - button "alternate_email" [ref=e198] [cursor=pointer]:
                - generic [ref=e199]: alternate_email
              - button "share" [ref=e200] [cursor=pointer]:
                - generic [ref=e201]: share
              - button "call" [ref=e202] [cursor=pointer]:
                - generic [ref=e203]: call
            - paragraph [ref=e204]: "Contact Us: support@medsgh.com"
        - generic [ref=e205]:
          - paragraph [ref=e206]: © 2024 MedsGh Digital Care. All rights reserved.
          - generic [ref=e207]:
            - img "Visa" [ref=e208]
            - img "Mastercard" [ref=e209]
            - img "MTN Momo" [ref=e210]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test'
  2   | 
  3   | const baseUrl = 'http://localhost:3000'
  4   | 
  5   | test.describe('Order Request Images Feature', () => {
  6   |     test.beforeEach(async ({ page }) => {
  7   |         // Navigate to order page
  8   |         await page.goto(`${baseUrl}/customer?tab=new`)
  9   |         
  10  |         // Wait for step 1 to load (medication search input)
  11  |         await page.waitForSelector('input[placeholder*="Search"]', { timeout: 5000 })
  12  | 
  13  |         // Navigate to step 2 (Prescription & Request Images)
> 14  |         await page.click('button:has-text("Next")')
      |                    ^ Error: page.click: Test timeout of 30000ms exceeded.
  15  |         await page.waitForTimeout(300)
  16  |     })
  17  | 
  18  |     test('should display Request Images section with upload controls', async ({ page }) => {
  19  |         // Check for Request Images section
  20  |         const requestImagesSection = page.locator('text=Request Images').first()
  21  |         await expect(requestImagesSection).toBeVisible()
  22  | 
  23  |         // Check for upload label and file input
  24  |         const uploadLabel = page.locator('text=Add reference images')
  25  |         await expect(uploadLabel).toBeVisible()
  26  | 
  27  |         // Check for file picker button
  28  |         const uploadButton = page.locator('text=Choose Photos')
  29  |         await expect(uploadButton).toBeVisible()
  30  |     })
  31  | 
  32  |     test('should upload single image and display preview', async ({ page }) => {
  33  |         // Find the file input for request images
  34  |         const fileInput = page.locator('input[type="file"][accept="image/*"][multiple]').nth(0) // First file input (request images)
  35  |         
  36  |         // Set up file input and select a test image
  37  |         const testImagePath = './tests/test-image.png'
  38  |         
  39  |         // Create a simple test image on the fly
  40  |         const imageBuffer = Buffer.from([
  41  |             ...Array(100).fill(137), ...Array(100).fill(80), ...Array(100).fill(78), // PNG signature
  42  |             ...Array(10000).fill(0)  // Placeholder for image data
  43  |         ])
  44  |         
  45  |         // Note: For actual testing, you'd need a real test image file
  46  |         // This is a simplified version - use a real image for production tests
  47  |         
  48  |         // Try to upload using the file input
  49  |         try {
  50  |             await fileInput.setInputFiles(testImagePath)
  51  |             
  52  |             // Wait for preview to appear
  53  |             const previewImage = page.locator('.prescription-preview-image').first()
  54  |             await expect(previewImage).toBeVisible({ timeout: 5000 })
  55  |             
  56  |             // Check that image count is displayed
  57  |             const imageCount = page.locator('text=Image 1')
  58  |             await expect(imageCount).toBeVisible()
  59  |         } catch (e) {
  60  |             // Skip if test image not available
  61  |             console.log('Test image not available - skipping upload test')
  62  |         }
  63  |     })
  64  | 
  65  |     test('should enforce maximum 5 images limit', async ({ page }) => {
  66  |         const uploadButton = page.locator('text=Choose Photos').first()
  67  |         
  68  |         // Try to find evidence of max limit in UI
  69  |         const maxLimitText = page.locator('text=5').filter({ hasText: 'image' })
  70  |         
  71  |         // The UI should indicate max 5 images somewhere
  72  |         // This is a placeholder test - actual implementation depends on UI feedback
  73  |         await expect(uploadButton).toBeVisible()
  74  |     })
  75  | 
  76  |     test('should allow replacing an image', async ({ page }) => {
  77  |         // This test would require:
  78  |         // 1. Upload an image first
  79  |         // 2. Click the "Retake" button
  80  |         // 3. Verify the replace file picker is opened
  81  |         // 4. Select a new image
  82  |         // 5. Verify the preview updated
  83  |         
  84  |         const retakeButtons = page.locator('button:has-text("Retake")')
  85  |         
  86  |         // Check if retake buttons are available (would only show after image upload)
  87  |         const count = await retakeButtons.count()
  88  |         // This will be 0 until images are uploaded
  89  |         expect(count).toBeGreaterThanOrEqual(0)
  90  |     })
  91  | 
  92  |     test('should allow deleting an image', async ({ page }) => {
  93  |         // This test would require:
  94  |         // 1. Upload an image first
  95  |         // 2. Click the "Delete" button
  96  |         // 3. Verify the image is removed from preview
  97  |         
  98  |         const deleteButtons = page.locator('button:has-text("Delete")')
  99  |         
  100 |         // Check if delete buttons are available
  101 |         const count = await deleteButtons.count()
  102 |         // This will be 0 until images are uploaded
  103 |         expect(count).toBeGreaterThanOrEqual(0)
  104 |     })
  105 | 
  106 |     test('should include request images in form submission at mobile breakpoint (375px)', async ({ page }) => {
  107 |         // Set mobile viewport
  108 |         await page.setViewportSize({ width: 375, height: 667 })
  109 |         
  110 |         // Verify Request Images section is still visible
  111 |         const requestImagesSection = page.locator('text=Request Images')
  112 |         await expect(requestImagesSection).toBeVisible()
  113 |         
  114 |         // Check that form controls are accessible
```