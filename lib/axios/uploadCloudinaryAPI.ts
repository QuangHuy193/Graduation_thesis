// lib/axios/uploadCloudinaryAPI.ts
import axios from "axios";

export type CloudinaryResult = {
    secure_url: string;
    public_id: string;
    [key: string]: any;
};

export type UploadOptions = {
    uploadPreset?: string; // override env
    folder?: string;
    onUploadProgress?: (percent: number) => void;
};

export async function uploadToCloudinary(file: File, opts?: UploadOptions): Promise<CloudinaryResult> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = opts?.uploadPreset ?? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
        throw new Error("Missing Cloudinary config (NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET)");
    }

    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", uploadPreset);
    if (opts?.folder) form.append("folder", opts.folder);

    const res = await axios.post(url, form, {
        headers: {
            // axios tự set boundary cho FormData
        },
        onUploadProgress: (ev) => {
            if (ev.total) {
                const percent = Math.round((ev.loaded * 100) / ev.total);
                opts?.onUploadProgress?.(percent);
            }
        },
    });

    return res.data as CloudinaryResult;
}