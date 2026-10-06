import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Helper to convert hex colors to RGB array for jsPDF
const hexToRgb = (hex, fallback = [27, 42, 74]) => {
  if (!hex || typeof hex !== 'string') return fallback;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return fallback;
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return fallback;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
};

export default function ExportDossierButton({ chartId, context, className }) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!chartId || !document.getElementById(chartId)) {
      alert("Chart element not found for export.");
      return;
    }
    
    setIsExporting(true);
    
    try {
      const chartElement = document.getElementById(chartId);
      
      // Temporarily ensure background is white for crisp snapshot capture
      const originalBg = chartElement.style.backgroundColor;
      chartElement.style.backgroundColor = '#ffffff';
      
      // Capture the chart container as a high-res canvas
      const canvas = await html2canvas(chartElement, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        ignoreElements: (element) => {
          if (element.classList && element.classList.contains('pdf-hide')) {
            return true;
          }
          return false;
        }
      });
      
      chartElement.style.backgroundColor = originalBg;
      
      if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
        throw new Error("Chart canvas rendered with invalid zero dimensions. Please ensure the forecast chart tab is visible and loaded before exporting.");
      }
      
      const chartImageData = canvas.toDataURL('image/png');
      
      // Initialize PDF (A4 size: 210mm x 297mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2); // 182mm
      
      const goalColorRgb = hexToRgb(context?.goalColor, [27, 42, 74]);
      
      // ==========================================
      // 1. TOP HEADER BANNER (Y = 0 to 28mm)
      // ==========================================
      // Top accent bar (Goal color)
      doc.setFillColor(goalColorRgb[0], goalColorRgb[1], goalColorRgb[2]);
      doc.rect(0, 0, pageWidth, 3, 'F');
      
      // Main deep navy header bar
      doc.setFillColor(27, 42, 74); // #1B2A4A
      doc.rect(0, 3, pageWidth, 25, 'F');
      
      // Header Titles
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("EXECUTIVE SDG POLICY BRIEFING", margin, 14);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(147, 197, 253); // Light blue #93c5fd
      doc.text("2030 AGENDA STATISTICAL TRAJECTORY & STRATEGIC ASSESSMENT", margin, 21);
      
      // Header Metadata (Right aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(203, 213, 225);
      doc.text("OFFICIAL DOSSIER", pageWidth - margin, 14, { align: 'right' });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`, pageWidth - margin, 21, { align: 'right' });
      
      // ==========================================
      // 2. PROFILE & TARGET SCOPE CARD (Y = 32 to 57mm)
      // ==========================================
      const profileCardY = 31.5;
      const profileCardH = 24.5;
      doc.setFillColor(248, 250, 252); // #f8fafc
      doc.setDrawColor(226, 232, 240); // #e2e8f0
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, profileCardY, contentWidth, profileCardH, 1.5, 1.5, 'FD');
      
      // Row 1: Country & Goal Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // #0f172a
      const countryLabel = `Country: ${context?.countryName || 'Global'} (${context?.countryCode || 'N/A'})`;
      doc.text(countryLabel, margin + 4, profileCardY + 6.5);
      
      const goalNum = context?.goalNumber || (context?.selectedTarget ? context.selectedTarget.split('.')[0] : '1');
      const goalTitle = context?.goalTitle || `Goal ${goalNum}`;
      const goalLabel = `SDG Goal ${goalNum} — ${goalTitle}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(goalColorRgb[0], goalColorRgb[1], goalColorRgb[2]);
      doc.text(goalLabel, pageWidth - margin - 4, profileCardY + 6.5, { align: 'right' });
      
      // Row 2: Target Code & Target Title
      const targetCode = context?.selectedTarget || `${goalNum}.1`;
      const targetTitle = context?.targetTitle || `Target ${targetCode}`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Target ${targetCode}:`, margin + 4, profileCardY + 13.5);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      // Truncate target title if overly long to fit cleanly
      const targetTitleText = doc.splitTextToSize(targetTitle, contentWidth - 32)[0];
      doc.text(targetTitleText, margin + 24, profileCardY + 13.5);
      
      // Row 3: Indicator, Unit, & Trajectory Polarity
      const indicatorName = context?.indicatorName || 'Core SDG Indicator';
      const unit = context?.unit || 'Score / Rate';
      const polarity = context?.polarity === 'lower_is_better' 
        ? 'Lower value is better (Reduction Target)' 
        : 'Higher value is better (Expansion Target)';
        
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text("Metric:", margin + 4, profileCardY + 19.5);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(`${indicatorName}   |   Unit: ${unit}   |   Polarity: ${polarity}`, margin + 17, profileCardY + 19.5);
      
      // ==========================================
      // 3. 4-BOX KPI SUMMARY MATRIX (Y = 59 to 81mm)
      // ==========================================
      const kpiCardY = 58.5;
      const kpiCardH = 20.5;
      const kpiGap = 3;
      const kpiCardW = (contentWidth - (kpiGap * 3)) / 4;
      
      // Helper to render KPI box
      const renderKpiBox = (x, title, value, subtext, valueColorRgb = [15, 23, 42], isSmallValue = false) => {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, kpiCardY, kpiCardW, kpiCardH, 1.5, 1.5, 'FD');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        doc.text(title.toUpperCase(), x + 3.5, kpiCardY + 5.5);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isSmallValue ? 9 : 11);
        doc.setTextColor(valueColorRgb[0], valueColorRgb[1], valueColorRgb[2]);
        doc.text(String(value), x + 3.5, kpiCardY + 12.5);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text(subtext, x + 3.5, kpiCardY + 17.5);
      };
      
      // Box 1: Baseline
      const baselineFormatted = context?.baselineValue !== undefined && context?.baselineValue !== null
        ? Number(context.baselineValue).toFixed(2)
        : 'N/A';
      renderKpiBox(margin, "Baseline (2015)", baselineFormatted, "Starting observation");
      
      // Box 2: Projected 2030
      const projectedFormatted = context?.projectedValue2030 !== undefined && context?.projectedValue2030 !== null
        ? Number(context.projectedValue2030).toFixed(2)
        : 'N/A';
      renderKpiBox(margin + kpiCardW + kpiGap, "Projected (2030)", projectedFormatted, "Statistical forecast");
      
      // Box 3: Benchmark / Target
      const benchmarkText = context?.benchmarkLabel 
        ? context.benchmarkLabel.replace('UN 2030 Target: ', '').replace('UN 2030 Benchmark: ', '')
        : (context?.benchmarkValue !== null && context?.benchmarkValue !== undefined ? `${context.benchmarkValue}` : 'Standard');
      renderKpiBox(margin + (kpiCardW + kpiGap) * 2, "2030 Target", benchmarkText, "Global benchmark", [30, 41, 59], true);
      
      // Box 4: Trajectory Status
      const status = context?.status || 'Unknown';
      let statusColorRgb = [37, 99, 235]; // Blue
      const sLower = status.toLowerCase();
      if (sLower.includes('achieved') || sLower.includes('track')) {
        statusColorRgb = [22, 163, 74]; // Green
      } else if (sLower.includes('risk')) {
        statusColorRgb = [217, 119, 6]; // Amber
      } else if (sLower.includes('off')) {
        statusColorRgb = [220, 38, 38]; // Red
      }
      renderKpiBox(margin + (kpiCardW + kpiGap) * 3, "Current Status", status, "Velocity assessment", statusColorRgb);
      
      // ==========================================
      // 4. TRAJECTORY FORECAST VISUAL CHART (Y = 82 to 170mm)
      // ==========================================
      const chartY = 81.5;
      const chartH = 88;
      
      // Subtle container card for chart
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, chartY, contentWidth, chartH, 1.5, 1.5, 'FD');
      
      // Draw Chart Image
      doc.addImage(chartImageData, 'PNG', margin + 1, chartY + 1, contentWidth - 2, chartH - 2);
      
      // ==========================================
      // 5. STRATEGIC AI DIAGNOSIS & POLICY INSIGHTS CARD (Y = 172 to 276mm)
      // ==========================================
      const diagnosisY = 172;
      const diagnosisH = 104;
      
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, diagnosisY, contentWidth, diagnosisH, 1.5, 1.5, 'FD');
      
      // Left vertical accent bar
      doc.setFillColor(109, 40, 217); // Purple #6d28d9
      doc.roundedRect(margin, diagnosisY, 2.5, diagnosisH, 1, 1, 'F');
      
      // Section Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(109, 40, 217);
      doc.text("✦ AI STRATEGIC TRAJECTORY DIAGNOSIS", margin + 6, diagnosisY + 6.5);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text("AUTOMATED SYNTHESIS", pageWidth - margin - 4, diagnosisY + 6.5, { align: 'right' });
      
      // Primary AI Trajectory Narrative
      let currentY = diagnosisY + 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      
      const narrativeText = context?.aiNarrative || `Statistical trend analysis indicates ${context?.countryName || 'the nation'} is currently classified as ${status} for Target ${targetCode}. Ongoing policy implementation and resource allocation will determine final 2030 achievement.`;
      const splitNarrative = doc.splitTextToSize(narrativeText, contentWidth - 12);
      doc.text(splitNarrative, margin + 6, currentY);
      currentY += (splitNarrative.length * 3.8) + 3;
      
      // Policy Implications / Takeaway Sub-Block
      const policyTakeawayText = context?.policyTakeaway || context?.policyBriefSummary;
      if (policyTakeawayText && policyTakeawayText.trim().length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text("Policy Implications & Strategic Takeaway:", margin + 6, currentY);
        currentY += 4;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        const splitTakeaway = doc.splitTextToSize(policyTakeawayText.replace(/^"|"$/g, ''), contentWidth - 12);
        // Print max 3 lines for clean fit
        doc.text(splitTakeaway.slice(0, 3), margin + 6, currentY);
        currentY += (Math.min(splitTakeaway.length, 3) * 3.6) + 3;
      }
      
      // SDG Systematic Context & Development Impact
      const sdgContextText = context?.sdgContext || context?.impactOnGoal;
      if (sdgContextText && sdgContextText.trim().length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text("SDG Target Overview & Systematic Context:", margin + 6, currentY);
        currentY += 4;
        
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        const splitContext = doc.splitTextToSize(sdgContextText, contentWidth - 12);
        doc.text(splitContext.slice(0, 3), margin + 6, currentY);
      }
      
      // ==========================================
      // 6. OFFICIAL FOOTER (Y = 282 to 290mm)
      // ==========================================
      const footerY = 284;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY, pageWidth - margin, footerY);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text("SDG Trajectory Forecaster • Executive Policy Intelligence Briefing • UN 2030 Agenda", margin, footerY + 5);
      doc.text("Page 1 of 1", pageWidth - margin, footerY + 5, { align: 'right' });
      
      // Save PDF
      const filename = `SDG_Executive_Briefing_${context?.countryCode || 'Global'}_Target_${targetCode}.pdf`.replace(/\s+/g, '_');
      doc.save(filename);
      
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport}
      disabled={isExporting}
      className={`bg-slate-800 hover:bg-slate-900 text-white shadow-sm flex items-center gap-2 h-9 px-4 transition-all ${className || ''}`}
    >
      {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      <span className="text-sm font-medium">{isExporting ? 'Generating PDF...' : 'Executive Briefing (PDF)'}</span>
    </Button>
  );
}

