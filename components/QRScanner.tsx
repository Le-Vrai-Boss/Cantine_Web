import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { CameraIcon, XIcon } from './Icons';

interface QRScannerProps {
    onScanSuccess: (data: string) => void;
    onClose: () => void;
    progress: { expected: number; total: number };
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, progress }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [error, setError] = useState<string>('');
    const streamRef = useRef<MediaStream | null>(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    useEffect(() => {
        const startCamera = async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setError("La caméra n'est pas supportée par ce navigateur.");
                return;
            }

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
                streamRef.current = mediaStream;
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                    await videoRef.current.play();
                }
            } catch (err: unknown) {
                console.error("Erreur d'accès à la caméra:", err);
                let errorMessage = "Impossible d'accéder à la caméra. Veuillez vérifier les permissions.";
                if (err instanceof Error) {
                    if (err.name === 'NotAllowedError') {
                        errorMessage = "L'accès à la caméra a été refusé. Veuillez l'autoriser dans les paramètres de votre navigateur.";
                    } else if (err.name === 'NotFoundError') {
                        errorMessage = "Aucune caméra n'a été trouvée. Veuillez connecter une caméra.";
                    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                        errorMessage = "La caméra est peut-être utilisée par une autre application.";
                    } else if (err.name === 'OverconstrainedError') {
                        errorMessage = "La caméra ne supporte pas les contraintes demandées.";
                    } else if (err.name === 'TimeoutError') {
                        errorMessage = "Le démarrage de la caméra a expiré. Veuillez réessayer.";
                    }
                }
                setError(errorMessage);
            }
        };

        startCamera();

        return () => {
            stopCamera();
        };
    }, [stopCamera]);

    useEffect(() => {
        let animationFrameId: number;

        const tick = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                
                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height);

                    if (code) {
                        onScanSuccess(code.data);
                        cancelAnimationFrame(animationFrameId);
                        setTimeout(() => {
                            animationFrameId = requestAnimationFrame(tick);
                        }, 500); 
                        return;
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        animationFrameId = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [onScanSuccess]);

    const progressPercentage = progress.total > 0 ? ((progress.expected - 1) / progress.total) * 100 : 0;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
            <div className="relative w-full max-w-lg bg-slate-800 rounded-lg shadow-xl p-4 border border-slate-600">
                <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-white z-20">
                    <XIcon className="h-6 w-6" />
                </button>
                <div className="relative w-full aspect-square overflow-hidden rounded-md">
                    <video ref={videoRef} playsInline autoPlay muted className="w-full h-full object-cover"></video>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3/4 h-3/4 border-4 border-dashed border-white rounded-lg opacity-50"></div>
                    </div>
                </div>
                <canvas ref={canvasRef} className="hidden"></canvas>
                {error ? (
                    <div className="mt-4 text-center text-red-400 p-2 bg-red-900 rounded">{error}</div>
                ) : (
                    <div className="mt-4 text-center text-slate-300">
                        <div className="flex items-center justify-center mb-2">
                             <CameraIcon className="h-5 w-5 mr-2" />
                            {progress.total === 0
                                ? <span>Veuillez scanner le premier QR Code.</span>
                                : <span>Veuillez scanner le QR Code {progress.expected} sur {progress.total}.</span>
                            }
                        </div>
                        <div className="w-full bg-slate-600 rounded-full h-2.5">
                            <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
