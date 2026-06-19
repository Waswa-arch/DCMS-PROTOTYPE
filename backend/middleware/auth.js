import jwt from 'jsonwebtoken';

/**
 * INSTITUTIONAL CRYPTOGRAPHIC AUTHENTICATION GUARD:
 * Intercepts incoming requests, validates the cryptographic signature of 
 * the attached JSON Web Token, and prevents unauthorized system traversal.
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // Check if the Authorization header is completely missing
  if (!authHeader) {
    return res.status(401).json({ 
      error: 'AUTHENTICATION_REQUIRED', 
      message: 'Access denied. Missing Authorization header token context.' 
    });
  }

  // Expect standard OAuth2 structure: "Bearer <Token_String>"
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    return res.status(401).json({ 
      error: 'MALFORMED_TOKEN_FORMAT', 
      message: 'Authentication header must follow strict "Bearer <JWT>" formatting protocol.' 
    });
  }

  const token = tokenParts[1];

  // SECURITY FIX: Fail loudly if JWT_SECRET environment context is unconfigured
  if (!process.env.JWT_SECRET) {
    console.error('[CRITICAL SECURITY ERROR] JWT_SECRET environment variable is missing.');
    return res.status(500).json({
      error: 'SERVER_CONFIGURATION_ERROR',
      message: 'Cryptographic sub-system is misconfigured. Contact System Administrator.'
    });
  }

  try {
    // Validate signature authenticity against the unique system runtime secret
    const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Bind parsed claims directly into Express request context scope
    // HARMONIZATION FIX: standardizing on id_number to match backend database layout
    req.user = {
      id: decodedPayload.id,
      email: decodedPayload.email,
      role: decodedPayload.role,
      id_number: decodedPayload.id_number || decodedPayload.idNumber
    };

    next(); // Pass control down to the next functional route controller node
  } catch (error) {
    return res.status(403).json({ 
      error: 'INVALID_OR_EXPIRED_TOKEN', 
      message: 'Session token validation failed or signature has expired.',
      technicalDetails: error.message
    });
  }
};

export default verifyToken;