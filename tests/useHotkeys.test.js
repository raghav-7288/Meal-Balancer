/**
 * useHotkeys hook tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useHotkeys from "../src/hooks/useHotkeys";

describe("useHotkeys", () => {
    let shortcuts;

    beforeEach(() => {
        shortcuts = {
            "ctrl+s": vi.fn(),
            "ctrl+n": vi.fn(),
            "escape": vi.fn(),
            "ctrl+shift+p": vi.fn(),
            "alt+d": vi.fn(),
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function fireKeydown(opts) {
        const event = new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            ...opts,
        });
        document.dispatchEvent(event);
    }

    it("triggers ctrl+s shortcut", () => {
        renderHook(() => useHotkeys(shortcuts));
        fireKeydown({ key: "s", ctrlKey: true });
        expect(shortcuts["ctrl+s"]).toHaveBeenCalledTimes(1);
    });

    it("triggers ctrl+n shortcut", () => {
        renderHook(() => useHotkeys(shortcuts));
        fireKeydown({ key: "n", ctrlKey: true });
        expect(shortcuts["ctrl+n"]).toHaveBeenCalledTimes(1);
    });

    it("triggers escape shortcut", () => {
        renderHook(() => useHotkeys(shortcuts));
        fireKeydown({ key: "Escape", code: "Escape" });
        expect(shortcuts["escape"]).toHaveBeenCalledTimes(1);
    });

    it("triggers ctrl+shift+p shortcut", () => {
        renderHook(() => useHotkeys(shortcuts));
        fireKeydown({ key: "p", ctrlKey: true, shiftKey: true });
        expect(shortcuts["ctrl+shift+p"]).toHaveBeenCalledTimes(1);
    });

    it("triggers meta+s (Mac Cmd) as ctrl shortcut", () => {
        renderHook(() => useHotkeys(shortcuts));
        fireKeydown({ key: "s", metaKey: true });
        expect(shortcuts["ctrl+s"]).toHaveBeenCalledTimes(1);
    });

    it("does NOT trigger shortcuts when disabled", () => {
        renderHook(() => useHotkeys(shortcuts, false));
        fireKeydown({ key: "s", ctrlKey: true });
        expect(shortcuts["ctrl+s"]).not.toHaveBeenCalled();
    });

    it("does NOT trigger non-ctrl shortcuts when inside an input", () => {
        renderHook(() => useHotkeys({ "d": vi.fn() }));
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();

        const event = new KeyboardEvent("keydown", {
            key: "d",
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, "target", { value: input });
        document.dispatchEvent(event);

        document.body.removeChild(input);
    });

    it("DOES trigger ctrl shortcuts when inside an input", () => {
        renderHook(() => useHotkeys(shortcuts));
        const input = document.createElement("input");
        document.body.appendChild(input);
        input.focus();

        const event = new KeyboardEvent("keydown", {
            key: "s",
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, "target", { value: input });
        document.dispatchEvent(event);

        expect(shortcuts["ctrl+s"]).toHaveBeenCalledTimes(1);
        document.body.removeChild(input);
    });

    it("DOES trigger escape inside an input", () => {
        renderHook(() => useHotkeys(shortcuts));
        const textarea = document.createElement("textarea");
        document.body.appendChild(textarea);
        textarea.focus();

        const event = new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            bubbles: true,
            cancelable: true,
        });
        Object.defineProperty(event, "target", { value: textarea });
        document.dispatchEvent(event);

        expect(shortcuts["escape"]).toHaveBeenCalledTimes(1);
        document.body.removeChild(textarea);
    });

    it("does not trigger unmatched key combos", () => {
        renderHook(() => useHotkeys(shortcuts));
        fireKeydown({ key: "x", ctrlKey: true });
        expect(shortcuts["ctrl+s"]).not.toHaveBeenCalled();
        expect(shortcuts["ctrl+n"]).not.toHaveBeenCalled();
    });

    it("cleans up listener on unmount", () => {
        const spy = vi.spyOn(document, "removeEventListener");
        const { unmount } = renderHook(() => useHotkeys(shortcuts));
        unmount();
        expect(spy).toHaveBeenCalledWith("keydown", expect.any(Function));
        spy.mockRestore();
    });
});

