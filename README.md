# Canvas Friend Groups - Chrome Extension

A Chrome extension that lets you share Canvas homework deadlines with your friends through group functionality.

## Features

- 📚 **Canvas Integration**: Fetch assignments directly from Canvas using the Planner API
- 👥 **Friend Groups**: Create or join groups with unique codes
- 🔄 **Real-time Sync**: Share and view friends' deadlines automatically
- 🔐 **Secure**: Canvas tokens stay local, only sanitized data is shared
- 🔔 **Background Sync**: Automatic updates every 30 minutes

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing one)
3. Enable **Google Authentication**:
   - Go to Authentication → Sign-in method
   - Enable Google provider
4. Create a **Firestore Database**:
   - Go to Firestore Database → Create database
   - Start in production mode (or test mode for development)
5. Get your Firebase config:
   - Go to Project Settings → General
   - Scroll to "Your apps" → Web apps
   - Copy the configuration object
6. Update `firebase-config.js` with your credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

### 2. Firestore Security Rules

Set up these security rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Groups collection
    match /groups/{groupCode} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}
```

### 3. Build the Extension

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

   For development with auto-rebuild:
   ```bash
   npm run dev
   ```

3. The built extension will be in the `dist` folder.

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dist` folder (or the project root if not using build)

### 5. Canvas API Token

1. Log into your Canvas account
2. Go to Account → Settings
3. Scroll to "Approved Integrations"
4. Click "+ New Access Token"
5. Give it a purpose (e.g., "Friend Groups Extension")
6. Click "Generate Token"
7. Copy the token immediately (you won't see it again!)
8. Paste it into the extension popup

## Usage

### First Time Setup

1. **Configure Canvas**:
   - Enter your Canvas URL (e.g., `https://canvas.instructure.com`)
   - Paste your API token
   - Click "Save Settings"
   - Test the connection

2. **Sign In**:
   - Click "Sign in with Google"
   - Authorize the extension

3. **Sync Your Assignments**:
   - Go to "Upcoming Deadlines" → "My Assignments"
   - Click "Sync with Canvas"

### Creating a Group

1. Go to "Friend Groups" section
2. Click "Create Group"
3. Enter a group name
4. Click "Create"
5. Share the generated 6-digit code with friends

### Joining a Group

1. Get a group code from a friend
2. Click "Join Group"
3. Enter the code
4. Click "Join"

### Viewing Friends' Deadlines

1. Go to "Upcoming Deadlines"
2. Switch to "Friends' Assignments" tab
3. See all assignments from group members

## Project Structure

```
canvas-friend-groups/
├── manifest.json              # Chrome extension manifest
├── popup.html                 # Extension popup UI
├── popup.css                  # Popup styling
├── popup.js                   # Original popup logic (standalone)
├── popup-integrated.js        # Popup with Firebase integration
├── background.js              # Background service worker
├── firebase-config.js         # Firebase configuration
├── firebase-service.js        # Firebase service class
├── package.json               # NPM dependencies
├── vite.config.js            # Vite bundler configuration
└── icons/                    # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Development Notes

### Two Versions

- **Standalone Version** (`popup.js`): Works without Firebase, stores data locally
- **Integrated Version** (`popup-integrated.js`): Full Firebase integration for group features

To use the standalone version, update `popup.html`:
```html
<script type="module" src="popup.js"></script>
```

For integrated version (recommended):
```html
<script type="module" src="popup-integrated.js"></script>
```

### Security Considerations

- Canvas API tokens are stored in `chrome.storage.local` and never leave the user's browser
- Only sanitized assignment data (title, due date, course name) is sent to Firebase
- No personal Canvas data is shared
- Firebase security rules ensure users can only read data from their group members

### Data Privacy

**What is shared:**
- Assignment title
- Due date
- Course name
- Your display name/email (from Google account)

**What is NOT shared:**
- Canvas API token
- Assignment descriptions
- Grades
- Submission status
- Any other Canvas data

## Troubleshooting

### Canvas Connection Failed
- Verify your Canvas URL is correct
- Check if your API token is valid
- Ensure your Canvas account has API access enabled

### Firebase Sign-In Issues
- Check if Google authentication is enabled in Firebase Console
- Verify firebase-config.js has correct credentials
- Check browser console for specific errors

### Assignments Not Syncing
- Ensure Canvas settings are configured
- Check if background sync is working (check service worker in chrome://extensions)
- Try manual sync from popup

### Friends' Assignments Not Showing
- Verify you're in the same group
- Ensure friends have synced their assignments
- Check if you're signed in

## Future Enhancements

- [ ] Push notifications for upcoming deadlines
- [ ] Calendar view for assignments
- [ ] Filter assignments by course
- [ ] Export deadlines to Google Calendar
- [ ] Group chat functionality
- [ ] Assignment reminders
- [ ] Dark mode

## License

MIT License - Feel free to use and modify for your needs!

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
