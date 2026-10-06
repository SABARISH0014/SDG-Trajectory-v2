import{j as e}from"./vendor-motion-DDTkFNQb.js";import{a}from"./vendor-charts-B0v_XDzo.js";import{c as i}from"./Button-DPbSTwjT.js";function c({className:r,variant:t="default",...s}){const n="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",o={default:"border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",secondary:"border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",destructive:"border-transparent bg-red-500 text-white shadow hover:bg-red-600",warning:"border-transparent bg-yellow-500 text-white shadow hover:bg-yellow-600",success:"border-transparent bg-green-500 text-white shadow hover:bg-green-600",outline:"text-foreground"};return e.jsx("div",{className:i(n,o[t],r),...s})}function x({message:r="Initializing Global Data..."}){const t=e.jsxs("div",{className:"fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm",children:[e.jsx("style",{children:`
        .sdg-spinner-wrapper {
          position: relative;
          width: 72px;
          height: 72px;
          margin-bottom: 24px;
        }
        .sdg-spinner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: conic-gradient(
            #E5243B 0% 5.88%, #DDA63A 5.88% 11.76%, #4C9F38 11.76% 17.64%, 
            #C5192D 17.64% 23.52%, #FF3A21 23.52% 29.40%, #26BDE2 29.40% 35.28%, 
            #FCC30B 35.28% 41.16%, #A21942 41.16% 47.04%, #FD6925 47.04% 52.92%, 
            #DD1367 52.92% 58.80%, #FD9D24 58.80% 64.68%, #BF8B2E 64.68% 70.56%, 
            #3F7E44 70.56% 76.44%, #0A97D9 76.44% 82.32%, #56C02B 82.32% 88.20%, 
            #00689D 88.20% 94.08%, #19486A 94.08% 100%
          );
          animation: sdg-spin 2s linear infinite;
        }
        .sdg-spinner-inner {
          position: absolute;
          top: 8px; left: 8px; right: 8px; bottom: 8px;
          background-color: #f8fafc; /* Matches slate-50 */
          border-radius: 50%;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
        }
        @keyframes sdg-spin {
          100% { transform: rotate(360deg); }
        }
        .splash-text {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: 0.5px;
          animation: pulse-text 2s ease-in-out infinite;
        }
        .splash-subtext {
          margin-top: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
        }
        @keyframes pulse-text {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        `}),e.jsxs("div",{className:"sdg-spinner-wrapper",children:[e.jsx("div",{className:"sdg-spinner"}),e.jsx("div",{className:"sdg-spinner-inner"})]}),e.jsx("div",{className:"splash-text",children:"SDG Trajectory"}),e.jsx("div",{className:"splash-subtext",children:r})]});return a.createPortal(t,document.body)}export{c as B,x as S};
