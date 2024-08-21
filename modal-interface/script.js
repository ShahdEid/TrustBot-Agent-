const messages = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');

function getLocationAndSend(type) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const long = position.coords.longitude;

            fetch(`${window.location.origin}/api/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type, lat, long })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Received data:', data); 
                if (data.places && data.places.length > 0) {
                    const responseText = data.places.map(place => `<strong>${place.name}</strong> - ${place.address}`).join('<br>');
                    displayMessage(`Here are some nearby ${type}s:<br>${responseText}`, 'bot-message');
                } else {
                    displayMessage("Sorry, I couldn't find any results.", 'bot-message');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                displayMessage("Error getting location.", 'bot-message');
            });

        }, error => {
            console.error('Error getting location:', error);
            displayMessage("Error getting location. Please make sure location services are enabled.", 'bot-message');
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

function sendMessage() {
    const message = userInput.value.trim();
    const file = fileInput ? fileInput.files[0] : null;

    if (message) {
        displayMessage(`${message} 😊`, 'user-message');
        
        if (message.toLowerCase().includes('find') && message.toLowerCase().includes('gym')) {
            getLocationAndSend('Gym');
        } else if (message.toLowerCase().includes('find') && message.toLowerCase().includes('cafe')) {
            getLocationAndSend('Cafe');
        } else if (message.toLowerCase().includes('find') && message.toLowerCase().includes('library')) {
            getLocationAndSend('Library');
        } else {
            sendTextMessage(message);
        }
        
        userInput.value = ''; // Clear the input field
    }

    if (file) {
        displayMessage(`You uploaded a file: ${file.name}`, 'user-message');
        uploadFile(file);
        fileInput.value = ''; // Clear the file input
    }
}




function sendTextMessage(message) {
    console.log("Sending message to server:", message);
    fetch(`${window.location.origin}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.fulfillmentText) {
            displayMessage(`Bot: ${data.fulfillmentText} 🤖`, 'bot-message');
            speakText(data.fulfillmentText); // Speak the bot's response
        } else {
            console.error("Server response does not contain fulfillment text.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage(`Error: ${error.message}`, 'bot-message');
    });
}

function uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    console.log("Uploading file:", file.name);
    fetch(`${window.location.origin}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        console.log("File processed:", data);
        if (data.text) {
            displayMessage(`Extracted Text: ${data.text}`, 'bot-message');
            speakText(data.text); // Speak the extracted text
        } else {
            displayMessage(`Bot: ${data.message}`, 'bot-message'); // Upload confirmation
        }
    })
    .catch(error => {
        console.error('Upload error:', error);
        displayMessage(`Upload error: ${error.message}`, 'bot-message');
    });
}

function speakText(text) {
    var utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('Google UK English Female')) || speechSynthesis.getVoices()[0];
    window.speechSynthesis.speak(utterance);
}

function displayMessage(text, className) {
    const messageLi = document.createElement('li');
    messageLi.innerHTML = text;  // Use innerHTML to render HTML content
    messageLi.className = className;
    messages.appendChild(messageLi);
    messages.scrollTop = messages.scrollHeight;
}


var recognizing = false;
var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

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

function openModal() {
    var modal = document.getElementById('myModal');
    modal.style.display = 'flex';
    modal.style.opacity = '1';
}

function closeModal() {
    var modal = document.getElementById('myModal');
    modal.style.opacity = '0';
    setTimeout(() => modal.style.display = 'none', 250);
}

// Event handler for the Enter key
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});
