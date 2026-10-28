import { expect, test } from '@playwright/test';

test('customer login never returns a mock token for unverified credentials', async ({ request }) => {
  const response = await request.post('/api/auth/customer/login', {
    data: { email: 'not-a-real-customer@example.test', password: 'wrong', company_id: 1 },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.data?.token).toBeUndefined();
});

test('order list does not return mock records for a fabricated bearer token', async ({ request }) => {
  const response = await request.get('/api/orders', {
    headers: { Authorization: 'Bearer not-a-real-token' },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.data).toBeUndefined();
});

test('order detail does not return a mock record for a fabricated bearer token', async ({ request }) => {
  const response = await request.get('/api/orders/ORD1697400000000', {
    headers: { Authorization: 'Bearer not-a-real-token' },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.data).toBeUndefined();
});

test('order cancellation does not claim a mock cancellation', async ({ request }) => {
  const response = await request.put('/api/orders/ORD1697400000000/cancel', {
    headers: { Authorization: 'Bearer not-a-real-token' },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.success).not.toBe(true);
});

test('unused document-upload proxy does not forward unauthenticated uploads', async ({ request }) => {
  const response = await request.post('/api/upload-document', {
    multipart: {
      file: {
        name: 'resume.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('test document'),
      },
    },
  });

  expect(response.status()).toBe(501);
  const body = await response.json();
  expect(body.success).not.toBe(true);
});
