import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, ArrowRight, ChevronDown, ChevronUp, Info, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useDebounce } from "../hooks/useDebounce";
import EmptyState from "./ui/EmptyState";
import { SkeletonFoodResult } from "./ui/Skeleton";
import "./FoodSearchPage.css";

const FILTER_OPTIONS = ["All", "Foods", "Groups"];


function HighlightMatch({ text, query }) {
    if (!query || query.length < 2) return <>{text}</>;
    const splitRegex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const testRegex = new RegExp(`^${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const parts = text.split(splitRegex);
    return (
        <>
            {parts.map((part, i) =>
                testRegex.test(part) ? (
                    <mark key={i} className="food-search-highlight">{part}</mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </>
    );
}

function FoodSearchPage() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState(null);
    const [nutrients, setNutrients] = useState([]);
    const [nutrientsLoading, setNutrientsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState("All");
    const [activeIndex, setActiveIndex] = useState(-1);
    const [searchError, setSearchError] = useState("");
    const resultListRef = useRef(null);
    const inputRef = useRef(null);

    const debouncedQuery = useDebounce(query, 300);
    const [isNutrientSearch, setIsNutrientSearch] = useState(false);
    const [matchedNutrientName, setMatchedNutrientName] = useState("");

    // Search foods — with nutrient-based ranking
    useEffect(() => {
        let cancelled = false;

        if (debouncedQuery.length < 2) {
            // Use a microtask to avoid synchronous setState in effect body
            queueMicrotask(() => {
                if (cancelled) return;
                setResults([]);
                setActiveIndex(-1);
                setIsNutrientSearch(false);
                setMatchedNutrientName("");
            });
            return () => { cancelled = true; };
        }

        async function search() {
            setLoading(true);
            setSearchError("");
            try {
                // First, check if the query matches a nutrient name
                const { data: nutrientMatches, error: nutrientError } = await supabase
                    .from("food_search_view")
                    .select("nutrient_name, nutrient_id, unit")
                    .ilike("nutrient_name", `%${debouncedQuery}%`)
                    .limit(1);

                if (nutrientError) {
                    console.error("Search error:", nutrientError);
                    if (!cancelled) {
                        setSearchError("Could not connect to database. Check your network connection and try again.");
                        setResults([]);
                        setIsNutrientSearch(false);
                        setMatchedNutrientName("");
                        setLoading(false);
                    }
                    return;
                }

                if (!cancelled && nutrientMatches && nutrientMatches.length > 0) {
                    // Nutrient match found — fetch foods ranked by this nutrient value desc
                    const matched = nutrientMatches[0];
                    const { data: nutrientFoods, error: nfError } = await supabase
                        .from("food_search_view")
                        .select("food_id, food_code, food_name, food_group, nutrient_name, value, unit")
                        .eq("nutrient_id", matched.nutrient_id)
                        .not("value", "is", null)
                        .gt("value", 0)
                        .order("value", { ascending: false })
                        .limit(20);

                    if (nfError) {
                        console.error("Search error:", nfError);
                        if (!cancelled) {
                            setSearchError("Could not connect to database. Check your network connection and try again.");
                            setResults([]);
                            setIsNutrientSearch(false);
                            setMatchedNutrientName("");
                            setLoading(false);
                        }
                        return;
                    }

                    if (!cancelled) {
                        setIsNutrientSearch(true);
                        setMatchedNutrientName(matched.nutrient_name);
                        setResults(nutrientFoods || []);
                        setActiveIndex(-1);
                    }
                } else {
                    // No nutrient match — full text field search via RPC
                    const { data, error } = await supabase.rpc(
                        "search_foods_all_fields",
                        { search_text: debouncedQuery }
                    );

                    if (error) {
                        console.error("Search error:", error);
                        if (!cancelled) {
                            setSearchError("Could not connect to database. Check your network connection and try again.");
                            setResults([]);
                            setIsNutrientSearch(false);
                            setMatchedNutrientName("");
                            setLoading(false);
                        }
                        return;
                    }

                    if (!cancelled) {
                        setIsNutrientSearch(false);
                        setMatchedNutrientName("");
                        setResults(data || []);
                        setActiveIndex(-1);
                    }
                }
            } catch (err) {
                console.error("Search error:", err);
                if (!cancelled) {
                    setResults([]);
                    setIsNutrientSearch(false);
                    setMatchedNutrientName("");
                    setSearchError("Could not connect to database. Check your network connection and try again.");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        search();
        return () => { cancelled = true; };
    }, [debouncedQuery]);

    // Fetch nutrient details for selected food
    useEffect(() => {
        let cancelled = false;

        if (!selectedFood) {
            queueMicrotask(() => {
                if (cancelled) return;
                setNutrients([]);
            });
            return () => { cancelled = true; };
        }

        async function fetchNutrients() {
            setNutrientsLoading(true);
            try {
                const { data, error } = await supabase
                    .from("food_search_view")
                    .select("*")
                    .eq("food_id", selectedFood.food_id);
                if (error) {
                    console.error("Nutrient fetch error:", error);
                    if (!cancelled) setNutrients([]);
                    return;
                }
                if (!cancelled) setNutrients(data || []);
            } catch (err) {
                console.error("Nutrient fetch error:", err);
                if (!cancelled) setNutrients([]);
            } finally {
                if (!cancelled) setNutrientsLoading(false);
            }
        }

        fetchNutrients();
        return () => { cancelled = true; };
    }, [selectedFood]);

    // Filter results
    const filteredResults = useMemo(() => {
        if (activeFilter === "All") return results;
        if (activeFilter === "Foods") return results;
        if (activeFilter === "Groups") {
            // Deduplicate by food_group
            const seen = new Set();
            return results.filter((r) => {
                if (seen.has(r.food_group)) return false;
                seen.add(r.food_group);
                return true;
            });
        }
        return results;
    }, [results, activeFilter]);

    // Group nutrients by nutrient_group
    const groupedNutrients = useMemo(() => {
        const groups = {};
        for (const row of nutrients) {
            const group = row.nutrient_group || "Other";
            if (!groups[group]) groups[group] = [];
            groups[group].push(row);
        }
        return groups;
    }, [nutrients]);

    // Keyboard navigation
    const handleKeyDown = useCallback(
        (e) => {
            if (filteredResults.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev < filteredResults.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredResults.length - 1
                );
            } else if (e.key === "Enter" && activeIndex >= 0) {
                e.preventDefault();
                setSelectedFood(filteredResults[activeIndex]);
            }
        },
        [filteredResults, activeIndex]
    );

    // Scroll active item into view
    useEffect(() => {
        if (activeIndex >= 0 && resultListRef.current) {
            const item = resultListRef.current.children[activeIndex];
            if (item) item.scrollIntoView({ block: "nearest" });
        }
    }, [activeIndex]);

    return (
        <div className="food-search-page">
            {/* Sticky search bar */}
            <div className="food-search-bar-container">
                <div className="food-search-bar">
                    <Search size={20} className="food-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="food-search-input"
                        placeholder="Search foods, nutrients, groups..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                        role="combobox"
                        aria-expanded={filteredResults.length > 0}
                        aria-controls="food-search-results"
                        aria-activedescendant={activeIndex >= 0 ? `food-result-${activeIndex}` : undefined}
                        aria-label="Search foods, nutrients, or food groups"
                    />
                    {query && (
                        <button
                            className="food-search-clear"
                            onClick={() => {
                                setQuery("");
                                setResults([]);
                                inputRef.current?.focus();
                            }}
                            aria-label="Clear search"
                        >
                            <ArrowRight size={18} />
                        </button>
                    )}
                    {loading && <Loader2 size={18} className="food-search-spinner" />}
                </div>

                {/* Filter chips */}
                <div className="food-filter-chips">
                    {FILTER_OPTIONS.map((filter) => (
                        <button
                            key={filter}
                            className={`food-filter-chip ${activeFilter === filter ? "active" : ""}`}
                            onClick={() => setActiveFilter(filter)}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
                <div className="food-source-note">
                    <Info size={14} />
                    <span>Nutrient values are per 100g of food, based on IFCT 2017 data.</span>
                </div>
            </div>

            {/* Main content */}
            <div className="food-search-layout">
                {/* Left panel - Search results */}
                <div className="food-search-results-panel">
                    {query.length === 0 && (
                        <EmptyState
                            icon={<Search size={36} strokeWidth={1.5} />}
                            title="Search the food database"
                            description="Type a food name, nutrient, or food group to explore 600+ Indian foods with detailed nutrient data."
                        />
                    )}

                    {query.length > 0 && query.length < 2 && (
                        <div className="food-search-empty-state">
                            <p>Type at least 2 characters to search</p>
                        </div>
                    )}

                    {debouncedQuery.length >= 2 && !loading && filteredResults.length === 0 && !searchError && (
                        <EmptyState
                            icon={<Search size={36} strokeWidth={1.5} />}
                            title="No matching foods found"
                            description="Try a different search term or check your spelling."
                        />
                    )}

                    {/* Loading skeletons (#30) */}
                    {loading && (
                        <div className="food-search-results-list" aria-label="Loading search results" role="status">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <SkeletonFoodResult key={i} />
                            ))}
                        </div>
                    )}

                    {searchError && (
                        <div className="food-search-empty-state" style={{ color: "#ef4444" }}>
                            <p>{searchError}</p>
                        </div>
                    )}

                    {filteredResults.length > 0 && (
                        <div className="food-search-results-list" ref={resultListRef}>
                            {isNutrientSearch && (
                                <div className="food-nutrient-search-badge">
                                    Sorted by <strong>{matchedNutrientName}</strong> (highest first)
                                </div>
                            )}
                            {filteredResults.map((food, index) => (
                                <div
                                    key={`${food.food_id}-${index}`}
                                    className={`food-result-card ${
                                        selectedFood?.food_id === food.food_id ? "selected" : ""
                                    } ${activeIndex === index ? "keyboard-active" : ""}`}
                                    onClick={() => setSelectedFood(food)}
                                >
                                    <div className="food-result-name-row">
                                        <span className="food-result-name">
                                            <HighlightMatch text={food.food_name} query={debouncedQuery} />
                                        </span>
                                        {isNutrientSearch && food.value != null && (
                                            <span className="food-result-nutrient-value">
                                                {Number(food.value).toFixed(1)} <small>{food.unit || ""}</small>
                                            </span>
                                        )}
                                    </div>
                                    <div className="food-result-meta">
                                        <span className="food-result-code">{food.food_code}</span>
                                        <span className="food-result-group">
                                            <HighlightMatch text={food.food_group || ""} query={debouncedQuery} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right panel - Food details */}
                <div className="food-detail-panel">
                    {!selectedFood && (
                        <div className="food-search-empty-state">
                            <p>Select a food to view nutrient details</p>
                        </div>
                    )}

                    {selectedFood && nutrientsLoading && (
                        <div className="food-search-empty-state">
                            <Loader2 size={32} className="food-search-spinner" />
                            <p>Loading nutrient details...</p>
                        </div>
                    )}

                    {selectedFood && !nutrientsLoading && (
                        <div className="food-detail-content">
                            {/* Detail header */}
                            <div className="food-detail-header">
                                <h2 className="food-detail-name">{selectedFood.food_name}</h2>
                                <div className="food-detail-meta">
                                    <span className="food-detail-code">{selectedFood.food_code}</span>
                                    <span className="food-detail-group-badge">
                                        {selectedFood.food_group}
                                    </span>
                                </div>
                            </div>

                            {/* Nutrient groups */}
                            <div className="food-nutrient-groups">
                                {Object.entries(groupedNutrients).map(([groupName, items]) => (
                                    <NutrientGroupTable
                                        key={groupName}
                                        groupName={groupName}
                                        items={items}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function NutrientGroupTable({ groupName, items }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="food-nutrient-group">
            <button
                className="food-nutrient-group-header"
                onClick={() => setCollapsed(!collapsed)}
            >
                <h3>{groupName}</h3>
                {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            {!collapsed && (
                <table className="food-nutrient-table">
                    <thead>
                        <tr>
                            <th>Nutrient</th>
                            <th className="food-nutrient-value-col">Value</th>
                            <th className="food-nutrient-unit-col">Unit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, i) => (
                            <tr key={`${item.nutrient_id}-${i}`}>
                                <td className="food-nutrient-name">{item.nutrient_name}</td>
                                <td className="food-nutrient-value">
                                    {item.value != null ? Number(item.value).toFixed(2) : "—"}
                                </td>
                                <td className="food-nutrient-unit">{item.unit || ""}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default FoodSearchPage;


