document.addEventListener('DOMContentLoaded', function () {
  var formElement = document.getElementById('sortableForm');
  var activeTabUrl; // Variable to store the active tab's base URL
  var generatedUrl; // Variable to store the generated URL
  var activeTabId; // Variable to store the active tab's ID

  // prevent window from dismissing

  // Function to prevent default behavior
  function preventPopupClose(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Add event listeners to buttons
  document
    .getElementById('addField')
    .addEventListener('click', function (event) {
      preventPopupClose(event);
      addFormField(); // Function to add a new field
    });

  document
    .getElementById('generateUrl')
    .addEventListener('click', function (event) {
      preventPopupClose(event);
      generateURL(); // Function to generate the URL
    });

  document
    .getElementById('openInNewTab')
    .addEventListener('click', function (event) {
      preventPopupClose(event);
      let url = generateURL(); // Generate the URL
      if (url) {
        chrome.tabs.create({ url: url });
      } else {
        console.error('Failed to generate URL.');
      }
    });

  document
    .getElementById('copyUrl')
    .addEventListener('click', function (event) {
      preventPopupClose(event);
      let url = generateURL(); // Generate the URL
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

  document
    .getElementById('replaceCurrentTab')
    .addEventListener('click', function (event) {
      preventPopupClose(event);
      let url = generateURL(); // Generate the URL
      if (url && activeTabId) {
        // Inject a script to replace the current tab's URL without reloading
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTabId },
            func: function (newUrl) {
              history.replaceState(null, null, newUrl); // Replaces the current URL without reloading
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

  ///

  // Function to add a new form field
  function addFormField(paramName = '', paramValue = '') {
    let newFormGroup = document.createElement('div');
    newFormGroup.className = 'form-group';
    newFormGroup.dataset.id = Date.now(); // Unique ID based on timestamp

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

    // Create a delete button with a larger SVG trash icon
    let deleteButtonDiv = document.createElement('div');
    deleteButtonDiv.className = 'delete-button';
    let deleteButton = document.createElement('button');
    deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="black" viewBox="0 0 24 24">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.59 13.41L15.17 16l-3.17-3.17L8.83 16l-1.42-1.41L10.59 12 7.41 8.83 8.83 7.41 12 10.59l3.17-3.18 1.41 1.42L13.41 12l3.18 3.17z"/>
</svg>
    `; // Larger SVG icon with red fill
    deleteButton.style.backgroundColor = 'transparent'; // Transparent background
    deleteButton.style.border = 'none';
    deleteButton.style.cursor = 'pointer';
    deleteButton.style.padding = '0'; // Remove padding
    deleteButton.style.display = 'flex'; // Flex display to center the icon
    deleteButton.style.alignItems = 'center'; // Center align icon vertically

    // Add event listener to remove the form group when the delete button is clicked
    deleteButton.addEventListener('click', function () {
      formElement.removeChild(newFormGroup);
    });

    deleteButtonDiv.appendChild(deleteButton);

    paramNameDiv.appendChild(paramNameInput);
    paramValueDiv.appendChild(paramValueInput);

    newFormGroup.appendChild(paramNameDiv);
    newFormGroup.appendChild(paramValueDiv);
    newFormGroup.appendChild(deleteButtonDiv); // Add the delete button to the form group

    formElement.appendChild(newFormGroup);
  }

  // Function to parse URL parameters and populate form fields
  function initializeFormFromURL() {
    // Get current URL parameters from the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let tab = tabs[0];
      activeTabUrl = new URL(tab.url); // Store the active tab's URL
      activeTabId = tab.id; // Store the active tab's ID
      let params = new URLSearchParams(activeTabUrl.search);

      console.log('Active Tab URL:', activeTabUrl.href);
      console.log('Active Tab ID:', activeTabId);

      // Clear existing form fields
      formElement.innerHTML = '';

      // Display the initial URL
      displayURL(activeTabUrl);

      // Iterate over URL parameters and create form fields
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
    outputUrlElement.innerHTML = ''; // Clear previous content

    // Decode the URL before displaying it
    let decodedUrl = decodeURIComponent(urlObject.href);

    // Split the pathname into segments
    let pathnameSegments = urlObject.pathname.split('/').filter(Boolean);

    // Create base URL span (gray)
    let baseUrlSpan = document.createElement('span');
    baseUrlSpan.style.color = '#ccc'; // Light gray for base URL
    baseUrlSpan.textContent = urlObject.origin + '/';

    // Append base URL to output
    outputUrlElement.appendChild(baseUrlSpan);

    // Iterate over pathname segments and style them
    pathnameSegments.forEach((segment, index) => {
      let segmentSpan = document.createElement('span');
      if (index === pathnameSegments.length - 1) {
        // Last segment before query parameters - make it green
        segmentSpan.style.color = 'green';
      } else {
        // Other segments - keep them gray
        segmentSpan.style.color = '#ccc';
      }
      segmentSpan.textContent = segment + '/';
      outputUrlElement.appendChild(segmentSpan);
    });

    // Create parameters span
    let paramsSpan = document.createElement('span');

    // Iterate over query parameters and style each pair
    let queryParams = new URLSearchParams(urlObject.search);
    queryParams.forEach((value, key) => {
      let paramSpan = document.createElement('span');
      paramSpan.style.color = PARAM_COLOR; // Black for parameter name
      paramSpan.style.fontWeight = 'bold';
      paramSpan.textContent = key + '=';

      let valueSpan = document.createElement('span');
      valueSpan.style.color = VALUE_COLOR; // Red for parameter value
      valueSpan.textContent = value;

      // Append the parameter and value to the params span
      paramsSpan.appendChild(paramSpan);
      paramsSpan.appendChild(valueSpan);

      // Add "&" between multiple parameters
      paramsSpan.appendChild(document.createTextNode('&'));
    });

    // Remove the last "&" character
    if (paramsSpan.lastChild) {
      paramsSpan.removeChild(paramsSpan.lastChild);
    }

    // Append "?" before parameters if they exist
    if (queryParams.toString()) {
      outputUrlElement.appendChild(document.createTextNode('?'));
    }

    // Append parameters to output
    outputUrlElement.appendChild(paramsSpan);
  }

  // Initialize the form with the current URL parameters
  initializeFormFromURL();

  // Function to generate URL based on the form fields
  function generateURL() {
    if (!activeTabUrl) {
      console.error('Active tab URL not found.');
      return null;
    }

    // Clone the base URL to avoid modifying the original URL object
    generatedUrl = new URL(activeTabUrl.href);
    let queryParams = new URLSearchParams();

    // Get all form fields in the current order
    let formFields = document.querySelectorAll('.form-group');

    // Loop through each form field to construct the query parameters
    formFields.forEach((field) => {
      let paramName = field
        .querySelector('input[name="param-name"]')
        .value.trim();
      let paramValue = field
        .querySelector('input[name="param-value"]')
        .value.trim();

      if (paramName) {
        // Append the parameter to the queryParams
        queryParams.append(paramName, paramValue);
      }
    });

    // Set the search parameters of the generated URL
    generatedUrl.search = queryParams.toString();

    // Decode the URL before displaying it
    let decodedUrl = decodeURIComponent(generatedUrl.href);

    console.log('Generated URL:', decodedUrl);

    // Display the decoded URL with custom styling
    let outputUrlElement = document.getElementById('outputUrl');
    outputUrlElement.innerHTML = ''; // Clear previous content

    // Split the pathname into segments
    let pathnameSegments = generatedUrl.pathname.split('/').filter(Boolean);

    // Create base URL span (gray)
    let baseUrlSpan = document.createElement('span');
    baseUrlSpan.style.color = '#ccc'; // Light gray for base URL
    baseUrlSpan.textContent = generatedUrl.origin + '/';

    // Append base URL to output
    outputUrlElement.appendChild(baseUrlSpan);

    // Iterate over pathname segments and style them
    pathnameSegments.forEach((segment, index) => {
      let segmentSpan = document.createElement('span');
      if (index === pathnameSegments.length - 1) {
        // Last segment before query parameters - make it blue
        segmentSpan.style.color = VALUE_COLOR;
      } else {
        // Other segments - keep them gray
        segmentSpan.style.color = '#999';
      }
      segmentSpan.textContent = segment + '/';
      outputUrlElement.appendChild(segmentSpan);
    });

    // Create parameters span
    let paramsSpan = document.createElement('span');

    // Iterate over query parameters and style each pair
    queryParams.forEach((value, key) => {
      let paramSpan = document.createElement('span');
      paramSpan.style.color = PARAM_COLOR;
      paramSpan.style.fontWeight = 'bold';
      paramSpan.textContent = key + '=';

      let valueSpan = document.createElement('span');
      valueSpan.style.color = ASSET_COLOR;
      valueSpan.textContent = value;

      // Append the parameter and value to the params span
      paramsSpan.appendChild(paramSpan);
      paramsSpan.appendChild(valueSpan);

      // Add "&" between multiple parameters
      paramsSpan.appendChild(document.createTextNode('&'));
    });

    // Remove the last "&" character
    if (paramsSpan.lastChild) {
      paramsSpan.removeChild(paramsSpan.lastChild);
    }

    // Append "?" before parameters if they exist
    if (queryParams.toString()) {
      outputUrlElement.appendChild(document.createTextNode('?'));
    }

    // Append parameters to output
    outputUrlElement.appendChild(paramsSpan);

    return decodedUrl; // Return the decoded URL string
  }

  // Generate and display URL when "Generate URL" button is clicked
  document.getElementById('generateUrl').addEventListener('click', function () {
    generateURL();
  });

  // Open the generated URL in a new tab
  document
    .getElementById('openInNewTab')
    .addEventListener('click', function () {
      let url = generateURL(); // Generate the URL
      if (url) {
        chrome.tabs.create({ url: url });
      } else {
        console.error('Failed to generate URL.');
      }
    });

  // Replace the current tab's URL without closing the popup
  document
    .getElementById('replaceCurrentTab')
    .addEventListener('click', function () {
      let url = generateURL(); // Generate the URL
      if (url && activeTabId) {
        // Inject a script to replace the current tab's URL without reloading
        chrome.scripting.executeScript(
          {
            target: { tabId: activeTabId },
            func: function (newUrl) {
              // Display an alert to confirm script execution in the tab context
              // alert('Replacing URL with: ' + newUrl);
              try {
                // Directly assign to location.href to see if it can navigate
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

  // Initialize the form with the current URL parameters
  initializeFormFromURL();
});
