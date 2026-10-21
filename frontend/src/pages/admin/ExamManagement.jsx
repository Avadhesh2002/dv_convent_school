import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Calendar, CheckCircle2, Play, Trash2,
  ArrowRight, ShieldCheck, Send, EyeOff, BookOpen, Layers
} from 'lucide-react';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Toast from '../../components/common/Toast';
import { useSettings } from '../../context/SettingsContext';

// ── CBSE component config ──────────────────────────────────────
const TERM_COMPONENTS = {
  'Term-1': [
    { key: 'periodicTest',  label: 'Unit Test / Periodic Test', marks: 10 },
    { key: 'subEnrichment', label: 'Subject Enrichment',        marks: 5  },
    { key: 'noteBooks',     label: 'Note Books',                marks: 5  },
    { key: 'halfYearlyExam',label: 'Half Yearly Exam',          marks: 80 },
  ],
  'Term-2': [
    { key: 'periodicTest',  label: 'Unit Test / Periodic Test', marks: 10 },
    { key: 'subEnrichment', label: 'Subject Enrichment',        marks: 5  },
    { key: 'noteBooks',     label: 'Note Books',                marks: 5  },
    { key: 'yearlyExam',    label: 'Final / Yearly Exam',       marks: 80 },
  ],
};

const COMPONENT_LABEL = {
  periodicTest:   'Unit Test',
  subEnrichment:  'Sub. Enrichment',
  noteBooks:      'Note Books',
  halfYearlyExam: 'Half Yearly Exam',
  yearlyExam:     'Final Exam',
};

const COMPONENT_COLOR = {
  periodicTest:   'bg-blue-100 text-blue-700',
  subEnrichment:  'bg-purple-100 text-purple-700',
  noteBooks:      'bg-teal-100 text-teal-700',
  halfYearlyExam: 'bg-indigo-100 text-indigo-700',
  yearlyExam:     'bg-orange-100 text-orange-700',
};

const TERM_COLOR = {
  'Term-1': { bg: 'bg-indigo-600', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  'Term-2': { bg: 'bg-orange-600', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

// ─────────────────────────────────────────────────────────────
const ExamManagement = () => {
  const { settings } = useSettings();
  const [exams, setExams]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  // Form state
  const [fTerm, setFTerm]           = useState('Term-1');
  const [fComponent, setFComponent] = useState('periodicTest');
  const [fName, setFName]           = useState('');
  const [fStart, setFStart]         = useState('');
  const [fEnd, setFEnd]             = useState('');
  const [fMaxMarks, setFMaxMarks]   = useState(10);

  // Auto-set maxMarks when component changes
  useEffect(() => {
    const comps = TERM_COMPONENTS[fTerm] || [];
    const found = comps.find(c => c.key === fComponent);
    if (found) setFMaxMarks(found.marks);
  }, [fTerm, fComponent]);

  // Auto-generate exam name
  useEffect(() => {
    const compLabel = COMPONENT_LABEL[fComponent] || fComponent;
    const termNum   = fTerm === 'Term-1' ? '1' : '2';
    setFName(`${compLabel} - Term ${termNum}`);
  }, [fTerm, fComponent]);

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/admin/exams?year=${settings.currentAcademicYear}`);
      setExams(res.data);
    } catch {
      setToast({ message: 'Failed to load exams', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" delete karna chahte ho? Saare marks bhi delete ho jayenge.`)) return;
    try {
      await API.delete(`/admin/exams/${id}`);
      setExams(prev => prev.filter(e => e._id !== id));
      setToast({ message: 'Exam deleted', type: 'success' });
    } catch {
      setToast({ message: 'Delete failed', type: 'error' });
    }
  };

  const onCreateExam = async (e) => {
    e.preventDefault();
    if (!fName || !fStart || !fEnd) {
      setToast({ message: 'Saare fields fill karo', type: 'error' }); return;
    }
    setSubmitting(true);
    try {
      await API.post('/admin/exams', {
        examName:    fName,
        examType:    fComponent === 'halfYearlyExam' || fComponent === 'yearlyExam' ? 'Final' : 'Unit Test',
        academicYear: settings.currentAcademicYear,
        startDate:   fStart,
        endDate:     fEnd,
        maxMarks:    fMaxMarks,
        term:        fTerm,
        component:   fComponent,
      });
      setToast({ message: 'Exam created!', type: 'success' });
      setIsModalOpen(false);
      fetchExams();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Creation failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (examId, newStatus) => {
    try {
      await API.put(`/admin/exams/${examId}/status`, { status: newStatus });
      setToast({ message: `Status updated: ${newStatus}`, type: 'success' });
      fetchExams();
    } catch {
      setToast({ message: 'Status update failed', type: 'error' });
    }
  };

  const handlePublish = async (examId, examName) => {
    if (!window.confirm(`"${examName}" ke results students ko dikhane chahte ho?`)) return;
    try {
      const res = await API.put(`/admin/exams/${examId}/publish`);
      setToast({ message: res.data.message, type: 'success' });
      fetchExams();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Publish failed', type: 'error' });
    }
  };

  const handleUnpublish = async (examId) => {
    try {
      await API.put(`/admin/exams/${examId}/unpublish`);
      setToast({ message: 'Results unpublish ho gaye', type: 'success' });
      fetchExams();
    } catch {
      setToast({ message: 'Unpublish failed', type: 'error' });
    }
  };

  const statusConfig = {
    Scheduled: 'bg-blue-50 text-blue-600 border-blue-100',
    Ongoing:   'bg-green-50 text-green-600 border-green-100',
    Completed: 'bg-amber-50 text-amber-600 border-amber-100',
    Cancelled: 'bg-red-50 text-red-500 border-red-100',
  };

  // Group exams by term
  const term1Exams  = exams.filter(e => e.term === 'Term-1');
  const term2Exams  = exams.filter(e => e.term === 'Term-2');
  const otherExams  = exams.filter(e => !e.term);

  // Ordering within term (component order)
  const COMP_ORDER = ['periodicTest','subEnrichment','noteBooks','halfYearlyExam','yearlyExam'];
  const sortByComp = (arr) => [...arr].sort((a, b) =>
    COMP_ORDER.indexOf(a.component) - COMP_ORDER.indexOf(b.component)
  );

  if (loading && exams.length === 0) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  const ExamCard = ({ exam }) => {
    const tc = TERM_COLOR[exam.term] || { bg:'bg-gray-600', light:'bg-gray-50', text:'text-gray-600', border:'border-gray-200' };
    return (
      <Card className="relative overflow-hidden group">
        {/* Delete */}
        <button
          onClick={() => handleDelete(exam._id, exam.examName)}
          className="absolute top-3 left-3 w-7 h-7 flex items-center justify-center text-red-400 bg-red-50 hover:bg-red-500 hover:text-white rounded-lg border border-red-100 opacity-0 group-hover:opacity-100 transition-all z-10"
        >
          <Trash2 size={13} />
        </button>

        {/* Status badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border z-10 ${statusConfig[exam.status]}`}>
          {exam.resultsPublished ? '✅ Published' : exam.status}
        </div>

        <div className="pt-9 space-y-3">
          {/* Component pill + marks */}
          <div className="flex items-center gap-2 flex-wrap">
            {exam.component && (
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${COMPONENT_COLOR[exam.component] || 'bg-gray-100 text-gray-600'}`}>
                {COMPONENT_LABEL[exam.component] || exam.component}
              </span>
            )}
            <span className="text-[10px] font-bold text-gray-400">Max: {exam.maxMarks}</span>
          </div>

          {/* Name */}
          <h3 className="font-black text-gray-800 text-sm leading-tight pr-4">{exam.examName}</h3>

          {/* Dates */}
          <div className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-gray-600">
            <Calendar size={12} className="text-gray-400" />
            {new Date(exam.startDate).toLocaleDateString('en-GB')}
            <ArrowRight size={12} className="text-gray-300" />
            {new Date(exam.endDate).toLocaleDateString('en-GB')}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {exam.status === 'Scheduled' && (
              <Button fullWidth size="sm" icon={Play} onClick={() => updateStatus(exam._id, 'Ongoing')}>
                Start (Marks Entry Open)
              </Button>
            )}
            {exam.status === 'Ongoing' && (
              <button
                onClick={() => updateStatus(exam._id, 'Completed')}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg h-9 transition-all"
              >
                <CheckCircle2 size={14} /> Close Exam (Marks Band)
              </button>
            )}
            {exam.status === 'Completed' && !exam.resultsPublished && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-amber-600 font-semibold text-center">Closed — students ko nahi dikh raha</p>
                <Button fullWidth variant="success" size="sm" icon={Send}
                  onClick={() => handlePublish(exam._id, exam.examName)}>
                  Publish Results
                </Button>
              </div>
            )}
            {exam.status === 'Completed' && exam.resultsPublished && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xs py-2 bg-green-50 rounded-xl border border-green-200">
                  <ShieldCheck size={14} /> Published
                  {exam.publishedAt && <span className="text-[10px] text-gray-400 font-normal">({new Date(exam.publishedAt).toLocaleDateString('en-IN')})</span>}
                </div>
                <button onClick={() => handleUnpublish(exam._id)}
                  className="w-full text-[10px] text-gray-400 hover:text-red-500 font-bold flex items-center justify-center gap-1 py-1 transition-colors">
                  <EyeOff size={11} /> Unpublish
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const TermSection = ({ termLabel, termExams }) => {
    if (!termExams.length) return null;
    const tc = TERM_COLOR[termLabel];
    const totalMax = TERM_COMPONENTS[termLabel]?.reduce((s, c) => s + c.marks, 0) || 100;
    const created  = termExams.length;
    const total    = TERM_COMPONENTS[termLabel]?.length || 4;
    return (
      <div className="space-y-3">
        {/* Term header */}
        <div className={`flex items-center gap-3 p-3 ${tc.light} rounded-2xl border ${tc.border}`}>
          <div className={`w-8 h-8 ${tc.bg} rounded-xl flex items-center justify-center`}>
            <Layers size={16} className="text-white" />
          </div>
          <div className="flex-1">
            <p className={`font-black text-sm ${tc.text}`}>{termLabel}</p>
            <p className="text-[10px] text-gray-400 font-semibold">{created}/{total} components • Total marks: {totalMax}</p>
          </div>
          {/* Progress dots */}
          <div className="flex gap-1">
            {TERM_COMPONENTS[termLabel]?.map((comp, i) => {
              const done = termExams.some(e => e.component === comp.key);
              return <div key={i} className={`w-2 h-2 rounded-full ${done ? tc.bg : 'bg-gray-200'}`} />;
            })}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortByComp(termExams).map(exam => <ExamCard key={exam._id} exam={exam} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Exam Scheduler</h1>
          <p className="text-sm text-gray-500 font-medium">CBSE Term-wise exam aur component management</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          New Exam Component
        </Button>
      </div>

      {/* CBSE structure info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {['Term-1','Term-2'].map(term => {
          const tc = TERM_COLOR[term];
          return (
            <div key={term} className={`p-4 ${tc.light} rounded-2xl border ${tc.border}`}>
              <p className={`font-black text-sm ${tc.text} mb-2`}>{term} — {term === 'Term-1' ? 'Half Yearly' : 'Annual'}</p>
              <div className="flex flex-wrap gap-1.5">
                {TERM_COMPONENTS[term].map(c => (
                  <span key={c.key} className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${COMPONENT_COLOR[c.key] || 'bg-gray-100 text-gray-600'}`}>
                    {c.label} ({c.marks})
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Term sections */}
      {exams.length === 0 && !loading ? (
        <div className="py-20 text-center opacity-30">
          <Calendar size={64} className="mx-auto mb-4" />
          <p className="font-bold text-lg">Koi exam nahi hai. "New Exam Component" se banao.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <TermSection termLabel="Term-1" termExams={term1Exams} />
          <TermSection termLabel="Term-2" termExams={term2Exams} />
          {otherExams.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Other / Legacy Exams</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherExams.map(e => <ExamCard key={e._id} exam={e} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Exam Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Exam Component">
        <form onSubmit={onCreateExam} className="space-y-4">

          {/* Term selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Term</label>
            <div className="grid grid-cols-2 gap-2">
              {['Term-1', 'Term-2'].map(t => (
                <button key={t} type="button"
                  onClick={() => { setFTerm(t); setFComponent(TERM_COMPONENTS[t][0].key); }}
                  className={`h-11 rounded-xl font-black text-sm border-2 transition-all ${
                    fTerm === t
                      ? t === 'Term-1' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Component selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Component</label>
            <div className="grid grid-cols-1 gap-2">
              {TERM_COMPONENTS[fTerm].map(comp => (
                <button key={comp.key} type="button"
                  onClick={() => setFComponent(comp.key)}
                  className={`flex items-center justify-between h-11 px-4 rounded-xl border-2 font-bold text-sm transition-all ${
                    fComponent === comp.key
                      ? `${COMPONENT_COLOR[comp.key]} border-current`
                      : 'bg-gray-50 text-gray-600 border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <span>{comp.label}</span>
                  <span className="text-xs font-black opacity-70">Max: {comp.marks}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-generated name (editable) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Exam Name</label>
            <input
              value={fName}
              onChange={e => setFName(e.target.value)}
              className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold text-gray-800 outline-none focus:border-indigo-400"
              placeholder="e.g. Unit Test - Term 1"
              required
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
              <input type="date" value={fStart} onChange={e => setFStart(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-indigo-400"
                required />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">End Date</label>
              <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)}
                className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-indigo-400"
                required />
            </div>
          </div>

          {/* Max marks (auto, read-only) */}
          <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${
            fTerm === 'Term-1' ? 'bg-indigo-50 border-indigo-200' : 'bg-orange-50 border-orange-200'}`}>
            <span className="text-sm font-bold text-gray-600">Maximum Marks</span>
            <span className="text-xl font-black text-gray-800">{fMaxMarks}</span>
          </div>

          <Button type="submit" fullWidth isLoading={submitting} icon={Plus}>
            Create {COMPONENT_LABEL[fComponent]}
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default ExamManagement;
