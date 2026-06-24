import client from './client';

/**
 * Sends student/officer/admin login credentials to the backend core engine
 * @param {string} id_number 
 * @param {string} password 
 */
export const loginUser = async (id_number, password) => {
  const response = await client.post('/auth/login', { id_number, password });
  return response.data; // Yields { success, token, user }
};

/**
 * Registers a brand new student account (Server-side forces role to 'STUDENT')
 * @param {Object} userData - Contains { id_number, name, email, password }
 */
export const registerUser = async (userData) => {
  const response = await client.post('/auth/register', userData);
  return response.data; // Yields { success, message }
};