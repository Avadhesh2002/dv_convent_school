import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, ImageIcon, Check, X } from 'lucide-react';
import { getCroppedImg } from '../../utils/cropImage';
import Button from './Button';

/**
 * ImagePickerWithCrop
 * - Gallery + Camera buttons
 * - Auto-compresses large images before crop
 * - Crop modal with zoom slider (own portal, z-[200] — works inside any parent modal)
 * - Returns cropped base64 via onChange(base64)
 */
const ImagePickerWithCrop = ({ value, onChange, aspect = 3 / 4, label = 'Photo' }) => {
    const [rawImage, setRawImage]           = useState(null);
    const [isCropOpen, setIsCropOpen]       = useState(false);
    const [crop, setCrop]                   = useState({ x: 0, y: 0 });
    const [zoom, setZoom]                   = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [processing, setProcessing]       = useState(false);
    const [cropError, setCropError]         = useState('');
    const galleryRef = useRef(null);
    const cameraRef  = useRef(null);

    const onCropComplete = useCallback((_, pixels) => {
        setCroppedAreaPixels(pixels);
    }, []);

    // Compress image to max ~1MB before showing cropper
    const compressImage = (dataUrl) =>
        new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const MAX = 1200;
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
            img.onerror = () => resolve(dataUrl); // fallback: use original
            img.src = dataUrl;
        });

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const compressed = await compressImage(ev.target.result);
                setRawImage(compressed);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
                setCropError('');
                setIsCropOpen(true);
            } catch {
                setCropError('Image load karne mein dikkat aayi. Dobara try karein.');
            }
        };
        reader.onerror = () => setCropError('File read nahi ho saki. Dobara try karein.');
        reader.readAsDataURL(file);

        // Reset input value so same file can be picked again
        // Done after reader.readAsDataURL to avoid losing the file reference
        setTimeout(() => { e.target.value = ''; }, 500);
    };

    const handleCropDone = async () => {
        if (!croppedAreaPixels) {
            setCropError('Pehle image ko thoda move ya zoom karein, phir try karein.');
            return;
        }
        setProcessing(true);
        setCropError('');
        try {
            const cropped = await getCroppedImg(rawImage, croppedAreaPixels, aspect);
            onChange(cropped);
            setIsCropOpen(false);
            setRawImage(null);
        } catch (err) {
            console.error('Crop error:', err);
            setCropError('Photo crop nahi ho saki. Cancel karke dobara try karein.');
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setIsCropOpen(false);
        setRawImage(null);
        setCropError('');
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
                        <input ref={galleryRef} type="file" className="hidden" accept="image/*" onChange={handleFile} />
                    </label>
                    <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-green-700 transition-colors shadow-sm">
                        <Camera size={14} /> Camera
                        <input ref={cameraRef} type="file" className="hidden" accept="image/*" capture="user" onChange={handleFile} />
                    </label>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">Large photos auto-compressed • You can skip this</p>
            </div>

            {/* Crop Modal — own z-[200] overlay, works inside any parent modal */}
            {isCropOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm" onClick={handleClose} />

                    {/* Panel */}
                    <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <h3 className="text-lg font-bold text-gray-800">Photo Crop Karein</h3>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-5">
                            {/* Cropper area */}
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

                            {/* Zoom slider */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Zoom</p>
                                <input
                                    type="range" min={1} max={3} step={0.05}
                                    value={zoom}
                                    onChange={e => setZoom(Number(e.target.value))}
                                    className="w-full accent-primary"
                                />
                            </div>

                            {/* Error message */}
                            {cropError && (
                                <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{cropError}</p>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <Button variant="ghost" fullWidth icon={X} onClick={handleClose}>Cancel</Button>
                                <Button fullWidth icon={Check} isLoading={processing} onClick={handleCropDone}>
                                    Yeh Photo Use Karein
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ImagePickerWithCrop;
