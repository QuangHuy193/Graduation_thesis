// lib/axios/saveImageToDB.ts
import axios from "axios";

export interface SaveImagePayload {
    url: string;
    public_id: string;
    caption?: string | null;
    movie_id?: number | null;
    type?: string;
}

export interface SaveImageResponse {
    success: boolean;
    insertId: number | null;
    image: {
        url: string;
        public_id: string;
        caption?: string | null;
        movie_id?: number | null;
        type?: string;
    };
}

export async function saveImageToDB(payload: SaveImagePayload): Promise<SaveImageResponse> {
    const res = await axios.post<SaveImageResponse>("/api/cloudinary", payload, {
        headers: { "Content-Type": "application/json" },
    });
    return res.data;
}