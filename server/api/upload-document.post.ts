export default defineEventHandler(() => {
  throw createError({
    statusCode: 501,
    statusMessage: 'Document upload proxy is not implemented',
  });
});
