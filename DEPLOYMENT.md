
# CruzPham Trivia: Production Deployment Guide

## 1. Firebase Hosting (Recommended)
### Step 1: Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create project `cruzpham-trivia-prod`.
3. Enable **Authentication** (Google & Email).
4. Create **Firestore Database** in "Production Mode".
5. Enable **Storage** for visual assets.

### Step 2: Deployment
1. Install CLI: `npm install -g firebase-tools`.
2. Login: `firebase login`.
3. Init: `firebase init`. Choose **Hosting**, **Firestore**, **Storage**.
4. Set public directory to `dist`.
5. Deploy: `npm run build && firebase deploy`.

## 2. Domain Mapping: cruzphamtriviastudio.it
1. In Firebase Console: **Hosting > Add Custom Domain**.
2. Enter `cruzphamtriviastudio.it`.
3. Verify ownership via DNS TXT record provided by Firebase.
4. Add **A Records** to your domain registrar (e.g., Cloudflare, Aruba).
5. **SSL** will be auto-provisioned within 24 hours.

## 3. Cloud Run (Alternative)
### Step 1: Containerize
1. Build image: `docker build -t gcr.io/[PROJECT_ID]/cruzpham-trivia .`.
2. Push to Registry: `docker push gcr.io/[PROJECT_ID]/cruzpham-trivia`.

### Step 2: Deploy
1. Deploy: `gcloud run deploy cruzpham-trivia --image gcr.io/[PROJECT_ID]/cruzpham-trivia --platform managed --region us-central1 --allow-unauthenticated`.
2. Set Environment Variables for `API_KEY`.

## 4. CI/CD (GitHub Actions)
1. Add `FIREBASE_SERVICE_ACCOUNT` to GitHub Repo Secrets.
2. The `firebase init` wizard can auto-generate a `.github/workflows/firebase-hosting-merge.yml`.

## 5. Monitoring
- Use **Firebase Analytics** to track live session engagement.
- Monitor **Cloud Logging** for Gemini API latency issues.
