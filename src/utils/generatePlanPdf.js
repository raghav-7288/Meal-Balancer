import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { foodById } from "../engines/nutrientEngine";
import { MEALS } from "../data/presetPlans";

/**
 * Draw the Meal Balancer logo on the PDF at the given position.
 * Includes: circle icon with utensils + "Meal Balancer" + "by Dt. Bhakti Shrivastava"
 */
function drawLogo(doc, x, y) {
    const circleX = x + 7;
    const circleY = y + 7;
    const radius = 7;

    // Dark circle background
    doc.setFillColor(30, 41, 59);
    doc.circle(circleX, circleY, radius, "F");

    // Draw utensils icon (simplified fork + knife in white)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);

    // Fork prongs
    doc.line(circleX - 2.5, circleY - 4, circleX - 2.5, circleY - 1);
    doc.line(circleX - 1, circleY - 4, circleX - 1, circleY - 1);
    doc.line(circleX + 0.5, circleY - 4, circleX + 0.5, circleY - 1);
    // Fork handle
    doc.line(circleX - 1, circleY - 1, circleX - 1, circleY + 4);

    // Knife
    doc.line(circleX + 2.5, circleY - 4, circleX + 2.5, circleY + 4);
    doc.line(circleX + 2.5, circleY - 4, circleX + 3.5, circleY - 2);
    doc.line(circleX + 3.5, circleY - 2, circleX + 2.5, circleY);

    // Reset line color
    doc.setDrawColor(0);
    doc.setLineWidth(0.2);

    // "Meal Balancer" text
    const textX = x + 16;
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Meal Balancer", textX, y + 6);

    // "by Dt. Bhakti Shrivastava" subtitle
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("by Dt. Bhakti Shrivastava", textX, y + 11);

    // Reset text color
    doc.setTextColor(0);
}

/**
 * Generate and download a PDF for a given diet plan.
 * @param {object} plan - The plan object with { id, name, meals }
 * @param {object} summary - The computed summary with dayTotals, mealTotals, dayScore
 */
export function downloadPlanAsPdf(plan, summary) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Logo at top-left
    drawLogo(doc, 14, 8);

    // Separator line below logo
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.3);
    doc.line(14, 24, pageWidth - 14, 24);
    doc.setDrawColor(0);

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text(plan.name, pageWidth / 2, 36, { align: "center" });

    // Score badge
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    const score = summary?.dayScore?.score || 0;
    const band = summary?.dayScore?.band || "";
    doc.text(`Daily Score: ${score} (${band})`, pageWidth / 2, 44, { align: "center" });

    // Date
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 50, { align: "center" });
    doc.setTextColor(0);

    let yPos = 58;

    // Each meal section
    for (const mealName of MEALS) {
        const items = plan.meals[mealName] || [];
        if (items.length === 0) continue;

        // Meal header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(mealName, 14, yPos);
        doc.setTextColor(0);
        yPos += 2;

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
                "Total",
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
            head: [["Food", "Amount", "Kcal", "Protein (g)", "Carbs (g)", "Fat (g)", "Fibre (g)"]],
            body: tableBody,
            theme: "striped",
            headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
            bodyStyles: { fontSize: 9 },
            styles: { cellPadding: 2 },
            didParseCell: (data) => {
                // Bold the totals row
                if (data.row.index === tableBody.length - 1 && mealTotals) {
                    data.cell.styles.fontStyle = "bold";
                    data.cell.styles.fillColor = [230, 240, 255];
                }
            },
            margin: { left: 14, right: 14 },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // Page break if running out of space
        if (yPos > 260) {
            doc.addPage();
            yPos = 20;
        }
    }

    // Day Summary section
    const dayTotals = summary?.dayTotals;
    if (dayTotals) {
        if (yPos > 230) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text("Daily Nutrition Summary", 14, yPos);
        doc.setTextColor(0);
        yPos += 2;

        autoTable(doc, {
            startY: yPos,
            head: [["Nutrient", "Value"]],
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
            headStyles: { fillColor: [34, 197, 94], fontSize: 10 },
            bodyStyles: { fontSize: 10 },
            styles: { cellPadding: 3 },
            margin: { left: 14, right: 14 },
            columnStyles: { 0: { fontStyle: "bold" } },
        });
    }

    // Add logo to all pages (top-left on every page)
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 2; i <= totalPages; i++) {
        doc.setPage(i);
        drawLogo(doc, 14, 6);
        // Separator line
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.3);
        doc.line(14, 20, pageWidth - 14, 20);
        doc.setDrawColor(0);
    }

    // Save
    const fileName = `${plan.name}.pdf`;
    doc.save(fileName);
}

