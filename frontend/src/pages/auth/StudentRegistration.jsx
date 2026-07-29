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
  Info,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import API from '../../api/axios';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Toast from '../../components/common/Toast';
import ImagePickerWithCrop from '../../components/common/ImagePickerWithCrop';
import { useSettings } from '../../context/SettingsContext';


const formatAadhar = (value) => {
  const digits = value.replace(/\D/g, ""); 
  const trimmed = digits.substring(0, 12); 
  const sections = trimmed.match(/.{1,4}/g); 
  return sections ? sections.join("-") : trimmed;
};


const formatPEN = (value) => {
  // Strip non-digits, allow max 12 digits
  return value.replace(/\D/g, "").substring(0, 12);
};

const StudentRegistration = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();
  
  // --- 1. FORM & UI STATES ---
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { register, handleSubmit, setValue, trigger, watch, formState: { errors } } = useForm();

  // Documents CheckBox - updated list as per requirement
  const CHECKLIST_DOCS = [
    { id: 'transferCertificate',  label: 'Transfer Certificate' },
    { id: 'migrationCertificate', label: 'Migration Certificate' },
    { id: 'characterCertificate', label: 'Character Certificate' },
    { id: 'casteCertificate',     label: 'Caste Certificate' },
    { id: 'birthCertificate',     label: 'Birth Certificate' },
    { id: 'markSheet',            label: 'Previous Class Result' },
    { id: 'fivePhotos',           label: '5 Photograph Passport Size' },
    { id: 'studentAadhar',        label: 'Student Aadhar Copy' },
    { id: 'fatherAadhar',         label: 'Father Aadhar Copy' },
    { id: 'motherAadhar',         label: 'Mother Aadhar Copy' },
  ];

  const handleAadharInput = (e) => {
  const formatted = formatAadhar(e.target.value);
  setValue("aadharNumber", formatted);
};

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        profileImage: imagePreview,
        academicYear: settings.currentAcademicYear,
        admissionType: 'New'  // All registrations are New Admission
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
                    <label className="text-xs font-bold text-secondary uppercase">Gender <span className="text-danger">*</span></label>
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
                  <label className="text-xs font-bold text-secondary uppercase">Applying for Class <span className="text-danger">*</span></label>
                  <select 
                    className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary transition-colors" 
                    {...register("class", { required: true })}
                  >
                     {['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8'].map(c =>
                      <option key={c} value={c}>Class {c}</option>
                    )}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-secondary uppercase">Category <span className="text-danger">*</span></label>
                  <select 
                    className="w-full h-12 bg-white border-2 border-gray-100 rounded-xl px-4 font-bold outline-none focus:border-primary transition-colors" 
                    {...register("category", { required: "Category is required" })}
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="Minority">Minority</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && <p className="text-xs text-danger font-medium">{errors.category.message}</p>}
                </div>

                <Input 
                  label="Home Address" 
                  icon={MapPin} 
                  required 
                  placeholder="Full residential address"
                  {...register("address", { required: "Address is required" })} 
                  error={errors.address?.message}
                />

                {/* ========== NEW FIELD: PINCODE ========== */}
                <Input 
                  label="Pincode" 
                  required 
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  {...register("pincode", { 
                    required: "Pincode is required",
                    pattern: {
                      value: /^\d{6}$/,
                      message: "Pincode must be exactly 6 digits"
                    }
                  })} 
                  error={errors.pincode?.message}
                />

                <Button 
                  type="button" 
                  fullWidth 
                  onClick={async () => {
                    // 1. List the fields in Step 1
                    const fieldsStep1 = ["name", "gender", "dateOfBirth", "class", "category", "address", "pincode"];
                    
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

            {/* ========== STEP 2: PARENT/GUARDIAN INFORMATION ========== */}
            {currentStep === 2 && (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <Users className="text-primary" size={20} />
                  <h3 className="font-black text-gray-900 uppercase text-sm tracking-wider">Parent Information</h3>
                </div>

                {/* Father's Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Father's Name" 
                    placeholder="Enter father's full name"
                    {...register("fatherName")} 
                    error={errors.fatherName?.message}
                  />
                  <Input 
                    label="Father's Mobile" 
                    icon={Phone} 
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    {...register("fatherMobile", {
                      pattern: {
                        value: /^\d{10}$/,
                        message: "Must be 10 digits"
                      }
                    })} 
                    error={errors.fatherMobile?.message}
                  />
                </div>

                {/* Mother's Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Mother's Name" 
                    placeholder="Enter mother's full name"
                    {...register("motherName")} 
                    error={errors.motherName?.message}
                  />
                  <Input 
                    label="Mother's Mobile" 
                    icon={Phone} 
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    {...register("motherMobile", {
                      pattern: {
                        value: /^\d{10}$/,
                        message: "Must be 10 digits"
                      }
                    })} 
                    error={errors.motherMobile?.message}
                  />
                </div>

                {/* SEPARATOR LINE WITH TEXT */}
                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    If No Parents Available
                  </span>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>

                {/* Guardian Details - Same Style as Parents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    label="Guardian's Name (Optional)" 
                    placeholder="Legal guardian's full name"
                    {...register("guardianName")} 
                    error={errors.guardianName?.message}
                  />
                  <Input 
                    label="Guardian's Mobile (Optional)" 
                    icon={Phone} 
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    {...register("guardianMobile", {
                      pattern: {
                        value: /^\d{10}$/,
                        message: "Must be 10 digits"
                      }
                    })} 
                    error={errors.guardianMobile?.message}
                  />
                </div>

                {/* Helper Text */}
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ Please provide either parent information OR guardian information. 
                    At least one contact person is required.
                  </p>
                </div>

                {/* Parent Email - Still Required */}
                <Input 
                  label="Parent/Guardian Email" 
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

                {/* Navigation Buttons */}
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
                      // ✅ CUSTOM VALIDATION: Check if either parents OR guardian is provided
                      const fatherNameValue = watch("fatherName");
                      const motherNameValue = watch("motherName");
                      const guardianNameValue = watch("guardianName");
                      const parentEmailValue = watch("parentEmail");

                      const hasParents = fatherNameValue || motherNameValue;
                      const hasGuardian = guardianNameValue;

                      // Validate: Must have either parents OR guardian
                      if (!hasParents && !hasGuardian) {
                        setToast({ 
                          message: "Please provide either parent information or guardian information", 
                          type: "error" 
                        });
                        return;
                      }

                      // Validate: Email is mandatory
                      const fieldsStep2 = ["parentEmail"];
                      const isValid = await trigger(fieldsStep2);
                      
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
                <ImagePickerWithCrop
                  value={imagePreview}
                  onChange={setImagePreview}
                  aspect={3 / 4}
                  label="Student Photo"
                />

                {/* AADHAR - SIMPLIFIED */}
                <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                  <label className="text-xs font-bold text-primary uppercase ml-1">Aadhar Card Number (Optional)</label>
                  
                  <input 
                    type="text" 
                    placeholder="XXXX-XXXX-XXXX" 
                    maxLength="14"
                    {...register("aadharNumber", { 
                      // Logic: Only validate length IF the user starts typing
                      validate: (val) => !val || val.length === 14 || "Aadhar must be 12 digits"
                    })}
                    onChange={handleAadharInput} // The formatting bridge
                    className="w-full h-14 bg-white border-2 border-indigo-200 rounded-2xl px-4 font-black tracking-[0.2em] text-center text-lg focus:border-primary focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />

                  <div className="flex flex-col gap-1 px-1">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] text-indigo-400 font-bold italic">Format: 0000-0000-0000</p>
                      {errors.aadharNumber && (
                        <p className="text-[10px] text-danger font-bold uppercase tracking-tighter">
                          {errors.aadharNumber.message}
                        </p>
                      )}
                    </div>
                    {/* YOUR PRESERVED LOGIC MESSAGE BELOW */}
                    <p className="text-[10px] text-indigo-600 font-medium italic">Leave blank if not available</p>
                  </div>
                </div>

              {/* PEN NUMBER - OPTIONAL */}
              <div className="space-y-3 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                <label className="text-xs font-bold text-primary uppercase ml-1">PEN No. (Optional)</label>
                
                <input 
                  type="text" 
                  placeholder="XXXXXXXXXXX" 
                  maxLength="12"
                  {...register("penNumber", { 
                    validate: (val) => !val || /^\d{11,12}$/.test(val) || "PEN must be 11 or 12 digits"
                  })}
                  onChange={(e) => {
                    const cleaned = formatPEN(e.target.value);
                    setValue("penNumber", cleaned);
                  }}
                  className="w-full h-14 bg-white border-2 border-indigo-200 rounded-2xl px-4 font-black tracking-[0.2em] text-center text-lg focus:border-primary focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                />

                <div className="flex flex-col gap-1 px-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-indigo-400 font-bold italic">Format: 11 or 12 digit number</p>
                    {errors.penNumber && (
                      <p className="text-[10px] text-danger font-bold uppercase tracking-tighter">
                        {errors.penNumber.message}
                      </p>
                    )}
                  </div>
                  <p className="text-[10px] text-indigo-600 font-medium italic">Leave blank if not available</p>
                </div>
              </div>

                {/* DOCUMENT CHECKLIST - Always shown, all registrations are new admission */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-grow bg-red-200"></div>
                    <span className="text-xs font-black text-red-600 uppercase">Documents Submitted</span>
                    <div className="h-px flex-grow bg-red-200"></div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    ✅ Check the documents you are submitting now. Remaining can be submitted later.
                  </p>
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
