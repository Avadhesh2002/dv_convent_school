import React from 'react';
import { NavLink } from 'react-router-dom';
import { bottomNavConfig } from '../../utils/navConfig';

const BottomNav = ({ role = 'student' }) => {
  const menuItems = bottomNavConfig[role] || [];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 px-6 flex items-center justify-between z-40">
      {menuItems.map((item, index) => (
        <NavLink 
          key={index} 
          to={item.path}
          className="flex-1" // Ensures equal spacing for touch targets
        >
          {({ isActive }) => (
            <div className={`flex flex-col items-center justify-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'}`}>
              
              {/* Icon Logic: isActive is now defined here */}
              <div className={`p-1 rounded-lg transition-all ${isActive ? 'scale-110' : ''}`}>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Label Logic */}
              <span className="text-[10px] font-bold uppercase tracking-tight">
                {item.title}
              </span>

              {/* Active Indicator Dot */}
              <div className={`w-1 h-1 rounded-full transition-all ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;