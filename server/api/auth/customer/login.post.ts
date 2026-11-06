export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'Customer authentication is not implemented',
  });
});
