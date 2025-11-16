// components/FilmDatalist.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Movie = { id: number; name: string };

export default function FilmDatalist({
    value,
    onChange,
    onSelect,
    placeholder = "Chọn phim...",
}: {
    value?: string;
    onChange?: (v: string) => void;
    onSelect?: (id: number | null) => void;
    placeholder?: string;
}) {
    const [query, setQuery] = useState(value ?? "");
    const [list, setList] = useState<Movie[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<number | null>(null);

    async function fetchMovies(q: string) {
        setLoading(true);
        try {
            const res = await fetch(`/api/movies/list`);
            const data = await res.json();
            // bảo đảm luôn set mảng
            setList(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("fetchMovies error:", err);
            setList([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // initial load
        fetchMovies("");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            fetchMovies(query);
        }, 250);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [query]);

    // khi input blur hoặc Enter -> map tên sang id
    async function handleSelectByName(name: string) {
        if (!name) {
            onSelect?.(null);
            return;
        }
        const found = list.find((m) => m.name === name);
        if (found) {
            onSelect?.(found.id);
            return;
        }
        // fallback: cố fetch limit 1 theo tên
        try {
            const res = await fetch(`/api/movies/list?q=${encodeURIComponent(name)}&limit=1`);
            const data = await res.json();
            const arr = Array.isArray(data) ? data : [];
            if (arr.length && arr[0].name === name) onSelect?.(arr[0].id);
            else onSelect?.(null);
        } catch {
            onSelect?.(null);
        }
    }

    return (
        <div>
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
                    if (e.key === "Enter") handleSelectByName((e.target as HTMLInputElement).value.trim());
                }}
                className="border px-3 py-2 rounded w-full"
            />

            <datalist id="movie-datalist">
                {list.map((m) => (
                    <option key={m.id} value={m.name} />
                ))}
            </datalist>

        </div>
    );
}