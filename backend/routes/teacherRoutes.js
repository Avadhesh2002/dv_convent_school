const express = require('express');
const router = express.Router();
const { getMyAssignments } = require('../controllers/assignmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { getTeacherDashboard } = require('../controllers/dashboardController');
const { getManagedClasses } = require('../controllers/classController');


// Teacher can only see their own assignments
router.get('/my-assignments', protect, authorize('teacher'), getMyAssignments);

router.get('/dashboard', protect, authorize('teacher'), getTeacherDashboard);

// Teacher can only see classes where they are the official "Class Teacher"
router.get('/managed-classes', protect, authorize('teacher'), getManagedClasses);


module.exports = router;