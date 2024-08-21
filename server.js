const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(cors({
    origin: '*',  // Allow requests from all origins. 
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// parsing JSON and urlencoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Homepage.html')); // Adjust the path to your HTML file
});
// Google auth
const auth = new GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
});

// async function fetchNearbyPlaces(location, lat, long) {
//       // Validate incoming parameters
//     if (!location || !lat || !long) {
//         console.error('Missing required location data:', { location, lat, long });
//         throw new Error('Missing required location data.');
//     }
   
//     const apiKey = process.env.GOOGLE_MAPS_API_KEY; // ensure your API key is set in environment variables
//     const radius = 1500; // Define the search radius in meters

//     const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${long}&radius=${radius}&type=${location}&key=${apiKey}`;

//     const response = await axios.get(url);
//     return response.data.results.map(place => ({
//         name: place.name,
//         address: place.vicinity
//     }));
// }

// Updated fetchNearbyPlaces function
async function fetchNearbyPlaces(type, lat, long) {
    console.log('Fetching places for type:', type, 'at', lat, long);  // Log inputs
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const radius = 1500; // Define the search radius in meters

    // Ensure that the type is correctly mapped to a Google Places API type
    const placeTypeMapping = {
        'Gym': 'gym',
        'Library': 'library',
        'Cafe': 'cafe'
    };

    const placeType = placeTypeMapping[type];
    
    if (!placeType) {
        console.error('Invalid place type:', type);  // Log if placeType is invalid
        throw new Error('Invalid place type');
    }

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${long}&radius=${radius}&type=${placeType}&key=${apiKey}`;

    try {
        const response = await axios.get(url);
        console.log('API Response:', response.data);  // Log the full API response
        return response.data.results.map(place => ({
            name: place.name,
            address: place.vicinity
        }));
    } catch (error) {
        console.error('Error fetching places:', error);  // Log any errors
        throw new Error('Failed to fetch nearby places');
    }
}


// Example of the API endpoint where the type is passed dynamically
app.post('/api/location', async (req, res) => {
    console.log('Received location data:', req.body); // debug log
    const { type, lat, long } = req.body;

    try {
        const places = await fetchNearbyPlaces(type, lat, long);
        res.json({ places });
    } catch (error) {
        console.error('Error fetching nearby places:', error);
        res.status(500).json({ error: 'Failed to fetch nearby places' });
    }
});


// fetch data from OpenAI using axios
const fetchData = async (prompt) => {
    const config = {
        method: 'post',
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        data: {
            model: "gpt-3.5-turbo",
            messages: [{
                role: "user",
                content: prompt
            }],
            max_tokens: 60
        }
    };

    try {
        const response = await axios(config);
        console.log(response.data); 
        return response.data;
    } catch (error) {
        console.error('Error in API call:', error.response.data);
        return null;
    }
}; 
//openai api server integration function source: https://github.com/RajKKapadia/YouTube-Openai-Dialogflow-CX-ES-Python/blob/main/helper/openai_api.py

// Dialogflow WEBHOOK endpoint
app.post('/dialogflow', async (req, res) => {
    let action = req.body.queryResult.action;
    let queryText = req.body.queryResult.queryText;

    if (action === 'input.unknown') {
        let apiResponse = await fetchData(queryText); // fetchData 
        if (apiResponse && apiResponse.choices) {
            res.json({ fulfillmentText: apiResponse.choices[0].message.content });
        } else {
            res.json({ fulfillmentText: "Sorry, I couldn't fetch a response." });
        }
    } else {
        res.json({ fulfillmentText: `No handler for the action ${action}.` });
    }
});

// app.post('/dialogflow', async (req, res) => {
//     let action = req.body.queryResult.action;
//     let queryText = req.body.queryResult.queryText;

//     if (action === 'provide_location_info') {
//         let apiResponse = await fetchData(queryText); // fetchData 
//         if (apiResponse && apiResponse.choices) {
//             res.json({ fulfillmentText: apiResponse.choices[0].message.content });
//         } else {
//             res.json({ fulfillmentText: "Sorry, I couldn't fetch a response." });
//         }
//     } else if (action === 'provide_location_info') {
//         // Handle the location info request here
//         const { lat, long, location } = req.body.queryResult.parameters;
        
//         try {
//             // Call the Google Maps API or process data
//             const places = await fetchNearbyPlaces(lat, long, location);
            
//             if (places.length > 0) {
//                 res.json({
//                     fulfillmentText: `The nearest ${location} is at ${places[0].name} located at ${places[0].vicinity}.`
//                 });
//             } else {
//                 res.json({
//                     fulfillmentText: `Sorry, I couldn't find any ${location} nearby.`
//                 });
//             }
//         } catch (error) {
//             console.error('Error fetching places:', error);
//             res.json({
//                 fulfillmentText: 'Sorry, there was an error processing your request.'
//             });
//         }
//     } else {
//         res.json({ fulfillmentText: `No handler for the action ${action}.` });
//     }
// });

// app.post('/dialogflow', async (req, res) => {
//     let action = req.body.queryResult.action;

//     if (action === 'provide_location_info') {
//         // Extract parameters from Dialogflow
//         const location = req.body.queryResult.parameters.location; // e.g., 'gym', 'library'
//         const lat = req.body.queryResult.parameters.lat; // Latitude from user input or device
//         const long = req.body.queryResult.parameters.long; // Longitude from user input or device

//         // Validate if all necessary parameters are present
//         if (!location || !lat || !long) {
//             res.json({ fulfillmentText: "Sorry, I couldn't get the necessary location details. Please provide a valid location, latitude, and longitude." });
//             return;
//         }

//         const places = await fetchNearbyPlaces(location, lat, long);

//         if (places.length > 0) {
//             const responseText = places.map(place => `${place.name} - ${place.address}`).join('\n');
//             res.json({ fulfillmentText: `Here are some nearby places:\n${responseText}` });
//         } else {
//             res.json({ fulfillmentText: "Sorry, I couldn't find any nearby." });
//         }
//     } else {
//         res.json({ fulfillmentText: `No handler for the action ${action}.` });
//     }
// });


//hardcoded for testing
// app.post('/dialogflow', async (req, res) => {
//     let action = req.body.queryResult.action;

//     if (action === 'provide_location_info') {
//         const { location, lat, long } = req.body.queryResult.parameters;
//         const places = await fetchNearbyPlaces(location, lat, long);

//         if (places.length > 0) {
//             const responseText = places.map(place => `${place.name} - ${place.address}`).join('\n');
//             res.json({ fulfillmentText: `Here are some nearby ${location} places:\n${responseText}` });
//         } else {
//             res.json({ fulfillmentText: `Sorry, I couldn't find any nearby ${location} places.` });
//         }
//     } else {
//         res.json({ fulfillmentText: `No handler for the action ${action}.` });
//     }
// });

//no handler function 
// app.post('/dialogflow', async (req, res) => {
//     let action = req.body.queryResult.action;

//     if (action === 'find_cafe_action') {
//         console.log('Processing FindCafe Action');
//         const { lat, long } = req.body.queryResult.parameters;
//         const places = await fetchNearbyPlaces('Cafe', lat, long);
//         const responseText = places.map(place => `${place.name} - ${place.address}`).join('\n');
//         res.json({ fulfillmentText: `Here are some nearby cafes:\n${responseText}` });

//     } else if (action === 'find_gym_action') {
//         console.log('Processing FindGym Action');
//         const { lat, long } = req.body.queryResult.parameters;
//         const places = await fetchNearbyPlaces('Gym', lat, long);
//         console.log('Fetched places:', places);  // Debugging line
//         const responseText = places.map(place => `${place.name} - ${place.address}`).join('\n');
//         res.json({ fulfillmentText: `Here are some nearby gyms:\n${responseText}` });

//     } else if (action === 'find_library_action') {
//         console.log('Processing FindLibrary Action');
//         const { lat, long } = req.body.queryResult.parameters;
//         const places = await fetchNearbyPlaces('Library', lat, long);
//         const responseText = places.map(place => `${place.name} - ${place.address}`).join('\n');
//         res.json({ fulfillmentText: `Here are some nearby libraries:\n${responseText}` });

//     } else {
//         res.json({ fulfillmentText: `No handler for the action ${action}.` });
//     }
// });

//revised app.post function 
app.post('/dialogflow', async (req, res) => {
    let action = req.body.queryResult.action;

    // Ensure parameters are being passed correctly
    const lat = req.body.queryResult.parameters.lat;
    const long = req.body.queryResult.parameters.long;

    if (!lat || !long) {
        console.error('Latitude or Longitude not provided');
        res.json({ fulfillmentText: "Sorry, I couldn't get your location. Please try again." });
        return;
    }

    try {
        if (action === 'find_cafe_action') {
            console.log('Processing FindCafe Action');
            const places = await fetchNearbyPlaces('Cafe', lat, long);
            const responseText = places.length > 0 
                ? `Here are some nearby cafes:\n${places.map(place => `${place.name} - ${place.vicinity}`).join('\n')}`
                : "Sorry, I couldn't find any nearby cafes.";
            res.json({ fulfillmentText: responseText });

        } else if (action === 'find_gym_action') {
            console.log('Processing FindGym Action');
            const places = await fetchNearbyPlaces('Gym', lat, long);
            const responseText = places.length > 0 
                ? `Here are some nearby gyms:\n${places.map(place => `${place.name} - ${place.vicinity}`).join('\n')}`
                : "Sorry, I couldn't find any nearby gyms.";
            res.json({ fulfillmentText: responseText });

        } else if (action === 'find_library_action') {
            console.log('Processing FindLibrary Action');
            const places = await fetchNearbyPlaces('Library', lat, long);
            const responseText = places.length > 0 
                ? `Here are some nearby libraries:\n${places.map(place => `${place.name} - ${place.vicinity}`).join('\n')}`
                : "Sorry, I couldn't find any nearby libraries.";
            res.json({ fulfillmentText: responseText });

        } else {
            console.error(`No handler for the action ${action}`);
            res.json({ fulfillmentText: `No handler for the action ${action}.` });
        }
    } catch (error) {
        console.error('Error processing action:', error);
        res.json({ fulfillmentText: "An error occurred while processing your request. Please try again later." });
    }
});


// API endpoint to receive location from frontend
// app.post('/api/location', async (req, res) => {
//     console.log('Received location data:', req.body);//debug
//     const { type, lat, long } = req.body;

//     try {
//         const places = await fetchNearbyPlaces(type, lat, long);
//         res.json({ places });
//     } catch (error) {
//         console.error('Error fetching nearby places:', error);
//         res.status(500).json({ error: 'Failed to fetch nearby places' });
//     }
// });

// DF message endpoint
app.post('/api/message', async (req, res) => {
    const { message } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'No message provided' });
    }
  //  const { message, location } = req.body;
    const sessionId = generateSessionId(); // session ID

    try {
        const client = await auth.getClient();
        const projectId = await auth.getProjectId();

        const dialogflow = google.dialogflow({
            version: 'v2',
            auth: client
        });

        const request = {
            session: `projects/${projectId}/agent/sessions/${sessionId}`,
            queryInput: {
                text: {
                    text: message, //message isnt empty
                    languageCode: 'en'
                }
            }
        };



        const response = await dialogflow.projects.agent.sessions.detectIntent({
            session: `projects/${projectId}/agent/sessions/${sessionId}`,
            requestBody: request
        });
        console.log(response);

        const result = response.data.queryResult.fulfillmentText;
       
        res.json({ fulfillmentText: result });
    } catch (error) {
        console.error('Error connecting to Dialogflow API', error);
        res.status(500).json({ error: `Error connecting to Dialogflow API: ${error.message}` });
    }
});

// Function to fetch nearby places using Google Maps API
// Function to fetch nearby places
// async function fetchNearbyPlaces(location, lat, long) {
//     const apiKey = process.env.GOOGLE_MAPS_API_KEY;
//     const radius = 1500; // search radius in meters

//     console.log(`Searching for ${location} near ${lat}, ${long}`); // Debugging log

//     const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${long}&radius=${radius}&keyword=${location}&key=${apiKey}`;
    
//     try {
//         const response = await axios.get(url);
//         console.log('Google Maps API response:', response.data); // Debugging log

//         if (response.data.results.length > 0) {
//             const places = response.data.results.map(place => ({
//                 name: place.name,
//                 address: place.vicinity
//             }));
//             return places;
//         } else {
//             return [];
//         }
//     } catch (error) {
//         console.error('Error fetching nearby places:', error);
//         return [];
//     }
// }



// Generate new session
function generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}



// Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

 const upload = multer({ storage });
                
// Endpoint for document upload

app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.log("No file uploaded");
        return res.status(400).json({ error: 'No file uploaded.' });
    }

    try {
        const filePath = path.join(__dirname, 'uploads', req.file.filename);
        console.log(`File saved at: ${filePath}`); // Log the file path
        const dataBuffer = fs.readFileSync(filePath);
        const textContent = await pdfParse(dataBuffer);
        
        console.log('Extracted text:', textContent.text); // Log extracted text
        res.json({ message: 'Document processed successfully', text: textContent.text });
    } catch (error) {
        console.error('Failed to process document:', error);
        res.status(500).json({ error: 'Document processing failed' });
    }
});

              
                
// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Serving files from:  ${path.join(__dirname, 'video-test-interface')}`);
});



                //doc server
                // const express = require('express');
                // const multer = require('multer');
                // const path = require('path');
                // const fs = require('fs');
                // const pdfParse = require('pdf-parse');
                // const axios = require('axios');
                // const { google } = require('googleapis');
                // const { GoogleAuth } = require('google-auth-library');
                // const cors = require('cors');  // Include CORS package
                // const dotenv = require('dotenv');
                
                // dotenv.config();
                
                // const app = express();
                // const port = 3000;
                
                // // Configure CORS
                // app.use(cors());
                
                // app.use(express.json());
                // app.use(express.static(path.join(__dirname)));
                
                // const auth = new GoogleAuth({
                //     keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
                //     scopes: ['https://www.googleapis.com/auth/cloud-platform']
                // });
                
                // // Utility to generate session IDs
                // function generateSessionId() {
                //     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                //         const r = Math.random() * 16 | 0;
                //         return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                //     });
                // }
                
                // // Dialogflow message endpoint
                // app.post('/api/message', async (req, res) => {
                //     if (!req.body.message) {
                //         console.log("No message received in the request");
                //         return res.status(400).json({ error: 'No message provided' });
                //     }
                
                //     const sessionId = generateSessionId();
                //     try {
                //         const client = await auth.getClient();
                //         const projectId = await auth.getProjectId();
                //         const dialogflow = google.dialogflow({ auth: client, version: 'v2' });
                //         const dialogflowReq = {
                //             session: `projects/${projectId}/agent/sessions/${sessionId}`,
                //             requestBody: {
                //                 queryInput: {
                //                     text: {
                //                         text: req.body.message,
                //                         languageCode: 'en'
                //                     }
                //                 }
                //             }
                //         };
                
                //         console.log("Request to Dialogflow:", dialogflowReq);
                //         const dialogflowRes = await dialogflow.projects.agent.sessions.detectIntent(dialogflowReq);
                //         console.log("Response from Dialogflow:", dialogflowRes.data);
                //         res.json({ fulfillmentText: dialogflowRes.data.queryResult.fulfillmentText });
                //     } catch (error) {
                //         console.error('Failed to connect to Dialogflow:', error);
                //         res.status(500).json({ error: `Dialogflow API Error: ${error.message}` });
                //     }
                // });
                
                // // Configure file storage for uploads
                // const storage = multer.diskStorage({
                //     destination: 'uploads/',
                //     filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
                // });
                // const upload = multer({ storage });
                
                // // Endpoint for document upload
                // app.post('/upload', upload.single('file'), async (req, res) => {
                //     if (!req.file) {
                //         console.log("No file uploaded");
                //         return res.status(400).json({ error: 'No file uploaded.' });
                //     }
                
                //     try {
                //         const filePath = path.join(__dirname, 'uploads', req.file.filename);
                //         const dataBuffer = fs.readFileSync(filePath);
                //         const textContent = await pdfParse(dataBuffer);
                
                //         console.log('Document processed successfully:', textContent);
                //         res.json({ message: 'Document processed successfully', text: textContent.text });
                //     } catch (error) {
                //         console.error('Failed to process document:', error);
                //         res.status(500).json({ error: 'Document processing failed' });
                //     }
                // });
                
                // app.listen(port, () => {
                //     console.log(`Server is running on http://localhost:${port}`);
                // });
                