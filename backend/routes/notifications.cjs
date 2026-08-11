const express = require('express');
const router = express.Router();
const { getPool } = require('../db_mysql.cjs');

// In-memory store for read notification IDs
let readNotificationIds = new Set();

// GET /api/notifications - Generate dynamic notifications strictly from real tasks in planner_tasks
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.json({ success: true, notifications: [], unreadCount: 0 });

    // 1. Fetch real tasks from planner_tasks MySQL table
    const [tasks] = await pool.query('SELECT * FROM planner_tasks ORDER BY id DESC');

    const now = new Date();
    const notifications = [];

    // Process each real task
    tasks.forEach((t) => {
      const isCompleted = t.status === 'Completed' || t.status === 'Done';
      const isOverdue = t.status === 'Overdue' || (!isCompleted && t.date && new Date(t.date) < new Date(now.toDateString()));
      const isHighPriority = t.priority === 'High' || t.priority === 'Urgent';
      const isInProgress = t.status === 'In Progress';
      const isToday = t.date === now.toISOString().split('T')[0] || t.targetDay === 'Today';

      const notifId = `task_notif_${t.id}`;
      const isUnread = !readNotificationIds.has(notifId);

      // Overdue Task Notification
      if (isOverdue) {
        notifications.push({
          id: notifId,
          taskId: t.id,
          type: 'task',
          category: 'overdue',
          severity: 'urgent',
          title: `Overdue Task: ${t.title}`,
          text: `Task "${t.title}" in ${t.category || 'General'} is overdue (Scheduled: ${t.date || 'Past Date'}). Please review.`,
          message: `Task "${t.title}" in ${t.category || 'General'} is overdue (Scheduled: ${t.date || 'Past Date'}). Please review.`,
          time: t.time || 'Overdue',
          timestamp: t.created_at || new Date().toISOString(),
          unread: isUnread,
          actionUrl: '/planner'
        });
      }
      // Urgent / High Priority Pending Task
      else if (isHighPriority && !isCompleted) {
        notifications.push({
          id: notifId,
          taskId: t.id,
          type: 'task',
          category: 'urgent',
          severity: 'warning',
          title: `Urgent Priority Task: ${t.title}`,
          text: `High priority task "${t.title}" is pending in ${t.category || 'General'}.`,
          message: `High priority task "${t.title}" is pending in ${t.category || 'General'}.`,
          time: t.time || 'High Priority',
          timestamp: t.created_at || new Date().toISOString(),
          unread: isUnread,
          actionUrl: '/planner'
        });
      }
      // In Progress Task
      else if (isInProgress) {
        notifications.push({
          id: notifId,
          taskId: t.id,
          type: 'task',
          category: 'today',
          severity: 'info',
          title: `Task In Progress: ${t.title}`,
          text: `Task "${t.title}" is currently in progress (${t.category || 'Execution'}).`,
          message: `Task "${t.title}" is currently in progress (${t.category || 'Execution'}).`,
          time: t.time || 'In Progress',
          timestamp: t.created_at || new Date().toISOString(),
          unread: isUnread,
          actionUrl: '/planner'
        });
      }
      // Scheduled Today / Upcoming Task
      else if (isToday && !isCompleted) {
        notifications.push({
          id: notifId,
          taskId: t.id,
          type: 'task',
          category: 'today',
          severity: 'info',
          title: `Scheduled Today: ${t.title}`,
          text: `Task "${t.title}" scheduled for today at ${t.time || 'scheduled time'}.`,
          message: `Task "${t.title}" scheduled for today at ${t.time || 'scheduled time'}.`,
          time: t.time || 'Today',
          timestamp: t.created_at || new Date().toISOString(),
          unread: isUnread,
          actionUrl: '/planner'
        });
      }
      // Completed Task Milestone
      else if (isCompleted) {
        notifications.push({
          id: notifId,
          taskId: t.id,
          type: 'task',
          category: 'today',
          severity: 'success',
          title: `Task Completed: ${t.title}`,
          text: `Task "${t.title}" in ${t.category || 'General'} has been completed.`,
          message: `Task "${t.title}" in ${t.category || 'General'} has been completed.`,
          time: t.time || 'Completed',
          timestamp: t.created_at || new Date().toISOString(),
          unread: isUnread,
          actionUrl: '/planner'
        });
      }
    });

    const unreadCount = notifications.filter((n) => n.unread).length;

    return res.json({
      success: true,
      unreadCount,
      totalCount: notifications.length,
      notifications
    });
  } catch (err) {
    console.error('[NotificationsRoute] Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/notifications/mark-read - Mark notification IDs as read
router.post('/mark-read', (req, res) => {
  const { ids, all } = req.body;
  if (all) {
    readNotificationIds.clear();
    res.json({ success: true, message: 'All notifications marked as read' });
  } else if (Array.isArray(ids)) {
    ids.forEach((id) => readNotificationIds.add(id));
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, error: 'Invalid parameters' });
  }
});

module.exports = router;
