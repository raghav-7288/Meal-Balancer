import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../src/components/ui/CopyToDaysMenu.css", () => ({}));

import CopyToDaysMenu from "../src/components/ui/CopyToDaysMenu";

const setup = (props = {}) => {
    const onCopy = vi.fn();
    render(<CopyToDaysMenu sourceDay="Monday" itemLabel="Rice" onCopy={onCopy} {...props} />);
    return { onCopy };
};

const openMenu = () => fireEvent.click(screen.getByRole("button", { name: /copy rice to other days/i }));

describe("CopyToDaysMenu", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders a trigger button and no popover initially", () => {
        setup();
        expect(screen.getByRole("button", { name: /copy rice to other days/i })).toBeInTheDocument();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens the popover with a dialog and per-day checkboxes", () => {
        setup();
        openMenu();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        // All 7 days appear
        for (const day of ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]) {
            expect(screen.getByRole("checkbox", { name: new RegExp(day) })).toBeInTheDocument();
        }
    });

    it("disables the source day checkbox", () => {
        setup();
        openMenu();
        expect(screen.getByRole("checkbox", { name: /Monday \(current day\)/i })).toBeDisabled();
    });

    it("reflects open state via aria-expanded", () => {
        setup();
        const trigger = screen.getByRole("button", { name: /copy rice to other days/i });
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        openMenu();
        expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("disables Copy until at least one day is selected", () => {
        setup();
        openMenu();
        const copyBtn = screen.getByRole("button", { name: /copy to selected days/i });
        expect(copyBtn).toBeDisabled();

        fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
        expect(copyBtn).not.toBeDisabled();
        expect(copyBtn).toHaveTextContent("Copy (1)");
    });

    it("emits selected days via onCopy and closes", () => {
        const { onCopy } = setup();
        openMenu();
        fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
        fireEvent.click(screen.getByRole("checkbox", { name: "Thursday" }));
        fireEvent.click(screen.getByRole("button", { name: /copy to selected days/i }));

        expect(onCopy).toHaveBeenCalledTimes(1);
        expect(onCopy).toHaveBeenCalledWith(["Tuesday", "Thursday"]);
        // Popover closes after copying
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("'All other days' selects every non-source day", () => {
        const { onCopy } = setup();
        openMenu();
        fireEvent.click(screen.getByRole("checkbox", { name: "All other days" }));
        fireEvent.click(screen.getByRole("button", { name: /copy to selected days/i }));

        expect(onCopy).toHaveBeenCalledWith([
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ]);
    });

    it("Cancel closes without calling onCopy", () => {
        const { onCopy } = setup();
        openMenu();
        fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCopy).not.toHaveBeenCalled();
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on Escape", () => {
        setup();
        openMenu();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on outside click", () => {
        setup();
        openMenu();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("resets selection when reopened", () => {
        setup();
        openMenu();
        fireEvent.click(screen.getByRole("checkbox", { name: "Tuesday" }));
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        // Reopen — Tuesday should no longer be checked
        openMenu();
        expect(screen.getByRole("checkbox", { name: "Tuesday" })).not.toBeChecked();
        expect(screen.getByRole("button", { name: /copy to selected days/i })).toBeDisabled();
    });
});

