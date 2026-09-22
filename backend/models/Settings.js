const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    schoolName:          { type: String, default: "DV Convent School" },
    schoolSlogan:        { type: String, default: "Education for Excellence" },
    schoolAddress:       { type: String, default: "Enter School Address" },
    contactNumber:       { type: String, default: "0000000000" },
    schoolEmail:         { type: String, default: "" },
    schoolLogo:          { type: String, default: "" },
    currentAcademicYear: { type: String, default: "2025-26" },
    isRegistrationOpen:  { type: Boolean, default: true },

    // School Identity for TC & Documents
    udiseCode:           { type: String, default: "" },
    schoolCode:          { type: String, default: "" },
    schoolAffiliation:   { type: String, default: "" },
    affiliationNumber:   { type: String, default: "" },
    principalName:       { type: String, default: "" },

    // UPI Payment
    upiId:               { type: String, default: "" },
    upiQr:               { type: String, default: "" },
}, { timestamps: true, strict: false });

module.exports = mongoose.model('Settings', settingsSchema);
