/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import cors from "cors";

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const corsHandler = cors({ origin: true });

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


const fallbackSendSMS = (mNotifyPhone, messageText, res) => {
    logger.info("Sending fallback SMS via NaloSolutions", { structuredData: true, phone: mNotifyPhone });
    const nalouidUsername = process.env.NALOSOLUTIONS_USERNAME;
    const naloupw = process.env.NALOSOLUTIONS_PASSWORD;
    const nalosource = process.env.NALOSOLUTIONS_SOURCE

    if (!nalouidUsername || !naloupw || !nalosource) {
        logger.error("NaloSolutions credentials are not set in environment variables.");
        return res.status(500).send("NaloSolutions credentials are missing.");
    }

    fetch(`https://sms.nalosolutions.com/smsbackend/clientapi/Resl_Nalo/send-message/?username=${encodeURIComponent(nalouidUsername)}&password=${encodeURIComponent(naloupw)}&type=0&destination=${encodeURIComponent(mNotifyPhone)}&dlr=1&source=${encodeURIComponent(nalosource)}&message=${encodeURIComponent(messageText)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then(response => {
            if (!response.ok) {
                const errorText = response.statusText || "Unknown error";
                return res.status(response.status).send(`Failed to send fallback SMS: ${errorText}`);
            }
            return response.text();
        })
        .then(data => {
            logger.info("Fallback SMS sent successfully:", { structuredData: true, data });
            res.status(200).send("Fallback SMS sent successfully.");
        })
        .catch(error => {
            logger.error("Error sending fallback SMS:", { structuredData: true, error });
            res.status(500).send("Internal Server Error: " + error.message);
        });
};

exports.sendSMS = onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
    let { mNotifyPhone, otp } = req.body; // Use let
    logger.info("Received SMS request", { structuredData: true, body: req.body }); // Use req.body

    const mNotifyApiKey = process.env.MNOTIFY_API_KEY;
    const mNotifySource = process.env.M_NOTIFY_SOURCE;
    const messageText = `Your verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone.`;

    if (!mNotifyApiKey) {
        logger.error("M_NOTIFY_API_KEY is not set in environment variables.");
        fallbackSendSMS(mNotifyPhone, messageText, res); // Pass res
        return;
    }

    // Additional formatting to ensure compliance with mNotify requirements
    if (mNotifyPhone.startsWith('0')) {
        mNotifyPhone = '233' + mNotifyPhone.substring(1);
    } else if (mNotifyPhone.startsWith('+233')) {
        mNotifyPhone = mNotifyPhone.substring(1);
    } else if (mNotifyPhone.startsWith('+')) {
        mNotifyPhone = mNotifyPhone.substring(1);
    }

    logger.info("Formatted phone for mNotify:", mNotifyPhone);

    const requestBody = {
        key: mNotifyApiKey,
        recipient: [mNotifyPhone],
        message: messageText,
        sender: mNotifySource || "MedsGh",
    };

    try {
        const response = await fetch("https://api.mnotify.com/api/sms/quick", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            logger.error("Failed to send SMS:", { structuredData: true, status: response.status, errorText });
            fallbackSendSMS(mNotifyPhone, messageText, res); // Pass res
            return;
        }

        const data = await response.json();
        logger.info("SMS sent successfully:", { structuredData: true, data });
        res.status(200).send("SMS sent successfully."); // Send response
    } catch (error) {
        logger.error("Error sending SMS:", { structuredData: true, error });
        fallbackSendSMS(mNotifyPhone, messageText, res); // Pass res
    }
    }
    );
});