export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'Order cancellation is not implemented',
  });
});
