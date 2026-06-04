/**
 * ROLE-BASED ACCESS CONTROL (RBAC) POLICY ENFORCER:
 * Restricts traversal through administrative routers by cross-matching 
 * the verified user request token role property against explicitly allowed system permissions.
 * * @param {string[]} allowedRoles - Array of valid role strings allowed to proceed (e.g. ['ADMIN', 'OFFICER'])
 */
const roleGuard = (allowedRoles) => {
  return (req, res, next) => {
    // Fail immediately if authentication middleware wasn't executed prior
    if (!req.user || !req.user.role) {
      return res.status(500).json({ 
        error: 'RBAC_CONTEXT_FAILURE', 
        message: 'Security context configuration error. Ensure verifyToken middleware maps upstream.' 
      });
    }

    // Verify user role explicitly lives inside permitted access matrix slice
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'ACCESS_DENIED_FORBIDDEN', 
        message: `Insufficient system privileges. Resource strictly isolated to roles: [${allowedRoles.join(', ')}]. Current context: [${req.user.role}]` 
      });
    }

    next(); // Access clearance verified. Proceed to resource.
  };
};

module.exports = roleGuard;