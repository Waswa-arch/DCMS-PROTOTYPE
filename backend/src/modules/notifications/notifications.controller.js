import { db } from '../../config/db.js';

/**
 * FETCH THE LOGGED-IN USER'S OWN NOTIFICATIONS
 * Available to any authenticated role — a student, officer, or admin all
 * have their own notification stream, scoped strictly to their own user_id.
 */
export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await db.all(
      'SELECT id, title, message, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    const unreadCount = notifications.filter((n) => n.is_read === 0).length;
    return res.status(200).json({ success: true, notifications, unread_count: unreadCount });
  } catch (error) {
    console.error('Notification Retrieval Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};

/**
 * MARK ONE NOTIFICATION AS READ
 * SECURITY: only the owning user may mark their own notification read —
 * the WHERE clause checks both id AND user_id together, so a user cannot
 * mark (or even confirm the existence of) another user's notification by
 * guessing an id.
 */
export const markNotificationRead = async (req, res) => {
  const notificationId = req.params.id;

  try {
    const result = await db.run(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found.',
      });
    }

    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    console.error('Notification Update Error:', error);
    return res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
};