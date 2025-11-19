"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./FilmDatalist.module.scss";
type Movie = { id: number; name: string };

export default function FilmDatalist({
    value,
    onChange,
    onSelect,
    placeholder = "Chọn phim...",
    initialId = null,
    initialLabel = null,
}: {
    value?: string;
    onChange?: (v: string) => void;
    onSelect?: (id: number | null) => void;
    placeholder?: string;
    initialId?: number | null;
    initialLabel?: string | null;
}) {
    const [query, setQuery] = useState(value ?? initialLabel ?? "");
    const [list, setList] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<number | null>(null);
    const lastFetchedQueryRef = useRef<string>("");

    async function fetchMovies(q: string) {
        setLoading(true);
        try {
            // backend hỗ trợ query param q, nếu không có thì trả toàn bộ list
            const url = q ? `/api/movies/list?q=${encodeURIComponent(q)}` : `/api/movies/list`;
            const res = await fetch(url);
            const data = await res.json();
            // normalize to array of { id, name }
            const arr = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
            // map to our Movie type (handle cases where backend uses movie_id/name)
            const mapped = arr.map((x: any) => {
                return { id: Number(x.movie_id ?? x.id ?? x.id_movie ?? 0), name: String(x.name ?? x.title ?? x.movie_name ?? "") };
            }).filter((m: Movie) => m.id && m.name);
            setList(mapped);
            lastFetchedQueryRef.current = q;
        } catch (err) {
            console.error("fetchMovies error:", err);
            setList([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // initial load (no query) to populate datalist suggestions
        fetchMovies("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // if parent controls value (typing from outside), reflect it
        if (typeof value === "string" && value !== query) {
            setQuery(value);
        }
    }, [value]);

    useEffect(() => {
        // if parent passes initialLabel, sync it to input
        if (initialLabel != null && initialLabel !== query) {
            setQuery(initialLabel);
        }
        // if parent passes initialId, notify parent via onSelect (so parent can set movieId)
        if (initialId != null) {
            // small delay to allow parent listeners to be ready
            // but avoid infinite loop: only call if initialId !== lastSelected (parent should guard)
            onSelect?.(initialId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialId, initialLabel]);

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            // only fetch when query changed meaningfully
            if (String(query).trim() === lastFetchedQueryRef.current?.trim()) return;
            fetchMovies(query.trim());
        }, 250);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    // khi input blur hoặc Enter -> map tên sang id
    async function handleSelectByName(name: string) {
        const trimmed = name?.trim() || "";
        if (!trimmed) {
            onSelect?.(null);
            return;
        }
        const found = list.find((m) => m.name === trimmed);
        if (found) {
            onSelect?.(found.id);
            return;
        }
        // fallback: cố fetch limit 1 theo tên
        try {
            const res = await fetch(`/api/movies/list?q=${encodeURIComponent(trimmed)}&limit=1`);
            const data = await res.json();
            const arr = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
            const mapped = arr.map((x: any) => ({ id: Number(x.movie_id ?? x.id ?? 0), name: String(x.name ?? x.title ?? "") }));
            if (mapped.length && mapped[0].name === trimmed) onSelect?.(mapped[0].id);
            else onSelect?.(null);
        } catch {
            onSelect?.(null);
        }
    }

    return (
        <div>
            {/* <input
                list="movie-datalist"
                value={query}
                placeholder={placeholder}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange?.(e.target.value);
                    // user typing -> selected item should be cleared
                    // parent will receive onSelect(null) on blur/enter if needed
                }}
                onBlur={(e) => handleSelectByName(e.currentTarget.value.trim())}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.currentTarget.blur(); // force onBlur -> handleSelectByName
                        handleSelectByName((e.target as HTMLInputElement).value.trim());
                    }
                }}
                className="border px-3 py-2 rounded w-full"
            /> */}
            <input
                list="movie-datalist"
                value={query}
                placeholder={placeholder}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange?.(e.target.value);
                }}
                onBlur={(e) => handleSelectByName(e.currentTarget.value.trim())}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.currentTarget.blur();
                        handleSelectByName((e.target as HTMLInputElement).value.trim());
                    }
                }}
                className={`${styles.input}`}
            />

            {/* spinner (hiện khi loading) */}
            <div className={`${styles.spinner} ${loading ? styles.loading : ""}`} aria-hidden={!loading} />

            <datalist id="movie-datalist">
                {list.map((m) => (
                    <option key={m.id} value={m.name} />
                ))}
            </datalist>
        </div>
    );
}
