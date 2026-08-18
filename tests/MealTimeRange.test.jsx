import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("../src/components/ui/MealTimeRange.css", () => ({}));

import MealTimeRange from "../src/components/ui/MealTimeRange";

const setup = (props = {}) => {
    const onChange = vi.fn();
    render(
        <MealTimeRange slot="Breakfast" mealTimes={{}} onChange={onChange} {...props} />
    );
    return { onChange };
};

const openPopover = () =>
    fireEvent.click(screen.getByRole("button", { name: "Meal time for Breakfast" }));

describe("MealTimeRange", () => {
    beforeEach(() => vi.clearAllMocks());

    it("renders a trigger chip with the friendly range label and no popover initially", () => {
        setup();
        // Empty mealTimes → default Breakfast range 08:00–10:00 → "8–10 AM"
        expect(screen.getByRole("button", { name: "Meal time for Breakfast" })).toHaveTextContent(
            "8\u201310 AM"
        );
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens a popover with Start and End inputs on click", () => {
        setup();
        openPopover();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByLabelText("Meal time for Breakfast start")).toHaveValue("08:00");
        expect(screen.getByLabelText("Meal time for Breakfast end")).toHaveValue("10:00");
    });

    it("reflects open state via aria-expanded", () => {
        setup();
        const trigger = screen.getByRole("button", { name: "Meal time for Breakfast" });
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        openPopover();
        expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("emits the full range when editing the start", () => {
        const { onChange } = setup();
        openPopover();
        fireEvent.change(screen.getByLabelText("Meal time for Breakfast start"), {
            target: { value: "07:30" },
        });
        expect(onChange).toHaveBeenCalledWith({ start: "07:30", end: "10:00" });
    });

    it("emits the full range when editing the end", () => {
        const { onChange } = setup();
        openPopover();
        fireEvent.change(screen.getByLabelText("Meal time for Breakfast end"), {
            target: { value: "09:30" },
        });
        expect(onChange).toHaveBeenCalledWith({ start: "08:00", end: "09:30" });
    });

    it("Done closes the popover", () => {
        setup();
        openPopover();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on Escape", () => {
        setup();
        openPopover();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        fireEvent.keyDown(document, { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on outside click", () => {
        setup();
        openPopover();
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        fireEvent.mouseDown(document.body);
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("renders a read-only label with no trigger or inputs when readOnly", () => {
        setup({
            readOnly: true,
            mealTimes: { Breakfast: { start: "08:00", end: "10:00" } },
        });
        expect(screen.getByText("8\u201310 AM")).toBeInTheDocument();
        expect(
            screen.queryByRole("button", { name: "Meal time for Breakfast" })
        ).not.toBeInTheDocument();
        expect(
            screen.queryByLabelText("Meal time for Breakfast start")
        ).not.toBeInTheDocument();
    });

    it("shows a 'Set time' placeholder for a slot with no range or default", () => {
        setup({ slot: "Snacktime", mealTimes: {} });
        expect(
            screen.getByRole("button", { name: "Meal time for Snacktime" })
        ).toHaveTextContent("Set time");
    });
});

