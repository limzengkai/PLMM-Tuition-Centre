import { initializeApp } from 'firebase-admin/app';


const app = initializeApp();

const myRefreshToken = '...'; // Get refresh token from OAuth2 flow

initializeApp({
  credential: refreshToken(myRefreshToken),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});