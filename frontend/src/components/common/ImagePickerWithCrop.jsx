import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, ImageIcon, Check, X } from 'lucide-react';
import { getCroppedImg } from '../../utils/cropImage';
import Modal from './Modal';
import Button from './Button';

/**
 * ImagePickerWithCrop
 * - Gallery + Camera buttons
 * - Auto-compresses large images before crop
 * - Crop modal with zoom slider
 * - Returns cropped base64 via onChange(base64)
 */
const ImagePickerWithCrop = ({ value, onChange, aspect = 3 / 4, label = 'Photo' }) => {
    const [rawImage, setRawImage]           = useState(null);
    const [isCropOpen, setIsCropOpen]       = useState(false);
    const [crop, setCrop]                   = useState({ x: 0, y: 0 });
    const [zoom, setZoom]                   = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing]       = useState(false);

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    // Compress image to max ~1MB before showing cropper
    const compressImage = (dataUrl) =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1200; // max dimension
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
                    else { width = Math.round((width * MAX) / height); height = MAX; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = dataUrl;
        });

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Reset input so same file can be picked again
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = async () => {
            const compressed = await compressImage(reader.result);
            setRawImage(compressed);
            setCrop({ x: 0, y: 0 });
            setZoom(1);
            setIsCropOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropDone = async () => {
        setProcessing(true);
        try {
            const cropped = await getCroppedImg(rawImage, croppedAreaPixels, aspect);
            onChange(cropped);
            setIsCropOpen(false);
        } catch {
            // silent
        } finally {
            setProcessing(false);
        }
    };

    return (
        <>
            {/* Preview + Buttons */}
            <div className="flex flex-col items-center gap-4 p-5 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                {/* Photo preview */}
                <div className="w-28 h-36 bg-white border-2 border-gray-200 rounded-xl overflow-hidden flex items-center justify-center shadow-md">
                    {value ? (
                        <img src={value} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-center p-3">
                            <ImageIcon size={28} className="mx-auto text-gray-300 mb-1" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{label}</p>
                        </div>
                    )}
                </div>

                {/* Two buttons */}
                <div className="flex gap-3">
                    <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm">
                        <ImageIcon size={14} /> Gallery
                        <input type="file" className="hidden" accept="image/*" onChange={handleFile} />
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm">
                        <Camera size={14} /> Camera
                        <input type="file" className="hidden" accept="image/*" capture="environment" onChange={handleFile} />
                    </label>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Large photos auto-compressed • You can skip this</p>
            </div>

            {/* Crop Modal */}
            <Modal isOpen={isCropOpen} onClose={() => setIsCropOpen(false)} title="Crop Photo" size="md">
                <div className="space-y-5">
                    <div className="relative h-72 w-full bg-gray-900 rounded-2xl overflow-hidden">
                        {rawImage && (
                            <Cropper
                                image={rawImage}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspect}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={onCropComplete}
                            />
                        )}
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Zoom</p>
                        <input
                            type="range" min={1} max={3} step={0.05}
                            value={zoom}
                            onChange={e => setZoom(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" fullWidth icon={X} onClick={() => setIsCropOpen(false)}>Cancel</Button>
                        <Button fullWidth icon={Check} isLoading={processing} onClick={handleCropDone}>Use This Photo</Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default ImagePickerWithCrop;
