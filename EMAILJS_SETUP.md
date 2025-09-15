# EmailJS Setup Instructions for Urban Mechanic Contact Form

## Step 1: Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

## Step 2: Add Email Service
1. Go to the EmailJS dashboard
2. Click "Add New Service"
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the setup instructions for your provider
5. Note down your **Service ID**

## Step 3: Create Email Template
1. Go to "Email Templates" in your EmailJS dashboard
2. Click "Create New Template"
3. Use this template content:

```
Subject: New Contact Form Submission - {{subject}}

Hello Urban Mechanic Team,

You have received a new message from your website contact form:

Name: {{from_name}}
Email: {{from_email}}
Phone: {{phone}}
Subject: {{subject}}

Message:
{{message}}

Newsletter Subscription: {{newsletter}}

Best regards,
Website Contact Form
```

4. Save the template and note down your **Template ID**

## Step 4: Get Your Public Key
1. Go to "Account" in your EmailJS dashboard
2. Find your **Public Key** (User ID)

## Step 5: Update Contact Form
Replace the following placeholders in `contact.html`:

```javascript
emailjs.init("YOUR_PUBLIC_KEY"); // Replace with your actual public key
```

```javascript
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
```

**Example:**
```javascript
emailjs.init("user_abc123xyz");
emailjs.send('service_gmail', 'template_contact', templateParams)
```

## Step 6: Test the Form
1. Open your contact form
2. Fill out all fields
3. Submit the form
4. Check your email for the message

## Email Template Variables
The following variables are sent from the form:
- `{{from_name}}` - First name + Last name
- `{{from_email}}` - Email address
- `{{phone}}` - Phone number
- `{{subject}}` - Selected subject
- `{{message}}` - Message content
- `{{newsletter}}` - Newsletter subscription (Yes/No)
- `{{to_name}}` - Urban Mechanic Team
- `{{reply_to}}` - Reply-to email address

## Features Included
✅ Loading state with spinner
✅ Success/error messages
✅ Form validation
✅ Phone number formatting
✅ Form reset after successful submission
✅ Enhanced UI with focus effects

## Troubleshooting
- Make sure all three IDs are correctly replaced
- Check browser console for error messages
- Verify your EmailJS service is properly configured
- Test with a simple template first

## Free Plan Limits
- 200 emails per month
- EmailJS branding in emails
- For higher limits, consider upgrading to a paid plan
