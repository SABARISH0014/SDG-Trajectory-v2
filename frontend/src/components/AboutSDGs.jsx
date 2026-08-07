import React, { useState } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import jsPDF from 'jspdf';
import { sdgGoalsContent } from '../data/sdgGoalsContent';

export default function AboutSDGs() {
  const [expandedGoal, setExpandedGoal] = useState(null);

  const generatePDF = (goal) => {
    const doc = new jsPDF();
    const margin = 20;
    let yPos = 20;
    
    // Helper to add text and wrap
    const addText = (text, fontSize, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, 210 - (margin * 2));
      
      lines.forEach(line => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(line, margin, yPos);
        yPos += fontSize * 0.4;
      });
      yPos += 5; // Extra spacing after paragraph
    };

    addText(`SDG Goal ${goal.goalNumber}: ${goal.title}`, 22, true);
    yPos += 5;
    
    addText("What It Achieves", 16, true);
    addText(goal.whatItAchieves, 12);
    yPos += 5;

    addText("History & Background", 16, true);
    addText(goal.history, 12);
    yPos += 5;

    addText("Official Targets", 16, true);
    goal.officialTargets.forEach(target => {
      addText(`• ${target}`, 11);
    });

    doc.save(`SDG_Goal_${goal.goalNumber}_Summary.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Understanding the SDGs</h2>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          The 17 Sustainable Development Goals are the world's blueprint to achieve a better and more sustainable future for all.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {sdgGoalsContent.map((goal) => (
          <Card key={goal.goalNumber} className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-all h-full bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-blue-900">
                  {goal.goalNumber.toString().padStart(2, '0')}
                </span>
              </div>
              <CardTitle className="text-lg text-slate-800 leading-tight">
                {goal.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex-1 flex flex-col">
              <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">
                {goal.whatItAchieves}
              </p>
              
              <div className="space-y-4">
                {expandedGoal === goal.goalNumber && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-3 bg-slate-50 rounded-md text-xs text-slate-700 space-y-3">
                      <div>
                        <strong className="block text-slate-900 mb-1">History</strong>
                        <p className="leading-relaxed">{goal.history}</p>
                      </div>
                      <div>
                        <strong className="block text-slate-900 mb-1">Targets</strong>
                        <ul className="space-y-1">
                          {goal.officialTargets.map((t, idx) => (
                            <li key={idx}>• {t}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 text-xs h-8 border-slate-200"
                    onClick={() => setExpandedGoal(expandedGoal === goal.goalNumber ? null : goal.goalNumber)}
                  >
                    {expandedGoal === goal.goalNumber ? (
                      <><ChevronUp className="w-3 h-3 mr-1" /> Less</>
                    ) : (
                      <><ChevronDown className="w-3 h-3 mr-1" /> More</>
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    className="flex-none w-8 h-8 p-0 text-blue-700 bg-blue-50 hover:bg-blue-100"
                    onClick={() => generatePDF(goal)}
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
