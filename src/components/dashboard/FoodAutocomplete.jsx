import { memo, useId, useState, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "../../hooks/useDebounce";
import { searchFoodItems } from "../../services/foodSearchService";

/**
 * A typeable autocomplete input for searching food items from the database.
 * Shows suggestions as the user types.
 */
function FoodAutocomplete({ value, onChange, onSelect, placeholder = "Type to search food..." }) {
    const [inputValue, setInputValue] = useState(value || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const debouncedQuery = useDebounce(inputValue, 300);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Virtualizer for dropdown (#76)
    // eslint-disable-next-line react-hooks/incompatible-library
    const virtualizer = useVirtualizer({
        count: suggestions.length,
        getScrollElement: () => dropdownRef.current,
        estimateSize: () => 40,
        overscan: 5,
    });
    // Sync external value changes via effect (controlled component pattern)
    const prevValueRef = useRef(value);
    useEffect(() => {
        if (value !== prevValueRef.current) {
            prevValueRef.current = value;
            setInputValue(value || "");
        }
    }, [value]);

    // Fetch suggestions when debounced query changes
    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setSuggestions([]);
            setIsOpen(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        searchFoodItems(debouncedQuery)
            .then((results) => {
                if (!cancelled) {
                    setSuggestions(results);
                    setIsOpen(results.length > 0);
                    setIsLoading(false);
                    setHighlightIndex(-1);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setSuggestions([]);
                    setIsOpen(false);
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [debouncedQuery]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    function handleInputChange(e) {
        const val = e.target.value;
        setInputValue(val);
        onChange(val);
        if (val.length < 2) {
            setIsOpen(false);
        }
    }

    function handleSelect(item) {
        setInputValue(item.food_name);
        setIsOpen(false);
        setSuggestions([]);
        onSelect(item);
    }

    function handleKeyDown(e) {
        if (!isOpen) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === "Enter" && highlightIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[highlightIndex]);
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    }

    const reactId = useId();
    const listboxId = `food-autocomplete-listbox-${reactId}`;

    return (
        <div className="food-autocomplete" ref={wrapperRef} style={{ position: "relative" }}>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    if (suggestions.length > 0) setIsOpen(true);
                }}
                placeholder={placeholder}
                aria-label="Search food item"
                autoComplete="off"
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={listboxId}
                aria-activedescendant={
                    highlightIndex >= 0 && isOpen ? `food-option-${highlightIndex}` : undefined
                }
                aria-autocomplete="list"
            />
            {isLoading && (
                <span className="food-autocomplete-loading" role="status" aria-live="polite">
                    Searching…
                </span>
            )}
            {isOpen && suggestions.length > 0 && (
                <ul
                    className="food-autocomplete-dropdown"
                    role="listbox"
                    id={listboxId}
                    ref={dropdownRef}
                    style={{ maxHeight: 240, overflow: "auto" }}
                    aria-label="Food search results"
                >
                    <div
                        style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const item = suggestions[virtualRow.index];
                            const index = virtualRow.index;
                            return (
                                <li
                                    key={item.food_id}
                                    id={`food-option-${index}`}
                                    role="option"
                                    aria-selected={index === highlightIndex}
                                    className={`food-autocomplete-item ${index === highlightIndex ? "highlighted" : ""}`}
                                    onClick={() => handleSelect(item)}
                                    onMouseEnter={() => setHighlightIndex(index)}
                                    style={{
                                        position: "absolute",
                                        top: 0,
                                        left: 0,
                                        width: "100%",
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <span className="food-autocomplete-name">{item.food_name}</span>
                                    <span className="food-autocomplete-code">{item.food_code}</span>
                                </li>
                            );
                        })}
                    </div>
                </ul>
            )}
        </div>
    );
}

export default memo(FoodAutocomplete);
