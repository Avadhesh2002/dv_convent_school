import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  UserCheck, 
  BookOpen, 
  Calendar, 
  ClipboardCheck, 
  FileText, 
  Megaphone, 
  Settings, 
  GraduationCap,
  Clock,
  BookMarked,
  Trophy,
  Medal,
  UserCircle,
  RefreshCcw,
  CalendarDays
} from 'lucide-react';

export const navConfig = {
  // --- ADMIN NAVIGATION ---
  admin: [
    { title: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { 
      title: 'Students', 
      icon: Users,
      submenu: [
        { title: 'All Students', path: '/admin/students' },
        { title: 'Pending Apps', path: '/admin/students/pending' },
      ]
    },
    { 
      title: 'Teachers', 
      icon: GraduationCap,
      submenu: [
        { title: 'All Teachers', path: '/admin/teachers' },
        { title: 'Assign Subjects', path: '/admin/assignments' },
      ]
    },
    { title: 'Classes', path: '/admin/classes', icon: BookOpen },
    { title: 'Subjects', path: '/admin/subjects', icon: BookMarked },
    { title: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { title: 'Exams', path: '/admin/exams', icon: FileText },
    { title: 'DateSheet', path: '/admin/datesheet', icon: CalendarDays },
    { title: 'Attendance', path: '/admin/attendance', icon: ClipboardCheck },
    { title: 'Marks', path: '/admin/marks', icon: Trophy },
    { title: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { title: 'Annual Transition', path: '/admin/transition', icon: RefreshCcw }, 
    { title: 'Settings', path: '/admin/settings', icon: Settings },
    
  ],

  // --- TEACHER NAVIGATION ---
  teacher: [
    { title: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { title: 'My Classes', path: '/teacher/classes', icon: BookOpen },
    { title: 'Mark Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
    { title: 'Homework', path: '/teacher/homework', icon: BookMarked },
    { title: 'Enter Marks', path: '/teacher/marks', icon: Trophy },
    { title: 'My Timetable', path: '/teacher/timetable', icon: Clock },
    { title: 'Merit List', path: '/teacher/ranks', icon: Medal },
    { title: 'Exam Schedule', path: '/teacher/datesheet', icon: CalendarDays },
    { title: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    
  ],

  // --- STUDENT NAVIGATION ---
  student: [
    { title: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { title: 'My Timetable', path: '/student/timetable', icon: Clock },
    { title: 'Attendance', path: '/student/attendance', icon: ClipboardCheck },
    { title: 'Homework', path: '/student/homework', icon: BookMarked },
    { title: 'My Marks', path: '/student/marks', icon: Trophy },
    { title: 'Exam Schedule', path: '/student/datesheet', icon: CalendarDays },
    { title: 'Announcements', path: '/student/announcements', icon: Megaphone },
    
  ],
};

// --- MOBILE BOTTOM NAVIGATION CONFIG ---
// This defines which 4 icons appear on the sticky bottom bar for mobile users
export const bottomNavConfig = {
  student: [
    { title: 'Home', path: '/student/dashboard', icon: LayoutDashboard },
    { title: 'Timetable', path: '/student/timetable', icon: Calendar },
    { title: 'Homework', path: '/student/homework', icon: BookMarked },
    { title: 'Profile', path: '/student/profile', icon: UserCircle },
  ],
  teacher: [
    { title: 'Home', path: '/teacher/dashboard', icon: LayoutDashboard },
    { title: 'Classes', path: '/teacher/classes', icon: BookOpen },
    { title: 'Attendance', path: '/teacher/attendance', icon: ClipboardCheck },
    { title: 'Profile', path: '/teacher/profile', icon: UserCircle },
  ],
  admin: [
    { title: 'Home', path: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Students', path: '/admin/students', icon: Users },
    { title: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { title: 'Settings', path: '/admin/settings', icon: Settings },
  ]
};
