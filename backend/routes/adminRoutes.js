const express = require('express');
const router = express.Router();

const {
    getPendingStudents, approveStudent, addTeacher, getAllTeachers, updateTeacher, deleteTeacher,
    getAllStudents, updateStudent, deleteStudent, bulkUploadStudents, promoteStudents,
    getSettings, updateSettings, massPromote, resetPassword, issueTc
} = require('../controllers/adminController');

const {
    createExam, getAllExams, updateExamStatus, publishResults, unpublishResults,
    deleteExam, getAcademicSessions
} = require('../controllers/examController');

const {
    getClassRankList, bulkEnterMarks, getExamResultSheet, getFinalResult
} = require('../controllers/marksController');

const { protect, authorize } = require('../middlewares/authMiddleware');

const { createClass, getClasses, updateClass, deleteClass } = require('../controllers/classController');

const { createSubject, getSubjectsByClass, getAllSubjects, deleteSubject, updateSubject } = require('../controllers/subjectController');

const { assignTeacher, getClassAssignments, removeAssignment, updateAssignment } = require('../controllers/assignmentController');

const { createAnnouncement, getAdminAnnouncements, updateAnnouncement, deleteAnnouncement, getAnnouncementViews } = require('../controllers/announcementController');

const { getAdminStats, getAdminDashboard, globalSearch } = require('../controllers/dashboardController');

// ── Student Management ────────────────────────────────────────
router.get('/pending-students', protect, authorize('admin'), getPendingStudents);
router.put('/approve-student/:id', protect, authorize('admin'), approveStudent);

router.get('/students', protect, authorize('admin'), getAllStudents);
router.post('/students/bulk-upload', protect, authorize('admin'), bulkUploadStudents);
router.put('/students/promote', protect, authorize('admin'), promoteStudents);
router.put('/students/:id/issue-tc', protect, authorize('admin'), issueTc);
router.put('/students/:id', protect, authorize('admin'), updateStudent);
router.delete('/students/:id', protect, authorize('admin'), deleteStudent);

// ── Teacher Management ────────────────────────────────────────
router.post('/teachers', protect, authorize('admin'), addTeacher);
router.get('/teachers', protect, authorize('admin'), getAllTeachers);
router.put('/teachers/:id', protect, authorize('admin'), updateTeacher);
router.delete('/teachers/:id', protect, authorize('admin'), deleteTeacher);

// ── Class Routes ──────────────────────────────────────────────
router.post('/classes', protect, authorize('admin'), createClass);
router.get('/classes', protect, authorize('admin', 'teacher'), getClasses);
router.put('/classes/:id', protect, authorize('admin'), updateClass);
router.delete('/classes/:id', protect, authorize('admin'), deleteClass);

// ── Subject Routes ────────────────────────────────────────────
router.post('/subjects', protect, authorize('admin'), createSubject);
router.get('/subjects', protect, authorize('admin'), getAllSubjects);
router.get('/subjects/:className', protect, authorize('admin'), getSubjectsByClass);
router.delete('/subjects/:id', protect, authorize('admin'), deleteSubject);
router.put('/subjects/:id', protect, authorize('admin'), updateSubject);

// ── Teacher Assignments ───────────────────────────────────────
router.post('/assignments', protect, authorize('admin'), assignTeacher);
router.delete('/assignments/:id', protect, authorize('admin'), removeAssignment);
router.get('/assignments/class/:classId', protect, authorize('admin'), getClassAssignments);
router.put('/assignments/:id', protect, authorize('admin'), updateAssignment);

// ── Exams — IMPORTANT: specific routes BEFORE /:id param routes ──
router.get('/exams/sessions', protect, authorize('admin', 'teacher'), getAcademicSessions);
router.post('/exams', protect, authorize('admin'), createExam);
router.get('/exams', protect, authorize('admin', 'teacher', 'student'), getAllExams);
router.put('/exams/:id/status', protect, authorize('admin'), updateExamStatus);
router.put('/exams/:id/publish', protect, authorize('admin'), publishResults);
router.put('/exams/:id/unpublish', protect, authorize('admin'), unpublishResults);
router.delete('/exams/:id', protect, authorize('admin'), deleteExam);

// ── Marks & Results ───────────────────────────────────────────
router.get('/marks/ranklist/:classId/:examId', protect, authorize('admin', 'teacher'), getClassRankList);
router.get('/results/sheet/:classId/:examId', protect, authorize('admin'), getExamResultSheet);
router.get('/results/final/:classId', protect, authorize('admin'), getFinalResult);

// ── Announcements ─────────────────────────────────────────────
router.post('/announcements', protect, authorize('admin'), createAnnouncement);
router.get('/announcements', protect, authorize('admin'), getAdminAnnouncements);
router.put('/announcements/:id', protect, authorize('admin'), updateAnnouncement);
router.delete('/announcements/:id', protect, authorize('admin'), deleteAnnouncement);
router.get('/announcements/:id/views', protect, authorize('admin'), getAnnouncementViews);

// ── Dashboard ─────────────────────────────────────────────────
router.get('/dashboard-stats', protect, authorize('admin'), getAdminStats);
router.get('/dashboard', protect, authorize('admin'), getAdminDashboard);
router.get('/search', protect, authorize('admin'), globalSearch);

// ── Settings ──────────────────────────────────────────────────
router.get('/settings', getSettings);
router.put('/settings', protect, authorize('admin'), updateSettings);

// ── Misc Admin Operations ─────────────────────────────────────
router.post('/promote-mass', protect, authorize('admin'), massPromote);
router.put('/reset-password', protect, authorize('admin'), resetPassword);

module.exports = router;
