// components/CloudImage.tsx
import Image from "next/image";
import { cloudinaryUrlFromPublicId } from "@/lib/cloudinary";

type CloudImageProps = {
    src: string | null | undefined; // secure_url or public_id
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    // nếu muốn override transform khi dùng public_id
    transform?: { w?: number; h?: number; crop?: string; f?: string; q?: string };
    priority?: boolean;
};

export default function CloudImage({
    src,
    alt = "",
    width = 300,
    height = 450,
    className,
    transform,
    priority = false,
}: CloudImageProps) {
    if (!src) {
        // placeholder: đặt file placeholder trong /public/images/placeholder.png
        return (
            <img
                src="/images/placeholder.png"
                alt={alt}
                width={width}
                height={height}
                className={className}
                style={{ objectFit: "cover" }}
            />
        );
    }

    const resolved =
        /^https?:\/\//.test(src) // already a URL
            ? src
            : cloudinaryUrlFromPublicId(src, { w: transform?.w ?? width, h: transform?.h ?? height, crop: transform?.crop, f: transform?.f, q: transform?.q });

    // next/image works with external urls that match next.config.js
    return (
        <Image
            src={resolved}
            alt={alt}
            width={width}
            height={height}
            className={className}
            style={{ objectFit: "cover" }}
            priority={priority}
        />
    );
}
