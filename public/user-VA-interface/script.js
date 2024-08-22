document.getElementById('start-record-btn').addEventListener('click', function() {
    if (recognizing) {
        recognition.stop();
        return;
    }
    recognition.start();
    recognizing = true;
});

document.getElementById('stop-record-btn').addEventListener('click', function() {
    recognition.stop();
});

document.getElementById('send-btn').addEventListener('click', sendMessage);

const messages = document.getElementById('messages');
const userInput = document.getElementById('user-input');

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
                    const responseText = data.places.map(place => `<strong>${place.name}</strong> - ${place.address}`).join('<br>');
                    displayMessage(`Here are some nearby ${type}s:<br>${responseText}`, 'bot-message');
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
function sendMessage() {
    const message = userInput.value.trim();
    if (message === '') return;

    // Display user message
    const userMessageDiv = document.createElement('div');
    userMessageDiv.textContent = message;
    userMessageDiv.className = 'user-message';
    messages.appendChild(userMessageDiv);

    // Clear input
    userInput.value = '';

    if (message.toLowerCase().includes('find') && (message.toLowerCase().includes('gym') || message.toLowerCase().includes('cafe') || message.toLowerCase().includes('library'))) {
        // If the user is looking for a place, handle it with location
        const type = message.toLowerCase().includes('gym') ? 'Gym' :
                     message.toLowerCase().includes('cafe') ? 'Cafe' : 'Library';
        getLocationAndSend(type);
    } else {
        // Otherwise, send the message to Dialogflow
        sendToDialogflow(message);
    }
}

let isFirstBotMessage = true; // Flag to check if it's the first bot message

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
        if (data.fulfillmentText) {
            const botMessage = data.fulfillmentText;
            const botMessageDiv = document.createElement('div');
            
            if (isFirstBotMessage) {
                botMessageDiv.className = 'bot-message-greeting'; // Apply special class for the first message
                isFirstBotMessage = false; // Reset the flag after the first message
            } else {
                botMessageDiv.className = 'bot-message'; // Apply regular class for other messages
            }
            
            botMessageDiv.textContent = botMessage;
            messages.appendChild(botMessageDiv);

            // Play the bot response
            var utterance = new SpeechSynthesisUtterance(botMessage);
            window.speechSynthesis.speak(utterance);

            // Scroll to bottom
            messages.scrollTop = messages.scrollHeight;
        } else {
            console.error("Dialogflow response does not contain fulfillment text.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    });
}
// Function to display messages in the chat
function displayMessage(text, className = 'bot-message') {
    const messageLi = document.createElement('li');
    messageLi.innerHTML = text;  // Use innerHTML to render HTML content
    messageLi.className = className;
    messages.appendChild(messageLi);
    messages.scrollTop = messages.scrollHeight;
}


// Voice recognition setup
var recognizing = false;
var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

recognition.onresult = function(event) {
    var speechResult = event.results[0][0].transcript;
    console.log('Speech received: ' + speechResult);
    userInput.value = speechResult;
    sendMessage();
};

recognition.onerror = function(event) {
    console.error('Speech recognition error detected: ' + event.error);
};

recognition.onend = function() {
    recognizing = false;
};


// Get the modal, button, and close elements
var modal = document.getElementById('aboutModal');
var btn = document.getElementById('aboutBtn');
var span = document.getElementsByClassName('close')[0];

// When the user clicks the button, open the modal 
btn.onclick = function() {
    modal.style.display = 'flex';
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
window.onload = function() {
    modal.style.display = 'none'; // Ensure the modal is hidden on load
};


// Enter key event handler
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});