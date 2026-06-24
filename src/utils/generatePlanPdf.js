import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { foodById } from "../engines/nutrientEngine";
import { MEALS } from "../data/presetPlans";

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
    doc.line(circleX + 3.5 * scale, circleY - 2 * scale, circleX + 2.5 * scale, circleY * scale);

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
 * Draw the Client Information card section.
 */
function drawClientInfo(doc, userInfo, profile, y, pageWidth) {
    const cardMargin = 14;
    const cardWidth = pageWidth - cardMargin * 2;

    // Section header
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("Client Information", cardMargin, y);
    y += 3;

    // Card background
    doc.setFillColor(...COLORS.light);
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardMargin, y, cardWidth, 32, 2, 2, "FD");
    doc.setDrawColor(0);
    y += 6;

    // Two-column layout
    const col1X = cardMargin + 6;
    const col2X = pageWidth / 2 + 6;
    const lineHeight = 6.5;

    doc.setFontSize(8.5);

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
    drawInfoRow(doc, col2X, y, "Activity", capitalize(profile.activity || "\u2014"));

    y += lineHeight + 4;

    // Additional info row below card
    const tagY = y;
    const tags = [
        { label: "Goal", value: capitalize(profile.goal || "\u2014") },
        { label: "Diet", value: capitalize(profile.dietType || "\u2014") },
    ];
    if (userInfo.contactNumber) {
        tags.push({ label: "Contact", value: userInfo.contactNumber });
    }

    doc.setFontSize(7.5);
    let tagX = cardMargin;
    for (const tag of tags) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.muted);
        doc.text(`${tag.label}: `, tagX, tagY);
        const labelWidth = doc.getTextWidth(`${tag.label}: `);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COLORS.text);
        doc.text(tag.value, tagX + labelWidth, tagY);
        tagX += labelWidth + doc.getTextWidth(tag.value) + 12;
    }

    doc.setTextColor(0);
    return tagY + 8;
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

function capitalize(str) {
    if (!str || str === "\u2014") return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Generate and download a PDF for a given diet plan.
 * @param {object} plan - The plan object with { id, name, meals }
 * @param {object} summary - The computed summary with dayTotals, mealTotals, dayScore
 * @param {object} [userInfo] - User information { fullName, email, age, heightCm, weightKg, bmi, contactNumber }
 * @param {object} [profile] - Local profile { activity, goal, dietType, sex }
 */
export function downloadPlanAsPdf(plan, summary, userInfo = {}, profile = {}) {
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

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(plan.name, pageWidth / 2, 35, { align: "center" });

    // Score badge
    const score = summary?.dayScore?.score || 0;
    const band = summary?.dayScore?.band || "";
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.text);
    doc.text(`Daily Score: ${score} / 100  \u2022  ${band}`, pageWidth / 2, 43, { align: "center" });

    doc.setTextColor(0);

    let yPos = 52;

    // ─── CLIENT INFO SECTION ───
    if (userInfo.fullName || userInfo.email) {
        yPos = drawClientInfo(doc, userInfo, profile, yPos, pageWidth);
    }

    // ─── MEAL SECTIONS ───
    for (const mealName of MEALS) {
        const items = plan.meals[mealName] || [];
        if (items.length === 0) continue;

        // Check if we need a new page (need at least 50px for a table)
        if (yPos > 240) {
            doc.addPage();
            yPos = drawPageHeader(doc, pageWidth);
        }

        // Meal header with colored indicator
        doc.setFillColor(...COLORS.primary);
        doc.roundedRect(14, yPos - 4.5, 3, 6, 1, 1, "F");
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(mealName, 20, yPos);
        doc.setTextColor(0);
        yPos += 4;

        // Build table data
        const tableBody = items.map((item) => {
            const food = foodById(item.foodId);
            const name = food?.name || item.foodId;
            const grams = item.grams;
            const factor = food ? grams / food.gramsPerExchange : 0;
            const kcal = food ? Math.round(food.kcal * factor) : 0;
            const protein = food ? (food.protein * factor).toFixed(1) : "0";
            const carbs = food ? (food.carbs * factor).toFixed(1) : "0";
            const fat = food ? (food.fat * factor).toFixed(1) : "0";
            const fibre = food ? (food.fibre * factor).toFixed(1) : "0";
            return [name, `${grams}g`, kcal, protein, carbs, fat, fibre];
        });

        // Meal totals row
        const mealTotals = summary?.mealTotals?.[mealName];
        if (mealTotals) {
            tableBody.push([
                "TOTAL",
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
            head: [["Food Item", "Qty", "Kcal", "Protein (g)", "Carbs (g)", "Fat (g)", "Fibre (g)"]],
            body: tableBody,
            theme: "grid",
            headStyles: {
                fillColor: COLORS.headerBg,
                textColor: COLORS.white,
                fontSize: 8.5,
                fontStyle: "bold",
                cellPadding: 3,
                halign: "center",
            },
            bodyStyles: {
                fontSize: 8.5,
                textColor: COLORS.text,
                cellPadding: 2.5,
            },
            columnStyles: {
                0: { halign: "left", cellWidth: 52 },
                1: { halign: "center", cellWidth: 18 },
                2: { halign: "center" },
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
                fillColor: [248, 250, 252],
            },
            didParseCell: (data) => {
                // Bold + highlight the totals row
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

    // ─── DAILY NUTRITION SUMMARY ───
    const dayTotals = summary?.dayTotals;
    if (dayTotals) {
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
            body: [
                ["Total Calories", `${Math.round(dayTotals.kcal)} kcal`],
                ["Protein", `${dayTotals.protein.toFixed(1)} g`],
                ["Carbohydrates", `${dayTotals.carbs.toFixed(1)} g`],
                ["Fat", `${dayTotals.fat.toFixed(1)} g`],
                ["Fibre", `${dayTotals.fibre.toFixed(1)} g`],
                ["Visible Fat", `${dayTotals.visibleFat.toFixed(1)} g`],
                ["Vegetables", `${dayTotals.vegetablesG.toFixed(1)} g`],
            ],
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

        yPos = doc.lastAutoTable.finalY + 10;
    }

    // ─── DISCLAIMER / NOTES ───
    if (yPos > 260) {
        doc.addPage();
        yPos = drawPageHeader(doc, pageWidth);
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...COLORS.muted);
    doc.text(
        "Note: This nutrition plan is generated for informational purposes. Please consult your dietitian for personalized advice.",
        pageWidth / 2, yPos + 2, { align: "center", maxWidth: pageWidth - 40 }
    );
    doc.setTextColor(0);

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

