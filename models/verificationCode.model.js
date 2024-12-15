import mongoose from "mongoose";

const verificationCodeSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true
    },
    verificationCode: {
        type: String,
        required:
        true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

export const VerificationCode = mongoose.model('VerificationCode', verificationCodeSchema);
