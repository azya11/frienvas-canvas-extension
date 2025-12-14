# Canvas Friend Groups - Quick Start Guide

## Prerequisites
- Chrome browser
- Canvas account with API access
- Firebase account (free tier is sufficient)

## Installation Steps

### 1. Firebase Configuration (5 minutes)

1. Create Firebase project at https://console.firebase.google.com/
2. Enable Google Authentication
3. Create Firestore database
4. Copy your Firebase config and update `firebase-config.js`

### 2. Build Extension (2 minutes)

```bash
npm install
npm run build
```

### 3. Load in Chrome (1 minute)

1. Go to `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select the `dist` folder

### 4. Configure Extension (2 minutes)

1. Click extension icon
2. Enter Canvas URL and API token (get from Canvas → Settings → New Access Token)
3. Sign in with Google
4. Sync your assignments

### 5. Create/Join Groups (1 minute)

**To create:**
- Click "Create Group"
- Enter name, get code
- Share code with friends

**To join:**
- Click "Join Group"
- Enter friend's code

## Tips

- Sync runs automatically every 30 minutes
- Canvas tokens are stored locally (secure)
- Only assignment titles and dates are shared
- View friends' deadlines in "Friends' Assignments" tab

## Support

Check the full README.md for detailed documentation and troubleshooting.
