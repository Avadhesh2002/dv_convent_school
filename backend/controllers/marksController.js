const Mark = require('../models/Mark');
const Exam = require('../models/Exam');
const mongoose = require('mongoose');
const TeacherAssignment = require('../models/TeacherAssignment');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const Class = require('../models/Class'); 
const Subject = require('../models/Subject'); 
// Helper function to calculate Grade
const calculateGrade = (obtained, max) => {
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 33) return 'E';
    return 'F';
};


const bulkEnterMarks = async (req, res) => {
    try {
        const { examId, subjectId, classId, academicYear, marksData } = req.body;

        // 1. Fetch the exam
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ message: "Exam not found" });

        // 2. THE LOCK GUARD (7 DAYS)
        const existingMark = await Mark.findOne({ examId, subjectId, classId });
        if (existingMark) {
            const now = new Date();
            const firstSubmission = new Date(existingMark.createdAt);
            const diffInDays = (now - firstSubmission) / (1000 * 60 * 60 * 24);

            if (diffInDays > 7) {
                return res.status(403).json({ 
                    message: "Access Denied: The 7-day editing window has expired." 
                });
            }
        }

        // 3. Preparation for Save
        const examMaxMarks = exam.maxMarks;
        const bulkOps = marksData.map((record) => {
            const grade = calculateGrade(record.marksObtained, examMaxMarks);
            return {
                updateOne: {
                    filter: { studentId: record.studentId, examId, subjectId },
                    update: {
                        $set: {
                            ...record,
                            classId: classId, // Critical for Admin Rankings
                            maxMarks: examMaxMarks,
                            grade,
                            teacherId: req.user._id,
                            academicYear
                        }
                    },
                    upsert: true
                }
            };
        });

        // 4. EXECUTE SAVE
        await Mark.bulkWrite(bulkOps);

        // 5. PREPARE HUMAN-READABLE NOTIFICATION (The Fix)
        // We do the lookups AFTER the save is successful
        const [targetClass, targetSubject] = await Promise.all([
            Class.findById(classId),
            Subject.findById(subjectId)
        ]);

        const className = targetClass ? targetClass.className : "Unknown Class";
        const subjectName = targetSubject ? targetSubject.subjectName : "Subject";

        // 6. CREATE NOTIFICATION
        await Notification.create({
            recipientRole: 'admin',
            title: 'Marks Updated',
            message: `Teacher ${req.user.name} submitted ${subjectName} marks for Class ${className}.`,
            link: '/admin/marks'
        });

        res.status(200).json({ message: "Marks saved and Admin notified." });

    } catch (error) {
        console.error("BULK_MARK_ERROR:", error);
        // We send the specific error message to help you debug
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get Class-wise Rank List (Step 5 - Analytics)
// @route   GET /api/marks/ranklist/:classId/:examId
const getClassRankList = async (req, res) => {
    try {
        const { classId, examId } = req.params;
        const mongoose = require('mongoose');

        // 1. CONVERT TO OBJECTID (Crucial for $match to work)
        const targetClassId = new mongoose.Types.ObjectId(classId);
        const targetExamId = new mongoose.Types.ObjectId(examId);

        const rankList = await Mark.aggregate([
            { 
                $match: { 
                    classId: targetClassId, 
                    examId: targetExamId 
                }
            },
            {
                $group: {
                    _id: "$studentId", // Calculate totals per student
                    totalObtained: { $sum: "$marksObtained" },
                    totalMax: { $sum: "$maxMarks" }
                }
            },
            {
                $lookup: {
                    from: "students", // Join with Student names
                    localField: "_id",
                    foreignField: "_id",
                    as: "studentInfo"
                }
            },
            { $unwind: "$studentInfo" },
            {
                $project: {
                    name: "$studentInfo.name",
                    UID: "$studentInfo.UID",
                    totalObtained: 1,
                    totalMax: 1,
                    percentage: { 
                        $multiply: [{ $divide: ["$totalObtained", "$totalMax"] }, 100] 
                    }
                }
            },
            { $sort: { totalObtained: -1 } } // Highest scores first
        ]);

        if (rankList.length === 0) {
            return res.status(404).json({ message: "No marks data found for this class and exam." });
        }

        const finalResults = rankList.map((item, index) => ({
            rank: index + 1,
            ...item,
            percentage: item.percentage.toFixed(2)
        }));

        res.status(200).json(finalResults);
    } catch (error) {
        console.error("RANKLIST_ERROR:", error);
        res.status(500).json({ message: "Failed to generate rank list" });
    }
};




// @desc    Get Student Report Card (Step 5)
// @route   GET /api/marks/report-card/:studentId/:examId
const getStudentReportCard = async (req, res) => {
    try {
        const { studentId, examId } = req.params;

        const marks = await Mark.find({ studentId, examId })
            .populate('subjectId', 'subjectName subjectCode')
            .populate('teacherId', 'name');

        if (marks.length === 0) return res.status(404).json({ message: "No marks found for this exam." });

        const totalObtained = marks.reduce((sum, m) => sum + m.marksObtained, 0);
        const totalMax = marks.reduce((sum, m) => sum + m.maxMarks, 0);
        const percentage = ((totalObtained / totalMax) * 100).toFixed(2);

        res.status(200).json({
            studentId,
            examId,
            totalObtained,
            totalMax,
            percentage,
            subjects: marks
        });
    } catch (error) {
        res.status(500).json({ message: "Report Card Error", error: error.message });
    }
};

module.exports = { bulkEnterMarks, getClassRankList, getStudentReportCard };