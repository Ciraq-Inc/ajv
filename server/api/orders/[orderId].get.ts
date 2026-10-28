export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'Customer order details are not implemented',
  });
});
