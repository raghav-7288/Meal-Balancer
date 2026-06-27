import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

/**
 * VirtualizedList (#76) — renders only visible rows using @tanstack/react-virtual.
 * Use in FoodSearchPage and FoodAutocomplete for windowed rendering of 500+ items.
 *
 * @param {object} props
 * @param {Array} props.items - The full list of items to virtualize.
 * @param {number} [props.estimateSize=56] - Estimated row height in px.
 * @param {number} [props.overscan=5] - Number of extra items to render outside the viewport.
 * @param {string} [props.className] - CSS class for the scroll container.
 * @param {(item: any, index: number, style: object) => JSX.Element} props.renderItem - Render function for each item.
 * @param {string} [props.maxHeight="60vh"] - Max height of the scroll container.
 */
function VirtualizedList({
    items,
    estimateSize = 56,
    overscan = 5,
    className = "",
    renderItem,
    maxHeight = "60vh",
}) {
    const parentRef = useRef(null);

    const virtualizer = useVirtualizer({
        count: items.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan,
    });

    return (
        <div
            ref={parentRef}
            className={className}
            style={{
                maxHeight,
                overflow: "auto",
                overscrollBehavior: "contain",
                position: "relative",
            }}
        >
            <div
                style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                }}
            >
                {virtualizer.getVirtualItems().map((virtualRow) => (
                    <div
                        key={virtualRow.key}
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            transform: `translateY(${virtualRow.start}px)`,
                        }}
                        data-index={virtualRow.index}
                        ref={virtualizer.measureElement}
                    >
                        {renderItem(items[virtualRow.index], virtualRow.index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VirtualizedList;
