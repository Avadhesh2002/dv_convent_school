const Student = require('../models/Student');
const Notification = require('../models/Notification');

// @desc    Register a new student (Public)
// @route   POST /api/students/register
// @access  Public
const registerStudent = async (req, res) => {
    try {
        const {
            name, dateOfBirth, gender, class: studentClass, address, // Removed section
            fatherName, fatherMobile, motherName, motherMobile, parentEmail,fatherQualification,aadharNumber,
            siblingName, profileImage , admissionType, documents
        } = req.body;

        // Validation: Remove 'section' from this check
        if (!name || !dateOfBirth || !gender || !studentClass || !fatherName || !fatherMobile) {
            return res.status(400).json({ message: "Please fill all required fields" });
        }

        // 2. Check if student already applied (Using name and father's mobile as a unique pair)
        const existingStudent = await Student.findOne({ name, fatherMobile });
        if (existingStudent) {
            return res.status(400).json({ message: "An application with this name and father's mobile already exists." });
        }

        // 3. Create the student in 'pending' status
        const student = await Student.create({
            name,
            dateOfBirth,
            gender,
            class: studentClass,
            address,
            fatherName,
            fatherMobile,
            motherName,
            motherMobile,
            parentEmail,
            profileImage,
            fatherQualification, 
            aadharNumber, 
            siblingName,
            admissionType,
            documents,
            accountStatus: 'pending' // Forced by default, but good to be explicit
        });

        if (student) {
            // TRIGGER: Notify Admin about the new application
            await Notification.create({
                recipientRole: 'admin',
                title: 'New Admission',
                message: `New Application: ${student.name} has applied for Class ${student.class}.`,
                link: '/admin/students/pending'
            });

            res.status(201).json({
                message: "Application submitted successfully! Please wait for Admin approval.",
                applicationId: student._id
            });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

module.exports = { registerStudent };