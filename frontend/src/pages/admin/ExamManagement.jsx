import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Clock, CheckCircle2, Play, Power, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import { useSettings } from '../../context/SettingsContext';

const ExamManagement = () => {
  const [exams, setExams] = useState([]);
  const { settings } = useSettings();

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // 1. Fetch Exam List
  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/exams?year=${settings.currentAcademicYear}`);
      setExams(res.data);
    } catch (err) {
      setToast({ message: "Failed to load exams", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
  // Security Handshake: Always confirm before destructive actions
  if (!window.confirm(`CRITICAL ACTION: Are you sure you want to delete "${name}"? This will also permanently delete all marks entered for this exam. This cannot be undone.`)) {
    return;
  }

  try {
    await API.delete(`/admin/exams/${id}`);
    
    // UI Update: Filter out the deleted exam from state so it disappears instantly
    setExams(prev => prev.filter(exam => exam._id !== id));
    
    setToast({ message: "Exam event removed from records", type: "success" });
  } catch (err) {
    setToast({ message: "Failed to delete exam. It might have linked records.", type: "error" });
  }
};

  // 2. Create New Exam Event
  const onCreateExam = async (data) => {
    setSubmitting(true);
    try {
      await API.post('/admin/exams', { ...data, academicYear: settings.currentAcademicYear });
      setToast({ message: "New exam scheduled successfully!", type: "success" });
      setIsModalOpen(false);
      reset();
      fetchExams();
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Creation failed", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Update Exam Status Handshake
  const updateStatus = async (examId, newStatus) => {
    try {
      await API.put(`/admin/exams/${examId}/status`, { status: newStatus });
      setToast({ message: `Exam is now ${newStatus}`, type: "success" });
      fetchExams();
    } catch (err) {
      setToast({ message: "Status update failed", type: "error" });
    }
  };

  // Helper: Status Color Map
  const statusConfig = {
    Scheduled: "bg-blue-50 text-blue-600 border-blue-100",
    Ongoing: "bg-green-50 text-success border-green-100",
    Completed: "bg-gray-50 text-gray-400 border-gray-100",
    Cancelled: "bg-red-50 text-danger border-red-100"
  };

  if (loading && exams.length === 0) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight text-indigo-700">Exam Scheduler</h1>
          <p className="text-sm text-secondary font-medium">Global academic examination lifecycle management.</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Create Exam Event
        </Button>
      </div>

      {/* 4. Exam Card Stack */}
{/* 4. Exam Card Stack */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {exams.length > 0 ? (
    exams.map((exam) => (
      <Card key={exam._id} className="relative overflow-hidden group min-h-[160px]">
        
        {/* 1. DELETE BUTTON (Far Top-Left) */}
        <button 
          onClick={(e) => {
            e.stopPropagation(); 
            handleDelete(exam._id, exam.examName);
          }}
          className="absolute top-3 left-3 w-8 h-8 flex items-center justify-center text-danger bg-red-50 hover:bg-danger hover:text-white rounded-xl border border-red-100 transition-all opacity-0 group-hover:opacity-100 z-30 shadow-sm active:scale-90"
          title="Delete Exam Record"
        >
          <Trash2 size={16} />
        </button>

        {/* 2. STATUS BADGE (Far Top-Right - ONLY ONE VERSION) */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase border z-20 ${statusConfig[exam.status]}`}>
          {exam.status}
        </div>

        {/* 3. MAIN CONTENT (With top padding to avoid icons) */}
        <div className="pt-10 space-y-5"> 
          
          {/* Header Row */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100 shadow-sm">
              <FileText size={20} />
            </div>
            <div className="pr-16"> {/* Right padding prevents text hitting the badge */}
              <h3 className="font-black text-gray-800 leading-tight text-base">
                {exam.examName}
              </h3>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-0.5">
                {exam.examType}
              </p>
            </div>
          </div>

          {/* Date Info Section */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100/50">
             <div className="text-center flex-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Starts</p>
                <p className="text-xs font-bold text-gray-700">{new Date(exam.startDate).toLocaleDateString('en-GB')}</p>
             </div>
             <ArrowRight size={14} className="text-gray-300 mx-2" />
             <div className="text-center flex-1">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Ends</p>
                <p className="text-xs font-bold text-gray-700">{new Date(exam.endDate).toLocaleDateString('en-GB')}</p>
             </div>
          </div>

                {/* 5. Status Workflow Actions */}
                <div className="flex gap-2 pt-2">
                  {exam.status === 'Scheduled' && (
                    <Button fullWidth size="sm" icon={Play} onClick={() => updateStatus(exam._id, 'Ongoing')}>
                      Start Exam
                    </Button>
                  )}
                  {exam.status === 'Ongoing' && (
                    <Button fullWidth variant="success" size="sm" icon={CheckCircle2} onClick={() => updateStatus(exam._id, 'Completed')}>
                      Close & Finish
                    </Button>
                  )}
                  {exam.status === 'Completed' && (
                    <div className="flex items-center justify-center w-full gap-2 text-success font-bold text-xs py-2 bg-green-50 rounded-xl">
                       <ShieldCheck size={16} /> Results Published
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-20 text-center opacity-30">
            <Calendar size={64} className="mx-auto mb-4" />
            <p className="font-bold text-lg">No exams scheduled for this session.</p>
          </div>
        )}
      </div>

      {/* 6. Create Exam Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="New Exam Event"
      >
        <form onSubmit={handleSubmit(onCreateExam)} className="space-y-5">
          <Input 
            label="Examination Name" 
            placeholder="e.g. Second Terminal Exam" 
            {...register("examName", { required: "Name required" })}
            error={errors.examName?.message}
          />
          
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Exam Type</label>
            <select 
              className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold text-gray-800 outline-none focus:border-primary"
              {...register("examType", { required: true })}
            >
              <option value="Unit Test">Unit Test</option>
              <option value="Mid-term">Mid-term</option>
              <option value="Final">Final Examination</option>
              <option value="Internal">Internal Assessment</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <Input label="Start Date" type="date" {...register("startDate", { required: true })} />
             <Input label="End Date" type="date" {...register("endDate", { required: true })} />
          </div>

          <Input 
            label="Maximum Marks (Total)" 
            type="number" 
            placeholder="e.g. 40 or 100" 
            {...register("maxMarks", { required: "Total marks are required", min: 1 })}
            error={errors.maxMarks?.message}
        />

          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-warning">
             <Power size={20} className="shrink-0" />
             <p className="text-[10px] font-bold uppercase leading-relaxed">
               Logic: Only exams set to "Ongoing" status are visible to teachers for marks entry.
             </p>
          </div>

          <Button type="submit" fullWidth isLoading={submitting} icon={Plus}>Create Schedule</Button>
        </form>
      </Modal>
    </div>
  );
};

export default ExamManagement;