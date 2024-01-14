// Initialize a global variable for contacts
let contacts = { contacts: [] };
let manageContactsState = 0;
let newNoteState = 0;
let newContactState = 0;
let editContactState = 0;
let shownContactID = 0;


// Add event listeners for buttons and other interactions

document.addEventListener("DOMContentLoaded", function () {
    // Reference to the load and save buttons
    const loadDatabaseButton = document.getElementById("loadDatabaseButton");
    const saveDatabaseButton = document.getElementById("saveDatabaseButton");
	const newContactButton = document.getElementById("newContactButton");
	const manageContactsButton = document.getElementById("manageContactsButton");
	const importButton = document.getElementById("importButton");
    const exportButton = document.getElementById("exportButton");
    const deleteButton = document.getElementById("deleteButton");
	
	const searchInput = document.getElementById('searchInput');
	searchInput.addEventListener('input', function() {
		clearForms();
		if (manageContactsState!=1) { executeSearch(); }
	});
	
	//New note button
	const newNoteButton = document.getElementById('newNoteButton');
	newNoteButton.addEventListener('click', function() {
		clearForms();
		if (manageContactsState !== 1) { 
			if (newNoteState === 0) {
				statesToZero();
				newNoteState = 1;
				openNewNoteForm();
			} else {
				newNoteState = 0;
				clearForms();
			}
		}
	});
	
	// Event listener for the edit contact button
	const editContactButton = document.getElementById("editContactButton");
	editContactButton.addEventListener('click', function() {
		clearForms();
		if (manageContactsState !== 1) { 
			if (editContactState === 0) {
				statesToZero();
				editContactState = 1;
				openEditContactForm();
			} else {
				editContactState = 0;
				clearForms();
			}
		}
	});
	
    // Event listener for the load button
    loadDatabaseButton.addEventListener("click", function () {
        // Call loadDatabase and chain the displayContacts function
		manageContacts(0);
		clearForms();
		statesToZero();
		loadDatabase()
        .then(() => {
			displayContacts('fullName','asc');
		})
        .then(() => {
			manageContactsButton.style.visibility = "visible";
			searchDialog.style.display = "block";
			manageContacts(0);
			manageContactsState = 0;
            console.log("Contacts loaded and displayed.");
		})
        .catch((error) => {
            console.error("Error:", error);
		});
	});
	
    // Event listener for the save database button
    saveDatabaseButton.addEventListener("click", function () {
		manageContacts(0);
		clearForms();
		statesToZero();
        saveDatabase();
	});
	
	// Event listener for the new contact button
    newContactButton.addEventListener("click", function () {
		clearForms();
		if (manageContactsState!=1) { 
			if (newContactState !==1) {
				statesToZero();
				newContactState = 1;
				openNewContactForm();
			} else {
				newContactState = 0;
				clearForms();
			}
		}
	});
	
	// Event listener for the manage contacts button
    manageContactsButton.addEventListener("click", function () {
		clearForms();
		statesToZero();
		manageContactsState = (manageContactsState === 1) ? 0 : 1;
        manageContacts(manageContactsState).then(() => {
			console.log('Visibility toggled successfully!');
		});
	});
	
	// Event listener for the import button
    importButton.addEventListener("click", function () {
		console.log("Importing contacts");
        importContacts()
		.then(() => displayContacts())
		.then(() => manageContacts(1))
		.then(() => {
			console.log("Import completed successfully.");
		})
		.catch((error) => {
			console.error("Error importing contacts:", error);
		});
	});
	
	// Event listener for the export button
    exportButton.addEventListener("click", function () {
		console.log("Exporting selected contacts");
		exportSelectedContacts()
		.then(() => {
			console.log("Export completed successfully.");
		})
		.catch((error) => {
			console.error("Error exporting selected contacts:", error);
		});
	});
	
    // Event listener for the delete button
    deleteButton.addEventListener("click", function () {
        console.log("Deleting selected contacts");
		deleteSelectedContacts()
		.then(() => displayContacts())
		.then(() => manageContacts(1))
		.then(() => {
			console.log("Contacts deletion completed successfully.");
		})
		.catch((error) => {
			console.error("Error exporting selected contacts:", error);
		});
	});
	
	// Function to import contacts
    function importContacts() {
        console.log("Importing contacts");
		return new Promise((resolve, reject) => {
			const fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.accept = ".json";
			fileInput.click();
			
			// Event listener for file selection
			fileInput.addEventListener("change", function () {
				const selectedFile = fileInput.files[0];
				
				if (selectedFile) {
					const reader = new FileReader();
					
					reader.onload = function (event) {
						try {
							const importedContacts = JSON.parse(event.target.result);
							
							// Assign new IDs to imported contacts to avoid duplicates
							const lastContactId = contacts.contacts.reduce((maxId, contact) => Math.max(maxId, contact.id), 0);
							
							// Push each contact individually with a new ID
							importedContacts.contacts.forEach((contact, index) => {
								contacts.contacts.push({
									...contact,
									id: lastContactId + index + 1,
								});
							});
							
							console.log("Contacts imported:", importedContacts);
							resolve();
							} catch (error) {
							console.error("Error parsing JSON:", error);
							alert("Invalid JSON file. Please select a valid .json file.");
							
							// Reject the promise if there is an error
							reject(error);
						}
					};
					
					reader.readAsText(selectedFile);
				}
			});
		});
	}
	
	// Function to export contacts
    function exportSelectedContacts() {
		
		return new Promise((resolve, reject) => {
			// Get all checkboxes
			const checkboxes = document.querySelectorAll('#contactTable input[type="checkbox"]');
			
			// Filter selected checkboxes
			const selectedContacts = Array.from(checkboxes)
			.filter(checkbox => checkbox.checked)
			.map(checkbox => {
				// Get the corresponding contact ID
				const contactId = parseInt(checkbox.closest('tr').getAttribute('data-contact-id'), 10);
				
				// Find the contact in the global variable based on the ID
				const contact = contacts.contacts.find(c => c.id === contactId);
				
				return contact;
			})
			.filter(contact => contact !== undefined); // Remove undefined entries
			
			// Check if any contacts are selected
			if (selectedContacts.length === 0) {
				reject(new Error("No contacts selected for export."));
				return;
			}
			
			// Create a JSON string for selected contacts
			const jsonData = JSON.stringify({ contacts: selectedContacts }, null, 2);
			
			// Create a Blob and download link
			const downloadAnchor = document.createElement("a");
			document.body.appendChild(downloadAnchor);
			const blob = new Blob([jsonData], { type: "application/json" });
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `selected_contacts_${timestamp}.json`;
			
			// Set up the download link
			downloadAnchor.href = URL.createObjectURL(blob);
			downloadAnchor.download = filename;
			downloadAnchor.click();
			
			// Clean up the download link
			document.body.removeChild(downloadAnchor);
			
			console.log("Selected contacts exported:", jsonData);
			resolve();
		});
        // Implement logic for exporting contacts
        console.log("Exporting contacts");
	}
	
	//Function to delete selected contacts
	function deleteSelectedContacts() {
		return new Promise((resolve, reject) => {
			// Get all checkboxes
			const checkboxes = document.querySelectorAll('#contactTable input[type="checkbox"]');
			
			// Filter selected checkboxes
			const selectedContactIds = Array.from(checkboxes)
			.filter(checkbox => checkbox.checked)
			.map(checkbox => parseInt(checkbox.closest('tr').getAttribute('data-contact-id'), 10));
			
			// Check if any contacts are selected
			if (selectedContactIds.length === 0) {
				console.warn("No contacts selected for deletion.");
				resolve(); // Resolve the promise without performing deletion
				return;
			}
			
			try {
				// Remove selected contacts from the global variable
				contacts.contacts = contacts.contacts.filter(contact => !selectedContactIds.includes(contact.id));
				
				// Resolve the promise
				resolve();
				} catch (error) {
				// Reject the promise if there is an error
				reject(error);
			}
		});
	}
	
	// Function to load the database
	function loadDatabase() {
		return new Promise((resolve, reject) => {
			const fileInput = document.createElement("input");
			fileInput.type = "file";
			fileInput.accept = ".json";
			fileInput.click();
			
			fileInput.addEventListener("change", function () {
				const selectedFile = fileInput.files[0];
				
				if (selectedFile) {
					const reader = new FileReader();
					
					reader.onload = function (event) {
						try {
							contacts = JSON.parse(event.target.result);
							console.log("Database loaded:", contacts);
							
							// Resolve the promise when the database is successfully loaded
							resolve();
							} catch (error) {
							console.error("Error parsing JSON:", error);
							alert("Invalid JSON file. Please select a valid .json file.");
							
							// Reject the promise if there is an error
							reject(error);
						}
					};
					
					reader.readAsText(selectedFile);
				}
			});
		});
	}
	
    // Function to save the database
    function saveDatabase() {
		
		// Check if contacts is undefined or null, initialize with an empty contact
        if (!contacts) {
            contacts = { contacts: [] };
		}
		
        const jsonData = JSON.stringify(contacts, null, 2);
		
        const downloadAnchor = document.createElement("a");
        document.body.appendChild(downloadAnchor);
		
        const blob = new Blob([jsonData], { type: "application/json" });
		
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const filename = `database_${timestamp}.json`;
		
        downloadAnchor.href = URL.createObjectURL(blob);
        downloadAnchor.download = filename;
        downloadAnchor.click();
		
        document.body.removeChild(downloadAnchor);
		
        console.log("Database saved:", jsonData);
	}
	
});

// Function to display contacts in the table
function displayContacts(sortOption = 'fullName', dateSortOrder, searchText) {
    return new Promise((resolve) => {
        const contactTable = document.getElementById('contactTable');
        contactTable.innerHTML = '';
		
        // Access the 'contacts' array from the 'contacts' object
        let contactsArray = contacts.contacts || [];
		
		// Filter by search text
        const searchText = searchInput.value.trim().toLowerCase();
        if (searchText) {
            contactsArray = contactsArray.filter((contact) => {
                const nameMatch = contact.fullName.toLowerCase().includes(searchText);
				const groupMatch = contact.contactGroup.toLowerCase().includes(searchText);
                const labelsMatch = contact.labels.some((label) => label.toLowerCase().includes(searchText));
                
				// Check if any note contains the search text
				const notesMatch = contact.notes.some((note) => {
					const noteContent = note.content.toLowerCase();
					return noteContent.includes(searchText);
				});

				return nameMatch || groupMatch || labelsMatch || notesMatch;
			});
		}
		
		// Sort the contacts based on the sorting option
		contactsArray.sort((a, b) => {
            if (sortOption === 'labels') {
                // Sorting by labels requires custom logic
                const labelsA = a[sortOption].join(','); // Convert labels array to a string for comparison
                const labelsB = b[sortOption].join(',');
                return labelsA.localeCompare(labelsB);
				} else if (sortOption === 'date') {
                // Sorting by date
                const dateA = parseDate(a.notes.length > 0 ? a.notes[a.notes.length - 1].date : null);
                const dateB = parseDate(b.notes.length > 0 ? b.notes[b.notes.length - 1].date : null);
				
                if (dateA && dateB) {
                    // Toggle between ascending and descending order for dates
                    return dateSortOrder === 'asc' ? dateA - dateB : dateB - dateA;
					} else if (dateA) {
                    return -1;
					} else if (dateB) {
                    return 1;
					} else {
                    return 0;
				}
				} else {
                // Default sorting for other columns
                return a[sortOption].localeCompare(b[sortOption]);
			}
		});
		
        // Create a table element
        const table = document.createElement('table');
        table.className = 'contactsTable';
		
        // Create the table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['#', 'Name', 'Groups', 'Location', 'URL', 'Email', 'Phone', 'Labels', 'Date'].forEach((columnTitle) => {
            const th = document.createElement('th');
			
			// Attach an event listener to the "Name", "Location" "Groups", "Labels" and "Date" headers for sorting
			if (columnTitle === 'Name' || columnTitle === 'Location' || columnTitle === 'Groups' || columnTitle === 'Labels' || columnTitle === 'Date') {
                
				th.addEventListener('click', function () {
					if (columnTitle === 'Name') {
						displayContacts('fullName');
						} else if (columnTitle === 'Groups') {
							displayContacts('contactGroup');
						} else if (columnTitle === 'Location') {
							displayContacts('contactLocation');
						} else if (columnTitle === 'Labels') {
							displayContacts('labels');
						} else if (columnTitle === 'Date') {
							// Toggle between ascending and descending order for dates
							dateSortOrder = dateSortOrder === 'asc' ? 'desc' : 'asc';
							displayContacts('date', dateSortOrder);
						} else {
							displayContacts(); // Reset sorting for other columns
						}
				});
				th.style.cursor = 'pointer'; // Change cursor to pointer to indicate it's clickable
			}
			
            
            th.textContent = columnTitle;
            headerRow.appendChild(th);
		});
        thead.appendChild(headerRow);
        table.appendChild(thead);
		
        // Create the table body
        const tbody = document.createElement('tbody');
		
		// Create a map to track names and their occurrences
        const nameOccurrences = new Map();
		
        // Populate the table rows with data from the 'contacts' array
        contactsArray.forEach((contact, index) => {
            const row = document.createElement('tr');
			row.setAttribute('data-contact-id', contact.id);
			
			//We check for wildcards in contact notes 
			const wildcardNotesRed = contact.notes.filter(note => note.content.includes('#red'));
			const wildcardNotesOrange = contact.notes.filter(note => note.content.includes('#orange'));
			const wildcardNotesGreen = contact.notes.filter(note => note.content.includes('#green'));
			
            // Add a checkbox column
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.style.margin = 'auto'; // Center the checkbox
			checkbox.style.display = 'none';
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
			
            // Add other columns
			['fullName', 'contactGroup', 'contactLocation', 'urlName', 'emailAddress', 'phoneNumber', 'labels', 'notes'].forEach((column) => {
                const cell = document.createElement('td');
				
                // URL
                if (column === 'urlName') {
                    const urlLink = document.createElement('a');

                    // Check if the urlLink is not empty
                    if (contact.urlLink && contact.urlLink.trim() !== '') {
                        // Check if the urlLink starts with "www"
                        urlLink.href = contact.urlLink.toLowerCase().startsWith('www') ? `https://${contact.urlLink}` : contact.urlLink;
                        urlLink.textContent = contact.urlName;

                        // Open the link in a new tab
                        urlLink.target = '_blank';

                        cell.appendChild(urlLink);
                    }
                }
				
				// EMAIL
				if (column === 'emailAddress') {
					const emailLink = document.createElement('a');
					emailLink.href = 'mailto:' + contact[column];
					emailLink.textContent = contact[column];
					
					// Add an event listener to copy the email address to the clipboard when clicked
					emailLink.addEventListener('click', function (event) {
						event.preventDefault();
						
						// Create a temporary textarea to copy the email address
						const textarea = document.createElement('textarea');
						textarea.value = contact[column];
						document.body.appendChild(textarea);
						textarea.select();
						document.execCommand('copy');
						document.body.removeChild(textarea);
					});
					
					cell.appendChild(emailLink);
				} 
				// NOTES
				if (column === 'notes') {
					// NOTES
					// Assuming 'notes' is an array of objects, display the latest date
					if (contact[column].length > 0) {
						const latestNote = contact[column][contact[column].length - 1];
						const formattedDate = formatDate(latestNote.date);
						cell.textContent = formattedDate;
						} else {
						cell.textContent = ''; // Handle the case when there are no notes
					}
				} 
				// Other columns
				if (column !== 'urlName' && column !== 'emailAddress' && column !== 'notes') {
					// For other columns, simply display the text content
					cell.textContent = contact[column];
				}
				
				// Check for duplicate names and set a class for styling
                if (column === 'fullName') {
                    const name = contact[column];
                    const occurrences = nameOccurrences.get(name) || 0;
                    nameOccurrences.set(name, occurrences + 1);
					
                    if (occurrences > 0) {
                        row.classList.add('duplicate-name');
						console.log("duplicate-name class added");
					}
				}
				
                row.appendChild(cell);
			});
			
			if (wildcardNotesRed.length>0) {
				row.classList.add('redContact');
			} else if (wildcardNotesOrange.length>0) {
				row.classList.add('orangeContact');
			} else if (wildcardNotesGreen.length>0) {
				row.classList.add('greenContact');
			}
			
			
            // Append the row to the table body
            tbody.appendChild(row);
			
			
		});
		
        // Append the table body to the table
        table.appendChild(tbody);
		
        // Append the table to the contactTable div
        contactTable.appendChild(table);
		
		// Add event listener for table rows to show contact details when a name is clicked
		table.addEventListener('click', function (event) {
			const target = event.target;

			// Check if the clicked element is within a table cell (TD) and not the checkbox cell
			if (target.tagName === 'TD' && !target.querySelector('input[type="checkbox"]')) {
				// Find the "Name" column index
				const nameColumnIndex = Array.from(target.parentElement.children).indexOf(target);

				// Check if the click is within the "Name" column
				if (nameColumnIndex === 1) { // Assuming the "Name" column is the second column (index 1)
					const contactId = parseInt(target.parentElement.getAttribute('data-contact-id'), 10);
					
					// Remove the 'selected' class from all rows
					const rows = document.querySelectorAll('.contactsTable tbody tr');
					rows.forEach(row => row.classList.remove('selected'));

					// Add the 'selected' class to the clicked row
					target.parentElement.classList.add('selected');
					
					shownContactID = contactId;
					showContactDetails(contactId);
					showNotes(contactId);
					// We make sure that the edit contact and note forms are hidden when selecting a new name
					clearForms();
				}
			}
		});
		
		// Check if shownContactID is not zero and the corresponding row doesn't have the "selected" class
		if (shownContactID > 0) {
			const selectedRow = document.querySelector(`[data-contact-id="${shownContactID}"]`);
			if (selectedRow && !selectedRow.classList.contains('selected')) {
				selectedRow.classList.add('selected');
			}
		}
		
        // Resolve the promise once contacts are displayed
        resolve();
	});
}

// Function to open the modal
function openModal() {
	if (manageContactsState !==1)  document.getElementById("myModal").style.display = "block";
}

// Function to close the modal
function closeModal() {
  document.getElementById("myModal").style.display = "none";
}

function manageContacts(manageContactsState) {
	return new Promise((resolve) => {
        // Get all checkboxes in the table
        const checkboxes = document.querySelectorAll('#contactTable input[type="checkbox"]');
		const headerCells = document.querySelectorAll('#contactTable th');
		if (manageContactsState==1) {
			
			importButton.style.visibility = 'visible';
			exportButton.style.visibility = 'visible';
			deleteButton.style.visibility = 'visible';
			closeModal();
			
			// Toggle the visibility of checkboxes
			checkboxes.forEach((checkbox) => { checkbox.style.display = 'block'; });
			} else {
			
			importButton.style.visibility = 'hidden';
			exportButton.style.visibility = 'hidden';
			deleteButton.style.visibility = 'hidden';
			
			// Toggle the visibility of checkboxes
			checkboxes.forEach((checkbox) => { checkbox.style.display = 'none'; });
			
		}
        
		
		// Find the # cell and add event listener
        headerCells.forEach((cell, index) => {
            if (cell.textContent.trim() === '#') {
                cell.addEventListener('click', function () {
                    const checkAll = !checkboxes[0].checked; // Check all if none are checked, uncheck all if any are checked
					
                    checkboxes.forEach((checkbox) => {
                        checkbox.checked = checkAll;
					});
				});
			}
		});
		
        // Resolve the promise after toggling visibility
        resolve();
	});
}

// Function to parse date in the format "day/month/year"
function parseDate(dateString) {
    if (!dateString) return null;
	
    const [day, month, year] = dateString.split('/').map(Number);
	
    // Months are 0-based in JavaScript Date object, so subtract 1 from the month
    return new Date(year, month - 1, day);
}

// Helper function to parse date and time string in the format "dd/mm/yyyy hh:mm"
function parseDateTime(dateTimeString) {
    if (!dateTimeString) return null;
	
    const [day, month, year, time] = dateTimeString.split(/[\/\s:]/).map(Number);
	
    // Months are 0-based in JavaScript Date object, so subtract 1 from the month
    return new Date(year, month - 1, day, time);
}

// Function to format date in the format "year/month with three letters/day"
function formatDate(dateString) {
    const date = parseDate(dateString);
	
    if (!date) return null;
	
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'short' }).toUpperCase(); // Get three-letter month abbreviation
    const day = date.getDate();
    const paddedDay = day < 10 ? `0${day}` : day;
	
    return `${year}/${month}/${paddedDay}`;
}

// Function to execute the search based on the entered text
function executeSearch() {
    const searchText = searchInput.value.toLowerCase();
	
    // Call displayContacts with the search text
    displayContacts('fullName', 'asc', searchText);
}

// Function to display contact details in the contactDetails div
function showContactDetails(contactId) {
    // Find the contact in the global variable based on the ID
    const contact = contacts.contacts.find(c => c.id === contactId);

    if (contact) {
		const contactDetails = document.getElementById('contactDetails');
		
		contactDetails.innerHTML = '';
		contactDetails.appendChild(createPersonalInfoDiv(contact));
		openModal();
    }
}

// Function to create the personalInfo div for a contact
function createPersonalInfoDiv(contact) {
    const personalInfoDiv = document.createElement('div');
    personalInfoDiv.className = 'personalInfo';

    // Image element for the picture
    const imgElement = document.createElement('img');
    imgElement.src = contact.picture; // Replace 'url' with the actual property from the contact object
    imgElement.className = 'picStyle';

    // Div for text information
    const infoTextDiv = document.createElement('div');
    infoTextDiv.className = 'infoText';

    // Add h1 element for full name
    const fullNameHeading = document.createElement('h1');
    fullNameHeading.textContent = contact.fullName; // Replace 'John Doe' with the actual property from the contact object

    // Other information elements
    const groupsHeading = createInfoElement('Groups:', 'contactGroup', contact.contactGroup);
    const locationHeading = createInfoElement('Location:', 'contactLocation', contact.contactLocation);
    const emailHeading = createInfoElement('email:', 'emailAddress', contact.emailAddress);
    const phoneHeading = createInfoElement('Phone:', 'phoneNumber', contact.phoneNumber);
    const urlHeading = createInfoElement('URL:', 'urlLink', contact.urlLink);
    const labelsHeading = createInfoElement('Labels:', 'profileLabels', contact.labels.join(', '));

    // Append elements to the div
    infoTextDiv.appendChild(fullNameHeading);
    infoTextDiv.appendChild(groupsHeading);
    infoTextDiv.appendChild(locationHeading);
    infoTextDiv.appendChild(emailHeading);
    infoTextDiv.appendChild(phoneHeading);
    infoTextDiv.appendChild(urlHeading);
    infoTextDiv.appendChild(labelsHeading);

    // Append image and text div to personalInfo div
    personalInfoDiv.appendChild(imgElement);
    personalInfoDiv.appendChild(infoTextDiv);

    return personalInfoDiv;
}

// Helper function to create information elements
function createInfoElement(headingText, elementId, content) {
    const containerDiv = document.createElement('div'); // Create a container div

    const heading = document.createElement('h2');
    heading.textContent = headingText;
	containerDiv.appendChild(heading);
	
	if (headingText == 'email:') {
		const emailLink = document.createElement('a');
		emailLink.href = 'mailto:' + content;
		emailLink.textContent = content;
		
		// Add an event listener to copy the email address to the clipboard when clicked
		emailLink.addEventListener('click', function (event) {
			event.preventDefault();
			
			// Create a temporary textarea to copy the email address
			const textarea = document.createElement('textarea');
			textarea.value = content;
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			document.body.removeChild(textarea);
		});
		containerDiv.appendChild(emailLink);
	} else if (headingText == 'URL:') {
		const urlLink = document.createElement('a');

        // Check if the urlLink is not empty
        if (content && content.trim() !== '') {
            // Check if the urlLink starts with "www"
            urlLink.href = content.toLowerCase().startsWith('www') ? `https://${content}` : content;
            urlLink.textContent = content;

            // Open the link in a new tab
            urlLink.target = '_blank';

            containerDiv.appendChild(urlLink);
        }
	} else {
		const paragraph = document.createElement('p');
		paragraph.id = elementId;
		paragraph.textContent = content;
		containerDiv.appendChild(paragraph);
	}

    return containerDiv; // Return the container div
}

// Function to display notes in the modal
function showNotes(contactId) {
    // Find the contact in the global variable based on the ID
    const contact = contacts.contacts.find(c => c.id === contactId);

    if (contact) {
        // Parse dates and sort notes by descending date
        contact.notes.sort((a, b) => parseDate(b.date) - parseDate(a.date));

        // Move notes with wildcard "#!" to the beginning
        const wildcardNotes = contact.notes.filter(note => note.content.includes('#!'));
        const otherNotes = contact.notes.filter(note => !note.content.includes('#!'));

        // Get the number of notes in wildcardNotes
        const numberOfWildcardNotes = wildcardNotes.length;

        contact.notes = wildcardNotes.concat(otherNotes);

        // Access the modalContent div
        const modalContent = document.getElementById('modalContent');
		
		const newNoteDiv = document.getElementById('newNoteDiv');
		newNoteDiv.innerHTML = '';

        // Check if the contact has any notes
        if (contact.notes.length > 0) {
            // Loop through the notes and create elements for each
            contact.notes.forEach((note, index) => {
                // Create a note div for each note in the modal
                const noteDiv = document.createElement('div');

                // Check if the index is less than or equal to the number of notes with "#!"
                if (index < wildcardNotes.length) {
                    noteDiv.className = 'newImportantNote';
                } else {
                    noteDiv.className = 'newNote';
                }

                // Check if the note content contains the wildcard #X
                if (note.content.includes('#X')) {
                    // If the wildcard is present, set display: none in CSS
                    noteDiv.classList.add('hiddenNote');
                }

                // Add elements for date, time, and content
                const dateHeading = createInfoElement('Date:', `noteDate${index}`, formatDate(note.date));
                const timeHeading = createInfoElement('Time:', `noteTime${index}`, note.time);

                // Process note content to create links for URLs
                const contentContainer = processNoteContent(note.content);

                // Create a delete button
                const deleteButton = document.createElement('button');
                deleteButton.className = 'deleteButton';
                deleteButton.innerHTML = '&#10006;'; // "X" icon as HTML entity

                // Add event listener to delete the note when the button is clicked
                deleteButton.addEventListener('click', function () {
                    deleteNote(contactId, index);
                });

                // Append elements to the note div
                noteDiv.appendChild(dateHeading);
                noteDiv.appendChild(timeHeading);
                const noteCont = document.createElement('div');
                noteCont.className = 'noteContent';
                noteCont.appendChild(contentContainer);
                noteDiv.appendChild(noteCont);
                noteDiv.appendChild(deleteButton);

                // Append note div to notes container
				newNoteDiv.appendChild(noteDiv);
            });
        } else {
            // Display a message if there are no notes
            const noNotesMessage = document.createElement('p');
            noNotesMessage.textContent = 'No notes available for this contact.';
			newNoteDiv.appendChild(noNotesMessage);
        }
		
		newNoteDiv.style = 'block';
        // Append notes container to modalContent div
		modalContent.appendChild(newNoteDiv);
    }
}

// Helper function to process note content and create links for URLs
function processNoteContent(content) {
	
	// Remove wildcards "#!" and "#X" from the content
    content = content.replace(/#!|#X/g, '');
	
    // Use a regular expression to find URLs in the note content
	const urlRegex = /(https:\/\/www\.[^\s]+)|(http:\/\/www\.[^\s]+)|(www\.[^\s]+)/g;
	

    const container = document.createElement('div'); // Create a container div

    // Split the note content into parts based on URLs and line breaks
	content.split(/(?:\r\n|\r|\n)/g).forEach((lineBreakPart, index) => {
		// Use a regular expression to find URLs in each lineBreakPart
		lineBreakPart.split(urlRegex).forEach((urlPart, indexURL) => {
			if (urlRegex.test(urlPart)) {
				// Create a link element for URLs
				const link = document.createElement('a');
				link.href = /^(https?:\/\/|www\.)/.test(urlPart) ? (urlPart.startsWith('www.') ? `http://${urlPart}` : urlPart) : `http://www.${urlPart}`;
				link.target = '_blank';
				link.textContent = urlPart;

				// Append the link to the container div
				container.appendChild(link);
			} else {
				// Create a paragraph element for non-URL parts
				const paragraph = document.createElement('p');
				paragraph.textContent = urlPart;

				// Append the paragraph to the container div
				container.appendChild(paragraph);
			}
		});

		// Add a <br> element after each line break
		if (index < content.split(/(?:\r\n|\r|\n)/g).length - 1) {
			container.appendChild(document.createElement('br'));
		}
	});

    return container; // Return the container div containing the note content
}

// Function to delete a note with confirmation
function deleteNote(contactId, noteIndex) {
    // Find the contact in the global variable based on the ID
    const contact = contacts.contacts.find(c => c.id === contactId);

    // Check if the contact exists and the note index is valid
    if (contact && noteIndex >= 0 && noteIndex < contact.notes.length) {
        // Ask for confirmation before deleting the note
        const confirmation = window.confirm('Are you sure you want to delete this note?');

        if (confirmation) {
            // Remove the note from the contact's notes array
            contact.notes.splice(noteIndex, 1);

            // Update the UI to reflect the changes
            showNotes(contactId);
        }
    }
}

// Function to open a new note form
function openNewNoteForm() {
	
	const newNoteForm = document.getElementById('newNoteForm');
    // Create a form element
    const noteForm = document.createElement('form');
    noteForm.className = 'newNoteForm';

    // Add input fields and dropdown
    noteForm.innerHTML = `
        <label for="noteDate">Date:</label>
        <input type="text" id="noteDate" value="${getCurrentDate()}" readonly>

		<p></p>
        <label for="noteTime">Time:</label>
        <input type="text" id="noteTime" value="${getCurrentTime()}" readonly>

		<p></p>
        <label for="noteWildcard">Wildcard:</label>
        <select id="noteWildcard">
			<option value="" selected>No Wildcard</option>
            <option value="#">Hide note</option>
            <option value="#!">Important note</option>
            <option value="#red">Red contact</option>
            <option value="#orange">Orange contact</option>
            <option value="#green">Green contact</option>
        </select>
		
		<p></p>
        <label for="noteText">Text:</label>
        <textarea id="noteText" rows="10" class="noteText"></textarea>
		<p></p>
        <button type="button" onclick="addNote()">Add Note</button>
    `;

    // Append the form to the body or another container of your choice
	newNoteForm.appendChild(noteForm);
	newNoteForm.style.display = 'block';
}

// Helper function to get the current date in the format dd/mm/yyyy
function getCurrentDate() {
    const currentDate = new Date();
    const day = currentDate.getDate().toString().padStart(2, '0');
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = currentDate.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function to get the current time in the format hh:mm
function getCurrentTime() {
    const currentTime = new Date();
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Funtion to add a new note
function addNote() {
    // Get values from the form
    const noteDate = document.getElementById('noteDate').value;
    const noteTime = document.getElementById('noteTime').value;
    const noteWildcard = document.getElementById('noteWildcard').value;
    const noteText = document.getElementById('noteText').value;

    // Create a note object
    const newNote = {
        date: noteDate,
        time: noteTime,
        content: `${noteWildcard} ${noteText}`
    };

    // Add the note to the contact's notes array (replace contactId with the actual ID)
    const contact = contacts.contacts.find(c => c.id === shownContactID);
    if (contact) {
        contact.notes.push(newNote);
        // You might want to update your UI here to reflect the new note
        // For example, you can call your displayContacts function to refresh the displayed contacts
        displayContacts();
		showNotes(shownContactID);
		
		// Add the 'selected' class to the row
		const selectedRow = document.querySelector(`[data-contact-id="${contact.id}"]`);
		if (selectedRow) {
			selectedRow.classList.add('selected');
		}
    }

    // Remove the form after adding the note
	clearForms();
	statesToZero();
}

// Function to open a new contact form
function openNewContactForm() {
    const newContactForm = document.getElementById('newContactForm');
    // Create a form element
    const contactForm = document.createElement('form');
    contactForm.className = 'newContactForm';

    // Add input fields
    contactForm.innerHTML = `
        <label for="contactPicture">Profile Picture (URL):</label>
        <input type="text" id="contactPicture">

		<p></p>
        <label for="contactFullName">Full Name:</label>
        <input type="text" id="contactFullName" required>

		<p></p>
        <label for="contactGroup">Contact Group:</label>
        <input type="text" id="contactGroup">

		<p></p>
        <label for="contactLocation">Contact Location:</label>
        <input type="text" id="contactLocation">

		<p></p>
        <label for="contactEmailAddress">Email Address:</label>
        <input type="email" id="contactEmailAddress">

		<p></p>
        <label for="contactPhoneNumber">Phone Number:</label>
        <input type="tel" id="contactPhoneNumber">

		<p></p>
        <label for="contactUrlName">URL Name:</label>
        <input type="text" id="contactUrlName">

		<p></p>
        <label for="contactUrlLink">URL Link:</label>
        <input type="url" id="contactUrlLink">

		<p></p>
        <label for="contactLabels">Labels (comma-separated):</label>
        <input type="text" id="contactLabels">
		
		<p></p>
		<label for="contactJson">Contact Details (JSON):</label>
        <textarea id="contactJson"></textarea>

		<p></p>
        <button type="button" onclick="addContact()">Add Contact</button>
    `;

    // Append the form to the body or another container of your choice
    newContactForm.appendChild(contactForm);
    newContactForm.style.display = 'block';
}

// Function to add a new contact
function addContact() {
	// Get values from the form
    const contactJsonInput = document.getElementById('contactJson').value;
    
    // Check if JSON input is provided
    if (contactJsonInput.trim() !== '') {
        try {
            // Parse the JSON input
            const newContact = JSON.parse(contactJsonInput);

            // Copy values to each form field
            document.getElementById('contactPicture').value = newContact.picture || '';
            document.getElementById('contactFullName').value = newContact.fullName || '';
            document.getElementById('contactGroup').value = newContact.contactGroup || '';
            document.getElementById('contactLocation').value = newContact.contactLocation || '';
            document.getElementById('contactEmailAddress').value = newContact.emailAddress || '';
            document.getElementById('contactPhoneNumber').value = newContact.phoneNumber || '';
            document.getElementById('contactUrlName').value = newContact.urlName || '';
            document.getElementById('contactUrlLink').value = newContact.urlLink || '';
            document.getElementById('contactLabels').value = newContact.labels ? newContact.labels.join(', ') : '';
			document.getElementById('contactJson').value = '';

        } catch (error) {
            console.error('Error parsing JSON:', error);
            // Handle parsing error, e.g., show an error message to the user
        }
    } else {
		// Get values from the form
		const contactPicture = document.getElementById('contactPicture').value;
		const contactFullName = document.getElementById('contactFullName').value;
		const contactGroup = document.getElementById('contactGroup').value;
		const contactLocation = document.getElementById('contactLocation').value;
		const contactEmailAddress = document.getElementById('contactEmailAddress').value;
		const contactPhoneNumber = document.getElementById('contactPhoneNumber').value;
		const contactUrlName = document.getElementById('contactUrlName').value;
		const contactUrlLink = document.getElementById('contactUrlLink').value;
		const contactLabelsInput = document.getElementById('contactLabels').value;
		const contactLabels = contactLabelsInput.split(',').map(label => label.trim());

		// Create a contact object
		const newContact = {
			id: generateContactId(),
			// controlTag: [],  //TO BE IMPLEMENTED IN THE FUTURE
			type: "contact",
			picture: contactPicture,
			fullName: contactFullName,
			contactGroup: contactGroup,
			contactLocation: contactLocation,
			emailAddress: contactEmailAddress,
			phoneNumber: contactPhoneNumber,
			urlName: contactUrlName,
			urlLink: contactUrlLink,
			labels: contactLabels,
			notes: [] // Initialize notes as an empty array
		};

		// Add the contact to the contacts array
		contacts.contacts.push(newContact);

		// You might want to update your UI here to reflect the new contact
		// For example, you can call your displayContacts function to refresh the displayed contacts
		displayContacts();
		manageContactsButton.style.visibility = "visible";
		searchDialog.style.display = "block";
		
		// Remove the form after adding the contact
		clearForms();
	}
}

// Helper function to generate a unique contact ID
function generateContactId() {
    // Check if there are any existing contacts
    if (contacts && contacts.contacts && contacts.contacts.length > 0) {
        // Get the maximum existing contact ID
        const lastContactId = contacts.contacts.reduce((maxId, contact) => Math.max(maxId, contact.id), 0);

        // Assign a new ID as the maximum ID + 1
        return lastContactId + 1;
    } else {
        // If there are no existing contacts, start with an ID of 1
        return 1;
    }
}

// Function to open the edit contact form
function openEditContactForm() {
    // Get the selected contact
    const selectedContact = getSelectedContact();

    // Check if a contact is selected
    if (selectedContact) {
        // Create a form element
        const editContactForm = document.createElement("form");
        editContactForm.className = "editContactForm";

        // Add input fields and dropdown for editing contact information
        editContactForm.innerHTML = `
		
		<p></p>
            <label for="editPictureURL">Profile Picture (URL):</label>
            <input type="text" id="editPictureURL" value="${selectedContact.picture}">
		
		<p></p>
            <label for="editFullName">Full Name:</label>
            <input type="text" id="editFullName" value="${selectedContact.fullName}">

		<p></p>
            <label for="editContactGroup">Contact Group:</label>
            <input type="text" id="editContactGroup" value="${selectedContact.contactGroup}">

		<p></p>
            <label for="editContactLocation">Contact Location:</label>
            <input type="text" id="editContactLocation" value="${selectedContact.contactLocation}">

		<p></p>
            <label for="editEmailAddress">Email Address:</label>
            <input type="text" id="editEmailAddress" value="${selectedContact.emailAddress}">

		<p></p>
            <label for="editPhoneNumber">Phone Number:</label>
            <input type="text" id="editPhoneNumber" value="${selectedContact.phoneNumber}">

		<p></p>
            <label for="editUrlName">URL Name:</label>
            <input type="text" id="editUrlName" value="${selectedContact.urlName}">

		<p></p>
            <label for="editUrlLink">URL Link:</label>
            <input type="text" id="editUrlLink" value="${selectedContact.urlLink}">

		<p></p>
            <label for="editLabels">Labels:</label>
            <input type="text" id="editLabels" value="${selectedContact.labels.join(", ")}">

		<p></p>
            <button type="button" onclick="saveEditedContact(${selectedContact.id})">Save Changes</button>
        `;

        // Append the form to the body or another container of your choice
        const editContactFormContainer = document.getElementById("editContactForm");
        editContactFormContainer.innerHTML = ''; // Clear previous form content
        editContactFormContainer.appendChild(editContactForm);
        editContactFormContainer.style.display = 'block';
    } else {
        alert("Please select a contact to edit.");
    }
}

// Function to save the edited contact
function saveEditedContact(contactId) {
    // Find the selected contact in the contacts array
    const selectedContact = contacts.contacts.find(contact => contact.id === contactId);

    // Check if the contact is found
    if (selectedContact) {
        // Update contact information based on the form input values
		selectedContact.picture = document.getElementById("editPictureURL").value;
        selectedContact.fullName = document.getElementById("editFullName").value;
        selectedContact.contactGroup = document.getElementById("editContactGroup").value;
        selectedContact.contactLocation = document.getElementById("editContactLocation").value;
        selectedContact.emailAddress = document.getElementById("editEmailAddress").value;
        selectedContact.phoneNumber = document.getElementById("editPhoneNumber").value;
        selectedContact.urlName = document.getElementById("editUrlName").value;
        selectedContact.urlLink = document.getElementById("editUrlLink").value;
        selectedContact.labels = document.getElementById("editLabels").value.split(", ").map(label => label.trim());

		// Hide the edit contact form after saving changes
		clearForms();
		statesToZero();
		
        displayContacts();
		showContactDetails(shownContactID);
		
    } else {
        alert("Contact not found.");
    }
}

// Function to get the selected contact based on shownContactID
function getSelectedContact() {
    // Find the selected contact in the contacts array
    const selectedContact = contacts.contacts.find(contact => contact.id === shownContactID);

    return selectedContact;
}

function statesToZero() {
	newNoteState = 0;
	newContactState = 0;
	editContactState = 0;
}

function clearForms() {
	
	const editContactFormContainer = document.getElementById("editContactForm");
	if (editContactFormContainer) {
		editContactFormContainer.innerHTML = ''; // Clear the form content
		editContactFormContainer.style.display = 'none';
	}
	
	// Remove the notes form
    const noteForm = document.querySelector('.newNoteForm');
    if (noteForm) {
		noteForm.innerHTML = '';
		noteForm.style.display = "none";
    }
	
	// Remove the add new contacts form
    const contactForm = document.querySelector('.newContactForm');
    if (contactForm) {
        contactForm.innerHTML = '';
        contactForm.style.display = 'none';
    }
}