export default function errorHandler(err, req, res, next) {
  console.error('🛑 [System Error Core]:', err.stack || err.message || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'An internal system transaction anomaly occurred.';

  res.status(statusCode).json({
    success: false,
    message,
    // stack is completely hidden in production scenarios for security
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}