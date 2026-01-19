const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    schoolName: { type: String, default: "DV Convent School" },
    schoolSlogan: { type: String, default: "Education for Excellence" }, // NEW
    schoolAddress: { type: String, default: "Enter School Address" },   // NEW
    contactNumber: { type: String, default: "0000000000" },
    schoolLogo: { type: String, default: "" },                           // NEW (Base64)
    currentAcademicYear: { type: String, default: "2024-2025" },
    isRegistrationOpen: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);