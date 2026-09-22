const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    schoolName:          { type: String, default: "DV Convent School" },
    schoolSlogan:        { type: String, default: "Education for Excellence" },
    schoolAddress:       { type: String, default: "Enter School Address" },
    contactNumber:       { type: String, default: "0000000000" },
    schoolEmail:         { type: String, default: "" },
    schoolLogo:          { type: String, default: "" },   // Base64
    currentAcademicYear: { type: String, default: "2025-26" },
    isRegistrationOpen:  { type: Boolean, default: true },

    // School Identity for TC & Documents
    udiseCode:           { type: String, default: "" },   // UDISE+ Code
    schoolCode:          { type: String, default: "" },   // Govt / Board School Code
    schoolAffiliation:   { type: String, default: "" },   // e.g. "UP Board"
    affiliationNumber:   { type: String, default: "" },
    principalName:       { type: String, default: "" },

    // UPI Payment
    upiId:               { type: String, default: "" },
    upiQr:               { type: String, default: "" },   // Base64 QR image
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
