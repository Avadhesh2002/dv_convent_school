import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, ShieldCheck, ChevronRight } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import logo from "../../assets/school_logo.png";


const LandingPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  // 1. Role Configurations - Defined here for clean, reusable code
  const roles = [
    {
      title: "Student & Parent",
      description: "Check your attendance, homework, and academic performance.",
      icon: Users,
      path: "/login/student",
      color: "bg-primary",      // Indigo
      lightBg: "bg-indigo-50",
      textColor: "text-primary"
    },
    {
      title: "Teacher Portal",
      description: "Manage your classes, mark attendance, and enter student marks.",
      icon: GraduationCap,
      path: "/login/teacher",
      color: "bg-success",      // Green
      lightBg: "bg-green-50",
      textColor: "text-success"
    },
    {
      title: "Administration",
      description: "Manage school operations, staff, students, and generate reports.",
      icon: ShieldCheck,
      path: "/login/admin",
      color: "bg-purple-600",   // Dark Purple
      lightBg: "bg-purple-50",
      textColor: "text-purple-600"
    }
  ];

  return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        
        {/* 2. Hero Header Section */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
          
          <div className="max-w-3xl mx-auto space-y-6">
      
      {/* LINE 1: LOGO + SCHOOL NAME (Balanced Horizontal Layout) */}
      <div className="flex items-center justify-center gap-4 md:gap-5">
        <img 
          src={logo}
          alt="School Logo" 
          className="w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
        />
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
          {settings.schoolName || "DV Convent School"}
        </h1>
      </div>

      {/* LINE 2: HINDI SLOGAN (Refined Typography) */}
      <h2 className="text-xl md:text-2xl font-semibold text-gray-700 tracking-wide">
        {settings.schoolSlogan || "शिक्षार्थ आइए, सेवार्थ जाइए"}
      </h2>

      {/* VISUAL SEPARATOR (Subtle Divider) */}
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="h-px w-16 bg-gradient-to-r from-transparent to-gray-300"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent to-gray-300"></div>
      </div>

      {/* LINE 3: WELCOME MESSAGE (Clear & Direct) */}
      <div className="max-w-md mx-auto">
        <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed">
          Welcome to our School Management System.<br />
          Please select your role to continue.
        </p>
      </div>
    </div>
  </div>


      {/* 3. Role Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
        {roles.map((role, index) => (
          <button
            key={index}
            onClick={() => navigate(role.path)}
            className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-left overflow-hidden"
          >
            {/* Background Decoration (Visual Polish) */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full transition-transform group-hover:scale-150 duration-500 opacity-10 ${
              role.title === "Student & Parent" ? "bg-indigo-500" :
              role.title === "Teacher Portal" ? "bg-green-500" : "bg-purple-500"
            }`} />

            {/* Icon Container */}
            <div className={`relative w-16 h-16 ${role.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-inherit`}>
              <role.icon size={32} />
            </div>

            {/* Text Content */}
            <div className="relative">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{role.title}</h2>
              <p className="text-secondary text-sm leading-relaxed mb-6">
                {role.description}
              </p>

              
              <div className={`flex items-center gap-2 font-bold text-sm ${role.textColor}`}>
                {role.title === "Student & Parent" && "Access Portal"}
                {role.title === "Teacher Portal" && "Staff Login"}
                {role.title === "Administration" && "Admin Dashboard"}
                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 4. Simple Footer */}
      <footer className="mt-16 text-center">
        <p className="text-xs font-black text-gray-900 uppercase tracking-widest">
          Academic Session {settings.currentAcademicYear}
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;