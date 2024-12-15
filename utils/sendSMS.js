import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID; // get from env
const authToken = process.env.TWILIO_AUTH_TOKEN; // get from env
const twilio_phone_number = process.env.TWILIO_FROM_NUMBER; // get from env

const ISD_CODE = '+91';
const client = new twilio(accountSid, authToken);

const sendSMS = async (phoneNumber, message) => {
    try {
        await client.messages.create({
            body: message,
            from: twilio_phone_number,
            to: ISD_CODE + phoneNumber
        });
        console.log(`SMS sent to ${phoneNumber}: ${message}`);
    } catch (error) {
        console.error("Error sending SMS:", error);
        throw new Error("Failed to send SMS.");
    }
};

export { sendSMS }
