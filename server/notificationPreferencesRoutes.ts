import { Router, Request, Response } from 'express';
import { notificationDeliveryService, UserNotificationPreferences } from './notificationDeliveryService';
import { requireEnhancedAuth as requireAuth } from './enhancedAuthGuards';

const router = Router();

/**
 * Get user notification preferences
 * GET /api/notification-preferences
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const preferences = await notificationDeliveryService.getUserPreferences(userId);
    
    res.json({
      success: true,
      preferences
    });
  } catch (error: any) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences',
      message: error.message
    });
  }
});

/**
 * Update user notification preferences
 * PUT /api/notification-preferences
 */
router.put('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const updates: Partial<UserNotificationPreferences> = req.body;
    
    // Remove userId from updates to prevent tampering
    delete updates.userId;
    
    const preferences = await notificationDeliveryService.updateUserPreferences(userId, updates);
    
    res.json({
      success: true,
      preferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences',
      message: error.message
    });
  }
});

/**
 * Get notification history
 * GET /api/notification-preferences/history
 */
router.get('/history', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { channel, status, limit, offset } = req.query;
    
    const options: any = {};
    if (channel) options.channel = channel as string;
    if (status) options.status = status as string;
    if (limit) options.limit = parseInt(limit as string);
    if (offset) options.offset = parseInt(offset as string);
    
    const history = await notificationDeliveryService.getNotificationHistory(userId, options);
    
    res.json({
      success: true,
      history,
      total: history.length
    });
  } catch (error: any) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification history',
      message: error.message
    });
  }
});

/**
 * Cancel scheduled notification
 * DELETE /api/notification-preferences/history/:id
 */
router.delete('/history/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await notificationDeliveryService.cancelNotification(id);
    
    res.json({
      success: true,
      message: 'Notification cancelled successfully'
    });
  } catch (error: any) {
    console.error('Error cancelling notification:', error);
    
    if (error.message === 'Notification not found') {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    if (error.message.includes('Cannot cancel')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to cancel notification',
      message: error.message
    });
  }
});

/**
 * Test notification delivery
 * POST /api/notification-preferences/test
 */
router.post('/test', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { channel } = req.body as { channel: 'email' | 'sms' | 'push' | 'in_app' };
    
    if (!channel) {
      return res.status(400).json({
        success: false,
        error: 'Channel is required'
      });
    }
    
    // Queue test notification
    const notificationId = await notificationDeliveryService.queueNotification({
      userId,
      channel,
      notificationType: 'test',
      subject: 'Test Notification',
      content: 'This is a test notification to verify your notification settings.',
      priority: 1
    });
    
    res.json({
      success: true,
      message: `Test notification queued for ${channel} delivery`,
      notificationId
    });
  } catch (error: any) {
    console.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
      message: error.message
    });
  }
});

export default router;
