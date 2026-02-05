// Test WhatsApp Notification
// Run this file to test if Twilio is working: node test-whatsapp.js

require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

console.log('🚀 Testing WhatsApp notification...\n');

client.messages
    .create({
        from: 'whatsapp:+14155238886',
        body: '🎉 *GrowFarm Test Message*\n\nYour Twilio WhatsApp integration is working perfectly!\n\n✅ All AS-4 features are ready:\n• Voice Input\n• Smart Filtering\n• Insurance Options\n• Auto-filled PDFs\n• Deadline Reminders\n\nReady for hackathon! 🚀',
        to: 'whatsapp:+919172858669'
    })
    .then(message => {
        console.log('✅ SUCCESS! Message sent to WhatsApp');
        console.log('📱 Message SID:', message.sid);
        console.log('📞 To:', message.to);
        console.log('📤 From:', message.from);
        console.log('\n✨ Check your WhatsApp (+919172858669) for the test message!');
    })
    .catch(error => {
        console.error('❌ ERROR sending message:');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Status:', error.status);

        if (error.code === 20003 || error.status === 401) {
            console.error('\n🔐 AUTHENTICATION ERROR!');
            console.error('This means your Auth Token is incorrect or has been regenerated.');
            console.error('\n📋 To fix this:');
            console.error('1. Go to: https://console.twilio.com/');
            console.error('2. Login to your account');
            console.error('3. On the dashboard, find "Auth Token"');
            console.error('4. Click "View" to reveal the token');
            console.error('5. Copy the EXACT token (no spaces!)');
            console.error('6. Update scheme_controller.js line 9 with new token');
            console.error('\n⚠️  Current credentials:');
            console.error('   Account SID: YOUR_ACCOUNT_SID');
            console.error('   Auth Token: YOUR_AUTH_TOKEN');
            console.error('\n💡 The Auth Token might have been regenerated. Please verify!');
        } else {
            console.error('\n💡 Troubleshooting:');
            console.error('1. Make sure you activated WhatsApp in Twilio Sandbox');
            console.error('2. Send "join [sandbox-code]" to +1 415 523 8886');
            console.error('3. Wait for confirmation before testing');
        }
    });
