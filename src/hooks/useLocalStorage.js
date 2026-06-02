import { useState, useEffect } from "react";

/**
 * A useState-like hook that persists value to localStorage.
 * @param {string} key - localStorage key
 * @param {*} initialValue - default value if nothing in storage
 */
export function useLocalStorageState(key, initialValue) {
    const [state, setState] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialValue;
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(state));
        } catch (err) {
            console.error("Failed to save to localStorage:", err);
        }
    }, [key, state]);

    return [state, setState];
}

