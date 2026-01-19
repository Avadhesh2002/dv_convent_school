import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  MapPin, 
  Mail,
  Users, 
  Send, 
  Camera, 
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import API from '../../api/axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import { useSettings } from '../../context/SettingsContext';

const StudentRegistration = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  
  // --- 1. FORM & UI STATES ---
  const [currentStep, setCurrentStep] = useState(1); // ✅ ADDED THIS
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isNewAdmission, setIsNewAdmission] = useState(false);

  const { register, handleSubmit, setValue, trigger,  formState: { errors } } = useForm();

  // Documents CheckBox
  const CHECKLIST_DOCS = [
    { id: 'transferCertificate', label: 'Transfer Certificate' },
    { id: 'characterCertificate', label: 'Character Certificate' },
    { id: 'markSheet', label: 'Mark Sheet' },
    { id: 'migrationCertificate', label: 'Migration Certificate' },
    { id: 'casteCertificate', label: 'Caste Certificate' },
    { id: 'birthCertificate', label: 'Birth Certificate' },
    { id: 'fivePhotos', label: '5 Photos Physical' },
    { id: 'aadharPhotoCopy', label: 'Aadhar Photo Copy (Student & Parent)' },
  ];

  // --- EVENT HANDLERS ---
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        setToast({ message: "File is too large. Max 2MB.", type: "error" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        profileImage: imagePreview,
        academicYear: settings.currentAcademicYear,
        admissionType: isNewAdmission ? 'New' : 'Old'
      };
      await API.post('/students/register', payload);
      setToast({ message: "Application submitted successfully!", type: "success" });
      setTimeout(() => navigate('/'), 3000);
    } catch (err) {
      setToast({ message: err.response?.data?.message || "Registration failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Registration Closed Check
  if (!settings.isRegistrationOpen) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-amber-50 text-warning rounded-full flex items-center justify-center mb-4">
          <Info size={40} />
        </div>
        <h1 className="text-2xl font-black">Admissions Closed</h1>
        <p className="text-secondary mt-2">Currently not accepting applications for {settings.currentAcademicYear}.</p>
        <Button className="mt-6" onClick={() => navigate('/')}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <form onSubmit={handleSubmit(onSubmit)}> {/* ✅ WRAPPED IN FORM TAG */}
        <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          
          {/* HEADER WITH PROGRESS BAR */}
          <div className="bg-primary p-6 text-white relative overflow-hidden">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="mb-4 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft />
            </button>
            <h1 className="text-2xl font-black">Admission Application</h1>
            <p className="text-indigo-100 text-sm">Session {settings.currentAcademicYear}</p>
            
            {/* Progress Indicator */}
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map(step => (
                <div 
                  key={step} 
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    step <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`} 
                />
              ))}
            </div>
          </div>

          {/* STEP CONTENT */}
          <div className="p-8 space-y-6">
            
            {/* ========== STEP 1: STUDENT DETAILS ========== */}
            {currentStep === 1 && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <User className="text-primary" size={20} />
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Student Details</h3>
                </div>
                
                <Input 
                  label="Full Name" 
                  required 
                  placeholder="Enter student's full name"
                  {...register("name", { required: "Name is required" })} 
                  error={errors.name?.message}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-secondary uppercase">Gender *</label>
                    <select 
                      className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary transition-colors" 
                      {...register("gender", { required: true })}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input 
                    label="Date of Birth" 
                    type="date" 
                    required 
                    {...register("dateOfBirth", { required: "DOB is required" })} 
                    error={errors.dateOfBirth?.message}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase">Applying for Class *</label>
                  <select 
                    className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary transition-colors" 
                    {...register("class", { required: true })}
                  >
                    {['LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'].map(c => 
                      <option key={c} value={c}>Class {c}</option>
                    )}
                  </select>
                </div>

                <Input 
                  label="Home Address" 
                  icon={MapPin} 
                  required 
                  placeholder="Full residential address"
                  {...register("address", { required: "Address is required" })} 
                  error={errors.address?.message}
                />

                <Button 
                  type="button" 
                  fullWidth 
                  onClick={async () => {
                    // 1. List the fields in Step 1
                    const fieldsStep1 = ["name", "gender", "dateOfBirth", "class", "address"];
                    
                    // 2. Trigger validation for these fields only
                    const isValid = await trigger(fieldsStep1);
                    
                    // 3. Only move forward if valid
                    if (isValid) {
                      setCurrentStep(2);
                    }
                  }} 
                  icon={ChevronRight}
                >
                  Continue to Parent Details
                </Button>
              </>
            )}

            {/* ========== STEP 2: PARENT INFORMATION ========== */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Users className="text-primary" size={20} />
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Parent Information</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Father's Name" 
                    required 
                    {...register("fatherName", { required: "Father's name is required" })} 
                    error={errors.fatherName?.message}
                  />
                  <Input 
                    label="Father's Mobile" 
                    icon={Phone} 
                    required 
                    type="tel" // Use tel for mobile keypad
                    maxLength="10" // UI restriction
                    placeholder="Enter 10 digit number"
                    {...register("fatherMobile", { 
                      required: "Contact number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Mobile number must be exactly 10 digits"
                      },
                      minLength: { value: 10, message: "Exactly 10 digits required" },
                      maxLength: { value: 10, message: "Exactly 10 digits required" }
                    })} 
                    error={errors.fatherMobile?.message}
                  />
                  <Input 
                    label="Mother's Name" 
                    required 
                    {...register("motherName", { required: "Mother's name is required" })} 
                    error={errors.motherName?.message}
                  />
                  <Input 
                    label="Mother's Mobile" 
                    icon={Phone} 
                    required 
                    type="tel" // Use tel for mobile keypad
                    maxLength="10" // UI restriction
                    placeholder="Enter 10 digit number"
                    {...register("motherMobile", { 
                      required: "Contact number is required",
                      pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Mobile number must be exactly 10 digits"
                      },
                      minLength: { value: 10, message: "Exactly 10 digits required" },
                      maxLength: { value: 10, message: "Exactly 10 digits required" }
                    })} 
                    error={errors.fatherMobile?.message}
                  />
                </div>

                <Input 
                  label="Parent Email" 
                  icon={Mail} 
                  type="email"
                  required={true}
                  placeholder="parent@email.com" 
                  {...register("parentEmail", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })} 
                  error={errors.parentEmail?.message}
                />

                {/* OPTIONAL FIELDS */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase mb-3">Optional Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      label="Father's Qualification" 
                      placeholder="e.g., B.Tech, M.Com"
                      {...register("fatherQualification")} 
                    />
                    <Input 
                      label="Sibling in School" 
                      placeholder="Name if already enrolled"
                      {...register("siblingName")} 
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    fullWidth 
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </Button>

                  <Button 
                    type="button" 
                    fullWidth 
                    onClick={async () => {
                      // 1. List the fields in Step 2
                      const fieldsStep2 = ["fatherName", "fatherMobile", "motherName", "motherMobile", "parentEmail"];
                      
                      // 2. Trigger validation
                      const isValid = await trigger(fieldsStep2);
                      
                      // 3. Only move forward if valid
                      if (isValid) {
                        setCurrentStep(3);
                      }
                    }} 
                    icon={ChevronRight}
                  >
                    Final Step
                  </Button>

                </div>
              </>
            )}

            {/* ========== STEP 3: ADDITIONAL DETAILS ========== */}
            {currentStep === 3 && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <ShieldCheck className="text-primary" size={20} />
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Additional Details</h3>
                </div>

                {/* PHOTO UPLOAD */}
                <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="relative group">
                    <div className="w-32 h-40 bg-white border-2 border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-4">
                          <Camera size={32} className="mx-auto text-gray-300 mb-2" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Optional Photo</p>
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-3 -right-3 bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-indigo-600 transition-colors">
                      <Camera size={20} />
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                      />
                    </label>
                  </div>
                  <p className="text-xs text-secondary mt-3">You can upload this later</p>
                </div>

                {/* AADHAR - SIMPLIFIED */}
                <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <label className="text-xs font-bold text-primary uppercase">Aadhar Card Number (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="XXXX-XXXX-XXXX" 
                    maxLength="14"
                    className="w-full h-12 border-2 border-indigo-100 rounded-xl px-4 font-bold text-center tracking-wider outline-none focus:border-primary transition-colors"
                    {...register("aadharNumber")}
                  />
                  <p className="text-[10px] text-indigo-600 font-medium">Leave blank if not available</p>
                </div>

                {/* NEW ADMISSION CHECKBOX */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                  <input 
                    type="checkbox" 
                    id="newAdmission" 
                    checked={isNewAdmission}
                    onChange={(e) => setIsNewAdmission(e.target.checked)}
                    className="w-5 h-5 rounded accent-warning mt-0.5 cursor-pointer" 
                  />
                  <label htmlFor="newAdmission" className="text-sm font-bold text-amber-800 cursor-pointer">
                    ⚠️ I am taking <span className="underline">NEW ADMISSION</span> in this school (not continuing from previous year)
                  </label>
                </div>

                {/* DOCUMENT CHECKLIST - CONDITIONAL */}
                {isNewAdmission && (
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-grow bg-red-200"></div>
                      <span className="text-xs font-black text-red-600 uppercase">Required Documents</span>
                      <div className="h-px flex-grow bg-red-200"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {CHECKLIST_DOCS.map((doc) => (
                        <label 
                          key={doc.id} 
                          className="flex items-center gap-3 p-3 bg-white border-2 border-gray-100 rounded-xl hover:border-primary transition-all cursor-pointer group"
                        >
                          <input 
                            type="checkbox" 
                            {...register(`documents.${doc.id}`)} 
                            className="w-5 h-5 rounded accent-success" 
                          />
                          <span className="text-xs font-bold text-gray-600 group-hover:text-primary transition-colors">
                            {doc.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    fullWidth 
                    onClick={() => setCurrentStep(2)}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    fullWidth 
                    icon={Send} 
                    isLoading={loading}
                  >
                    Submit Application
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default StudentRegistration;