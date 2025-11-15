import axios from "axios";
import { successResponse, errorResponse } from "../function";
export async function getFilm() {
    try {
        const res = await axios.get("/api/movies/list");
        return successResponse(res, "true", 200);
    } catch (error) {
        console.log("Lỗi server:", error);
        return errorResponse("false", 400);
    }
}