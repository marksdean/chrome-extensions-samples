document.addEventListener('DOMContentLoaded', function () {
    var formElement = document.getElementById('sortableForm');
    var activeTabUrl;
    var generatedUrl;
    var activeTabId;
  
    // Load Dragula CSS
    var dragulaCSS = document.createElement('link');
    dragulaCSS.rel = 'stylesheet';
    dragulaCSS.href = 'libs/dragula.min.css';
    document.head.appendChild(dragulaCSS);
  
    // Load Dragula script
    var dragulaScript = document.createElement('script');
    dragulaScript.src = 'libs/dragula.min.js';
    document.body.appendChild(dragulaScript);
  
    dragulaScript.onload = function () {
      // Initialize Dragula
      var drake = dragula([formElement], {
        moves: function (el, container, handle) {
          return handle.classList.contains('drag-handle');
        }
      });
  
      // Function to prevent default behavior
      function preventPopupClose(event) {
        event.preventDefault();
        event.stopPropagation();
      }
  
 

      // Function to prevent and stop propagation for popup close
      function preventDefaultAndStopPropagation(event) {
        preventPopupClose(event);
        // Prevent the popup from closing when interacting with the form
        chrome.runtime.sendMessage({ action: 'keepPopupOpen' });
      }
  
      // Add event listeners to buttons
      document
        .getElementById('replaceCurrentTab')
        .addEventListener('click', function (event) {
          preventDefaultAndStopPropagation(event);
          let url = generateURL();
          if (url && activeTabId) {
            chrome.scripting.executeScript(
              {
                target: { tabId: activeTabId },
                func: function (newUrl) {
                  try {
                    location.href = newUrl;
                    console.log('URL replaced with:', newUrl);
                  } catch (error) {
                    console.error('Failed to replace URL:', error);
                  }
                },
                args: [url]
              },
              (results) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    'Error updating URL in the tab:',
                    chrome.runtime.lastError.message
                  );
                } else {
                  console.log('Tab URL updated successfully without navigation.');
                }
              }
            );
          } else {
            console.error('Failed to generate URL or retrieve active tab ID.');
          }
        });
  
      document
        .getElementById('addField')
        .addEventListener('click', function (event) {
          preventDefaultAndStopPropagation(event);
          addFormField();
        });
  
      document
        .getElementById('generateUrl')
        .addEventListener('click', function (event) {
          preventDefaultAndStopPropagation(event);
          generateURL();
        });
  
      document
        .getElementById('openInNewTab')
        .addEventListener('click', function (event) {
          preventDefaultAndStopPropagation(event);
          let url = generateURL();
          if (url) {
            chrome.tabs.create({ url: url });
          } else {
            console.error('Failed to generate URL.');
          }
        });
  
      document
        .getElementById('copyUrl')
        .addEventListener('click', function (event) {
          preventDefaultAndStopPropagation(event);
          let url = generateURL();
          if (url) {
            navigator.clipboard
              .writeText(url)
              .then(() => {
                alert('URL copied to clipboard!');
              })
              .catch((err) => {
                console.error('Failed to copy URL: ', err);
              });
          } else {
            console.error('Failed to generate URL.');
          }
        });
  
      // Function to add a new form field
      function addFormField(paramName = '', paramValue = '') {
        let newFormGroup = document.createElement('div');
        newFormGroup.className = 'form-group';
        newFormGroup.dataset.id = Date.now();
  
        let dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '&#9776;';
        dragHandle.style.cursor = 'move';
        dragHandle.style.padding = '5px';
        dragHandle.style.marginRight = '10px';
  
        let paramNameDiv = document.createElement('div');
        paramNameDiv.className = 'param-name';
        let paramNameInput = document.createElement('input');
        paramNameInput.type = 'text';
        paramNameInput.name = 'param-name';
        paramNameInput.placeholder = 'Parameter Name';
        paramNameInput.value = paramName;
  
        let paramValueDiv = document.createElement('div');
        paramValueDiv.className = 'param-value';
        let paramValueInput = document.createElement('input');
        paramValueInput.type = 'text';
        paramValueInput.name = 'param-value';
        paramValueInput.placeholder = 'Value';
        paramValueInput.value = paramValue;
  
        let deleteButtonDiv = document.createElement('div');
        deleteButtonDiv.className = 'delete-button';
        let deleteButton = document.createElement('button');
        deleteButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 13.41L15.17 16l-3.17-3.17L8.83 16l-1.42-1.41L10.59 12 7.41 8.83 8.83 7.41 12 10.59l3.17-3.18 1.41 1.42L13.41 12l3.18 3.17z"/>
            </svg>
          `;
        deleteButton.style.backgroundColor = 'transparent';
        deleteButton.style.border = 'none';
        deleteButton.style.cursor = 'pointer';
        deleteButton.style.padding = '0';
        deleteButton.style.display = 'flex';
        deleteButton.style.alignItems = 'center';
  
        deleteButton.addEventListener('click', function () {
          preventDefaultAndStopPropagation(event);
          formElement.removeChild(newFormGroup);
        });
  
        deleteButtonDiv.appendChild(deleteButton);
  
        paramNameDiv.appendChild(paramNameInput);
        paramValueDiv.appendChild(paramValueInput);
  
        newFormGroup.appendChild(dragHandle);
        newFormGroup.appendChild(paramNameDiv);
        newFormGroup.appendChild(paramValueDiv);
        newFormGroup.appendChild(deleteButtonDiv);
  
        formElement.appendChild(newFormGroup);
      }
  
      // Function to parse URL parameters and populate form fields
      function initializeFormFromURL() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          let tab = tabs[0];
          activeTabUrl = new URL(tab.url);
          activeTabId = tab.id;
          let params = new URLSearchParams(activeTabUrl.search);
  
          console.log('Active Tab URL:', activeTabUrl.href);
          console.log('Active Tab ID:', activeTabId);
  
          formElement.innerHTML = '';
          displayURL(activeTabUrl);
  
          params.forEach((value, key) => {
            addFormField(decodeURIComponent(key), decodeURIComponent(value));
          });
        });
      }
  
      const PARAM_COLOR = 'black';
      const VALUE_COLOR = '#FE6634';
      const ASSET_COLOR = '#007bff';
  
      // Function to display the generated or current URL
      function displayURL(urlObject) {
        let outputUrlElement = document.getElementById('outputUrl');
        outputUrlElement.innerHTML = '';
  
        let decodedUrl = decodeURIComponent(urlObject.href);
        let pathnameSegments = urlObject.pathname.split('/').filter(Boolean);
  
        let baseUrlSpan = document.createElement('span');
        baseUrlSpan.style.color = '#ccc';
        baseUrlSpan.textContent = urlObject.origin + '/';
        outputUrlElement.appendChild(baseUrlSpan);
  
        pathnameSegments.forEach((segment, index) => {
          let segmentSpan = document.createElement('span');
          segmentSpan.style.color =
            index === pathnameSegments.length - 1 ? 'green' : '#ccc';
          segmentSpan.textContent = segment + '/';
          outputUrlElement.appendChild(segmentSpan);
        });
  
        let paramsSpan = document.createElement('span');
        let queryParams = new URLSearchParams(urlObject.search);
        queryParams.forEach((value, key) => {
          let paramSpan = document.createElement('span');
          paramSpan.style.color = PARAM_COLOR;
          paramSpan.style.fontWeight = 'bold';
          paramSpan.textContent = key + '=';
  
          let valueSpan = document.createElement('span');
          valueSpan.style.color = VALUE_COLOR;
          valueSpan.textContent = value;
  
          paramsSpan.appendChild(paramSpan);
          paramsSpan.appendChild(valueSpan);
          paramsSpan.appendChild(document.createTextNode('&'));
        });
  
        if (paramsSpan.lastChild) {
          paramsSpan.removeChild(paramsSpan.lastChild);
        }
  
        if (queryParams.toString()) {
          outputUrlElement.appendChild(document.createTextNode('?'));
        }
  
        outputUrlElement.appendChild(paramsSpan);
      }
  
      // Function to generate URL based on the form fields
      function generateURL() {
        if (!activeTabUrl) {
          console.error('Active tab URL not found.');
          return null;
        }
  
        generatedUrl = new URL(activeTabUrl.href);
        let queryParams = new URLSearchParams();
  
        let formFields = document.querySelectorAll('.form-group');
  
        formFields.forEach((field) => {
          let paramName = field
            .querySelector('input[name="param-name"]')
            .value.trim();
          let paramValue = field
            .querySelector('input[name="param-value"]')
            .value.trim();
  
          if (paramName) {
            queryParams.append(paramName, paramValue);
          }
        });
  
        generatedUrl.search = queryParams.toString();
        let decodedUrl = decodeURIComponent(generatedUrl.href);
  
        console.log('Generated URL:', decodedUrl);
        displayURL(generatedUrl);
  
        return decodedUrl;
      }
  
      // Initialize the form with the current URL parameters
      initializeFormFromURL();
    };
  });