import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { foodById } from "../engines/nutrientEngine";
import { MEALS } from "../data/presetPlans";

/**
 * Generate and download a PDF for a given diet plan.
 * @param {object} plan - The plan object with { id, name, meals }
 * @param {object} summary - The computed summary with dayTotals, mealTotals, dayScore
 */
export function downloadPlanAsPdf(plan, summary) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(plan.name, pageWidth / 2, 20, { align: "center" });

    // Score badge
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const score = summary?.dayScore?.score || 0;
    const band = summary?.dayScore?.band || "";
    doc.text(`Daily Score: ${score} (${band})`, pageWidth / 2, 30, { align: "center" });

    // Date
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 36, { align: "center" });
    doc.setTextColor(0);

    let yPos = 44;

    // Each meal section
    for (const mealName of MEALS) {
        const items = plan.meals[mealName] || [];
        if (items.length === 0) continue;

        // Meal header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(mealName, 14, yPos);
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
        doc.text("Daily Nutrition Summary", 14, yPos);
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

    // Add watermark to all pages (bottom-most layer, top-right, subtle shadow)
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(210, 210, 210);
        doc.text("Meal Balancer by Dt. Bhakti Shrivastava", pageWidth - 14, 12, {
            align: "right",
        });
        doc.setTextColor(0);
    }

    // Save
    const fileName = `${plan.name}.pdf`;
    doc.save(fileName);
}

