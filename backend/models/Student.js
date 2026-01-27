const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    // Student Basic Info
    name: { type: String, required: [true, "Name is mandatory"] },
    dateOfBirth: { type: Date, required: [true, "DOB is mandatory"] },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: [true, "Gender is mandatory"]},
    class: { 
    type: String, 
    required: [true, "Fill the class"],
    enum: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'] // Added Nursery
},
    address: { type: String, required: [true, "Address is mandatory"] },

    // Parent/Guardian Detailed Info
    fatherName: { 
        type: String,
        required: [true, "Father's name is mandatory"]
    },
    fatherMobile: { 
    type: String, 
    required: [true, "Father's mobile No is mandatory"],
    validate: {
        validator: function(v) {
            return /^\d{10}$/.test(v); // Ensures exactly 10 digits
        },
        message: props => `${props.value} is not a valid 10-digit phone number!`
    }
},
    motherName: { type: String, required: [true, "Mother's name is mandatory"] },
    motherMobile: { 
    type: String, 
    required: [true, "Mother's mobile No is mandatory"],
    validate: {
        validator: function(v) {
            return /^\d{10}$/.test(v);
        },
        message: props => `${props.value} is not a valid 10-digit phone number!`
    }   
},
    parentEmail: {
        type: String,
        required: [true, "Guardian email is mandatory"],
        lowercase: true,
        trim: true
    },
    
    profileImage: {
    type: String, // This will store the Base64 string or Image URL
    default: ""
    },

    // Admin Controlled Fields (Empty at Registration)
    UID: { type: String, unique: true, sparse: true }, 
    password: { type: String },
    admissionDate: { type: Date },
    isPasswordChanged: { type: Boolean, default: false },
    
    // Status Logic
    academicHistory: [
        {
            year: { type: String, required: true },  // e.g., "2024-25"
            class: { type: String, required: true }, // e.g., "4"
            status: { 
                type: String, 
                enum: ['Promoted', 'Repeated', 'Graduated'], 
                default: 'Promoted' 
            }
        }
    ],
    accountStatus: { 
    type: String, 
    enum: ['pending', 'active', 'rejected', 'inactive', 'graduated'], // MUST include 'graduated'
    default: 'pending' 
},

fatherQualification: { 
    type: String, 
    default: ""  
},
hasAadhar: { 
    type: Boolean, 
    default: false 
},
aadharNumber: { 
    type: String, 
    // No 'unique' constraint here because some might not have it
    default: "" 
},
siblingName: { 
    type: String, 
    default: "" 
},

admissionType: { 
    type: String, 
    enum: ['New', 'Old'], 
    default: 'Old',
    required: [true, "Admission type is mandatory"] 
},

documents: {
    transferCertificate: { type: Boolean, default: false },
    characterCertificate: { type: Boolean, default: false },
    markSheet: { type: Boolean, default: false },
    migrationCertificate: { type: Boolean, default: false },
    casteCertificate: { type: Boolean, default: false },
    birthCertificate: { type: Boolean, default: false },
    fivePhotos: { type: Boolean, default: false },
    aadharPhotoCopy: { type: Boolean, default: false },
},

    role: { type: String, default: 'student' }
}, { timestamps: true });

// Auto-hash password only if it exists and is modified
studentSchema.pre('save', async function() {
    // If there is no password (student is still pending), just move on
    if (!this.password || !this.isModified('password')) {
        return; 
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});


module.exports = mongoose.model('Student', studentSchema);
