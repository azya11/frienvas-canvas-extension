// Canvas API Integration Module
class CanvasAPI {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  async fetchPlannerItems(startDate = null, endDate = null) {
    const params = new URLSearchParams();
    
    if (startDate) {
      params.append('start_date', startDate);
    }
    if (endDate) {
      params.append('end_date', endDate);
    }

    const url = `${this.baseUrl}/api/v1/planner/items?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Canvas API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching planner items:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      const url = `${this.baseUrl}/api/v1/users/self`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Connection failed: ${response.status}`);
      }

      const userData = await response.json();
      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  sanitizeAssignments(plannerItems) {
    return plannerItems
      .filter(item => item.plannable_type === 'assignment' && item.plannable_date)
      .map(item => ({
        title: item.plannable?.title || 'Untitled Assignment',
        dueDate: item.plannable_date,
        courseName: item.context_name || 'Unknown Course',
        id: item.plannable_id
      }));
  }
}

// UI Controller with Firebase Integration
class PopupUI {
  constructor() {
    this.canvasAPI = null;
    this.firebaseService = null;
    this.currentUser = null;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.attachEventListeners();
    
    // Import and initialize Firebase
    try {
      const { FirebaseService } = await import('./firebase-service.js');
      this.firebaseService = new FirebaseService();
      
      // Set up auth listener
      this.firebaseService.onAuthStateChanged((user) => {
        this.updateAuthUI(user);
        if (user) {
          this.loadUserGroups();
        }
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      console.log('Extension will work without Firebase features');
    }
    
    this.loadMyAssignments();
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['canvasUrl', 'canvasToken']);
    if (result.canvasUrl) {
      document.getElementById('canvas-url').value = result.canvasUrl;
    }
    if (result.canvasToken) {
      document.getElementById('canvas-token').value = result.canvasToken;
      this.canvasAPI = new CanvasAPI(result.canvasUrl, result.canvasToken);
    }
  }

  attachEventListeners() {
    // Canvas Settings
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
    document.getElementById('test-connection').addEventListener('click', () => this.testConnection());

    // Authentication
    document.getElementById('sign-in').addEventListener('click', () => this.signIn());
    document.getElementById('sign-out').addEventListener('click', () => this.signOut());

    // Group Management
    document.getElementById('create-group').addEventListener('click', () => this.showCreateGroupForm());
    document.getElementById('join-group').addEventListener('click', () => this.showJoinGroupForm());
    document.getElementById('cancel-create').addEventListener('click', () => this.hideCreateGroupForm());
    document.getElementById('cancel-join').addEventListener('click', () => this.hideJoinGroupForm());
    document.getElementById('submit-create-group').addEventListener('click', () => this.createGroup());
    document.getElementById('submit-join-group').addEventListener('click', () => this.joinGroup());

    // Deadlines
    document.getElementById('sync-deadlines').addEventListener('click', () => this.syncDeadlines());

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
    });
  }

  async saveSettings() {
    const url = document.getElementById('canvas-url').value.trim();
    const token = document.getElementById('canvas-token').value.trim();

    if (!url || !token) {
      this.showStatus('settings-status', 'Please fill in both fields', 'error');
      return;
    }

    try {
      await chrome.storage.local.set({ canvasUrl: url, canvasToken: token });
      this.canvasAPI = new CanvasAPI(url, token);
      this.showStatus('settings-status', 'Settings saved successfully!', 'success');
    } catch (error) {
      this.showStatus('settings-status', 'Error saving settings', 'error');
    }
  }

  async testConnection() {
    if (!this.canvasAPI) {
      this.showStatus('settings-status', 'Please save settings first', 'error');
      return;
    }

    this.showStatus('settings-status', 'Testing connection...', 'info');
    
    const result = await this.canvasAPI.testConnection();
    
    if (result.success) {
      this.showStatus('settings-status', `Connected as ${result.user.name}!`, 'success');
    } else {
      this.showStatus('settings-status', `Connection failed: ${result.error}`, 'error');
    }
  }

  async syncDeadlines() {
    if (!this.canvasAPI) {
      alert('Please configure Canvas settings first');
      return;
    }

    const btn = document.getElementById('sync-deadlines');
    btn.disabled = true;
    btn.textContent = 'Syncing...';

    try {
      // Fetch assignments for the next 60 days
      const startDate = new Date().toISOString();
      const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      
      const plannerItems = await this.canvasAPI.fetchPlannerItems(startDate, endDate);
      const sanitized = this.canvasAPI.sanitizeAssignments(plannerItems);
      
      // Save to local storage
      await chrome.storage.local.set({ myAssignments: sanitized });
      
      // Display assignments
      this.displayMyAssignments(sanitized);
      
      // Sync to Firebase if signed in
      if (this.currentUser && this.firebaseService) {
        const syncResult = await this.firebaseService.syncAssignments(sanitized);
        if (!syncResult.success) {
          console.error('Firebase sync failed:', syncResult.error);
        }
      }
      
      btn.textContent = 'Synced!';
      setTimeout(() => {
        btn.textContent = 'Sync with Canvas';
        btn.disabled = false;
      }, 2000);
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync assignments: ' + error.message);
      btn.textContent = 'Sync with Canvas';
      btn.disabled = false;
    }
  }

  async loadMyAssignments() {
    const result = await chrome.storage.local.get(['myAssignments']);
    if (result.myAssignments && result.myAssignments.length > 0) {
      this.displayMyAssignments(result.myAssignments);
    } else {
      document.getElementById('my-assignments-list').innerHTML = 
        '<div class="empty-state">No assignments yet. Click "Sync with Canvas" to fetch your assignments.</div>';
    }
  }

  displayMyAssignments(assignments) {
    const container = document.getElementById('my-assignments-list');
    
    if (assignments.length === 0) {
      container.innerHTML = '<div class="empty-state">No upcoming assignments</div>';
      return;
    }

    // Sort by due date
    assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    container.innerHTML = assignments.map(assignment => `
      <div class="assignment-item">
        <div class="assignment-title">${this.escapeHtml(assignment.title)}</div>
        <div class="assignment-due">📅 Due: ${this.formatDate(assignment.dueDate)}</div>
        <div class="assignment-course">${this.escapeHtml(assignment.courseName)}</div>
      </div>
    `).join('');
  }

  updateAuthUI(user) {
    this.currentUser = user;
    if (user) {
      document.getElementById('user-info').classList.remove('hidden');
      document.getElementById('sign-in-container').classList.add('hidden');
      document.getElementById('user-email').textContent = user.email;
    } else {
      document.getElementById('user-info').classList.add('hidden');
      document.getElementById('sign-in-container').classList.remove('hidden');
    }
  }

  async signIn() {
    if (!this.firebaseService) {
      alert('Firebase is not configured. Please check firebase-config.js');
      return;
    }

    try {
      const result = await this.firebaseService.signInWithGoogle();
      if (result.success) {
        console.log('Signed in successfully');
        await this.loadUserGroups();
      } else {
        alert('Sign-in failed: ' + result.error);
      }
    } catch (error) {
      alert('Sign-in error: ' + error.message);
    }
  }

  async signOut() {
    if (!this.firebaseService) return;

    const result = await this.firebaseService.signOut();
    if (result.success) {
      document.getElementById('groups-list').innerHTML = '';
      document.getElementById('friends-assignments-list').innerHTML = 
        '<div class="empty-state">Please sign in to view friends\' assignments</div>';
    }
  }

  showCreateGroupForm() {
    document.getElementById('create-group-form').classList.remove('hidden');
    document.getElementById('join-group-form').classList.add('hidden');
  }

  showJoinGroupForm() {
    document.getElementById('join-group-form').classList.remove('hidden');
    document.getElementById('create-group-form').classList.add('hidden');
  }

  hideCreateGroupForm() {
    document.getElementById('create-group-form').classList.add('hidden');
    document.getElementById('group-name').value = '';
  }

  hideJoinGroupForm() {
    document.getElementById('join-group-form').classList.add('hidden');
    document.getElementById('group-code').value = '';
  }

  async createGroup() {
    const groupName = document.getElementById('group-name').value.trim();
    if (!groupName) {
      alert('Please enter a group name');
      return;
    }

    if (!this.currentUser || !this.firebaseService) {
      alert('Please sign in first');
      return;
    }

    try {
      const result = await this.firebaseService.createGroup(groupName);
      if (result.success) {
        alert(`Group created! Share this code with friends: ${result.groupCode}`);
        this.hideCreateGroupForm();
        await this.loadUserGroups();
      } else {
        alert('Failed to create group: ' + result.error);
      }
    } catch (error) {
      alert('Error creating group: ' + error.message);
    }
  }

  async joinGroup() {
    const groupCode = document.getElementById('group-code').value.trim().toUpperCase();
    if (!groupCode) {
      alert('Please enter a group code');
      return;
    }

    if (!this.currentUser || !this.firebaseService) {
      alert('Please sign in first');
      return;
    }

    try {
      const result = await this.firebaseService.joinGroup(groupCode);
      if (result.success) {
        alert(`Successfully joined ${result.groupName}!`);
        this.hideJoinGroupForm();
        await this.loadUserGroups();
      } else {
        alert('Failed to join group: ' + result.error);
      }
    } catch (error) {
      alert('Error joining group: ' + error.message);
    }
  }

  async loadUserGroups() {
    if (!this.firebaseService || !this.currentUser) return;

    const groups = await this.firebaseService.getUserGroups();
    const container = document.getElementById('groups-list');

    if (groups.length === 0) {
      container.innerHTML = '<div class="empty-state">No groups yet. Create or join one!</div>';
      return;
    }

    container.innerHTML = groups.map(group => `
      <div class="group-item">
        <div>
          <div class="group-name">${this.escapeHtml(group.name)}</div>
          <div class="group-code">Code: ${group.code}</div>
        </div>
        <button class="btn btn-secondary" onclick="popupUI.leaveGroup('${group.code}')">Leave</button>
      </div>
    `).join('');
  }

  async leaveGroup(groupCode) {
    if (!confirm('Are you sure you want to leave this group?')) {
      return;
    }

    if (!this.firebaseService) return;

    const result = await this.firebaseService.leaveGroup(groupCode);
    if (result.success) {
      await this.loadUserGroups();
    } else {
      alert('Failed to leave group: ' + result.error);
    }
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'friends-deadlines') {
      this.loadFriendsAssignments();
    }
  }

  async loadFriendsAssignments() {
    const container = document.getElementById('friends-assignments-list');
    
    if (!this.currentUser || !this.firebaseService) {
      container.innerHTML = '<div class="empty-state">Please sign in to view friends\' assignments</div>';
      return;
    }

    container.innerHTML = '<div class="loading">Loading friends\' assignments...</div>';

    try {
      const friendsData = await this.firebaseService.getFriendsAssignments();
      
      if (friendsData.length === 0) {
        container.innerHTML = '<div class="empty-state">No friends in your groups yet, or they haven\'t synced their assignments.</div>';
        return;
      }

      // Flatten all assignments with owner info
      const allAssignments = [];
      friendsData.forEach(friend => {
        friend.assignments.forEach(assignment => {
          allAssignments.push({
            ...assignment,
            ownerName: friend.userName
          });
        });
      });

      // Sort by due date
      allAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      container.innerHTML = allAssignments.map(assignment => `
        <div class="assignment-item">
          <div class="assignment-title">${this.escapeHtml(assignment.title)}</div>
          <div class="assignment-due">📅 Due: ${this.formatDate(assignment.dueDate)}</div>
          <div class="assignment-course">${this.escapeHtml(assignment.courseName)}</div>
          <div class="assignment-owner">👤 ${this.escapeHtml(assignment.ownerName)}</div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error loading friends assignments:', error);
      container.innerHTML = '<div class="empty-state">Error loading assignments</div>';
    }
  }

  showStatus(elementId, message, type) {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
    
    if (type === 'success') {
      setTimeout(() => {
        statusEl.style.display = 'none';
      }, 3000);
    }
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `${date.toLocaleDateString()} (Overdue)`;
    } else if (diffDays === 0) {
      return `${date.toLocaleDateString()} (Today!)`;
    } else if (diffDays === 1) {
      return `${date.toLocaleDateString()} (Tomorrow)`;
    } else if (diffDays <= 7) {
      return `${date.toLocaleDateString()} (${diffDays} days)`;
    } else {
      return date.toLocaleDateString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the popup and make it globally accessible for inline event handlers
let popupUI;
document.addEventListener('DOMContentLoaded', () => {
  popupUI = new PopupUI();
  window.popupUI = popupUI; // Make it accessible globally
});
