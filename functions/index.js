/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });



exports.sendSMS = onRequest(async (req, res) => {
    // Set CORS headers for all requests
    res.set('Access-Control-Allow-Origin', '*'); // In production, replace '*' with your specific domain
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Max-Age', '3600');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        logger.info("Handling preflight OPTIONS request");
        return res.status(204).send('');
    }

    // Only allow POST requests for the actual SMS sending
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    let { userPhoneNo, otp } = req.body; // Use let
    logger.info("Received SMS request", { structuredData: true, body: req.body }); // Use req.body

    const messageText = `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;


    // Additional formatting to ensure compliance with mNotify requirements
    if (userPhoneNo && userPhoneNo.startsWith('0')) {
        userPhoneNo = '233' + userPhoneNo.substring(1);
    } else if (userPhoneNo && userPhoneNo.startsWith('+233')) {
        userPhoneNo = userPhoneNo.substring(1);
    } else if (userPhoneNo && userPhoneNo.startsWith('+')) {
        userPhoneNo = userPhoneNo.substring(1);
    }

    logger.info("Formatted phone for sms:", userPhoneNo);
    const nalouidUsername = "Rigelis"
    const naloupw = "Maestro1985@"
    const nalosource = "RigelOS"

    if (!nalouidUsername || !naloupw || !nalosource) {
        logger.error("credentials are not set in environment variables.");
        return res.status(500).send("credentials are missing.");
    }

    const nalosolutionsUrl = `https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo/send-message/?username=${encodeURIComponent(nalouidUsername)}&password=${encodeURIComponent(naloupw)}&type=0&destination=${encodeURIComponent(userPhoneNo)}&dlr=1&source=${encodeURIComponent(nalosource)}&message=${encodeURIComponent(messageText)}`;

    try {
        const response = await fetch(nalosolutionsUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Failed to send OTP:", { structuredData: true, status: response.status, errorText });
            return res.status(response.status).send(`Failed to send OTP: ${errorText}`);
        } else {
            const data = await response.text();
            logger.info("SMS sent successfully:", data );
            return res.status(200).send("OTP sent successfully.");
        }
    } catch (error) {
        logger.error("Error sending OTP", error );
        res.status(500).send("Internal Server Error: " + error.message);
    }
});

// exports.sendSMS = onRequest(async (req, res) => {
//     let { userPhoneNo, otp } = req.body; // Use let
//     logger.info("Received SMS request", { structuredData: true, body: req.body }); // Use req.body

//     const mNotifyApiKey = "0KLeqS4nHwJD76dIhTy8bppRV"
//     const mNotifySource = "MedsGh"
//     const messageText = `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

//     if (!mNotifyApiKey) {
//         logger.error("M_NOTIFY_API_KEY is not set in environment variables.");
//         fallbackSendSMS(userPhoneNo, messageText, res); // Pass res
//         return;
//     }

//     // Additional formatting to ensure compliance with mNotify requirements
//     if (userPhoneNo && userPhoneNo.startsWith('0')) {
//         userPhoneNo = '233' + userPhoneNo.substring(1);
//     } else if (userPhoneNo && userPhoneNo.startsWith('+233')) {
//         userPhoneNo = userPhoneNo.substring(1);
//     } else if (userPhoneNo && userPhoneNo.startsWith('+')) {
//         userPhoneNo = userPhoneNo.substring(1);
//     }

//     logger.info("Formatted phone for mNotify:", userPhoneNo);

//     const requestBody = {
//         key: mNotifyApiKey,
//         recipient: [userPhoneNo],
//         message: messageText,
//         sender: mNotifySource || "MedsGh",
//     };

//     try {
//         const response = await fetch("https://api.mnotify.com/api/sms/quick", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify(requestBody),
//         });

//         if (!response.ok) {
//             const errorText = await response.text();
//             logger.error("Failed to send SMS:", { structuredData: true, status: response.status, errorText });
//             fallbackSendSMS(userPhoneNo, messageText, res); // Pass res
//             return;
//         }

//         const data = await response.json();
//         logger.info("SMS sent successfully:", { structuredData: true, data });
//         res.status(200).send("SMS sent successfully."); // Send response
//     } catch (error) {
//         logger.error("Error sending SMS:", { structuredData: true, error });
//         fallbackSendSMS(userPhoneNo, messageText, res); // Pass res
//     }
// });