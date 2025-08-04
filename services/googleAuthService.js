// services/googleAuthService.js
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

// Sử dụng Web Client ID từ environment variable
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);

console.log('🔑 Google Client ID loaded:', CLIENT_ID ? 'OK' : 'MISSING');

exports.verifyGoogleToken = async (token) => {
  try {
    console.log('🔍 Verifying Google token...');
    
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid token payload');
    }
    
    console.log('✅ Google token verification successful for:', payload.email);
    
    return {
      email: payload.email,
      given_name: payload.given_name,
      family_name: payload.family_name,
      picture: payload.picture,
      sub: payload.sub, // Google User ID
      email_verified: payload.email_verified
    };
  } catch (error) {
    console.error('❌ Google token verification failed:', error);
    throw new Error('Invalid Google token');
  }
};