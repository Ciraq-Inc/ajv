export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'Customer orders are not implemented',
  });
});
