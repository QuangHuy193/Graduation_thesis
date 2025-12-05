// useSlidingWindow.ts
import { useRef, useState, useCallback } from "react";

type Range = { from: string; to: string };

function addDaysISO(d: string, days: number) {
    const dt = new Date(d + 'T00:00:00');
    dt.setDate(dt.getDate() + days);
    return dt.toISOString().slice(0, 10);
}

export function useSlidingWindow({
    initialFrom,
    windowSize = 15,
    fetchRange,   // async (from,to) => ShowtimeDay[]
    generateRange // optional async (showtimeId, from, to) => ShowtimeDay[]
}: {
    initialFrom: string;
    windowSize?: number;
    fetchRange: (from: string, to: string) => Promise<any[]>;
    generateRange?: (from: string, to: string) => Promise<any[]>;
}) {
    const [byDate, setByDate] = useState<Record<string, any[]>>({});
    const loadedRanges = useRef<Range[]>([]); // tracked ranges already loaded/generated
    const loading = useRef<Record<string, boolean>>({});

    const markRangeLoaded = (from: string, to: string) => {
        loadedRanges.current.push({ from, to });
    };

    const isDateLoaded = (date: string) => {
        // if any loadedRange covers date
        return loadedRanges.current.some(r => r.from <= date && r.to >= date);
    };

    const mergeIntoState = (items: any[]) => {
        setByDate(prev => {
            const next = { ...prev };
            for (const it of items) {
                const key = it.show_date?.slice(0, 10);
                if (!key) continue;
                if (!next[key]) next[key] = [];
                // naive dedupe by id
                if (!next[key].some((x: any) => x.id === it.id)) next[key].push(it);
            }
            return next;
        });
    };

    const loadRange = useCallback(async (from: string, to: string) => {
        const key = `${from}_${to}`;
        if (loading.current[key]) return;
        loading.current[key] = true;
        try {
            const items = await fetchRange(from, to);
            mergeIntoState(items);
            markRangeLoaded(from, to);
        } finally {
            loading.current[key] = false;
        }
    }, [fetchRange]);

    // ensure a particular date is loaded; will compute a window that contains it
    const ensureDate = useCallback(async (date: string) => {
        if (isDateLoaded(date)) return;
        // create a window that starts at 'date' (or you might prefer left-align)
        const from = date;
        const to = addDaysISO(from, windowSize - 1);
        await loadRange(from, to);
    }, [loadRange, windowSize]);

    // initial loader
    const init = useCallback(() => {
        const from = initialFrom;
        const to = addDaysISO(from, windowSize - 1);
        loadRange(from, to);
    }, [initialFrom, loadRange, windowSize]);

    return {
        byDate,
        ensureDate,
        init,
        isDateLoaded,
        loadedRanges: loadedRanges.current
    };
}
