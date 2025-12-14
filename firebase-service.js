import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import firebaseConfig from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase Service Class
export class FirebaseService {
  constructor() {
    this.auth = auth;
    this.db = db;
    this.currentUser = null;
    this.unsubscribers = [];
  }

  // Authentication Methods
  async signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(this.auth, provider);
      this.currentUser = result.user;
      
      // Create or update user document
      await this.createUserDocument(result.user);
      
      return {
        success: true,
        user: {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName
        }
      };
    } catch (error) {
      console.error('Sign-in error:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      // Unsubscribe from all listeners
      this.unsubscribers.forEach(unsubscribe => unsubscribe());
      this.unsubscribers = [];
      
      await firebaseSignOut(this.auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Sign-out error:', error);
      return { success: false, error: error.message };
    }
  }

  onAuthStateChanged(callback) {
    return this.auth.onAuthStateChanged((user) => {
      this.currentUser = user;
      callback(user);
    });
  }

  // User Management
  async createUserDocument(user) {
    const userRef = doc(this.db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        groups: [],
        createdAt: new Date().toISOString()
      });
    }
  }

  // Assignment Sync Methods
  async syncAssignments(assignments) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(this.db, 'users', this.currentUser.uid);
    
    try {
      await updateDoc(userRef, {
        assignments: assignments,
        lastSync: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }

  // Group Management Methods
  generateGroupCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  async createGroup(groupName) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const groupCode = this.generateGroupCode();
    const groupRef = doc(this.db, 'groups', groupCode);

    try {
      // Check if code already exists (unlikely but possible)
      const groupSnap = await getDoc(groupRef);
      if (groupSnap.exists()) {
        // Regenerate code if collision
        return this.createGroup(groupName);
      }

      // Create group
      await setDoc(groupRef, {
        code: groupCode,
        name: groupName,
        createdBy: this.currentUser.uid,
        createdAt: new Date().toISOString(),
        members: [this.currentUser.uid]
      });

      // Add group to user's groups
      const userRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        groups: arrayUnion(groupCode)
      });

      return { success: true, groupCode, groupName };
    } catch (error) {
      console.error('Create group error:', error);
      return { success: false, error: error.message };
    }
  }

  async joinGroup(groupCode) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    const groupRef = doc(this.db, 'groups', groupCode.toUpperCase());

    try {
      const groupSnap = await getDoc(groupRef);
      
      if (!groupSnap.exists()) {
        return { success: false, error: 'Group not found' };
      }

      const groupData = groupSnap.data();

      // Check if already a member
      if (groupData.members.includes(this.currentUser.uid)) {
        return { success: false, error: 'Already a member of this group' };
      }

      // Add user to group
      await updateDoc(groupRef, {
        members: arrayUnion(this.currentUser.uid)
      });

      // Add group to user's groups
      const userRef = doc(this.db, 'users', this.currentUser.uid);
      await updateDoc(userRef, {
        groups: arrayUnion(groupCode.toUpperCase())
      });

      return { success: true, groupName: groupData.name, groupCode: groupCode.toUpperCase() };
    } catch (error) {
      console.error('Join group error:', error);
      return { success: false, error: error.message };
    }
  }

  async getUserGroups() {
    if (!this.currentUser) {
      return [];
    }

    try {
      const userRef = doc(this.db, 'users', this.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return [];
      }

      const userData = userSnap.data();
      const groupCodes = userData.groups || [];

      // Fetch group details
      const groups = [];
      for (const code of groupCodes) {
        const groupRef = doc(this.db, 'groups', code);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          groups.push({ code, ...groupSnap.data() });
        }
      }

      return groups;
    } catch (error) {
      console.error('Get groups error:', error);
      return [];
    }
  }

  async getFriendsAssignments() {
    if (!this.currentUser) {
      return [];
    }

    try {
      // Get user's groups
      const userRef = doc(this.db, 'users', this.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        return [];
      }

      const userData = userSnap.data();
      const groupCodes = userData.groups || [];

      // Get all members from all groups
      const allMembers = new Set();
      for (const code of groupCodes) {
        const groupRef = doc(this.db, 'groups', code);
        const groupSnap = await getDoc(groupRef);
        if (groupSnap.exists()) {
          const groupData = groupSnap.data();
          groupData.members.forEach(memberId => {
            if (memberId !== this.currentUser.uid) {
              allMembers.add(memberId);
            }
          });
        }
      }

      // Fetch assignments from all friends
      const friendsAssignments = [];
      for (const memberId of allMembers) {
        const memberRef = doc(this.db, 'users', memberId);
        const memberSnap = await getDoc(memberRef);
        if (memberSnap.exists()) {
          const memberData = memberSnap.data();
          if (memberData.assignments && memberData.assignments.length > 0) {
            friendsAssignments.push({
              userId: memberId,
              userName: memberData.displayName || memberData.email,
              assignments: memberData.assignments
            });
          }
        }
      }

      return friendsAssignments;
    } catch (error) {
      console.error('Get friends assignments error:', error);
      return [];
    }
  }

  // Real-time listener for friends' assignments
  listenToFriendsAssignments(callback) {
    if (!this.currentUser) {
      return null;
    }

    const userRef = doc(this.db, 'users', this.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, async (docSnap) => {
      if (docSnap.exists()) {
        const assignments = await this.getFriendsAssignments();
        callback(assignments);
      }
    });

    this.unsubscribers.push(unsubscribe);
    return unsubscribe;
  }

  async leaveGroup(groupCode) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const groupRef = doc(this.db, 'groups', groupCode);
      const userRef = doc(this.db, 'users', this.currentUser.uid);

      // Get current group data
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        return { success: false, error: 'Group not found' };
      }

      const groupData = groupSnap.data();
      
      // Remove user from group members
      const updatedMembers = groupData.members.filter(id => id !== this.currentUser.uid);
      await updateDoc(groupRef, { members: updatedMembers });

      // Get user data and remove group
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const updatedGroups = (userData.groups || []).filter(code => code !== groupCode);
        await updateDoc(userRef, { groups: updatedGroups });
      }

      return { success: true };
    } catch (error) {
      console.error('Leave group error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default FirebaseService;
