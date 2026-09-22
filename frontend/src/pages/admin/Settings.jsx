import React, { useState, useEffect, useRef } from 'react';
import { Save, School, Calendar, ShieldCheck, Info, CreditCard, User, QrCode, Hash, Mail, MapPin, Phone } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Toast from '../../components/common/Toast';

// ── Small helper: image file → base64 ──────────────────────────────────────
const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const AdminSettings = () => {
    const { settings, refreshSettings } = useSettings();
    const [formData, setFormData] = useState(settings);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const qrInputRef = useRef(null);

    useEffect(() => { setFormData(settings); }, [settings]);

    const set = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

    const handleQrUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const b64 = await fileToBase64(file);
            set('upiQr', b64);
        } catch {
            setToast({ message: 'QR image load nahi ho saka.', type: 'error' });
        }
        e.target.value = '';
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await API.put('/admin/settings', formData);
            await refreshSettings();
            setToast({ message: 'Settings save ho gayi!', type: 'success' });
        } catch {
            setToast({ message: 'Save karne mein error aaya.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}

            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Settings</h1>
                <p className="text-sm text-secondary font-medium">School identity, academic config, and payment settings.</p>
            </div>

            {/* ── ROW 1: School Profile + Academic Session ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. SCHOOL PROFILE */}
                <Card title="School Profile" icon={School}>
                    <div className="space-y-4">
                        <Input
                            label="School Name"
                            value={formData.schoolName || ''}
                            onChange={(e) => set('schoolName', e.target.value)}
                        />
                        <Input
                            label="School Slogan (Tagline)"
                            value={formData.schoolSlogan || ''}
                            onChange={(e) => set('schoolSlogan', e.target.value)}
                        />
                        <Input
                            label="Physical Address"
                            icon={MapPin}
                            value={formData.schoolAddress || ''}
                            onChange={(e) => set('schoolAddress', e.target.value)}
                        />
                        <Input
                            label="Contact Number"
                            icon={Phone}
                            value={formData.contactNumber || ''}
                            onChange={(e) => set('contactNumber', e.target.value)}
                        />
                        <Input
                            label="School Email"
                            icon={Mail}
                            value={formData.schoolEmail || ''}
                            onChange={(e) => set('schoolEmail', e.target.value)}
                            placeholder="school@example.com"
                        />
                    </div>
                </Card>

                {/* 2. ACADEMIC CONFIG */}
                <Card title="Academic Session" icon={Calendar}>
                    <div className="space-y-4">
                        {/* Live status */}
                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex justify-between items-center shadow-inner">
                            <div>
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Live Now</p>
                                <p className="text-lg font-black text-gray-900">{settings.currentAcademicYear}</p>
                            </div>
                            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Change / Update Session</label>
                            <Input
                                placeholder="e.g. 2026-2027"
                                value={formData.currentAcademicYear || ''}
                                onChange={(e) => set('currentAcademicYear', e.target.value)}
                            />
                            <p className="text-[9px] text-secondary font-medium ml-1">
                                Type the new year and click "Save Settings" to update.
                            </p>
                        </div>

                        {/* Registration toggle */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <span className="text-xs font-bold text-gray-600 uppercase">Admission Portal Open</span>
                            <input
                                type="checkbox"
                                checked={formData.isRegistrationOpen || false}
                                onChange={(e) => set('isRegistrationOpen', e.target.checked)}
                                className="w-6 h-6 rounded accent-primary cursor-pointer"
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* ── ROW 2: School Identity (TC / Documents) ── */}
            <Card title="School Identity — TC & Official Documents" icon={ShieldCheck}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="UDISE+ Code"
                        icon={Hash}
                        value={formData.udiseCode || ''}
                        onChange={(e) => set('udiseCode', e.target.value)}
                        placeholder="e.g. 09141234567"
                    />
                    <Input
                        label="School Code (Govt / Board)"
                        icon={Hash}
                        value={formData.schoolCode || ''}
                        onChange={(e) => set('schoolCode', e.target.value)}
                        placeholder="e.g. 65730"
                    />
                    <Input
                        label="School Affiliation"
                        value={formData.schoolAffiliation || ''}
                        onChange={(e) => set('schoolAffiliation', e.target.value)}
                        placeholder="e.g. UP Board / CBSE"
                    />
                    <Input
                        label="Affiliation Number"
                        icon={Hash}
                        value={formData.affiliationNumber || ''}
                        onChange={(e) => set('affiliationNumber', e.target.value)}
                        placeholder="e.g. 51380"
                    />
                    <div className="md:col-span-2">
                        <Input
                            label="Principal Name"
                            icon={User}
                            value={formData.principalName || ''}
                            onChange={(e) => set('principalName', e.target.value)}
                            placeholder="Full name as printed on TC"
                        />
                    </div>
                </div>
                <p className="text-[9px] text-secondary font-medium mt-3 ml-1">
                    These fields appear on Transfer Certificates, Admission Forms, and official PDF exports.
                </p>
            </Card>

            {/* ── ROW 3: UPI Payment ── */}
            <Card title="UPI Payment Settings" icon={CreditCard}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Left: UPI ID */}
                    <div className="space-y-4">
                        <Input
                            label="UPI ID"
                            icon={QrCode}
                            value={formData.upiId || ''}
                            onChange={(e) => set('upiId', e.target.value)}
                            placeholder="yourschool@upi"
                        />
                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-black text-blue-700 uppercase mb-1">How it works</p>
                            <p className="text-[10px] text-blue-600 leading-relaxed">
                                UPI ID aur QR code fee payment section me parents ko dikhaya jaayega.
                                QR scan karke direct payment kar sakenge.
                            </p>
                        </div>
                    </div>

                    {/* Right: QR Upload + Preview */}
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-secondary uppercase ml-1">UPI QR Code Image</p>
                        <div
                            className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer hover:border-primary transition-colors"
                            onClick={() => qrInputRef.current?.click()}
                        >
                            {formData.upiQr ? (
                                <img
                                    src={formData.upiQr}
                                    alt="UPI QR"
                                    className="max-h-44 max-w-full object-contain"
                                />
                            ) : (
                                <div className="text-center p-4">
                                    <QrCode size={36} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-xs font-bold text-gray-400">Click to upload QR</p>
                                    <p className="text-[10px] text-gray-300 mt-1">PNG / JPG supported</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={qrInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleQrUpload}
                        />
                        {formData.upiQr && (
                            <button
                                type="button"
                                onClick={() => set('upiQr', '')}
                                className="text-[10px] font-bold text-danger hover:underline ml-1"
                            >
                                ✕ QR Remove Karein
                            </button>
                        )}
                    </div>
                </div>
            </Card>

            {/* ── Save Button ── */}
            <div className="flex justify-end">
                <Button icon={Save} isLoading={loading} onClick={handleSave} className="w-full md:w-auto px-10">
                    Save Settings
                </Button>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                <Info className="text-warning shrink-0 mt-0.5" size={18} />
                <p className="text-[10px] font-bold text-amber-700 uppercase leading-relaxed">
                    Academic Year change karne ke baad Dashboard, Attendance, aur Marks sirf us year ke records dikhayenge.
                </p>
            </div>
        </div>
    );
};

export default AdminSettings;
