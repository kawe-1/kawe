import { useRef, useState } from 'react';
import { uploadDocument, uploadAudio, uploadImage } from '../../../services/endpoints/sources';
import {
    pollJob,
} from "../../../services/endpoints/jobs";

export const MAX_FILE_SIZE_MB = 20;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type UploadStage =
    | "uploading"
    | "queued"
    | "processing"
    | "completed"
    | "failed";

interface UploadStatus {
    [fileName: string]: UploadStage;
}

interface UseFileUploadResult {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    isDragging: boolean;
    statuses: UploadStatus;
    uploading: boolean;
    errors: string[];
    handleFileSelect: (files: FileList) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragLeave: () => void;
    handleDrop: (e: React.DragEvent) => void;
    resetErrors: () => void;
}

export function useFileUpload(sessionId: string, onUploadSuccess?: () => void): UseFileUploadResult {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [statuses, setStatuses] = useState<UploadStatus>({});
    const [uploading, setUploading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const resetErrors = () => setErrors([]);

    const getFileType = (file: File): 'document' | 'audio' | 'image' | null => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';

        if (['pdf', 'docx', 'pptx', 'html', 'htm'].includes(ext)) return 'document';
        if (['mp3', 'wav', 'm4a'].includes(ext)) return 'audio';
        if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'image';

        return null;
    };

    const handleFileSelect = async (files: FileList) => {
        const fileArray = Array.from(files);
        resetErrors();
        setUploading(true);

        for (const file of fileArray) {
            const fileType = getFileType(file);

            // Validate file type
            if (!fileType) {
                setErrors((prev) => [...prev, `${file.name}: Unsupported file format`]);
                continue;
            }

            // Validate file size
            if (file.size > MAX_FILE_SIZE_BYTES) {
                setErrors((prev) => [
                    ...prev,
                    `${file.name}: File exceeds ${MAX_FILE_SIZE_MB}MB limit`,
                ]);
                continue;
            }

            try {
                setStatuses(prev => ({
                    ...prev,
                    [file.name]: "uploading",
                }));

                const uploadFn =
                    fileType === "document"
                        ? uploadDocument
                        : fileType === "audio"
                            ? uploadAudio
                            : uploadImage;

                const ingestionJob =
                    await uploadFn(sessionId, file);

                setStatuses(prev => ({
                    ...prev,
                    [file.name]: "queued",
                }));

                await pollJob(
                    ingestionJob.job_id,
                    {
                        onPoll: (job) => {
                            if (job.status === "processing") {
                                setStatuses(prev => ({
                                    ...prev,
                                    [file.name]: "processing",
                                }));
                            }
                        },
                    }
                );

                setStatuses(prev => ({
                    ...prev,
                    [file.name]: "completed",
                }));

                if (onUploadSuccess) {
                    onUploadSuccess();
                }
            } catch (error) {
                setStatuses(prev => ({ ...prev, [file.name]: "failed" }));

                setErrors(prev => [
                    ...prev,
                    `${file.name}: Ingestion processing failed. Please try again.`
                ]);
            }
        }

        setUploading(false);
        // Clear progress after a delay so user sees the completion
        setTimeout(() => {
            setStatuses({});
        }, 3000);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files) {
            handleFileSelect(e.dataTransfer.files);
        }
    };

    return {
        fileInputRef,
        isDragging,
        statuses,
        uploading,
        errors,
        handleFileSelect,
        handleDragOver,
        handleDragLeave,
        handleDrop,
        resetErrors,
    };
}
