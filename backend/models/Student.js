const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
    
    // ============================
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

    // ============================
    name: {
        type: String,
        required: [true, "Name is mandatory"]
    },


    dateOfBirth: {
        type: Date,
        required: [true, "DOB is mandatory"]
    },

    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, "Gender is mandatory"]
    },

    class: {
        type: String,
        required: [true, "Fill the class"],
        enum: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8']
    },

    address: {
        type: String,
        required: [true, "Address is mandatory"]
    },

    pincode: {
        type: String,
        required: [true, "Pincode is mandatory"],
        validate: {
            validator: function (v) {
                return /^\d{6}$/.test(v);
            },
            message: props => `${props.value} is not a valid 6-digit pincode!`
        }
    },

    category: {
        type: String,
        required: [true, "Category is mandatory"],
        enum: ['General', 'OBC', 'SC', 'ST', 'Minority', 'Other']
    },

    // ============================
    // Parent / Guardian Info
    // ============================
    fatherName: { 
        type: String,
        default: ""  
    },
    
    fatherMobile: { 
        type: String, 
        default: "",  
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }
    },
    
    motherName: { 
        type: String, 
        default: ""  
    },
    
    motherMobile: { 
        type: String, 
        default: "",  
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid 10-digit phone number!`
        }   
    },

    guardianName: { 
        type: String, 
        default: "" 
    },
    
    guardianMobile: { 
        type: String, 
        default: "",
        validate: {
            validator: function(v) {
                return !v || /^\d{10}$/.test(v);
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
        type: String,
        default: ""
    },

    // ============================
    // Admin Controlled Fields
    // ============================
    UID: {
        type: String,
        unique: true,
        sparse: true
    },

    password: {
        type: String
    },

    admissionDate: {
        type: Date
    },

    isPasswordChanged: {
        type: Boolean,
        default: false
    },

    // ============================
    // Academic History
    // ============================
    academicHistory: [
        {
            year: {
                type: String,
                required: true
            },
            class: {
                type: String,
                required: true
            },
            status: {
                type: String,
                enum: ['Promoted', 'Repeated', 'Graduated'],
                default: 'Promoted'
            }
        }
    ],

    accountStatus: {
        type: String,
        enum: ['pending', 'active', 'rejected', 'inactive', 'graduated'],
        default: 'pending'
    },

    // ============================
    // Additional Information
    // ============================
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
        aadharPhotoCopy: { type: Boolean, default: false }
    },

    role: {
        type: String,
        default: 'student'
    }

}, {
    timestamps: true
});


studentSchema.pre('validate', async function() {
    const hasAnyContact = 
        this.fatherName || this.motherName || 
        this.fatherMobile || this.motherMobile || 
        this.guardianName || this.guardianMobile;

    if (!hasAnyContact) {
        this.invalidate('guardianName', 'Please provide at least one contact person (Father, Mother, or Guardian).');
    }
});

studentSchema.pre('save', async function() {
    if (!this.password || !this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

<<<<<<< HEAD

module.exports = mongoose.model('Student', studentSchema);
=======
module.exports = mongoose.model('Student', studentSchema);
>>>>>>> 9bbba46 (Final State Fixed everything)
