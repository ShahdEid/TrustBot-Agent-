const messages = document.getElementById('messages');
const userInput = document.getElementById('user-input');

function sendMessage() {
    const message = userInput.value.trim().toLowerCase();

    if (message === '') return; // Don't send empty messages

    // Display user message
    const userMessageLi = document.createElement('li');
    userMessageLi.textContent = userInput.value;  // Display the original message (not converted to lowercase)
    userMessageLi.className = 'user-message';
    messages.appendChild(userMessageLi);

    // Scroll to bottom after user input is added
    messages.scrollTop = messages.scrollHeight;

    // Clear the input field
    userInput.value = '';

    if (message.includes('find') && message.includes('gym')) {
        getLocationAndSend('Gym');
    } else if (message.includes('find') && message.includes('cafe')) {
        getLocationAndSend('Cafe');
    } else if (message.includes('find') && message.includes('library')) {
        getLocationAndSend('Library');
    } else {
        sendToDialogflow(message);
    }
}

function getLocationAndSend(type) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;

            fetch(`${window.location.origin}/upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, lat, long })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Received data:', data); // Check what is being received
                if (data.places && data.places.length > 0) {
                    // Format the response to show places
                    const placesText = data.places.map(place => `${place.name} - ${place.address}`).join('\n');
                    displayMessage(`Here are some nearby ${type}s:\n${placesText}`);
                } else {
                    displayMessage("Sorry, I couldn't find any results.");
                }
            })
            .catch(error => {
                console.error('Error:', error);
                displayMessage("Error getting location.");
            });

        }, error => {
            console.error('Error getting location:', error);
            displayMessage("Error getting location. Please make sure location services are enabled.");
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function sendToDialogflow(message) {
    fetch(`${window.location.origin}/api/message`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Received data:', data);
        if (data.fulfillmentText) {
            displayMessage(data.fulfillmentText);
        } else {
            console.error("Dialogflow response does not contain fulfillment text.");
            displayMessage("Sorry, something went wrong.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    });
}

function displayMessage(text) {
    const messageLi = document.createElement('li');
    
    // If the text contains a list of places, format it as a bulleted list
    if (text.startsWith("Here are some nearby")) {
        const parts = text.split(":\n");
        const title = parts[0];
        const places = parts[1].split("\n");
        
        // Create the title part
        const titleElement = document.createElement('strong');
        titleElement.textContent = title;
        messageLi.appendChild(titleElement);
        
        // Create the list
        const ul = document.createElement('ul');
        places.forEach(place => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${place.split(" - ")[0]}</strong> - ${place.split(" - ")[1]}`;
            ul.appendChild(li);
        });
        messageLi.appendChild(ul);
    } else {
        // Regular message
        messageLi.textContent = text;
    }
    
    messageLi.className = 'bot-message';
    messages.appendChild(messageLi);
    messages.scrollTop = messages.scrollHeight;
}
// Get the modal, button, and close elements
var modal = document.getElementById('aboutModal');
var btn = document.getElementById('aboutBtn');
var span = document.getElementsByClassName('close')[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
    modal.style.display = 'block';
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = 'none';
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


// Listen for Enter key press
userInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
