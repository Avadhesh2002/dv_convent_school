import React, { useState } from 'react';
import { User, ShieldCheck, Mail, Lock, LogOut, Phone, Edit3, Fingerprint } from 'lucide-react'; // Added Fingerprint icon
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import API from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import Toast from '../../components/common/Toast';
import EditableAvatar from '../shared/EditableAvatar';

const AdminProfile = () => {
  const { user, updateUser, logout } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm();

  // THE MASTER UPDATE LOGIC
  const onUpdateIdentity = async (data) => {
    console.log("Step 1: Function triggered with data:", data);
    setSubmitting(true);
    try {
      const res = await API.put('/users/update-info', data);
      console.log("Step 2: Backend response received:", res.data);

      if (res.data && res.data.user) {
          updateUser(res.data.user); // THIS UPDATES THE UI IMMEDIATELY
          setToast({ message: "Identity updated successfully!", type: "success" });
          setIsEditModalOpen(false); 
      }
    } catch (err) {
      console.error("Step 3: Error caught:", err);
      const msg = err.response?.data?.message || "Failed to update";
      setToast({ message: msg, type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6 pb-10 max-w-4xl mx-auto">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* HEADER SECTION */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col items-center text-center">
        <EditableAvatar currentImage={user.profileImage} />
        <h2 className="text-2xl font-black text-gray-900 mt-4">{user.name}</h2>
        <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase rounded-full">Administrator</span>
      </div>

      {/* IDENTITY DETAILS CARD (CORRECTED SECTION BELOW) */}
      <Card 
        title="Identity" 
        icon={User} 
        noPadding
        footer={
          <button onClick={() => setIsEditModalOpen(true)} className="p-3 text-xs font-black text-primary uppercase flex items-center gap-2">
            <Edit3 size={14} /> Edit Admin Details
          </button>
        }
      >
        <div className="divide-y divide-gray-50">
          {/* 1. Full Name Display */}
          <InfoRow label="Full Name" value={user.name} icon={User} />
          
          {/* 2. Official Email (Matches backend 'email' key) */}
          <InfoRow label="Official Email" value={user.email || 'Not Set'} icon={Mail} />
          
          {/* 3. Contact Number (Matches backend 'phone' key) */}
          <InfoRow label="Contact Number" value={user.phone || 'Not Set'} icon={Phone} />

          {/* 4. Login Username (Matches backend 'username' key) */}
          <InfoRow label="Login Username" value={user.username || 'admin'} icon={Fingerprint} />
        </div>
      </Card>

      <Button fullWidth variant="danger" onClick={logout}>Logout</Button>

      {/* --- THE EDIT MODAL --- */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Admin Details">
        <form onSubmit={handleSubmit(onUpdateIdentity)} className="space-y-4">
          <Input 
            label="Full Name" 
            defaultValue={user.name} 
            {...register("name", { required: "Name is required" })} 
            error={errors.name?.message} 
          />
          <Input 
            label="Official Email" 
            defaultValue={user.email} 
            {...register("email", { required: "Email is required" })} 
            error={errors.email?.message} 
          />
          <Input 
            label="Contact Number" 
            defaultValue={user.phone} 
            {...register("phone")} 
          />
          
          <div className="flex gap-3 pt-4">
             <Button variant="ghost" fullWidth onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
             <Button type="submit" fullWidth isLoading={submitting}>Save Changes</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// HELPER COMPONENT
const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center gap-4 p-4">
    {Icon && <Icon className="text-gray-300" size={20} />}
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-black text-gray-800">{value}</p>
    </div>
  </div>
);

export default AdminProfile;