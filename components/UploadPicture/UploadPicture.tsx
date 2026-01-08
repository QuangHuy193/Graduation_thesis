"use client";

import { useState, useRef, useEffect } from "react";
import { uploadToCloudinary } from "@/lib/axios/uploadCloudinaryAPI";
import { saveImageToDB } from "@/lib/axios/saveImageToDB";

type Props = {
    open: boolean;
    onClose: () => void;
    target?: {
        type: string;
        id?: number | null;
    };
    defaultCaption?: string;
    onSuccess?: (data: { url: string }) => void;
};

export default function UploadPicture({
    open,
    onClose,
    target,
    defaultCaption = "",
    onSuccess,
}: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [caption, setCaption] = useState(defaultCaption);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const previewRef = useRef<string | null>(null);

    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open]);

    function reset() {
        setFile(null);
        setPreview(null);
        setCaption(defaultCaption);
        setProgress(0);
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null;
        setFile(f);

        if (previewRef.current) URL.revokeObjectURL(previewRef.current);

        const url = f ? URL.createObjectURL(f) : null;
        previewRef.current = url;
        setPreview(url);
    }

    async function handleUpload() {
        if (!file) return;
        setLoading(true);

        try {
            const cloud = await uploadToCloudinary(file, {
                onUploadProgress: (e: any) => {
                    if (e?.loaded && e?.total) {
                        setProgress(Math.round((e.loaded / e.total) * 100));
                    }
                },
            });

            const payload = {
                url: cloud.secure_url,
                public_id: cloud.public_id,
                target_type: target?.type ?? null,
                target_id: target?.id ?? null,
                caption: caption || null,
            };

            await saveImageToDB(payload);

            onSuccess?.({ url: cloud.secure_url });
            onClose();
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <div className="bg-white rounded-lg w-[420px] p-4 shadow-xl">
                <h3 className="font-semibold text-lg mb-3">Upload hình ảnh</h3>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    id="upload-image"
                    className="hidden"
                />

                <label
                    htmlFor="upload-image"
                    className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
                >
                    Chọn ảnh
                </label>


                {preview && (
                    <img
                        src={preview}
                        className="mt-3 w-full max-h-60 object-contain border rounded"
                    />
                )}

                <input
                    className="mt-3 w-full border px-2 py-1 rounded"
                    placeholder="Caption (tuỳ chọn)"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                />

                {progress > 0 && (
                    <div className="mt-2 h-2 bg-gray-200 rounded">
                        <div
                            className="h-full bg-blue-600 rounded"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                    <button
                        onClick={onClose}
                        className="px-3 py-1 border rounded cursor-pointer"
                    >
                        Huỷ
                    </button>
                    <button
                        disabled={loading}
                        onClick={handleUpload}
                        className="px-3 py-1 bg-blue-600 text-white rounded cursor-pointer"
                    >
                        {loading ? "Đang upload..." : "Upload"}
                    </button>
                </div>
            </div>
        </div>
    );
}
