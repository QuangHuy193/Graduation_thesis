"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";

type MovieRow = {
    name: string; // tiêu đề
    release_date: string; // ISO date string yyyy-mm-dd
    duration: number | null; // phút
    age_require: number | null; // độ tuổi
    country: string;
    subtitle: string; // ví dụ: "Tiếng Việt;Tiếng Anh" or "Vietnamese,English"
    trailer_url: string; // youtube link
    genres: string[]; // split by comma
    actors: string[]; // split by comma
    description: string;
    status: 0 | 1;
    __rowNum?: number; // internal: row number from sheet
};

type RowError = {
    row: number;
    field: keyof MovieRow | "general";
    message: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    /** Called when user confirms import; receives array of validated MovieRow */
    onImport: (movies: MovieRow[]) => void;
    /** Optional: allow override of accepted column names */
    maxPreviewRows?: number;
};

export default function ExcelImportMovies({ open, onClose, onImport, maxPreviewRows = 200 }: Props) {

    const [rawRows, setRawRows] = useState<any[]>([]);
    const [validRows, setValidRows] = useState<MovieRow[]>([]);
    const [errors, setErrors] = useState<RowError[]>([]);
    const [parsing, setParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    if (!open) return null;
    // possible header keys mapping (accepts VN/EN common names)
    const headerCandidates: Record<string, string[]> = {
        name: ["title", "tiêu đề", "tên phim", "name"],
        release_date: [
            "ngày công chiếu",
            "release date",
            "release_date",
            "releaseDate",
            "ngay cong chieu",
        ],
        duration: ["thời lượng", "duration", "runtime", "length"],
        age_require: ["độ tuổi", "age", "age_rating", "ageRequire", "age_require"],
        country: ["quốc gia", "country", "nation"],
        subtitle: ["phụ đề", "subtitles", "subtitle", "sub"],
        trailer_url: ["trailer", "link trailer", "youtube", "trailer_link", "trailer_url"],
        genres: ["thể loại", "thể-loại", "genres", "genre", "categories"],
        actors: ["diễn viên", "actors", "cast"],
        description: ["mô tả", "description", "desc"],
        status: ["trạng thái", "status", "state"],
    };

    function findHeaderKey(headerMap: Record<string, number>, candidates: string[]) {
        for (const c of candidates) {
            const low = c.trim().toLowerCase();
            if (headerMap[low] !== undefined) return headerMap[low];
        }
        return -1;
    }

    function normalizeCellToString(cell: any) {
        if (cell === null || cell === undefined) return "";
        if (typeof cell === "string") return cell.trim();
        if (typeof cell === "number") return String(cell);
        if (cell instanceof Date) return cell.toISOString();
        return String(cell).trim();
    }

    function isYoutubeUrl(url: string) {
        if (!url) return false;
        try {
            const u = new URL(url, "https://example.com");
            const host = u.hostname.toLowerCase();
            return host.includes("youtube.com") || host.includes("youtu.be");
        } catch {
            return false;
        }
    }

    function parseExcelFile(file: File) {
        setParsing(true);
        setErrors([]);
        setRawRows([]);
        setValidRows([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: "array" });
                const sheetName = workbook.SheetNames[0];
                const ws = workbook.Sheets[sheetName];

                // convert to JSON with header row
                // use header: 1 to get array of arrays
                const sheetData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

                if (sheetData.length === 0) {
                    setErrors([{ row: 0, field: "general", message: "File Excel rỗng" }]);
                    setParsing(false);
                    return;
                }

                // build header map: normalized header -> index
                const rawHeaderRow: any[] = sheetData[0].map((h) => String(h ?? "").trim());
                const headerMap: Record<string, number> = {};
                rawHeaderRow.forEach((h: string, idx: number) => {
                    headerMap[h.trim().toLowerCase()] = idx;
                });

                // Attempt to map known columns by candidates
                const mapping: Record<keyof MovieRow, number> = {
                    name: findHeaderKey(headerMap, headerCandidates.name),
                    release_date: findHeaderKey(
                        headerMap,
                        headerCandidates.release_date
                    ),
                    duration: findHeaderKey(headerMap, headerCandidates.duration),
                    age_require: findHeaderKey(headerMap, headerCandidates.age_require),
                    country: findHeaderKey(headerMap, headerCandidates.country),
                    subtitle: findHeaderKey(headerMap, headerCandidates.subtitle),
                    trailer_url: findHeaderKey(headerMap, headerCandidates.trailer_url),
                    genres: findHeaderKey(headerMap, headerCandidates.genres),
                    actors: findHeaderKey(headerMap, headerCandidates.actors),
                    description: findHeaderKey(headerMap, headerCandidates.description),
                    status: findHeaderKey(headerMap, headerCandidates.status),
                };

                // If title or releaseDate missing, still allow parsing by asking user to have those columns.
                // We'll validate rows and report missing required fields.
                const parsedRows: any[] = [];
                const reportedErrors: RowError[] = [];

                for (let r = 1; r < sheetData.length; r++) {
                    const rowArr = sheetData[r];
                    if (rowArr.every((c: any) => c === "" || c === null || c === undefined)) {
                        // skip empty row
                        continue;
                    }
                    const obj: any = {};
                    (Object.keys(mapping) as (keyof MovieRow)[]).forEach((k) => {
                        const idx = mapping[k];
                        obj[k] = idx >= 0 ? rowArr[idx] ?? "" : "";
                    });
                    obj.__rowNum = r + 1; // Excel-style row number (1-indexed) + header
                    parsedRows.push(obj);
                }

                // Validate parsedRows into MovieRow[] and collect errors
                const valRows: MovieRow[] = [];
                parsedRows.forEach((rObj: any) => {
                    const rowNum = rObj.__rowNum ?? -1;

                    // Helper for pushing error
                    const pushErr = (field: keyof MovieRow | "general", message: string) => {
                        reportedErrors.push({ row: rowNum, field, message });
                    };

                    // Title (required)
                    const name = normalizeCellToString(rObj.name);
                    if (!name) pushErr("name", "Tiêu đề bắt buộc");

                    // Release date (required) -> convert to ISO yyyy-mm-dd
                    let releaseDateStr = "";
                    if (rObj.release_date instanceof Date) {
                        releaseDateStr = rObj.release_date.toISOString().slice(0, 10);
                    } else {
                        const raw = normalizeCellToString(rObj.release_date);
                        if (!raw) {
                            pushErr("release_date", "Ngày công chiếu bắt buộc");
                        } else {
                            // nếu raw là dạng số (Excel serial) -> convert theo epoch Excel
                            if (/^\d+(\.\d+)?$/.test(raw)) {
                                const n = Number(raw);
                                const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // 1899-12-30
                                const ms = Math.round(n * 24 * 60 * 60 * 1000);
                                const dt = new Date(excelEpoch.getTime() + ms);
                                if (!isNaN(dt.getTime())) {
                                    releaseDateStr = dt.toISOString().slice(0, 10);
                                } else {
                                    pushErr("release_date", `Không thể parse ngày (excel serial): "${raw}"`);
                                }
                            } else {
                                // bình thường parse chuỗi ngày ISO/locale
                                const d = new Date(raw);
                                if (!isNaN(d.getTime())) {
                                    releaseDateStr = d.toISOString().slice(0, 10);
                                } else {
                                    pushErr("release_date", `Không thể parse ngày: "${raw}"`);
                                }
                            }
                        }
                    }

                    // duration (optional but should be number)
                    let duration: number | null = null;
                    const rawDur = normalizeCellToString(rObj.duration);
                    if (rawDur !== "") {
                        const n = Number(rawDur);
                        if (isNaN(n) || n < 0) pushErr("duration", `Thời lượng không hợp lệ: "${rawDur}"`);
                        else duration = Math.round(n);
                    }

                    // age (optional integer)
                    let age_require: number | null = null;
                    const rawAge = normalizeCellToString(rObj.age_require);
                    if (rawAge !== "") {
                        const n = Number(rawAge);
                        if (isNaN(n) || n < 0) pushErr("age_require", `Độ tuổi không hợp lệ: "${rawAge}"`);
                        else age_require = Math.round(n);
                    }

                    const country = normalizeCellToString(rObj.country);
                    const subtitle = normalizeCellToString(rObj.subtitle);
                    const trailer_url = normalizeCellToString(rObj.trailer_url);
                    if (trailer_url && !isYoutubeUrl(trailer_url)) {
                        pushErr("trailer_url", `Trailer không phải URL YouTube hợp lệ: "${trailer_url}"`);
                    }

                    const genresRaw = normalizeCellToString(rObj.genres);
                    const genres = genresRaw ? genresRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

                    const actorsRaw = normalizeCellToString(rObj.actors);
                    const actors = actorsRaw ? actorsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

                    const description = normalizeCellToString(rObj.description);

                    // status: allow 0/1, or text like "active"/"1"
                    let statusVal: 0 | 1 = 1;
                    const rawStatus = normalizeCellToString(rObj.status).toLowerCase();
                    if (rawStatus === "") {
                        // default to 1
                        statusVal = 1;
                    } else if (rawStatus === "1" || rawStatus === "active" || rawStatus === "true" || rawStatus === "hiện") {
                        statusVal = 1;
                    } else if (rawStatus === "0" || rawStatus === "inactive" || rawStatus === "false" || rawStatus === "ẩn") {
                        statusVal = 0;
                    } else {
                        // try number parsing
                        const n = Number(rawStatus);
                        if (n === 0) statusVal = 0;
                        else if (n === 1) statusVal = 1;
                        else pushErr("status", `Trạng thái nên là 0 hoặc 1: "${rawStatus}"`);
                    }

                    // Build MovieRow
                    const movieRow: MovieRow = {
                        name,
                        release_date: releaseDateStr || "",
                        duration,
                        age_require,
                        country,
                        subtitle,
                        trailer_url,
                        genres,
                        actors,
                        description,
                        status: statusVal,
                        __rowNum: rowNum,
                    };

                    // If required fields missing, don't push to validRows. But keep parsing everything.
                    const rowHasCriticalError = reportedErrors.some((er) => er.row === rowNum && (er.field === "name" || er.field === "release_date"));
                    if (!rowHasCriticalError) {
                        // ensure releaseDate string exists
                        if (!movieRow.release_date) {
                            reportedErrors.push({ row: rowNum, field: "release_date", message: "Ngày công chiếu không phù hợp" });
                        } else {
                            valRows.push(movieRow);
                        }
                    }
                }); // parsedRows.forEach

                // Trim preview if too many rows
                if (valRows.length > maxPreviewRows) {
                    // but still keep all errors; truncated preview only affects display
                }

                setRawRows(parsedRows);
                setValidRows(valRows);
                setErrors(reportedErrors);
            } catch (err: any) {
                setErrors([{ row: 0, field: "general", message: "Lỗi khi đọc file: " + String(err?.message ?? err) }]);
            } finally {
                setParsing(false);
            }
        };

        reader.onerror = () => {
            setParsing(false);
            setErrors([{ row: 0, field: "general", message: "Không thể đọc file" }]);
        };

        reader.readAsArrayBuffer(file);
    }

    function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        if (f) parseExcelFile(f);
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) parseExcelFile(f);
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
    }

    function handleConfirmImport() {
        // Only pass validated rows. Caller will call AddingExcelList
        onImport(validRows);
        onClose?.();
        setRawRows([]);
        setValidRows([]);
        setErrors([]);
    }

    return (
        <>
            {/* <button
                onClick={() => setOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
                Import file Excel
            </button>

            {open && ( */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                aria-modal="true"
                role="dialog"
            >
                <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="text-lg font-semibold">Import danh sách phim từ Excel</h3>
                        <div className="space-x-2">
                            <button
                                onClick={() => {
                                    // setOpen(false);
                                    onClose?.();
                                    setRawRows([]);
                                    setValidRows([]);
                                    setErrors([]);
                                }}
                                className="px-3 py-1 rounded border"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>

                    <div className="p-4 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium">Upload file (.xls/.xlsx)</label>
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    className="mt-2 p-4 border-dashed border-2 rounded text-center"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <div>
                                        <p>Drag & drop file Excel vào đây, hoặc click để chọn file</p>
                                        <p className="text-xs text-gray-500">Header nên có: tiêu đề, ngày công chiếu, thời lượng, độ tuổi, quốc gia, phụ đề, trailer, thể loại, diễn viên, mô tả, trạng thái</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium">Trạng thái</label>
                                <div className="mt-2 text-sm text-gray-700">
                                    <p>• Bản preview sẽ hiện các hàng hợp lệ và liệt kê lỗi cho hàng không hợp lệ.</p>
                                    <p>• Khi nhấn <strong>Confirm Import</strong> sẽ lưu vào database.</p>
                                    <p>• Hệ thống chấp nhận nhiều tên header (Tiếng Việt / English). Ngày công chiếu sẽ được chuẩn hóa thành YYYY-MM-DD.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Preview phim hợp lệ ({validRows.length})</h4>
                                <div className="text-sm text-gray-600">{parsing ? "Đang phân tích..." : "Sẵn sàng"}</div>
                            </div>

                            <div className="mt-2 overflow-auto max-h-52 border rounded">
                                {validRows.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-500">Không có hàng hợp lệ để hiển thị.</div>
                                ) : (
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-1 text-left">#</th>
                                                <th className="px-2 py-1 text-left">Tiêu đề</th>
                                                <th className="px-2 py-1 text-left">Ngày</th>
                                                <th className="px-2 py-1 text-left">Thời lượng</th>
                                                <th className="px-2 py-1 text-left">Độ tuổi</th>
                                                <th className="px-2 py-1 text-left">Quốc gia</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {validRows.slice(0, maxPreviewRows).map((r, i) => (
                                                <tr key={i} className="even:bg-white odd:bg-gray-50">
                                                    <td className="px-2 py-1">{r.__rowNum ?? i + 1}</td>
                                                    <td className="px-2 py-1">{r.name}</td>
                                                    <td className="px-2 py-1">{r.release_date}</td>
                                                    <td className="px-2 py-1">{r.duration ?? "-"}</td>
                                                    <td className="px-2 py-1">{r.age_require ?? "-"}</td>
                                                    <td className="px-2 py-1">{r.country ?? "-"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium">Lỗi & Cảnh báo ({errors.length})</h4>
                            <div className="mt-2 max-h-40 overflow-auto border rounded p-2">
                                {errors.length === 0 ? (
                                    <div className="text-sm text-gray-500">Không có lỗi.</div>
                                ) : (
                                    <ul className="text-sm space-y-1">
                                        {errors.map((er, idx) => (
                                            <li key={idx} className="border-b pb-1">
                                                <span className="font-medium">Hàng {er.row}:</span>{" "}
                                                <span>{er.field} — {er.message}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <button
                                onClick={() => {
                                    // Re-open file selector
                                    fileInputRef.current?.click();
                                }}
                                className="px-3 py-1 rounded border"
                            >
                                Chọn file khác
                            </button>

                            <button
                                onClick={() => {
                                    // Reset all
                                    setRawRows([]);
                                    setValidRows([]);
                                    setErrors([]);
                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                }}
                                className="px-3 py-1 rounded border"
                            >
                                Xóa
                            </button>

                            <button
                                disabled={validRows.length === 0}
                                onClick={handleConfirmImport}
                                className={`px-4 py-2 rounded text-white ${validRows.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                            >
                                Confirm Import ({validRows.length})
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* )} */}
        </>
    );
}
