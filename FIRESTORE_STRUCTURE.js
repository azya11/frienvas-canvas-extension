// Firestore Database Structure Documentation

/*
COLLECTIONS STRUCTURE:

1. users/ (collection)
   - Document ID: {userId} (Firebase Auth UID)
   - Fields:
     * uid: string
     * email: string
     * displayName: string
     * groups: array<string> (array of group codes)
     * assignments: array<object> (sanitized Canvas assignments)
       - title: string
       - dueDate: string (ISO 8601)
       - courseName: string
       - id: string
     * lastSync: string (ISO 8601 timestamp)
     * createdAt: string (ISO 8601 timestamp)

2. groups/ (collection)
   - Document ID: {groupCode} (6-character uppercase code)
   - Fields:
     * code: string (same as document ID)
     * name: string
     * createdBy: string (user ID)
     * members: array<string> (array of user IDs)
     * createdAt: string (ISO 8601 timestamp)

SECURITY RULES:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read any authenticated user's data
    // Users can only write their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Groups can only be read by members
    // Groups can be created by any authenticated user
    // Groups can be updated by any authenticated user (for joining)
    match /groups/{groupCode} {
      allow read: if request.auth != null && 
                     request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
  }
}

INDEXES (create in Firestore Console if needed):

- Collection: groups
  - Fields: members (Array)
  - Query scope: Collection

- Collection: users
  - Fields: groups (Array)
  - Query scope: Collection

DATA FLOW:

1. User syncs with Canvas → assignments stored in users/{userId}/assignments
2. User creates group → new document in groups/ with generated code
3. Friend joins group → their UID added to groups/{code}/members
4. User views friends' assignments:
   - Query user's groups from users/{userId}/groups
   - For each group, get members from groups/{code}/members
   - For each member, read assignments from users/{memberId}/assignments
   - Merge and display all assignments

PRIVACY NOTES:

- Only sanitized data is stored (title, due date, course name)
- No Canvas tokens are stored in Firebase
- No assignment descriptions, grades, or submission status
- Users can only see data from group members
*/

// Example Data Structures:

const exampleUser = {
  uid: "abc123def456",
  email: "student@university.edu",
  displayName: "John Doe",
  groups: ["A1B2C3", "D4E5F6"],
  assignments: [
    {
      title: "Math Homework 5",
      dueDate: "2024-12-20T23:59:00Z",
      courseName: "Calculus I",
      id: "12345"
    },
    {
      title: "Essay on Shakespeare",
      dueDate: "2024-12-22T17:00:00Z",
      courseName: "English Literature",
      id: "12346"
    }
  ],
  lastSync: "2024-12-14T10:30:00Z",
  createdAt: "2024-12-01T08:15:00Z"
};

const exampleGroup = {
  code: "A1B2C3",
  name: "Study Group Fall 2024",
  createdBy: "abc123def456",
  members: ["abc123def456", "xyz789uvw012", "lmn345opq678"],
  createdAt: "2024-12-01T09:00:00Z"
};

export { exampleUser, exampleGroup };
