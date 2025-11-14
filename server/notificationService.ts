import { db } from './db';
import { notifications } from '../shared/schema';
import { websocketService } from './websocket';

interface NotificationData {
  userId: string;
  type: 'info' | 'success' | 'error' | 'warning';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
}

export class NotificationService {
  /**
   * Create a notification in the database and send real-time WebSocket notification
   */
  async createNotification(data: NotificationData) {
    try {
      // Save to database
      await db.insert(notifications).values(data);

      // Send real-time notification via WebSocket
      websocketService.sendToUser(data.userId, {
        type: 'notification',
        payload: {
          title: data.title,
          message: data.message,
          type: data.type,
          relatedId: data.relatedId,
          relatedType: data.relatedType
        }
      });

      console.log(`Notification sent to user ${data.userId}: ${data.title}`);
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  /**
   * Notify about a new inquiry
   */
  async notifyNewInquiry(supplierId: string, inquiryId: string, buyerName: string) {
    await this.createNotification({
      userId: supplierId,
      type: 'info',
      title: 'New Inquiry',
      message: `You have received a new inquiry from ${buyerName}`,
      relatedId: inquiryId,
      relatedType: 'inquiry'
    });

    // Send specific inquiry update via WebSocket
    websocketService.sendToUser(supplierId, {
      type: 'inquiry',
      payload: {
        action: 'new',
        inquiry: { id: inquiryId }
      }
    });
  }

  /**
   * Notify about inquiry status change
   */
  async notifyInquiryUpdate(userId: string, inquiryId: string, status: string) {
    await this.createNotification({
      userId,
      type: 'info',
      title: 'Inquiry Updated',
      message: `Inquiry status changed to ${status}`,
      relatedId: inquiryId,
      relatedType: 'inquiry'
    });

    websocketService.sendToUser(userId, {
      type: 'inquiry',
      payload: {
        action: 'updated',
        inquiry: { id: inquiryId, status }
      }
    });
  }

  /**
   * Notify about a new order
   */
  async notifyNewOrder(supplierId: string, orderId: string, buyerName: string) {
    await this.createNotification({
      userId: supplierId,
      type: 'success',
      title: 'New Order',
      message: `You have received a new order from ${buyerName}`,
      relatedId: orderId,
      relatedType: 'order'
    });

    websocketService.sendToUser(supplierId, {
      type: 'order',
      payload: {
        action: 'new',
        order: { id: orderId }
      }
    });
  }

  /**
   * Notify about order status change
   */
  async notifyOrderStatusChange(userId: string, orderId: string, status: string) {
    await this.createNotification({
      userId,
      type: 'info',
      title: 'Order Status Updated',
      message: `Order #${orderId} status changed to ${status}`,
      relatedId: orderId,
      relatedType: 'order'
    });

    websocketService.sendToUser(userId, {
      type: 'order',
      payload: {
        action: 'status_changed',
        order: { id: orderId, status }
      }
    });
  }

  /**
   * Notify about a new RFQ matching supplier's products
   */
  async notifyNewRFQ(supplierId: string, rfqId: string, category: string) {
    await this.createNotification({
      userId: supplierId,
      type: 'info',
      title: 'New RFQ Available',
      message: `A new RFQ in ${category} matches your products`,
      relatedId: rfqId,
      relatedType: 'rfq'
    });

    websocketService.sendToUser(supplierId, {
      type: 'rfq',
      payload: {
        action: 'new',
        rfq: { id: rfqId, category }
      }
    });
  }

  /**
   * Notify about RFQ response status
   */
  async notifyRFQResponse(userId: string, rfqId: string, status: string) {
    await this.createNotification({
      userId,
      type: status === 'accepted' ? 'success' : 'info',
      title: 'RFQ Response Update',
      message: `Your response to RFQ has been ${status}`,
      relatedId: rfqId,
      relatedType: 'rfq'
    });

    websocketService.sendToUser(userId, {
      type: 'rfq',
      payload: {
        action: 'response_' + status,
        rfq: { id: rfqId, status }
      }
    });
  }

  /**
   * Notify about auction updates
   */
  async notifyAuctionUpdate(supplierId: string, auctionId: string, action: 'new_bid' | 'outbid' | 'won' | 'lost') {
    const messages = {
      new_bid: 'A new bid has been placed',
      outbid: 'You have been outbid',
      won: 'Congratulations! You won the auction',
      lost: 'The auction has ended'
    };

    const types: Record<string, 'info' | 'success' | 'error' | 'warning'> = {
      new_bid: 'info',
      outbid: 'warning',
      won: 'success',
      lost: 'info'
    };

    await this.createNotification({
      userId: supplierId,
      type: types[action],
      title: 'Auction Update',
      message: messages[action],
      relatedId: auctionId,
      relatedType: 'auction'
    });

    websocketService.sendToUser(supplierId, {
      type: 'auction',
      payload: {
        action,
        auction: { id: auctionId }
      }
    });
  }

  /**
   * Notify about quotation status change
   */
  async notifyQuotationUpdate(supplierId: string, quotationId: string, action: 'accepted' | 'rejected' | 'expired') {
    const messages = {
      accepted: 'Your quotation has been accepted',
      rejected: 'Your quotation has been rejected',
      expired: 'Your quotation has expired'
    };

    const types: Record<string, 'info' | 'success' | 'error' | 'warning'> = {
      accepted: 'success',
      rejected: 'error',
      expired: 'warning'
    };

    await this.createNotification({
      userId: supplierId,
      type: types[action],
      title: 'Quotation Update',
      message: messages[action],
      relatedId: quotationId,
      relatedType: 'quotation'
    });

    websocketService.sendToUser(supplierId, {
      type: 'quotation',
      payload: {
        action,
        quotation: { id: quotationId }
      }
    });
  }

  /**
   * Notify buyer about quotation received
   */
  async notifyQuotationReceived(buyerId: string, quotationId: string, supplierName: string) {
    await this.createNotification({
      userId: buyerId,
      type: 'info',
      title: 'New Quotation',
      message: `You have received a quotation from ${supplierName}`,
      relatedId: quotationId,
      relatedType: 'quotation'
    });

    websocketService.sendToUser(buyerId, {
      type: 'quotation',
      payload: {
        action: 'received',
        quotation: { id: quotationId }
      }
    });
  }

  /**
   * Notify supplier about commission created (Task 12 - Requirement 2.5)
   */
  async notifyCommissionCreated(supplierId: string, commissionId: string, amount: number, rate: number, orderId: string, dueDate: Date) {
    await this.createNotification({
      userId: supplierId,
      type: 'info',
      title: 'Commission Created',
      message: `A commission of ₹${amount.toFixed(2)} (${(rate * 100).toFixed(1)}%) has been created for order #${orderId}. Due date: ${dueDate.toLocaleDateString()}.`,
      relatedId: commissionId,
      relatedType: 'commission'
    });

    websocketService.sendToUser(supplierId, {
      type: 'commission',
      payload: {
        action: 'created',
        commission: { id: commissionId, amount, rate, orderId, dueDate }
      }
    });
  }

  /**
   * Notify supplier about account restriction (Task 12 - Requirement 3.5)
   */
  async notifyAccountRestricted(supplierId: string, totalUnpaid: number) {
    await this.createNotification({
      userId: supplierId,
      type: 'error',
      title: 'Account Restricted',
      message: `Your account has been restricted due to unpaid commissions (₹${totalUnpaid.toFixed(2)}). Please submit payment to restore access.`,
      relatedType: 'commission'
    });

    websocketService.sendToUser(supplierId, {
      type: 'restriction',
      payload: {
        action: 'restricted',
        totalUnpaid
      }
    });
  }

  /**
   * Notify supplier about account restriction lifted
   */
  async notifyAccountRestrictionLifted(supplierId: string) {
    await this.createNotification({
      userId: supplierId,
      type: 'success',
      title: 'Account Restriction Lifted',
      message: `Your account restriction has been lifted. You can now access all features.`,
      relatedType: 'commission'
    });

    websocketService.sendToUser(supplierId, {
      type: 'restriction',
      payload: {
        action: 'lifted'
      }
    });
  }

  /**
   * Notify admin about payment submission (Task 12 - Requirement 5.5)
   */
  async notifyPaymentSubmitted(adminId: string, paymentId: string, supplierName: string, amount: number) {
    await this.createNotification({
      userId: adminId,
      type: 'info',
      title: 'New Payment Submission',
      message: `${supplierName} has submitted a commission payment of ₹${amount.toFixed(2)} for verification.`,
      relatedId: paymentId,
      relatedType: 'payment_submission'
    });

    websocketService.sendToUser(adminId, {
      type: 'payment',
      payload: {
        action: 'submitted',
        payment: { id: paymentId, supplierName, amount }
      }
    });
  }

  /**
   * Notify supplier about payment approved (Task 12 - Requirement 6.5)
   */
  async notifyPaymentApproved(supplierId: string, paymentId: string, amount: number) {
    await this.createNotification({
      userId: supplierId,
      type: 'success',
      title: 'Payment Approved',
      message: `Your commission payment of ₹${amount.toFixed(2)} has been verified and approved.`,
      relatedId: paymentId,
      relatedType: 'payment_submission'
    });

    websocketService.sendToUser(supplierId, {
      type: 'payment',
      payload: {
        action: 'approved',
        payment: { id: paymentId, amount }
      }
    });
  }

  /**
   * Notify supplier about payment rejected (Task 12 - Requirement 7.3)
   */
  async notifyPaymentRejected(supplierId: string, paymentId: string, amount: number, reason: string) {
    await this.createNotification({
      userId: supplierId,
      type: 'error',
      title: 'Payment Rejected',
      message: `Your commission payment of ₹${amount.toFixed(2)} was rejected. Reason: ${reason}`,
      relatedId: paymentId,
      relatedType: 'payment_submission'
    });

    websocketService.sendToUser(supplierId, {
      type: 'payment',
      payload: {
        action: 'rejected',
        payment: { id: paymentId, amount, reason }
      }
    });
  }
}

export const notificationService = new NotificationService();
