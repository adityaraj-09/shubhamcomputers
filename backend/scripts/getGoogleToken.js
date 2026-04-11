/**
 * One-time script to get a Google OAuth2 refresh token.
 *
 * Prerequisites:
 *   1. Go to https://console.cloud.google.com/apis/credentials
 *   2. Create an OAuth 2.0 Client ID (type: Web application)
 *   3. Add "http://localhost:3000/oauth2callback" as an Authorized redirect URI
 *   4. Enable the Google Drive API in your project
 *
 * Usage:
 *   1. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env
 *   2. Run:  node backend/scripts/getGoogleToken.js
 *   3. Open the printed URL in a browser, sign in, allow access
 *   4. You'll be redirected to localhost:3000/oauth2callback?code=...
 *      Copy the "code" parameter value from the URL
 *   5. Paste the code back into this terminal prompt
 *   6. Copy the printed refresh_token into .env as GOOGLE_REFRESH_TOKEN
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET || CLIENT_ID === 'your_google_client_id') {
  console.error('❌ Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: ['https://www.googleapis.com/auth/drive.file']
});

console.log('\n🔗 Open this URL in your browser:\n');
console.log(authUrl);
console.log('\nAfter signing in, you will be redirected to a URL like:');
console.log('  http://localhost:3000/oauth2callback?code=4/0XXXXX...\n');
console.log('Copy the value of the "code" parameter and paste it below.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question('Paste the authorization code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oauth2Client.getToken(code.trim());
    console.log('\n✅ Success! Add this to your backend/.env file:\n');
    console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
    if (tokens.access_token) {
      console.log('(Access token received too — it will auto-refresh, no need to save it.)');
    }
  } catch (err) {
    console.error('❌ Error exchanging code for tokens:', err.message);
  }
});
