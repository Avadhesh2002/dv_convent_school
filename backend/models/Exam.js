const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    examName: { 
        type: String,
        required: true,
        trim: true
    },

    examType: {
        type: String,
        required: true,
        enum: ['Unit Test', 'Mid-term', 'Final', 'Internal'] 
    },

    academicYear: {
        type: String,
        required: true
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },
    
    maxMarks: { 
        type: Number,
        required: true,
        default: 100 
    },

    status: { 
        type: String,
        enum: ['Scheduled', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Scheduled' 
    },

    // CBSE Term structure
    term: {
        type: String,
        enum: ['Term-1', 'Term-2'],
        default: null
    },

    // Which component this exam represents
    // periodicTest=10, subEnrichment=5, noteBooks=5, halfYearlyExam=80(T1), yearlyExam=80(T2)
    component: {
        type: String,
        enum: ['periodicTest', 'subEnrichment', 'noteBooks', 'halfYearlyExam', 'yearlyExam'],
        default: null
    },

    // Admin explicitly publish kare tab tak student ko marks nahi dikhenge
    resultsPublished: {
        type: Boolean,
        default: false
    },

    publishedAt: {
        type: Date,
        default: null
    },

    createdBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
    
}, { timestamps: true });

// Index for fast searching by year and type
examSchema.index({ academicYear: 1, examType: 1 });

module.exports = mongoose.model('Exam', examSchema);