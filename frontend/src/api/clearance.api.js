import client from './client';

/**
 * Fetches the active clearance status and sub-department items for the authenticated student
 */
export const getStudentClearance = async () => {
  const response = await client.get('/clearance/me');
  return response.data; // Yields { success, clearance_request, departmental_status }
};

/**
 * Flags or Approves an individual departmental node item row
 * @param {number|string} itemId - The target tracking primary database ID
 * @param {Object} actionPayload - Contains { status: 'APPROVED'|'FLAGGED', remarks }
 */
export const updateDepartmentItemStatus = async (itemId, actionPayload) => {
  const response = await client.post(`/clearance/item/${itemId}/action`, actionPayload);
  return response.data; // Yields { success, message }
};