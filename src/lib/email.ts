import { Resend } from 'resend'
import { prisma } from './prisma'

// Lazy-load Resend to avoid build errors when API key is not set
let resend: Resend | null = null
function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

const FROM_EMAIL = process.env.FROM_EMAIL || 'Junobo Membership <notifications@junobo.com>'

export type NotificationType = 'UPLOAD_SUCCESS' | 'UPLOAD_ERROR' | 'RENEWAL_REMINDER'

interface UploadSuccessData {
  fileName: string
  uploadMonth: string
  recordsCount: number
  successCount: number
  totalRevenue: number
  uploadedBy: string
}

interface UploadErrorData {
  fileName: string
  uploadMonth: string
  successCount: number
  failedCount: number
  errors: Array<{ row: number; error: string }>
  uploadedBy: string
}

interface RenewalReminderData {
  month: string
  type: 'current' | 'next'
  members: Array<{
    name: string
    globalId: string
    email: string | null
    product: string | null
    membershipEndDate: Date
  }>
  totalRevenueAtRisk: number
}

// Get notification recipients
export async function getNotificationRecipients(type: NotificationType): Promise<string[]> {
  const config = await prisma.notificationConfig.findUnique({
    where: { type }
  })
  
  if (!config || !config.enabled || !config.emails) {
    return []
  }
  
  return config.emails.split(',').map(e => e.trim()).filter(e => e)
}

// Send upload success notification
export async function sendUploadSuccessNotification(data: UploadSuccessData) {
  const recipients = await getNotificationRecipients('UPLOAD_SUCCESS')
  
  if (recipients.length === 0) {
    console.log('No recipients configured for UPLOAD_SUCCESS notifications')
    return { success: false, reason: 'no_recipients' }
  }

  const subject = `✅ Invoice Upload Successful - ${data.uploadMonth}`
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #10b981; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">✅ Upload Successful</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h3 style="color: #374151; margin-top: 0;">Upload Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">File Name:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.fileName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Upload Month:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.uploadMonth}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Records Processed:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.recordsCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Successfully Created:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #10b981;">${data.successCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Total Revenue:</td>
            <td style="padding: 8px 0; font-weight: 600;">₹${data.totalRevenue.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Uploaded By:</td>
            <td style="padding: 8px 0;">${data.uploadedBy}</td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXTAUTH_URL}/dashboard" 
             style="display: inline-block; background: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
            View Dashboard
          </a>
        </div>
      </div>
    </div>
  `

  return sendNotification('UPLOAD_SUCCESS', recipients, subject, html, data)
}

// Send upload error notification
export async function sendUploadErrorNotification(data: UploadErrorData) {
  const recipients = await getNotificationRecipients('UPLOAD_ERROR')
  
  if (recipients.length === 0) {
    console.log('No recipients configured for UPLOAD_ERROR notifications')
    return { success: false, reason: 'no_recipients' }
  }

  const subject = `⚠️ Invoice Upload Completed with Errors - ${data.uploadMonth}`
  
  const errorRows = data.errors.slice(0, 10).map(e => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e5e7eb;">Row ${e.row}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb; color: #dc2626;">${e.error}</td>
    </tr>
  `).join('')
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #f59e0b; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⚠️ Upload Completed with Errors</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <h3 style="color: #374151; margin-top: 0;">Upload Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">File Name:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.fileName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Upload Month:</td>
            <td style="padding: 8px 0; font-weight: 600;">${data.uploadMonth}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Successful:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #10b981;">${data.successCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Failed:</td>
            <td style="padding: 8px 0; font-weight: 600; color: #dc2626;">${data.failedCount}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;">Uploaded By:</td>
            <td style="padding: 8px 0;">${data.uploadedBy}</td>
          </tr>
        </table>
        
        <h4 style="color: #374151;">Errors${data.errors.length > 10 ? ` (showing first 10 of ${data.errors.length})` : ''}:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Row</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Error</th>
            </tr>
          </thead>
          <tbody>
            ${errorRows}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXTAUTH_URL}/upload" 
             style="display: inline-block; background: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
            View Upload History
          </a>
        </div>
      </div>
    </div>
  `

  return sendNotification('UPLOAD_ERROR', recipients, subject, html, data)
}

// Send renewal reminder notification
export async function sendRenewalReminderNotification(data: RenewalReminderData) {
  const recipients = await getNotificationRecipients('RENEWAL_REMINDER')
  
  if (recipients.length === 0) {
    console.log('No recipients configured for RENEWAL_REMINDER notifications')
    return { success: false, reason: 'no_recipients' }
  }

  const typeLabel = data.type === 'current' ? 'This Month' : 'Next Month'
  const subject = `🔔 Membership Renewals - ${typeLabel} (${data.month})`
  
  const memberRows = data.members.slice(0, 20).map(m => `
    <tr>
      <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.name}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.globalId}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb;">${m.product || '-'}</td>
      <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date(m.membershipEndDate).toLocaleDateString('en-IN')}</td>
    </tr>
  `).join('')
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto;">
      <div style="background: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">🔔 Renewal Reminder - ${typeLabel}</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e;">
            <strong>${data.members.length} members</strong> have memberships expiring in <strong>${data.month}</strong>.
            <br/>
            Total Revenue at Risk: <strong>₹${data.totalRevenueAtRisk.toLocaleString('en-IN')}</strong>
          </p>
        </div>
        
        <h4 style="color: #374151;">Members Expiring${data.members.length > 20 ? ` (showing first 20 of ${data.members.length})` : ''}:</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Name</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Global ID</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Product</th>
              <th style="padding: 8px; border: 1px solid #e5e7eb; text-align: left;">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            ${memberRows}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <a href="${process.env.NEXTAUTH_URL}/members?status=ACTIVE" 
             style="display: inline-block; background: #d97706; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px;">
            View All Members
          </a>
        </div>
      </div>
    </div>
  `

  return sendNotification('RENEWAL_REMINDER', recipients, subject, html, data)
}

// Generic send notification function
async function sendNotification(
  type: NotificationType,
  recipients: string[],
  subject: string,
  html: string,
  metadata?: unknown
) {
  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: recipients,
      subject,
      html,
    })

    // Log the notification
    await prisma.notificationLog.create({
      data: {
        type,
        recipients: recipients.join(','),
        subject,
        status: 'SENT',
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    })

    console.log(`Notification sent: ${type} to ${recipients.join(', ')}`)
    return { success: true, data: result }
  } catch (error) {
    console.error(`Failed to send notification: ${type}`, error)
    
    // Log the failed notification
    await prisma.notificationLog.create({
      data: {
        type,
        recipients: recipients.join(','),
        subject,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: metadata ? JSON.stringify(metadata) : null,
      }
    })

    return { success: false, error }
  }
}

// Test email function
export async function sendTestEmail(email: string) {
  try {
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '🧪 Test Email - Junobo Membership System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #d97706; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">🧪 Test Email</h2>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>This is a test email from the Junobo Membership Management System.</p>
            <p>If you received this email, your notification settings are configured correctly!</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              Sent at: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        </div>
      `,
    })
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to send test email:', error)
    return { success: false, error }
  }
}
