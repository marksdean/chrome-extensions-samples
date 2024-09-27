chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.action === "updateTab") {
        chrome.tabs.update(request.tabId, { url: request.url }, function(tab) {
          if (chrome.runtime.lastError) {
            console.error('Error updating URL in the tab:', chrome.runtime.lastError.message);
            sendResponse({success: false, error: chrome.runtime.lastError.message});
          } else {
            console.log('Tab URL updated successfully:', tab.url);
            sendResponse({success: true, url: tab.url});
          }
        });
        return true;  // Indicates that we will send a response asynchronously
      }
    }
  );

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openPersistentPopup') {
      chrome.windows.create({
        url: 'popup.html', // Your popup HTML file
        type: 'popup',
        width: 400,
        height: 600
      }, function(window) {
        console.log('Persistent popup window created:', window.id);
      });
    }
  });