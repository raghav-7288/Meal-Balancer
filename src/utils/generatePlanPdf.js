import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { foodById } from "../engines/nutrientEngine";
import { MEALS, DAYS } from "../data/presetPlans";

/* ─── Exported Pure Functions (testable layout logic) ─── */

/**
 * Compute weekly average macronutrients from daySummaries.
 * @param {object} daySummaries - Per-day summaries keyed by day name
 * @param {string[]} days - Array of day names to iterate
 * @returns {{ daysWithFood: string[], avgKcal: number, avgProtein: number, avgCarbs: number, avgFat: number, avgFibre: number }}
 */
export function computeWeeklyAverages(daySummaries, days) {
    const daysWithFood = days.filter((d) => {
        const dt = daySummaries[d]?.dayTotals;
        return dt && (dt.protein || 0) + (dt.carbs || 0) + (dt.fat || 0) > 0;
    });
    const numDays = daysWithFood.length || 1;
    const avgKcal = Math.round(daysWithFood.reduce((s, d) => s + (daySummaries[d]?.dayTotals?.kcal || 0), 0) / numDays);
    const avgProtein = Math.round(daysWithFood.reduce((s, d) => s + (daySummaries[d]?.dayTotals?.protein || 0), 0) / numDays);
    const avgCarbs = Math.round(daysWithFood.reduce((s, d) => s + (daySummaries[d]?.dayTotals?.carbs || 0), 0) / numDays);
    const avgFat = Math.round(daysWithFood.reduce((s, d) => s + (daySummaries[d]?.dayTotals?.fat || 0), 0) / numDays);
    const avgFibre = Math.round(daysWithFood.reduce((s, d) => s + (daySummaries[d]?.dayTotals?.fibre || 0), 0) / numDays);

    return { daysWithFood, avgKcal, avgProtein, avgCarbs, avgFat, avgFibre };
}

/**
 * Build a single table row for a meal item.
 * @param {object} item - Meal item { foodId, foodName, grams, instructions, nutrients }
 * @param {function} lookupFood - Function to look up food by ID (e.g., foodById)
 * @param {object} [options] - { includeFibre: boolean }
 * @returns {Array} Table row array: [name, qty, instructions, kcal, protein, carbs, fat, ...fibre?]
 */
export function buildMealTableRow(item, lookupFood, options = {}) {
    const { includeFibre = false } = options;
    const food = lookupFood(item.foodId);
    const name = food?.name || item.foodName || item.foodId;
    const grams = item.grams;
    const instructions = item.instructions || "";
    let kcal = 0, protein = "0", carbs = "0", fat = "0", fibre = "0";

    if (item.nutrients) {
        const factor = grams / 100;
        kcal = Math.round((item.nutrients.kcal || 0) * factor);
        protein = ((item.nutrients.protein || 0) * factor).toFixed(1);
        carbs = ((item.nutrients.carbs || 0) * factor).toFixed(1);
        fat = ((item.nutrients.fat || 0) * factor).toFixed(1);
        fibre = ((item.nutrients.fibre || 0) * factor).toFixed(1);
    } else if (food) {
        const factor = grams / food.gramsPerExchange;
        kcal = Math.round(food.kcal * factor);
        protein = (food.protein * factor).toFixed(1);
        carbs = (food.carbs * factor).toFixed(1);
        fat = (food.fat * factor).toFixed(1);
        fibre = (food.fibre * factor).toFixed(1);
    }

    if (includeFibre) {
        return [name, `${grams}g`, instructions, kcal, protein, carbs, fat, fibre];
    }
    return [name, `${grams}g`, instructions, kcal, protein, carbs, fat];
}

/**
 * Build the daily nutrition summary table body from dayTotals.
 * @param {object} dayTotals - { kcal, protein, carbs, fat, fibre, visibleFat, vegetablesG }
 * @returns {Array[]} 2D array of [label, value] rows
 */
export function buildDailySummaryRows(dayTotals) {
    return [
        ["Total Calories", `${Math.round(dayTotals.kcal)} kcal`],
        ["Protein", `${dayTotals.protein.toFixed(1)} g`],
        ["Carbohydrates", `${dayTotals.carbs.toFixed(1)} g`],
        ["Fat", `${dayTotals.fat.toFixed(1)} g`],
        ["Fibre", `${dayTotals.fibre.toFixed(1)} g`],
        ["Visible Fat", `${dayTotals.visibleFat.toFixed(1)} g`],
        ["Vegetables", `${dayTotals.vegetablesG.toFixed(1)} g`],
    ];
}

/* ─── Color Palette ─── */
const COLORS = {
    primary: [37, 99, 235],       // Blue-600
    primaryDark: [29, 78, 216],   // Blue-700
    accent: [16, 185, 129],       // Emerald-500
    dark: [15, 23, 42],           // Slate-900
    text: [51, 65, 85],           // Slate-700
    muted: [100, 116, 139],       // Slate-500
    light: [241, 245, 249],       // Slate-100
    border: [226, 232, 240],      // Slate-200
    white: [255, 255, 255],
    headerBg: [37, 99, 235],
    summaryHeaderBg: [16, 185, 129],
    totalRowBg: [239, 246, 255],  // Blue-50
    // Light pastel section backgrounds
    dayCardBg: [248, 250, 255],       // Very light blue tint
    dayCardBorder: [214, 226, 252],   // Soft blue border
    mealSlotBg: [240, 249, 245],      // Very light emerald tint
    mealSlotBorder: [209, 237, 225],  // Soft emerald border
    dayTotalBg: [245, 243, 255],      // Very light indigo tint
    dayTotalBorder: [224, 220, 252],  // Soft indigo border
};

/**
 * Draw the Meal Balancer logo on the PDF at the given position.
 */
function drawLogo(doc, x, y, small = false) {
    const radius = small ? 5.5 : 7;
    const circleX = x + radius;
    const circleY = y + radius;

    // Dark circle background
    doc.setFillColor(30, 41, 59);
    doc.circle(circleX, circleY, radius, "F");

    // Draw utensils icon (simplified fork + knife in white)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(small ? 0.4 : 0.5);

    const scale = small ? 0.78 : 1;
    // Fork prongs
    doc.line(circleX - 2.5 * scale, circleY - 4 * scale, circleX - 2.5 * scale, circleY - 1 * scale);
    doc.line(circleX - 1 * scale, circleY - 4 * scale, circleX - 1 * scale, circleY - 1 * scale);
    doc.line(circleX + 0.5 * scale, circleY - 4 * scale, circleX + 0.5 * scale, circleY - 1 * scale);
    // Fork handle
    doc.line(circleX - 1 * scale, circleY - 1 * scale, circleX - 1 * scale, circleY + 4 * scale);
    // Knife
    doc.line(circleX + 2.5 * scale, circleY - 4 * scale, circleX + 2.5 * scale, circleY + 4 * scale);
    doc.line(circleX + 2.5 * scale, circleY - 4 * scale, circleX + 3.5 * scale, circleY - 2 * scale);
    doc.line(circleX + 3.5 * scale, circleY - 2 * scale, circleX + 2.5 * scale, circleY);

    // Reset line color
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);

    // "Meal Balancer" text
    const textX = x + (radius * 2) + 4;
    doc.setFontSize(small ? 10 : 13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("Meal Balancer", textX, y + (small ? 5 : 6));

    // "by Dt. Bhakti Shrivastava" subtitle
    doc.setFontSize(small ? 6.5 : 8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text("by Dt. Bhakti Shrivastava", textX, y + (small ? 9 : 11));

    // Reset text color
    doc.setTextColor(0);
}

/**
 * Draw a page header with logo and separator (for pages after the first).
 * Returns the Y position where content should start.
 */
function drawPageHeader(doc, pageWidth) {
    drawLogo(doc, 14, 6, true);

    // Date on right side
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }), pageWidth - 14, 12, { align: "right" });

    // Separator line
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, 19, pageWidth - 14, 19);
    doc.setDrawColor(0);
    doc.setTextColor(0);

    return 26; // Content starts after header
}

/**
 * Draw footer with page number.
 */
function drawFooter(doc, pageNum, totalPages, pageWidth, pageHeight) {
    const footerY = pageHeight - 10;

    // Separator
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);
    doc.setDrawColor(0);

    // Page number
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, footerY, { align: "center" });

    // Branding on left
    doc.text("Meal Balancer \u2014 Personalized Nutrition Plan", 14, footerY);

    doc.setTextColor(0);
}

/**
 * Draw the Client Information card section — personal details only.
 */
function drawClientInfo(doc, userInfo, profile, y, pageWidth) {
    const cardMargin = 14;
    const cardWidth = pageWidth - cardMargin * 2;

    // Section header with accent bar
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(cardMargin, y - 4.5, 3, 6, 1, 1, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("Client Information", cardMargin + 6, y);
    y += 6;

    // Card background
    const cardHeight = 38;
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardMargin, y, cardWidth, cardHeight, 3, 3, "FD");
    doc.setDrawColor(0);
    y += 8;

    // Two-column layout
    const col1X = cardMargin + 8;
    const col2X = pageWidth / 2 + 8;
    const lineHeight = 7.5;

    doc.setFontSize(9);

    // Row 1
    drawInfoRow(doc, col1X, y, "Name", userInfo.fullName || "\u2014");
    drawInfoRow(doc, col2X, y, "Email", userInfo.email || "\u2014");
    y += lineHeight;

    // Row 2
    drawInfoRow(doc, col1X, y, "Age", userInfo.age ? `${userInfo.age} years` : "\u2014");
    drawInfoRow(doc, col2X, y, "Sex", capitalize(profile.sex || "\u2014"));
    y += lineHeight;

    // Row 3
    drawInfoRow(doc, col1X, y, "Height", userInfo.heightCm ? `${userInfo.heightCm} cm` : "\u2014");
    drawInfoRow(doc, col2X, y, "Weight", userInfo.weightKg ? `${userInfo.weightKg} kg` : "\u2014");
    y += lineHeight;

    // Row 4
    drawInfoRow(doc, col1X, y, "BMI", userInfo.bmi || "\u2014");
    if (userInfo.contactNumber) {
        drawInfoRow(doc, col2X, y, "Contact", userInfo.contactNumber);
    }

    y += lineHeight + 2;
    doc.setTextColor(0);
    return y + 4;
}

/**
 * Draw the Plan Info card section — plan-specific details.
 */
function drawPlanInfo(doc, plan, profile, y, pageWidth) {
    const cardMargin = 14;
    const cardWidth = pageWidth - cardMargin * 2;

    // Section header with accent bar
    doc.setFillColor(...COLORS.accent);
    doc.roundedRect(cardMargin, y - 4.5, 3, 6, 1, 1, "F");
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("Plan Info", cardMargin + 6, y);
    y += 6;

    // Card background
    const cardHeight = 24;
    doc.setFillColor(...COLORS.mealSlotBg);
    doc.setDrawColor(...COLORS.mealSlotBorder);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardMargin, y, cardWidth, cardHeight, 3, 3, "FD");
    doc.setDrawColor(0);
    y += 8;

    const col1X = cardMargin + 8;
    const col2X = pageWidth / 2 + 8;
    const lineHeight = 7.5;

    doc.setFontSize(9);

    // Row 1
    drawInfoRow(doc, col1X, y, "Plan Name", plan.name || "\u2014");
    drawInfoRow(doc, col2X, y, "Diet Type", capitalize(profile.dietType || "\u2014"));
    y += lineHeight;

    // Row 2
    drawInfoRow(doc, col1X, y, "Goal", capitalize(profile.goal || "\u2014"));
    drawInfoRow(doc, col2X, y, "Activity Level", capitalize(profile.activity || "\u2014"));

    y += lineHeight + 2;

    doc.setTextColor(0);
    return y + 4;
}

/**
 * Draw a labeled info row.
 */
function drawInfoRow(doc, x, y, label, value) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.muted);
    doc.text(`${label}:`, x, y);
    const labelWidth = doc.getTextWidth(`${label}:`);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.dark);
    doc.text(` ${value}`, x + labelWidth, y);
}

/**
 * Capitalize the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
    if (!str || str === "\u2014") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate and download a PDF for a given diet plan.
 * When daySummaries is provided, generates a full weekly plan PDF.
 * @param {object} plan - The plan object with { id, name, meals }
 * @param {object} summary - The computed summary with dayTotals, mealTotals, dayScore
 * @param {object} [userInfo] - User information { fullName, email, age, heightCm, weightKg, bmi, contactNumber }
 * @param {object} [profile] - Local profile { activity, goal, dietType, sex }
 * @param {object} [daySummaries] - Optional: per-day summaries keyed by day name for weekly format
 */
export function downloadPlanAsPdf(plan, summary, userInfo = {}, profile = {}, daySummaries = null) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ─── PAGE 1: COVER / HEADER ───
    // Logo at top-left
    drawLogo(doc, 14, 8);

    // Date at top-right
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.muted);
    doc.text(
        new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
        pageWidth - 14, 14, { align: "right" }
    );

    // Separator line below logo
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(14, 23, pageWidth - 14, 23);
    doc.setDrawColor(0);

    doc.setTextColor(0);

    let yPos = 34;

    // ─── 1. CLIENT INFO SECTION ───
    if (userInfo.fullName || userInfo.email) {
        yPos = drawClientInfo(doc, userInfo, profile, yPos, pageWidth);
    }

    yPos += 8;

    // ─── 2. PLAN INFO SECTION ───
    yPos = drawPlanInfo(doc, plan, profile, yPos, pageWidth);

    yPos += 8;

    // ─── 3. PLAN GUIDELINES ───
    if (plan.guidelines) {
        // Section header
        doc.setFillColor(...COLORS.primaryDark);
        doc.roundedRect(14, yPos - 4.5, 3, 6, 1, 1, "F");
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text("Plan Guidelines", 20, yPos);
        doc.setTextColor(0);
        yPos += 6;

        // Guidelines text
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.text);
        const guidelinesLines = doc.splitTextToSize(plan.guidelines, pageWidth - 36);
        for (const line of guidelinesLines) {
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = drawPageHeader(doc, pageWidth);
            }
            doc.text(line, 16, yPos);
            yPos += 5.5;
        }
        doc.setTextColor(0);
        yPos += 8;
    }

    yPos += 4;

    // ─── 4. WEEKLY OVERVIEW STATS (only for weekly plans) ───
    if (daySummaries) {
        // Compute weekly averages
        const { daysWithFood, avgKcal, avgProtein, avgCarbs, avgFat, avgFibre } = computeWeeklyAverages(daySummaries, DAYS);

        // Check page space
        if (yPos > pageHeight - 55) {
            doc.addPage();
            yPos = drawPageHeader(doc, pageWidth);
        }

        // Section header
        doc.setFillColor(...COLORS.accent);
        doc.roundedRect(14, yPos - 4.5, 3, 6, 1, 1, "F");
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text("Weekly Overview", 20, yPos);
        doc.setTextColor(0);
        yPos += 6;

        // Stats card
        const statsCardHeight = 32;
        doc.setFillColor(...COLORS.dayCardBg);
        doc.setDrawColor(...COLORS.dayCardBorder);
        doc.setLineWidth(0.3);
        doc.roundedRect(14, yPos, pageWidth - 28, statsCardHeight, 3, 3, "FD");
        doc.setDrawColor(0);
        yPos += 8;

        // Stats in a row of boxes
        const statItems = [
            { label: "Days Planned", value: `${daysWithFood.length}` },
            { label: "Avg Calories", value: `${avgKcal} kcal` },
            { label: "Avg Protein", value: `${avgProtein}g` },
            { label: "Avg Carbs", value: `${avgCarbs}g` },
            { label: "Avg Fat", value: `${avgFat}g` },
            { label: "Avg Fibre", value: `${avgFibre}g` },
        ];

        const statWidth = (pageWidth - 36) / statItems.length;
        for (let i = 0; i < statItems.length; i++) {
            const sx = 18 + i * statWidth;
            // Value
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.primaryDark);
            doc.text(statItems[i].value, sx + statWidth / 2, yPos + 2, { align: "center" });
            // Label
            doc.setFontSize(7);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...COLORS.muted);
            doc.text(statItems[i].label, sx + statWidth / 2, yPos + 9, { align: "center" });
        }
        doc.setTextColor(0);

        yPos += statsCardHeight - 2;
    }


    // ─── WEEKLY FORMAT ───
    if (daySummaries) {
        for (const day of DAYS) {
            const daySummary = daySummaries[day];
            const dayTotals = daySummary?.dayTotals;
            const hasFood = dayTotals && (dayTotals.protein || 0) + (dayTotals.carbs || 0) + (dayTotals.fat || 0) > 0;

            if (!hasFood) continue;

            // ── Each day starts on a fresh page ──
            doc.addPage();
            yPos = drawPageHeader(doc, pageWidth);

            // ── Day header bar ──
            doc.setFillColor(...COLORS.primaryDark);
            doc.roundedRect(14, yPos - 5.5, pageWidth - 28, 11, 2.5, 2.5, "F");
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.white);
            doc.text(`${day}`, 20, yPos + 1);
            doc.setTextColor(0);
            yPos += 14;

            // Meals for this day
            for (const mealName of MEALS) {
                const items = (plan.meals[mealName] || []).filter(
                    (i) => i.day === day || !i.day
                );
                if (items.length === 0) continue;

                // Check if we need a new page (overflow within a day)
                if (yPos > 240) {
                    doc.addPage();
                    yPos = drawPageHeader(doc, pageWidth);
                }

                // Meal subheader with light background pill
                doc.setFillColor(...COLORS.mealSlotBg);
                doc.setDrawColor(...COLORS.mealSlotBorder);
                doc.setLineWidth(0.3);
                doc.roundedRect(16, yPos - 4, pageWidth - 32, 7.5, 1.5, 1.5, "FD");
                doc.setDrawColor(0);

                // Colored accent dot
                doc.setFillColor(...COLORS.accent);
                doc.circle(21, yPos - 0.25, 1.5, "F");

                doc.setFontSize(9.5);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...COLORS.dark);
                doc.text(mealName, 25, yPos);
                doc.setTextColor(0);
                yPos += 6;

                // Build table data
                const tableBody = items.map((item) => buildMealTableRow(item, foodById, { includeFibre: false }));

                autoTable(doc, {
                    startY: yPos,
                    head: [["Food Item", "Qty", "Instructions", "Kcal", "Protein (g)", "Carbs (g)", "Fat (g)"]],
                    body: tableBody,
                    theme: "grid",
                    headStyles: {
                        fillColor: [15, 23, 42],   // Slate-900 (dark contrast)
                        textColor: COLORS.white,
                        fontSize: 7.5,
                        fontStyle: "bold",
                        cellPadding: 2.5,
                        halign: "center",
                    },
                    bodyStyles: {
                        fontSize: 7.5,
                        textColor: COLORS.text,
                        cellPadding: 2.5,
                    },
                    columnStyles: {
                        0: { halign: "left", cellWidth: 40 },
                        1: { halign: "center", cellWidth: 14 },
                        2: { halign: "left", cellWidth: 36 },
                        3: { halign: "center" },
                        4: { halign: "center" },
                        5: { halign: "center" },
                        6: { halign: "center" },
                    },
                    styles: {
                        lineColor: COLORS.border,
                        lineWidth: 0.2,
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252], // Slate-50
                    },
                    margin: { left: 18, right: 18 },
                });

                yPos = doc.lastAutoTable.finalY + 8;
            }

            // ── Day total summary card ──
            if (dayTotals) {
                if (yPos > 265) {
                    doc.addPage();
                    yPos = drawPageHeader(doc, pageWidth);
                }
                const totalCardHeight = 10;
                doc.setFillColor(...COLORS.dayTotalBg);
                doc.setDrawColor(...COLORS.dayTotalBorder);
                doc.setLineWidth(0.3);
                doc.roundedRect(16, yPos - 2, pageWidth - 32, totalCardHeight, 2, 2, "FD");
                doc.setDrawColor(0);

                doc.setFontSize(8);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(...COLORS.primaryDark);
                const totalText = `Day Total:  ${Math.round(dayTotals.kcal)} kcal  |  Protein: ${dayTotals.protein.toFixed(1)}g  |  Carbs: ${dayTotals.carbs.toFixed(1)}g  |  Fat: ${dayTotals.fat.toFixed(1)}g  |  Fibre: ${dayTotals.fibre.toFixed(1)}g`;
                doc.text(totalText, pageWidth / 2, yPos + 3.5, { align: "center" });
                doc.setTextColor(0);
                yPos += totalCardHeight + 6;
            }
        }

    } else {
        // ─── SINGLE DAY FORMAT (fallback) ───
        for (const mealName of MEALS) {
            const items = plan.meals[mealName] || [];
            if (items.length === 0) continue;

            if (yPos > 240) {
                doc.addPage();
                yPos = drawPageHeader(doc, pageWidth);
            }

            doc.setFillColor(...COLORS.primary);
            doc.roundedRect(14, yPos - 4.5, 3, 6, 1, 1, "F");
            doc.setFontSize(13);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(...COLORS.dark);
            doc.text(mealName, 20, yPos);
            doc.setTextColor(0);
            yPos += 4;

            const tableBody = items.map((item) => buildMealTableRow(item, foodById, { includeFibre: true }));

            const mealTotals = summary?.mealTotals?.[mealName];
            if (mealTotals) {
                tableBody.push([
                    "TOTAL",
                    "",
                    "",
                    Math.round(mealTotals.kcal),
                    mealTotals.protein.toFixed(1),
                    mealTotals.carbs.toFixed(1),
                    mealTotals.fat.toFixed(1),
                    mealTotals.fibre.toFixed(1),
                ]);
            }

            autoTable(doc, {
                startY: yPos,
                head: [["Food Item", "Qty", "Instructions", "Kcal", "Protein (g)", "Carbs (g)", "Fat (g)", "Fibre (g)"]],
                body: tableBody,
                theme: "grid",
                headStyles: {
                    fillColor: COLORS.headerBg,
                    textColor: COLORS.white,
                    fontSize: 8,
                    fontStyle: "bold",
                    cellPadding: 3,
                    halign: "center",
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: COLORS.text,
                    cellPadding: 2.5,
                },
                columnStyles: {
                    0: { halign: "left", cellWidth: 38 },
                    1: { halign: "center", cellWidth: 15 },
                    2: { halign: "left", cellWidth: 34 },
                    3: { halign: "center" },
                    4: { halign: "center" },
                    5: { halign: "center" },
                    6: { halign: "center" },
                    7: { halign: "center" },
                },
                styles: {
                    lineColor: COLORS.border,
                    lineWidth: 0.2,
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252],
                },
                didParseCell: (data) => {
                    if (data.row.index === tableBody.length - 1 && mealTotals) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.fillColor = COLORS.totalRowBg;
                        data.cell.styles.textColor = COLORS.primaryDark;
                    }
                },
                margin: { left: 14, right: 14 },
            });

            yPos = doc.lastAutoTable.finalY + 10;
        }
    }

    // ─── DAILY NUTRITION SUMMARY ───
    const dayTotals = summary?.dayTotals;
    if (dayTotals && !daySummaries) {
        if (yPos > 210) {
            doc.addPage();
            yPos = drawPageHeader(doc, pageWidth);
        }

        // Section header
        doc.setFillColor(...COLORS.accent);
        doc.roundedRect(14, yPos - 4.5, 3, 6, 1, 1, "F");
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text("Daily Nutrition Summary", 20, yPos);
        doc.setTextColor(0);
        yPos += 4;

        autoTable(doc, {
            startY: yPos,
            head: [["Nutrient", "Daily Intake"]],
            body: buildDailySummaryRows(dayTotals),
            theme: "grid",
            headStyles: {
                fillColor: COLORS.summaryHeaderBg,
                textColor: COLORS.white,
                fontSize: 9.5,
                fontStyle: "bold",
                cellPadding: 3.5,
            },
            bodyStyles: {
                fontSize: 9.5,
                textColor: COLORS.text,
                cellPadding: 3,
            },
            columnStyles: {
                0: { fontStyle: "bold", cellWidth: 60 },
                1: { halign: "center" },
            },
            styles: {
                lineColor: COLORS.border,
                lineWidth: 0.2,
            },
            alternateRowStyles: {
                fillColor: [240, 253, 244],
            },
            margin: { left: 14, right: 14 },
        });
    }

    // ─── ADD HEADERS TO PAGES 2+ & FOOTERS TO ALL PAGES ───
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        drawFooter(doc, i, totalPages, pageWidth, pageHeight);
    }

    // Save
    const fileName = `${plan.name.replace(/[^a-zA-Z0-9 ]/g, "").trim()}.pdf`;
    doc.save(fileName);
}
