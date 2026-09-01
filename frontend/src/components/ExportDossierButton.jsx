import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

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
      
      // Temporarily ensure background is white for transparency issues
      const originalBg = chartElement.style.backgroundColor;
      chartElement.style.backgroundColor = '#ffffff';
      
      // Capture the chart as a canvas
      const canvas = await html2canvas(chartElement, {
        scale: 2, // Higher resolution
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
      
      const chartImageData = canvas.toDataURL('image/png');
      
      // Initialize PDF (A4 size)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // 1. Header: UN SDG Official Briefing Banner
      doc.setFillColor(30, 58, 138); // Navy blue
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("EXECUTIVE SDG BRIEFING", margin, 22);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 32);
      
      // 2. Metadata & KPI Summary
      doc.setTextColor(50, 50, 50);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(`Profile: ${context?.countryName || 'Unknown Country'} (${context?.countryCode || 'N/A'})`, margin, 55);
      
      doc.setFontSize(14);
      doc.text(`Target Indicator: ${context?.selectedTarget || 'N/A'}`, margin, 65);
      
      // KPI Box - Refined Alignment
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, 75, pageWidth - (margin * 2), 32, 3, 3, 'FD');
      
      const col1 = margin + 10;
      const col2 = margin + 70;
      const col3 = margin + 130;
      const labelY = 88;
      const valueY = 98;

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Baseline (2015)", col1, labelY);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`${context?.baselineValue !== undefined ? Number(context.baselineValue).toFixed(2) : 'N/A'}`, col1, valueY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Projected (2030)", col2, labelY);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 30, 30);
      doc.text(`${context?.projectedValue2030 !== undefined ? Number(context.projectedValue2030).toFixed(2) : 'N/A'}`, col2, valueY);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(100, 100, 100);
      doc.text("Current Status", col3, labelY);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      
      // Status coloring
      const status = context?.status || 'Unknown';
      if (status === 'Achieved') doc.setTextColor(22, 163, 74);
      else if (status.includes('On')) doc.setTextColor(37, 99, 235);
      else if (status.includes('risk')) doc.setTextColor(217, 119, 6);
      else doc.setTextColor(220, 38, 38);
      
      doc.text(`${status}`, col3, valueY);
      
      // 3. Trajectory Chart Snapshot
      // Calculate image dimensions to fit page width
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Add a subtle border around the image in the PDF
      doc.setDrawColor(230, 230, 230);
      doc.rect(margin - 1, 119, imgWidth + 2, imgHeight + 2);
      doc.addImage(chartImageData, 'PNG', margin, 120, imgWidth, imgHeight);
      
      // 4. AI Narrative Placeholder Note (if applicable)
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(120, 120, 120);
      doc.text("Note: Use the SDG Policy Copilot within the dashboard for AI-driven policy analysis.", margin, 120 + imgHeight + 15);
      
      // 5. Footer
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(150, 150, 150);
      doc.text("SDG Trajectory Forecaster - Internal Executive Briefing", margin, 285);
      doc.text(`Page 1 of 1`, pageWidth - margin - 15, 285);
      
      // Save PDF
      const filename = `SDG_Executive_Briefing_${context?.countryCode || 'Unknown'}_${context?.selectedTarget || 'Target'}.pdf`.replace(/\s+/g, '_');
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
