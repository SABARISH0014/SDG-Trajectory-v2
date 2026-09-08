import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { SelectItem } from './ui/select';
import { getTargetDetails } from '../data/sdgTargetsData';
import { sdgGoalsContent } from '../data/sdgGoalsContent';

export default function TargetSelectItem({ targetCode, targetTitle, ...props }) {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let x = rect.right + 10;
    if (x + 300 > window.innerWidth) {
      x = rect.left - 310;
    }
    let y = rect.top;
    if (y + 150 > window.innerHeight) {
      y = window.innerHeight - 160;
    }
    setCoords({ x, y });
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const details = getTargetDetails(targetCode);
  const goalNum = parseInt(targetCode.split('.')[0], 10) || 1;
  const goalContent = sdgGoalsContent.find(g => g.goalNumber === goalNum);
  const fullGoalName = goalContent ? `Goal ${goalNum}: ${goalContent.title}` : `Goal ${goalNum}`;

  return (
    <SelectItem 
      value={targetCode} 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      <span className="notranslate">{targetCode}</span> <span>— {targetTitle}</span>

      {hovered && createPortal(
        <div 
          className="fixed z-[100] w-72 p-4 bg-slate-900 text-white rounded-lg shadow-xl border border-slate-700 pointer-events-none animate-in fade-in zoom-in-95 duration-200"
          style={{ top: coords.y, left: coords.x }}
        >
          <div className="font-bold text-sm mb-1 text-white">{fullGoalName}</div>
          <div className="text-xs font-semibold mb-2 text-indigo-300">Target {targetCode}: {details.title}</div>
          <div className="text-xs text-slate-300 leading-relaxed">{details.impactOnGoal}</div>
        </div>,
        document.body
      )}
    </SelectItem>
  );
}
