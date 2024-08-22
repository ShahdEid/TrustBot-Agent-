// var recognizing = false;
// var recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// recognition.lang = 'en-US';
// recognition.interimResults = false;
// recognition.maxAlternatives = 1;

// document.getElementById('start-record-btn').addEventListener('click', function() {
//     if (recognizing) {
//         recognition.stop();
//         return;
//     }
//     recognition.start();
//     recognizing = true;
// });

// document.getElementById('stop-record-btn').addEventListener('click', function() {
//     recognition.stop();
// });

// const messages = document.getElementById('messages');
// const userInput = document.getElementById('user-input');
// const fileInput = document.getElementById('file-input');

// function sendMessage() {
//     const message = userInput.value.trim();
//     const file = fileInput.files[0];

//     if (message) {
//         displayMessage(`${message} 😊`, 'user-message');
        
//         if (message.toLowerCase().includes('find') && message.toLowerCase().includes('gym')) {
//             getLocationAndSend('Gym');
//         } else if (message.toLowerCase().includes('find') && message.toLowerCase().includes('cafe')) {
//             getLocationAndSend('Cafe');
//         } else if (message.toLowerCase().includes('find') && message.toLowerCase().includes('library')) {
//             getLocationAndSend('Library');
//         } else {
//             sendTextMessage(message);
//         }
        
//         userInput.value = ''; // Clear the input field
//     }

//     if (file) {
//         displayMessage(`You uploaded a file: ${file.name}`, 'user-message');
//         uploadFile(file);
//         fileInput.value = ''; // Clear the file input
//     }
// }

// function getLocationAndSend(type) {
//     if (navigator.geolocation) {
//         navigator.geolocation.getCurrentPosition(position => {
//             const lat = position.coords.latitude;
//             const long = position.coords.longitude;

//             fetch('http://localhost:3000/api/location', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify({ type, lat, long })
//             })
//             .then(response => response.json())
//             .then(data => {
//                 console.log('Received data:', data);
//                 if (data.places && data.places.length > 0) {
//                     const responseText = data.places.map(place => `<strong>${place.name}</strong> - ${place.address}`).join('<br>');
//                     displayMessage(`Here are some nearby ${type}s:<br>${responseText}`, 'bot-message');
//                 } else {
//                     displayMessage("Sorry, I couldn't find any results.", 'bot-message');
//                 }
//             })
//             .catch(error => {
//                 console.error('Error:', error);
//                 displayMessage("Error getting location.", 'bot-message');
//             });

//         }, error => {
//             console.error('Error getting location:', error);
//             displayMessage("Error getting location. Please make sure location services are enabled.", 'bot-message');
//         });
//     } else {
//         alert('Geolocation is not supported by this browser.');
//     }
// }
// function sendTextMessage(message) {
//     console.log("Sending message to server:", message);
//     fetch('http://localhost:3000/api/message', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ message })
//     })
//     .then(response => response.json())
//     .then(data => {
//         if (data.fulfillmentText) {
//             displayMessage(`${data.fulfillmentText} 🤖`, 'bot-message');

//            // Play the bot response with female voice
//            var utterance = new SpeechSynthesisUtterance(data.fulfillmentText);
            
//            // Get all voices and find a female one
//            var voices = speechSynthesis.getVoices();
//            var femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('woman'));
           
//            // Fallback to the first available voice if no female voice is found
//            utterance.voice = femaleVoice || voices[0];
           
//             window.speechSynthesis.speak(utterance);
//         } else {
//             console.error("Server response does not contain fulfillment text.");
//         }
//     })
//     .catch(error => {
//         console.error('Error:', error);
//         displayMessage(`Error: ${error.message}`, 'bot-message');
//     });
// }


// function uploadFile(file) {
//     const formData = new FormData();
//     formData.append('file', file);

//     console.log("Uploading file:", file.name);
//     fetch('http://localhost:3000/upload', {
//         method: 'POST',
//         body: formData
//     })
//     .then(response => response.json())
//     .then(data => {
//         console.log("File processed:", data);
//         displayMessage(` ${data.message}`, 'bot-message'); //  confirmation

//         //if there is extracted text and display it
//         if (data.text) {
//             displayMessage(`Extracted Text: <strong>${data.text}</strong>`, 'bot-message'); // Display extracted text
//             displayMessage(" Document processed. Let me know if you need anything else!", 'bot-message');
//         }
//     })
//     .catch(error => {
//         console.error('Upload error:', error);
//         displayMessage(`Upload error: ${error.message}`, 'bot-message');
//     });
// }



// function displayMessage(text, className) {
//     const messageLi = document.createElement('li');
//     messageLi.innerHTML = text;  // Use innerHTML to render HTML content
//     messageLi.className = className;
//     messages.appendChild(messageLi);
//     messages.scrollTop = messages.scrollHeight;
// }


// // voice recognition results
// recognition.onresult = function(event) {
//     var speechResult = event.results[0][0].transcript;
//     console.log('Speech received: ' + speechResult);
//     userInput.value = speechResult;
//     sendMessage();
// };

// recognition.onerror = function(event) {
//     console.error('Speech recognition error detected: ' + event.error);
// };

// recognition.onend = function() {
//     recognizing = false;
// };

// // Listen for Enter key press
// userInput.addEventListener('keypress', function(e) {
//     if (e.key === 'Enter') {
//         sendMessage();
//     }
// });
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

const messages = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const fileInput = document.getElementById('file-input');

let isFirstGreeting = true;  // To track if the first greeting has been sent

function sendMessage() {
    const message = userInput.value.trim();
    const file = fileInput.files[0];

    if (message) {
        // Check if the message is a greeting
        if (isFirstGreeting && message.toLowerCase() === 'hi') {
            displayMessage(`${message} 😊`, 'user-message');
            isFirstGreeting = false;
        } else {
            displayMessage(message, 'user-message');
        }

        // Handle specific actions or send the message to the server
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
           
            const botMessage = isFirstGreeting ? `${data.fulfillmentText} 🤖` : data.fulfillmentText;
            displayMessage(botMessage, 'bot-message');

           // Play the bot response with female voice
           var utterance = new SpeechSynthesisUtterance(data.fulfillmentText);
            
           // Get all voices and find a female one
           var voices = speechSynthesis.getVoices();
           var femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('woman'));
           
           // Fallback to the first available voice if no female voice is found
           utterance.voice = femaleVoice || voices[0];
           
           window.speechSynthesis.speak(utterance);
        } else {
            console.error("Server response does not contain fulfillment text.");
        }
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage(`Error: ${error.message}`, 'bot-message');
    });
}

// The rest of your existing code (e.g., uploadFile, displayMessage, etc.) remains unchanged

function displayMessage(text, className) {
    const messageLi = document.createElement('li');
    messageLi.innerHTML = text;  // Use innerHTML to render HTML content
    messageLi.className = className;
    messages.appendChild(messageLi);
    messages.scrollTop = messages.scrollHeight;
}


// voice recognition results
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
// Get the modal
var modal = document.getElementById("aboutModal");

// Get the button that opens the modal
var btn = document.getElementById("aboutBtn");

// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];

//  open the modal 
btn.onclick = function() {
    modal.style.display = "block";
}

//  close the modal
span.onclick = function() {
    modal.style.display = "none";
}

// close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// Listen for Enter key press
userInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
