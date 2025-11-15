// lib/cloudinary.ts
export function cloudinaryUrlFromPublicId(publicId: string, options?: { w?: number, h?: number, crop?: string, f?: string, q?: string }) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return publicId; // fallback: trả nguyên nếu chưa cấu hình
    const transformations = [
        options?.w ? `w_${options.w}` : '',
        options?.h ? `h_${options.h}` : '',
        options?.crop ? `c_${options.crop}` : '',
        options?.q ? `q_${options.q}` : 'q_auto',
        options?.f ? `f_${options.f}` : 'f_auto',
    ].filter(Boolean).join(',');
    const t = transformations ? `${transformations}/` : '';
    // không thêm extension; Cloudinary sẽ trả đúng format nhờ f_auto
    return `https://res.cloudinary.com/${cloudName}/image/upload/${t}${publicId}`;
}
