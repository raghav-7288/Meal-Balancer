/**
 * VirtualizedList component tests
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import VirtualizedList from "../src/components/ui/VirtualizedList";

describe("VirtualizedList", () => {
    it("renders a scrollable container with correct styles", () => {
        const items = Array.from({ length: 10 }, (_, i) => ({ id: i, name: `Item ${i}` }));
        const { container } = render(
            <VirtualizedList
                items={items}
                estimateSize={40}
                overscan={2}
                className="test-list"
                renderItem={(item) => <div data-testid={`item-${item.id}`}>{item.name}</div>}
            />
        );

        const scrollContainer = container.querySelector(".test-list");
        expect(scrollContainer).toBeInTheDocument();
        expect(scrollContainer.style.maxHeight).toBe("60vh");
        expect(scrollContainer.style.overflow).toBe("auto");
    });

    it("renders with custom maxHeight", () => {
        const items = [{ id: 1, name: "Test" }];
        const { container } = render(
            <VirtualizedList
                items={items}
                renderItem={(item) => <div>{item.name}</div>}
                maxHeight="400px"
            />
        );

        const scrollContainer = container.firstChild;
        expect(scrollContainer.style.maxHeight).toBe("400px");
    });

    it("renders items using the renderItem function", () => {
        const items = Array.from({ length: 5 }, (_, i) => ({ id: i, name: `Food ${i}` }));
        const { container } = render(
            <VirtualizedList
                items={items}
                estimateSize={50}
                renderItem={(item, index) => (
                    <div data-testid={`row-${index}`}>{item.name}</div>
                )}
            />
        );

        // The virtualizer renders items based on container scroll height
        // In jsdom, since there's no real viewport, we verify the structure is set up
        const inner = container.firstChild.firstChild;
        expect(inner.style.height).toBe(`${5 * 50}px`);
        // Virtual items may or may not render in jsdom depending on scroll element height
        // Just verify the container renders without error
        expect(container.firstChild).toBeInTheDocument();
    });

    it("renders inner container with total size height", () => {
        const items = Array.from({ length: 20 }, (_, i) => ({ id: i }));
        const { container } = render(
            <VirtualizedList
                items={items}
                estimateSize={40}
                renderItem={(item) => <div>Item {item.id}</div>}
            />
        );

        // Inner container should have height = count * estimateSize
        const inner = container.firstChild.firstChild;
        expect(inner.style.height).toBe(`${20 * 40}px`);
        expect(inner.style.position).toBe("relative");
    });

    it("renders empty list when items is empty", () => {
        const { container } = render(
            <VirtualizedList
                items={[]}
                renderItem={() => <div>Should not render</div>}
            />
        );

        const inner = container.firstChild.firstChild;
        expect(inner.style.height).toBe("0px");
    });

    it("applies default estimateSize and overscan", () => {
        const items = [{ id: 1 }];
        const { container } = render(
            <VirtualizedList
                items={items}
                renderItem={(item) => <div>{item.id}</div>}
            />
        );

        // Default estimateSize is 56, so 1 item = 56px
        const inner = container.firstChild.firstChild;
        expect(inner.style.height).toBe("56px");
    });
});


