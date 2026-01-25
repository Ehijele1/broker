// lib/notificationUtils.js
import { supabase } from '@/lib/supabase'

/**
 * Create a notification using your database function
 * @param {string} userId - The user's ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (deposit, withdrawal, trade, system, admin)
 * @param {string} relatedId - Optional related record ID (deposit_id, withdrawal_id, trade_id)
 */
export async function createNotification(userId, title, message, type, relatedId = null) {
  try {
    const { data, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_title: title,
      p_message: message,
      p_type: type,
      p_related_id: relatedId
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating notification:', error)
    return { success: false, error }
  }
}

// Notification message templates
export const notificationTemplates = {
  deposit: {
    pending: (amount, currency) => ({
      title: 'Deposit Submitted',
      message: `Your deposit of ${currency} ${amount} is being reviewed. We'll notify you once it's processed.`
    }),
    approved: (amount, currency) => ({
      title: 'Deposit Approved ✓',
      message: `Your deposit of ${currency} ${amount} has been approved and credited to your account.`
    }),
    rejected: (amount, currency, reason) => ({
      title: 'Deposit Rejected',
      message: `Your deposit of ${currency} ${amount} was rejected. Reason: ${reason}`
    })
  },
  withdrawal: {
    pending: (amount, currency) => ({
      title: 'Withdrawal Requested',
      message: `Your withdrawal request of ${currency} ${amount} is being processed.`
    }),
    approved: (amount, currency) => ({
      title: 'Withdrawal Approved ✓',
      message: `Your withdrawal of ${currency} ${amount} has been approved and is being sent to your account.`
    }),
    rejected: (amount, currency, reason) => ({
      title: 'Withdrawal Rejected',
      message: `Your withdrawal of ${currency} ${amount} was rejected. Reason: ${reason}`
    })
  },
  trade: {
    opened: (asset, type, amount) => ({
      title: 'Trade Opened',
      message: `Your ${type.toUpperCase()} trade on ${asset} for $${amount} is now active.`
    }),
    closed: (asset, outcome, profitLoss) => ({
      title: `Trade Closed - ${outcome === 'profit' ? 'Profit ✓' : 'Loss'}`,
      message: `Your ${asset} trade closed with a ${outcome} of $${Math.abs(profitLoss)}.`
    }),
    cancelled: (asset) => ({
      title: 'Trade Cancelled',
      message: `Your trade on ${asset} has been cancelled by admin.`
    })
  },
  system: {
    welcome: () => ({
      title: 'Welcome to SecureTrading! 🎉',
      message: 'Thank you for joining us! Start trading and grow your portfolio today.'
    }),
    verification: (status) => ({
      title: `Verification ${status}`,
      message: status === 'approved' 
        ? 'Your account has been verified successfully! ✓' 
        : 'Your verification request requires additional information.'
    }),
    planUpgrade: (planName) => ({
      title: 'Plan Upgraded ✓',
      message: `Your account has been upgraded to ${planName} plan. Enjoy your new benefits!`
    })
  }
}