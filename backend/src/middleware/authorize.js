/**
 * Role-Based Access Control Middleware
 * Supports array syntax: authorize(['ROLE1', 'ROLE2'])
 */
export default function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication context missing.' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
       message: 'Forbidden: You do not have permission to perform this action.'
      });
    }

    next();
  };
}