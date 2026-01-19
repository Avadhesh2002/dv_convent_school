import React, { useState, useEffect } from 'react';
import { Search, Filter, UserX, Edit3, Key, Eye, FileText, ShieldCheck, ChevronLeft, ChevronRight, User, Phone, MapPin, Calendar, CheckCircle } from 'lucide-react';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import Modal from '../../components/common/Modal'; 
import { generateStudentListPDF } from '../../utils/pdfGenerator';

const StudentDirectory = () => {
  // ============ STATE MANAGEMENT ============
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [toast, setToast] = useState(null);
  
  // Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form States
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [pdfClass, setPdfClass] = useState('');
  const [selectedFields, setSelectedFields] = useState(['name', 'fatherMobile']);
  const [exportCriteria, setExportCriteria] = useState('class');

  // Filter States
  const [filters, setFilters] = useState({
    search: '',
    studentClass: '',
    admissionType: '',
    status: 'active',
    page: 1
  });

  // ============ CONSTANTS ============
  const DOCUMENT_LABELS = {
    transferCertificate: 'Transfer Certificate',
    characterCertificate: 'Character Certificate',
    markSheet: 'Mark Sheet',
    migrationCertificate: 'Migration Certificate',
    casteCertificate: 'Caste Certificate',
    birthCertificate: 'Birth Certificate',
    fivePhotos: '5 Photos Physical',
    aadharPhotoCopy: 'Aadhar Photo Copy'
  };

  const availableParams = [
    { id: 'name', label: 'Student Name' },
    { id: 'dateOfBirth', label: 'Date of Birth' },
    { id: 'fatherName', label: 'Father Name' },
    { id: 'fatherMobile', label: 'Father Mobile' },
    { id: 'aadharNumber', label: 'Aadhar Card' },
    { id: 'address', label: 'Address' }
  ];

  // ============ DATA FETCHING ============
  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const { search, studentClass, status, page, admissionType } = filters;
        const res = await API.get('/admin/students', {
          params: { search, studentClass, status, page, admissionType, limit: 10 }
        });
        setStudents(res.data.students);
        setPagination(res.data.pagination);
      } catch (err) {
        setToast({ message: "Failed to load directory", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => fetchStudents(), 300);
    return () => clearTimeout(timer);
  }, [filters]);

  // ============ MODAL HANDLERS ============
  const handleView = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  // ============ CRUD OPERATIONS ============
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      await API.put(`/admin/students/${selectedStudent._id}`, data);
      setToast({ message: "Student records updated!", type: "success" });
      setIsEditModalOpen(false);
      setFilters({ ...filters }); 
    } catch (err) {
      setToast({ message: "Update failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualReset = async () => {
    if (!resetPasswordValue) return;
    setSubmitting(true);
    try {
      await API.put('/admin/reset-password', {
        userId: selectedStudent._id,
        role: 'student',
        newPassword: resetPasswordValue
      });
      setToast({ message: "Password reset successfully!", type: "success" });
      setIsResetModalOpen(false);
      setResetPasswordValue("");
    } catch (err) {
      setToast({ message: "Failed to reset password", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (studentId, name) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await API.delete(`/admin/students/${studentId}`);
      setToast({ message: "Student marked as Inactive", type: "success" });
      setFilters({ ...filters });
    } catch (err) {
      setToast({ message: "Action failed", type: "error" });
    }
  };

  // ============ PDF GENERATION ============
  const handleCriteriaChange = (newCriteria) => {
    setExportCriteria(newCriteria);
    if (newCriteria === 'class') {
      setSelectedFields(prev => prev.filter(f => f !== 'class'));
    }
  };

  const toggleField = (id) => {
    setSelectedFields(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handlePreparePDF = async () => {
    if (selectedFields.length === 0) {
      setToast({ message: "Select at least one parameter.", type: "error" });
      return;
    }
    if (exportCriteria === 'class' && !pdfClass) {
      setToast({ message: "Select a target class.", type: "error" });
      return;
    }

    setIsGenerating(true);
    try {
      const apiParams = { status: 'active', limit: 1000, page: 1 };
      
      if (exportCriteria === 'class') {
        apiParams.studentClass = pdfClass;
      } else {
        apiParams.admissionType = 'New';
      }

      const res = await API.get('/admin/students', { params: apiParams });
      const studentsArray = res.data.students;

      if (!studentsArray || studentsArray.length === 0) {
        setToast({ message: "No records found.", type: "error" });
        setIsGenerating(false);
        return;
      }

      const pdfTitle = exportCriteria === 'class' 
        ? `Student List - Class ${pdfClass}` 
        : "New Admissions Master List";

      setTimeout(() => {
        generateStudentListPDF(studentsArray, pdfTitle, selectedFields);
        setToast({ message: "PDF Downloaded!", type: "success" });
        setIsPdfModalOpen(false);
        setIsGenerating(false);
      }, 400);
    } catch (err) {
      setToast({ message: "Generation failed.", type: "error" });
      setIsGenerating(false);
    }
  };

  // ============ RENDER ============
  if (loading && students.length === 0) {
    return <div className="py-20"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Student Directory</h1>
        <Button 
          variant="primary" 
          size="sm" 
          icon={FileText} 
          onClick={() => setIsPdfModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
        >
          Generate PDF
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col lg:flex-row items-center gap-4">
        <div className="w-full lg:flex-grow">
          <Input 
            placeholder="Search Name or UID" 
            icon={Search} 
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="border-none"
          />
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
          <select 
            className="h-12 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl px-4 font-bold text-xs outline-none min-w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
            value={filters.studentClass}
            onChange={(e) => setFilters({ ...filters, studentClass: e.target.value, page: 1 })}
          >
            <option value="">All Classes</option>
            {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'].map(c => (
              <option key={c} value={c}>Class {c}</option>
            ))}
          </select>

          <select 
            className="h-12 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl px-4 font-bold text-xs outline-none min-w-[160px] cursor-pointer hover:bg-gray-100 transition-colors"
            value={filters.admissionType}
            onChange={(e) => setFilters({ ...filters, admissionType: e.target.value, page: 1 })}
          >
            <option value="">All Types</option>
            <option value="New">New Admissions</option>
          </select>

          <select 
            className="h-12 bg-gray-50 border-2 border-transparent focus:border-primary rounded-xl px-4 font-bold text-xs outline-none min-w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option> 
          </select>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="py-20 text-center"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Class</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase">Parent Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-primary rounded-full flex items-center justify-center font-bold">
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900">{s.name}</p>
                            {s.admissionType === 'New' && (
                              <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-medium text-secondary">UID: {s.UID}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className="text-xs font-bold text-gray-700">Class {s.class}</span></td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-gray-700">{s.fatherMobile}</p>
                      <p className="text-[10px] text-secondary">{s.fatherName}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionBtn icon={Eye} color="text-primary" onClick={() => handleView(s)} />
                        <ActionBtn icon={Edit3} color="text-warning" onClick={() => handleEdit(s)} />
                        <ActionBtn icon={Key} color="text-purple-600" onClick={() => { setSelectedStudent(s); setIsResetModalOpen(true); }} />
                        {s.accountStatus === 'active' && <ActionBtn icon={UserX} color="text-danger" onClick={() => handleDeactivate(s._id, s.name)} />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden grid grid-cols-1 gap-3">
            {students.map((s) => (
              <Card key={s._id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-primary rounded-xl flex items-center justify-center font-bold">
                      {s.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{s.name}</p>
                      <p className="text-[10px] font-bold text-secondary uppercase">Class {s.class} • {s.UID}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleView(s)} className="p-2 bg-indigo-50 text-primary rounded-lg"><Eye size={16}/></button>
                    <button onClick={() => handleEdit(s)} className="p-2 bg-amber-50 text-warning rounded-lg"><Edit3 size={16}/></button>
                    <button onClick={() => { setSelectedStudent(s); setIsResetModalOpen(true); }} className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Key size={16}/></button>
                    <button onClick={() => handleDeactivate(s._id, s.name)} className="p-2 bg-red-50 text-danger rounded-lg"><UserX size={16}/></button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-primary rounded-xl flex items-center justify-center shadow-inner">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                  Total {filters.admissionType || 'All'} Records
                </p>
                <p className="text-sm font-black text-gray-900">
                  {pagination.totalItems || 0} Students Found
                </p>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-4">
                <button 
                  disabled={filters.page === 1} 
                  onClick={() => setFilters({...filters, page: filters.page - 1})} 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"
                >
                  <ChevronLeft size={20}/>
                </button>
                <div className="px-4 py-2 bg-indigo-50 rounded-lg border border-indigo-100">
                  <span className="text-xs font-black text-primary uppercase">
                    Page {filters.page} / {pagination.totalPages}
                  </span>
                </div>
                <button 
                  disabled={filters.page === pagination.totalPages} 
                  onClick={() => setFilters({...filters, page: filters.page + 1})} 
                  className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"
                >
                  <ChevronRight size={20}/>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ MODALS ============ */}
      
      {/* View Student Modal */}
      <ViewStudentModal 
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        student={selectedStudent}
        documentLabels={DOCUMENT_LABELS}
      />

      {/* Edit Student Modal */}
      <EditStudentModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
        onSubmit={handleUpdate}
        submitting={submitting}
      />

      {/* Password Reset Modal */}
      <PasswordResetModal 
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        student={selectedStudent}
        password={resetPasswordValue}
        setPassword={setResetPasswordValue}
        onReset={handleManualReset}
        submitting={submitting}
      />

      {/* PDF Export Modal */}
      <PdfExportModal 
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        exportCriteria={exportCriteria}
        onCriteriaChange={handleCriteriaChange}
        pdfClass={pdfClass}
        setPdfClass={setPdfClass}
        availableParams={availableParams}
        selectedFields={selectedFields}
        toggleField={toggleField}
        onGenerate={handlePreparePDF}
        isGenerating={isGenerating}
      />
    </div>
  );
};

// ============ SUBCOMPONENTS ============

const ActionBtn = ({ icon: Icon, color, onClick }) => (
  <button onClick={onClick} className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${color}`}>
    <Icon size={16} />
  </button>
);

const InfoBox = ({ label, value }) => (
  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
    <p className="text-[8px] font-black text-gray-400 uppercase leading-none mb-1">{label}</p>
    <p className="text-sm font-bold text-gray-800">{value || 'N/A'}</p>
  </div>
);

// ============ VIEW MODAL COMPONENT ============
const ViewStudentModal = ({ isOpen, onClose, student, documentLabels }) => {
  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Student Profile">
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 relative overflow-hidden">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-primary font-black text-2xl shadow-sm border-2 border-primary/10 overflow-hidden shrink-0 z-10">
            {student.profileImage ? (
              <img src={student.profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              student.name.charAt(0)
            )}
          </div>

          <div className="z-10">
            <h2 className="text-xl font-black text-gray-900">{student.name}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded-md border border-indigo-100">
                UID: {student.UID || 'Not assigned'}
              </p>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight shadow-sm border ${
                student.admissionType === 'New' 
                ? 'bg-amber-500 text-white border-amber-600' 
                : 'bg-emerald-500 text-white border-emerald-600'
              }`}>
                {student.admissionType === 'New' ? 'Fresh Admission' : 'Promoted Student'}
              </span>
            </div>
          </div>

          <div className="absolute -right-4 -bottom-4 opacity-5 text-indigo-900 pointer-events-none">
            <ShieldCheck size={100} />
          </div>
        </div>

        {/* Academic & Personal */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Academic & Personal</h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Grade Level" value={`Class ${student.class}`} />
            <InfoBox 
              label="Original Admission Date" 
              value={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'} 
            />
            <InfoBox label="Current Status" value={student.admissionType === 'New' ? 'Fresh Admission' : 'Promoted Student'} />
            <InfoBox label="Gender" value={student.gender} />
            <InfoBox label="Aadhar Number" value={student.aadharNumber || 'Not Provided'} />
            <InfoBox label="Date of Birth" value={new Date(student.dateOfBirth).toLocaleDateString('en-GB')} />
          </div>
        </div>

        {/* Parental Information */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Parental Information</h4>
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Father's Name" value={student.fatherName} />
            <InfoBox label="Father's Edu" value={student.fatherQualification} />
            <InfoBox label="Father's Mobile" value={student.fatherMobile} />
            <InfoBox label="Mother's Name" value={student.motherName} />
            <InfoBox label="Mother's Mobile" value={student.motherMobile} />
            <InfoBox label="Sibling Name" value={student.siblingName || 'None'} />
          </div>
        </div>

        {/* Communication Details */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Communication Details</h4>
          <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-100">
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Parent Email</p>
              <p className="text-sm font-bold text-gray-800">{student.parentEmail || 'No Email Provided'}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Residential Address</p>
              <p className="text-sm font-medium text-gray-600 leading-relaxed">{student.address}</p>
            </div>
            
            {/* Document Section - IMPROVED READABILITY */}
            {student.admissionType === 'New' && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="text-success" size={16} />
                  <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                    New Admission Documents
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {student.documents && 
                  Object.entries(student.documents)
                    .filter(([key, value]) => value === true)
                    .map(([key]) => (
                      <div 
                        key={key} 
                        className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-success/30 rounded-xl shadow-sm"
                      >
                        <div className="w-2 h-2 rounded-full bg-success flex-shrink-0"></div>
                        <span className="text-[11px] font-bold text-gray-800 tracking-tight">
                          {documentLabels[key] || key}
                        </span>
                      </div>
                  ))}

                  {(!student.documents || Object.values(student.documents).every(v => v === false)) && (
                    <p className="text-xs italic text-gray-500 px-1 py-2">No documents submitted at registration.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enrollment Timeline */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Enrollment Timeline</p>
          {student.academicHistory && student.academicHistory.length > 0 ? (
            <div className="space-y-2">
              {student.academicHistory.map((h, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white transition-colors">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <div className="flex-grow">
                    <p className="text-sm font-bold text-gray-800">Class {h.class}</p>
                    <p className="text-[10px] text-secondary font-medium uppercase tracking-tight">Session {h.year}</p>
                  </div>
                  <span className="text-[10px] font-black text-success uppercase bg-green-50 px-2 py-1 rounded-lg border border-green-100">
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-2xl text-center border border-dashed">
              <p className="text-xs text-secondary font-medium italic">This is the student's first session.</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

// ============ EDIT MODAL COMPONENT ============
const EditStudentModal = ({ isOpen, onClose, student, onSubmit, submitting }) => {
  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Student Records">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-4">
          <p className="text-[10px] font-black text-primary uppercase mb-2">Basic Info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Student Full Name" name="name" defaultValue={student.name} required />
            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary uppercase">Gender</label>
              <select name="gender" defaultValue={student.gender} className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary">
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input label="Date of Birth" name="dateOfBirth" type="date" defaultValue={student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : ''} required />
            <div className="space-y-1">
              <label className="text-xs font-bold text-secondary uppercase">Assign Class</label>
              <select name="class" defaultValue={student.class} className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary">
                {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'].map(c => (
                  <option key={c} value={c}>Class {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
          <p className="text-[10px] font-black text-secondary uppercase mb-2">Parental & Contact Information</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Father's Name" name="fatherName" defaultValue={student.fatherName} required />
            <Input label="Father's Mobile" name="fatherMobile" defaultValue={student.fatherMobile} required />
            <Input label="Mother's Name" name="motherName" defaultValue={student.motherName} required />
            <Input label="Mother's Mobile" name="motherMobile" defaultValue={student.motherMobile} required />
          </div>
          <div className="space-y-1 mt-4">
            <label className="text-xs font-bold text-secondary uppercase">Admission Status</label>
            <select 
              name="admissionType" 
              defaultValue={student.admissionType} 
              className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary"
            >
              <option value="New">Fresh Admission (New)</option>
              <option value="Old">Promoted Student (Old)</option>
            </select>
          </div>
          <div className="mt-4">
            <Input label="Parent Email Address" name="parentEmail" defaultValue={student.parentEmail} />
          </div>
        </div>

        <Input label="Residential Address" name="address" defaultValue={student.address} required icon={MapPin} />

        <div className="pt-4">
          <Button type="submit" fullWidth isLoading={submitting}>Save All Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

// ============ PASSWORD RESET MODAL COMPONENT ============
const PasswordResetModal = ({ isOpen, onClose, student, password, setPassword, onReset, submitting }) => {
  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manual Password Reset">
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
          <p className="text-xs font-bold text-purple-700 uppercase">Target: {student.name}</p>
          <p className="text-[10px] text-purple-400 mt-1">Enter the new password the student will use to log in.</p>
        </div>

        <Input 
          label="New Password" 
          placeholder="Enter new password..." 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onClose}>Cancel</Button>
          <Button fullWidth isLoading={submitting} onClick={onReset}>Update Password</Button>
        </div>
      </div>
    </Modal>
  );
};

// ============ PDF EXPORT MODAL COMPONENT ============
const PdfExportModal = ({ 
  isOpen, 
  onClose, 
  exportCriteria, 
  onCriteriaChange, 
  pdfClass, 
  setPdfClass, 
  availableParams, 
  selectedFields, 
  toggleField, 
  onGenerate, 
  isGenerating 
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Student Records">
      <div className="space-y-6">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">1. Report Type</label>
          <div className="flex p-1 bg-gray-100 rounded-2xl">
            <button 
              type="button"
              onClick={() => onCriteriaChange('class')}
              className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${exportCriteria === 'class' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              Class-Wise
            </button>
            <button 
              type="button"
              onClick={() => onCriteriaChange('new_admission')}
              className={`flex-1 py-2.5 text-xs font-black uppercase rounded-xl transition-all ${exportCriteria === 'new_admission' ? 'bg-white text-primary shadow-sm' : 'text-secondary'}`}
            >
              New Admissions
            </button>
          </div>
        </div>

        {/* Conditional Class Selection */}
        {exportCriteria === 'class' && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">2. Select Target Class</label>
            <select 
              className="w-full h-12 bg-gray-50 border-2 border-gray-100 rounded-xl px-4 font-bold mt-1 outline-none focus:border-primary transition-all"
              value={pdfClass}
              onChange={(e) => setPdfClass(e.target.value)}
            >
              <option value="">Choose Class...</option>
              {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'].map(c => 
                <option key={c} value={c}>Class {c}</option>
              )}
            </select>
          </div>
        )}

        {/* Parameter Selection */}
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-widest">
            {exportCriteria === 'class' ? '3. Choose Parameters' : '2. Choose Parameters'}
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {/* Special Class Parameter for New Admissions */}
            {exportCriteria === 'new_admission' && (
              <button
                type="button"
                onClick={() => toggleField('class')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                  selectedFields.includes('class') ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-white border-gray-100 text-secondary'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedFields.includes('class') ? 'bg-amber-500 border-amber-500' : 'bg-white'}`}>
                  {selectedFields.includes('class') && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                Target Class
              </button>
            )}

            {/* Regular Parameters */}
            {availableParams.map(param => (
              <button
                key={param.id}
                type="button"
                onClick={() => toggleField(param.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-[11px] font-bold ${
                  selectedFields.includes(param.id) ? 'bg-indigo-50 border-primary text-primary' : 'bg-white border-gray-100 text-secondary'
                }`}
              >
                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${selectedFields.includes(param.id) ? 'bg-primary border-primary' : 'bg-white'}`}>
                  {selectedFields.includes(param.id) && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                {param.label}
              </button>
            ))}
          </div>
        </div>

        <Button 
          fullWidth 
          onClick={onGenerate}
          isLoading={isGenerating}
          icon={FileText}
        >
          Generate PDF Report
        </Button>
      </div>
    </Modal>
  );
};

export default StudentDirectory;