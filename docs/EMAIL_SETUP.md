# Email Service Setup Guide

This guide will help you set up the free email service (Resend) for sending
notifications in your application.

## 🚀 Quick Setup

### 1. Sign Up for Resend (Free)

1. Go to [resend.com](https://resend.com)
2. Click "Get Started" and create a free account
3. Verify your email address
4. You'll get 3,000 free emails per month

### 2. Get Your API Key

1. After signing up, go to your Resend dashboard
2. Navigate to "API Keys" in the sidebar
3. Click "Create API Key"
4. Give it a name (e.g., "Production API Key")
5. Copy the API key (it starts with `re_`)

### 3. Configure Environment Variables

Add these environment variables to your `.env` file:

```env
# Email Service Configuration
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
APP_NAME=Your App Name
FRONTEND_URL=http://localhost:5173
```

### 4. Domain Verification (Optional but Recommended)

For better deliverability, verify your domain:

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Follow the DNS setup instructions
5. Update `EMAIL_FROM` to use your verified domain

## 📧 Email Templates Available

The system includes these pre-built email templates:

### 1. Welcome Email

- **Trigger**: New business registration
- **Content**: Welcome message, business details, next steps
- **Template**: `sendWelcomeEmail()`

### 2. Password Reset Email

- **Trigger**: Password reset request
- **Content**: Reset link, security warning
- **Template**: `sendPasswordResetEmail()`

### 3. Sales Notification Email

- **Trigger**: New sale/conversion
- **Content**: Sale details, commission amount
- **Template**: `sendSalesNotificationEmail()`

### 4. Analytics Report Email

- **Trigger**: Weekly/monthly reports
- **Content**: Performance metrics, charts
- **Template**: `sendAnalyticsReportEmail()`

### 5. Domain Verification Email

- **Trigger**: Domain verification process
- **Content**: Verification token, setup instructions
- **Template**: `sendDomainVerificationEmail()`

## 🔧 Configuration Options

### Environment Variables

| Variable         | Description            | Default                  |
| ---------------- | ---------------------- | ------------------------ |
| `RESEND_API_KEY` | Your Resend API key    | Required                 |
| `EMAIL_FROM`     | Default sender email   | `noreply@yourdomain.com` |
| `APP_NAME`       | Your application name  | `Our Platform`           |
| `FRONTEND_URL`   | Frontend URL for links | `http://localhost:5173`  |

### Email Service Features

- ✅ **Free Tier**: 3,000 emails/month
- ✅ **High Deliverability**: 99.9% delivery rate
- ✅ **HTML Templates**: Beautiful, responsive emails
- ✅ **Error Handling**: Comprehensive error logging
- ✅ **Async Processing**: Non-blocking email sending
- ✅ **Rate Limiting**: Built-in protection

## 🧪 Testing

## 📊 Monitoring

### Email Logs

Check your server logs for email status:

```bash
# Successful email
Email sent successfully: { id: 'abc123', from: 'noreply@yourdomain.com', to: 'user@example.com' }

# Failed email
Failed to send email: Invalid API key
```

### Resend Dashboard

Monitor your email performance in the Resend dashboard:

- Delivery rates
- Bounce rates
- Open rates
- Click rates

## 🔒 Security Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly

2. **Email Validation**
   - Validate email addresses before sending
   - Implement rate limiting
   - Use confirmed opt-in for marketing emails

3. **Error Handling**
   - Log all email failures
   - Implement retry logic for failed emails
   - Monitor delivery rates

## 🚨 Troubleshooting

### Common Issues

1. **"Invalid API Key"**
   - Check your `RESEND_API_KEY` environment variable
   - Ensure the key starts with `re_`
   - Verify the key in Resend dashboard

2. **"Email not received"**
   - Check spam folder
   - Verify sender domain is configured
   - Check Resend dashboard for delivery status

3. **"Rate limit exceeded"**
   - Free tier: 3,000 emails/month
   - Upgrade to paid plan for more emails
   - Implement email queuing for high volume

### Debug Mode

Enable debug logging by setting:

```env
DEBUG_EMAILS=true
```

This will log detailed email sending information.

## 📈 Scaling

### For High Volume

1. **Upgrade Resend Plan**
   - Pro: $20/month for 50,000 emails
   - Business: Custom pricing

2. **Implement Email Queuing**
   - Use Redis or database for email queue
   - Process emails in background
   - Retry failed emails

3. **Email Templates**
   - Use dynamic templates
   - Implement A/B testing
   - Track email performance

## 🎯 Next Steps

1. ✅ Set up Resend account
2. ✅ Configure environment variables
3. ✅ Test email functionality
4. ✅ Customize email templates
5. ✅ Monitor email performance
6. ✅ Implement advanced features

## 📞 Support

- **Resend Support**: [support.resend.com](https://support.resend.com)
- **Documentation**: [resend.com/docs](https://resend.com/docs)
- **Community**:
  [GitHub Discussions](https://github.com/resendlabs/resend/discussions)

---

**Note**: This setup uses Resend's free tier which is perfect for development
and small to medium applications. For production applications with high email
volume, consider upgrading to a paid plan.
