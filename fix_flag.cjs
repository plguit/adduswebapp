const fs = require('fs');
const file = 'src/components/chat/ConversationalOnboarding.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add IndiaFlag component import-like definition at top (before the function starts)
// Insert the IndiaFlag helper function right before the MascotLottiePlayer function definition
const mascotFnTarget = 'function MascotLottiePlayer(';
const indiaFlagFn = `// Inline SVG India flag (saffron/white/green tricolor + Ashoka Chakra)
function IndiaFlag() {
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 15 * Math.PI) / 180;
    return { x2: 450 + 80 * Math.sin(angle), y2: 300 - 80 * Math.cos(angle) };
  });
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" className="india-flag-svg" aria-label="India flag">
      <rect width="900" height="600" fill="#138808" />
      <rect width="900" height="400" fill="#FFFFFF" />
      <rect width="900" height="200" fill="#FF9933" />
      <circle cx="450" cy="300" r="90" fill="none" stroke="#000088" strokeWidth="8" />
      <circle cx="450" cy="300" r="10" fill="#000088" />
      {spokes.map((s, i) => (
        <line key={i} x1="450" y1="300" x2={s.x2} y2={s.y2} stroke="#000088" strokeWidth="4" />
      ))}
    </svg>
  );
}

`;

if (!content.includes('function IndiaFlag()')) {
  content = content.replace(mascotFnTarget, indiaFlagFn + mascotFnTarget);
  console.log('Added IndiaFlag component');
}

// Replace the broken emoji flag span in step 1 login screen
// The pattern is: <span className="manrope-flag-country">\n                      <span>dY.....</span>\n                      <span>+91</span>\n                    </span>
const brokenFlagRegex = /<span className="manrope-flag-country">\s*<span>[^<]*<\/span>\s*<span>\+91<\/span>\s*<\/span>/g;
const fixedFlagSpan = `<span className="manrope-flag-country">
                      <IndiaFlag />
                      <span className="india-code-text">+91</span>
                    </span>`;

const oldCount = (content.match(brokenFlagRegex) || []).length;
content = content.replace(brokenFlagRegex, fixedFlagSpan);
console.log('Replaced broken flag spans:', oldCount);

fs.writeFileSync(file, content, 'utf8');
console.log('ConversationalOnboarding.jsx updated successfully');
