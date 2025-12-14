# Canvas Friend Groups Extension - Project Summary

## 🎯 Project Overview

A Chrome extension that allows students to:
1. Fetch their Canvas assignments automatically
2. Create or join friend groups using unique codes
3. View their friends' upcoming homework deadlines in real-time

## 📁 Project Structure

```
canvas/
├── manifest.json                 # Chrome extension manifest (Manifest V3)
├── popup.html                    # Main UI for the extension popup
├── popup.css                     # Styling for the popup
├── popup.js                      # Standalone version (Canvas only, no Firebase)
├── popup-integrated.js           # Full version with Firebase integration
├── background.js                 # Service worker for background tasks
├── firebase-config.js            # Firebase credentials (NEEDS CONFIGURATION)
├── firebase-service.js           # Firebase service class for all backend operations
├── package.json                  # NPM dependencies
├── vite.config.js               # Build configuration for bundling
├── setup.sh                      # Setup script for initial configuration
├── test-extension.js             # Testing utilities
├── README.md                     # Comprehensive documentation
├── QUICKSTART.md                 # Quick start guide
├── FIRESTORE_STRUCTURE.js        # Database schema documentation
├── .gitignore                    # Git ignore file
└── icons/
    ├── generate-icons.html       # Tool to generate extension icons
    └── icon.svg                  # SVG icon template
```

## 🚀 Quick Start

### Step 1: Configure Firebase (Required)
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable **Google Authentication**
3. Create a **Firestore Database**
4. Copy your config and update `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Set Firestore security rules (see FIRESTORE_STRUCTURE.js)

### Step 2: Build the Extension
```bash
# Run the setup script (installs dependencies)
./setup.sh

# Or manually:
npm install
npm run build
```

### Step 3: Generate Icons
1. Open `icons/generate-icons.html` in a browser
2. Right-click each canvas and save as:
   - icon16.png
   - icon48.png
   - icon128.png
3. Place them in the `icons/` folder

### Step 4: Load in Chrome
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `dist` folder (after building) or project root

### Step 5: Configure Canvas
1. Get Canvas API token: Canvas → Account → Settings → New Access Token
2. Click extension icon
3. Enter Canvas URL and paste token
4. Click "Save Settings" and "Test Connection"

### Step 6: Use the Extension
1. Sign in with Google
2. Click "Sync with Canvas" to fetch assignments
3. Create or join a group
4. View friends' assignments in the "Friends' Assignments" tab

## 🔑 Key Features

### Canvas Integration
- Fetches assignments via Canvas Planner API
- Supports any Canvas instance (configurable URL)
- Automatic background sync every 30 minutes
- Secure: API tokens stored locally only

### Friend Groups
- Create groups with auto-generated 6-character codes
- Join groups with a shared code
- Real-time assignment sharing
- Leave groups anytime

### Privacy & Security
- **Stored Locally (never shared):**
  - Canvas API token
  - Canvas authentication
  
- **Shared via Firebase:**
  - Assignment title
  - Due date
  - Course name
  - Your Google email/name

- **Never Shared:**
  - Assignment descriptions
  - Grades
  - Submission status
  - Personal Canvas data

## 🛠️ Technology Stack

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend:** Firebase (Authentication + Firestore)
- **Build Tool:** Vite
- **Chrome APIs:** storage, alarms, runtime
- **Canvas API:** Planner Items endpoint

## 📊 Data Flow

```
1. User → Canvas API → Fetch assignments
2. Local Storage → Save assignments
3. User → Firebase Auth → Sign in
4. Firebase Firestore → Store sanitized assignments
5. Groups → Share with members
6. Real-time Listeners → Update friends' assignments
```

## 🧪 Testing

Run tests in the browser console:
```javascript
// Load the test script
window.testExtension()
```

Or include `test-extension.js` in your manifest for automated testing.

## 📝 Development Notes

### Two Versions Available

1. **Standalone (`popup.js`):** 
   - Canvas integration only
   - Local storage
   - No group features
   - Good for testing Canvas API

2. **Integrated (`popup-integrated.js`):**
   - Full Firebase integration
   - Group features
   - Real-time sync
   - Recommended for production

### File Dependencies

```
popup-integrated.js
  ├── firebase-service.js
  │   └── firebase-config.js
  └── Canvas API (no dependencies)

background.js
  └── Canvas API (no dependencies)
```

## 🔄 Background Sync

The extension automatically syncs assignments every 30 minutes via the background service worker. Manual sync is also available via the "Sync with Canvas" button.

## 🐛 Common Issues & Solutions

### Issue: Firebase auth popup blocked
**Solution:** Allow popups for the extension in Chrome settings

### Issue: Canvas API returns 401
**Solution:** Regenerate API token in Canvas settings

### Issue: Friends' assignments not showing
**Solution:** 
- Ensure all members are in the same group
- Friends must have synced their assignments
- Check Firebase security rules

### Issue: Extension not loading
**Solution:**
- Check if all files are in the dist folder after build
- Verify manifest.json syntax
- Check browser console for errors

## 🚧 Future Enhancements

Potential features to add:
- [ ] Assignment filtering by course
- [ ] Calendar view
- [ ] Push notifications
- [ ] Export to Google Calendar
- [ ] Group chat
- [ ] Assignment reminders
- [ ] Due date countdowns
- [ ] Dark mode
- [ ] Assignment categories/tags

## 📄 License

MIT License - Free to use and modify

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- UI/UX enhancements
- Additional Canvas API features
- Performance optimizations
- More comprehensive error handling
- Unit tests

## 📞 Support

- Check README.md for detailed documentation
- Review QUICKSTART.md for setup help
- See FIRESTORE_STRUCTURE.js for database schema
- Run tests using test-extension.js

## ✅ Completion Checklist

Before using the extension:
- [ ] Firebase project created
- [ ] firebase-config.js updated with credentials
- [ ] Firestore security rules configured
- [ ] Dependencies installed (`npm install`)
- [ ] Extension built (`npm run build`)
- [ ] Icons generated and placed in icons/
- [ ] Extension loaded in Chrome
- [ ] Canvas API token obtained
- [ ] Extension configured with Canvas credentials
- [ ] Tested connection to Canvas
- [ ] Signed in with Google
- [ ] Created or joined a group
- [ ] Synced assignments successfully

## 🎉 Success!

Once setup is complete, you should be able to:
- ✅ View your Canvas assignments
- ✅ Create friend groups
- ✅ Share assignment deadlines
- ✅ See friends' upcoming work
- ✅ Stay organized together!

Happy studying! 📚
