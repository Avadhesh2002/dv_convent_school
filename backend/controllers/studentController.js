const Student = require('../models/Student');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

const registerStudent = async (req, res) => {
    try {
        const {
            name, dateOfBirth, gender, class: studentClass, address,
            pincode,              // ✅ NEW
            category,             // ✅ NEW
            fatherName, fatherMobile, motherName, motherMobile, 
            guardianName,         // ✅ NEW
            guardianMobile,       // ✅ NEW
            parentEmail,
            profileImage: rawProfileImage, aadharNumber, penNumber, fatherQualification, siblingName,
            admissionType, documents, academicYear
        } = req.body;

        // ✅ UPDATED VALIDATION: Basic required fields
        if (!name || !dateOfBirth || !gender || !studentClass || !address || !pincode || !category || !parentEmail) {
            return res.status(400).json({ 
                message: "Please fill all required fields: Name, DOB, Gender, Class, Address, Pincode, Category, and Email" 
            });
        }

        // ✅ NEW VALIDATION: Either parents OR guardian must be provided
        const hasParents = fatherName || motherName;
        const hasGuardian = guardianName;

        if (!hasParents && !hasGuardian) {
            return res.status(400).json({ 
                message: "Please provide either parent information or guardian information" 
            });
        }

        // ✅ VALIDATE PINCODE: Must be 6 digits
        if (!/^\d{6}$/.test(pincode)) {
            return res.status(400).json({ 
                message: "Pincode must be exactly 6 digits" 
            });
        }

        // ✅ VALIDATE CATEGORY: Must be valid enum value
        const validCategories = ['General', 'OBC', 'SC', 'ST', 'Minority', 'Other'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                message: "Invalid category. Must be one of: General, OBC, SC, ST, Minority, Other" 
            });
        }

        let profileImageUrl = "";
        if (rawProfileImage && rawProfileImage.startsWith('data:image')) {
            try {
                const uploadResult = await cloudinary.uploader.upload(rawProfileImage, {
                    folder: 'dv_convent_school/profiles',
                    transformation: [
                        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                    // Note: No public_id here because student has no _id yet at this point.
                    // Cloudinary will auto-generate a unique ID. After approval,
                    // the student can re-upload via EditableAvatar which uses their _id.
                });
                profileImageUrl = uploadResult.secure_url;
            } catch (uploadError) {
                // If Cloudinary upload fails, registration still proceeds without image.
                // Do not block a student from applying just because of a photo issue.
                console.error("Registration photo upload failed:", uploadError.message);
                profileImageUrl = "";
            }
        }

        const newStudent = await Student.create({
            name, 
            dateOfBirth, 
            gender, 
            class: studentClass, 
            address,
            pincode,              // ✅ NEW
            category,             // ✅ NEW
            fatherName: fatherName || "",           // Optional
            fatherMobile: fatherMobile || "",       // Optional
            motherName: motherName || "",           // Optional
            motherMobile: motherMobile || "",       // Optional
            guardianName: guardianName || "",       // ✅ NEW - Optional
            guardianMobile: guardianMobile || "",   // ✅ NEW - Optional
            parentEmail,
            profileImage: profileImageUrl,
            aadharNumber: aadharNumber || "",
            penNumber: penNumber || "", 
            fatherQualification: fatherQualification || "",
            siblingName: siblingName || "",
            admissionType: admissionType || 'Old',
            documents: documents || {},
            academicYear: academicYear || "",
            accountStatus: 'pending'
        });

        await Notification.create({
        recipientRole: 'admin',
        title: 'New Admission',
        message: `New Application: ${newStudent.name} has applied for Class ${newStudent.class}.`,
        link: '/admin/students/pending'
    });


        res.status(201).json({ 
            message: "Application submitted successfully! Awaiting admin approval.", 
            student: newStudent 
        });


    } catch (error) {
        console.error("❌ Registration Error:", error);
        
        // ✅ HANDLE MONGOOSE VALIDATION ERRORS
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                message: "Validation failed", 
                errors: messages 
            });
        }

        res.status(500).json({ 
            message: "Registration failed due to server error", 
            error: error.message 
        });
    }
};

module.exports = { registerStudent };