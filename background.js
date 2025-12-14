// Background Service Worker for Canvas Friend Groups Extension

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Canvas Friend Groups extension installed');
  
  // Set up periodic sync alarm (every 30 minutes)
  chrome.alarms.create('syncAssignments', {
    periodInMinutes: 30
  });
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncAssignments') {
    syncAssignmentsInBackground();
  }
});

// Background sync function
async function syncAssignmentsInBackground() {
  try {
    const { canvasUrl, canvasToken, myAssignments } = await chrome.storage.local.get([
      'canvasUrl',
      'canvasToken',
      'myAssignments'
    ]);

    if (!canvasUrl || !canvasToken) {
      console.log('Canvas not configured, skipping background sync');
      return;
    }

    // Fetch latest assignments
    const startDate = new Date().toISOString();
    const endDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    
    const url = `${canvasUrl}/api/v1/planner/items?start_date=${startDate}&end_date=${endDate}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${canvasToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Background sync failed:', response.status);
      return;
    }

    const plannerItems = await response.json();
    const sanitized = plannerItems
      .filter(item => item.plannable_type === 'assignment' && item.plannable_date)
      .map(item => ({
        title: item.plannable?.title || 'Untitled Assignment',
        dueDate: item.plannable_date,
        courseName: item.context_name || 'Unknown Course',
        id: item.plannable_id
      }));

    // Save to local storage
    await chrome.storage.local.set({ myAssignments: sanitized });
    
    // TODO: Sync to Firebase if user is authenticated
    console.log('Background sync completed:', sanitized.length, 'assignments');
    
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_NOW') {
    syncAssignmentsInBackground().then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
});
