import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axios';

const SettingsContext = createContext(null); // Initialize with null

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        schoolName: 'DV Convent School',
        schoolSlogan: 'Education for Excellence',
        schoolAddress: '',
        contactNumber: '',
        schoolEmail: '',
        schoolLogo: '',
        currentAcademicYear: '2025-26',
        isRegistrationOpen: true,
        // School Identity
        udiseCode: '',
        schoolCode: '',
        schoolAffiliation: '',
        affiliationNumber: '',
        principalName: '',
        // UPI
        upiId: '',
        upiQr: '',
    });

    const refreshSettings = async () => {
        try {
            const res = await API.get('/admin/settings');
            if (res.data) setSettings(res.data);
        } catch (err) {
            console.error("Settings load failed - using defaults");
        }
    };

    useEffect(() => {
        refreshSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, setSettings, refreshSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

// SAFETY GUARD HOOK
export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};