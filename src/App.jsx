import React, { useState, useEffect } from "react";
import RandExp from "randexp";
import "./App.css";

const App = () => {
  const [regex, setRegex] = useState("");
  const [strings, setStrings] = useState([]);
  const [regex2, setRegex2] = useState("");
  const [equivalence, setEquivalence] = useState("");
  const [count, setCount] = useState(10);
  
  // Feature States
  const [flags, setFlags] = useState({ i: false, g: false, m: false });
  const [warnings, setWarnings] = useState([]);
  const [generationMode, setGenerationMode] = useState("match");
  const [manualTestString, setManualTestString] = useState("");
  const [manualTestResult, setManualTestResult] = useState(null);

  const [animatingString, setAnimatingString] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [regexError, setRegexError] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  const getFlagsString = () => {
    return Object.entries(flags)
      .filter(([_, v]) => v)
      .map(([k]) => k)
      .join("");
  };

  const lintRegex = (rgx) => {
    const warns = [];
    if (rgx.includes("||")) warns.push("Empty alternation ('||') detected.");
    if (rgx.includes("()")) warns.push("Empty capture group '()' detected.");
    if (/\[.*?\\w.*?\\d.*?\]/.test(rgx) || /\[.*?\\d.*?\\w.*?\]/.test(rgx)) {
      warns.push("\\d is redundant as \\w already includes digits.");
    }
    if (/\.\*/.test(rgx) && !rgx.includes("^") && !rgx.includes("$")) {
       warns.push("Using .* without ^ or $ could be slow on large strings.");
    }
    return warns;
  };

  const translateRegexToEnglish = (rgx) => {
    if (!rgx) return [];
    
    const rules = [];
    if (rgx.startsWith('^')) rules.push("Must start at the beginning of the string");
    
    const tokens = [
      { pattern: /\[A-Z\]/, desc: "uppercase letter (A-Z)" },
      { pattern: /\[a-z\]/, desc: "lowercase letter (a-z)" },
      { pattern: /\[0-9\]/, desc: "digit (0-9)" },
      { pattern: /\\d/, desc: "any digit (0-9)" },
      { pattern: /\\w/, desc: "any word character (alphanumeric & underscore)" },
      { pattern: /\\s/, desc: "whitespace character" },
      { pattern: /\+/, desc: "1 or more times" },
      { pattern: /\*/, desc: "0 or more times" },
      { pattern: /\?/, desc: "Optional" },
      { pattern: /\(.*\)/, desc: "Captures a specific group" },
      { pattern: /\|/, desc: "Logical OR (matches left or right option)" }
    ];

    for (const t of tokens) {
       if (t.pattern.test(rgx)) {
         rules.push(`Contains rule: Matches ${t.desc}`);
       }
    }
    
    if (rgx.endsWith('$')) rules.push("Must match all the way to the end of the string");
    
    if (rules.length === 0) {
      if (rgx.length > 0) rules.push("Matches structural sequence literally");
    }
    return [...new Set(rules)];
  };

  const handleRegexChange = (newRegex) => {
    setRegex(newRegex);
  };

  useEffect(() => {
    setWarnings(lintRegex(regex));
    try {
      if (regex) {
        new RegExp(regex, getFlagsString()); // Test base regex first
        setRegexError("");
      } else {
         setRegexError("");
      }
    } catch (err) {
      let msg = err.message;
      const parts = msg.split(': ');
      if (parts.length > 1) {
        msg = parts[parts.length - 1];
      }
      setRegexError(msg);
    }
  }, [regex, flags]);

  const testManualString = (str) => {
     setManualTestString(str);
     if (str === "") {
        setManualTestResult(null);
        return;
     }
     try {
        const flagStr = getFlagsString();
        const re = new RegExp(`^${regex}$`, flagStr);
        setManualTestResult(re.test(str));
     } catch (e) {
        setManualTestResult(null);
     }
  };

  const playSimulation = (str) => {
    if (window.simInterval) clearInterval(window.simInterval);
    setAnimatingString(str);
    setCurrentStepIndex(0);
    setIsPlaying(true);

    let i = 0;

    window.simInterval = setInterval(() => {
      i++;
      if (i >= str.length) {
        clearInterval(window.simInterval);
        setIsPlaying(false);
      } else {
        setCurrentStepIndex(i);
      }
    }, 1000);
  };

  const generateStrings = () => {
    if (regexError || !regex) return;
    try {
      const flagStr = getFlagsString();
      const re = new RegExp(`^${regex}$`, flagStr);
      
      if (generationMode === "match") {
         const randexp = new RandExp(re);
         randexp.max = 5;

         const result = new Set();
         let attempts = 0;
         const maxAttempts = count * 50;

         while (result.size < count && attempts < maxAttempts) {
           const str = randexp.gen();
           result.add(str);
           attempts++;
         }
         setStrings([...result]);
      } else {
         const result = new Set();
         let attempts = 0;
         const maxAttempts = count * 2000;
         
         const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_!@#$%^&*() ';
         
         while (result.size < count && attempts < maxAttempts) {
            let rStr = "";
            const len = Math.floor(Math.random() * (regex.length * 2)) + 1;
            for(let j=0; j<len; j++) {
              rStr += chars[Math.floor(Math.random() * chars.length)];
            }
            if (!re.test(rStr)) {
              result.add(rStr);
            }
            attempts++;
         }
         setStrings([...result]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkEquivalence = () => {
    try {
      const flagStr = getFlagsString();
      const r1 = new RegExp(`^${regex}$`, flagStr);
      const r2 = new RegExp(`^${regex2}$`, flagStr);

      const rand1 = new RandExp(r1);
      const rand2 = new RandExp(r2);

      let match = true;

      for (let i = 0; i < 15; i++) {
        const s1 = rand1.gen();
        const s2 = rand2.gen();

        if (!r2.test(s1) || !r1.test(s2)) {
          match = false;
          break;
        }
      }

      setEquivalence(match ? "Likely Equivalent" : "Not Equivalent");
    } catch (err) {
      setEquivalence("Invalid Regex Syntax");
    }
  };

  const insertSymbol = (symbol) => {
    handleRegexChange(regex + symbol);
  };

  const explainString = (regex, str) => {
    let explanations = [];
    for (let i = 0; i < str.length; i++) {
      let char = str[i];
      let reason = `'${char}' appears `;
      let inChoice = false;
      
      const orMatch = regex.match(/\(([^)]*\|[^)]*)\)/);
      if (orMatch && orMatch[1].replace(/[|*+?]/g, "").includes(char)) {
        inChoice = true;
        let options = orMatch[1].split('|').map(o => `'${o.replace(/[*+?()]/g, '')}'`).join(' or ');
        reason += `because it had the option to pick from ${options}`;
      } else if (regex.match(/\[(.*?)\]/)) {
        const classMatch = regex.match(/\[(.*?)\]/);
        reason += `because it matches the character class [${classMatch[1]}]`;
      } else if (/\d/.test(char) && regex.includes("\\d")) {
        reason += `because '\\d' generates a random digit`;
      } else if (/\w/.test(char) && regex.includes("\\w")) {
        reason += `because '\\w' generates a random word character`;
      } else if (regex.includes(char)) {
        reason += `because it matches the explicit literal '${char}' in the regex`;
      } else if (regex.includes(".")) {
        reason += `because the '.' wildcard can generate any character`;
      } else {
        reason += `to satisfy the overall pattern`;
      }

      if (inChoice && regex.includes(")*")) {
        reason += ` (and '*' allows repeating this choice).`;
      } else if (inChoice && regex.includes(")+")) {
        reason += ` (and '+' allows repeating this choice).`;
      } else {
        reason += `.`;
      }
      explanations.push(reason);
    }
    return explanations;
  };

  const getCaptureGroups = (s) => {
     try {
       const flagStr = getFlagsString();
       const re = new RegExp(`^${regex}$`, flagStr);
       const match = s.match(re);
       if (match && match.length > 1) {
         return match.slice(1);
       }
     } catch(e) {}
     return [];
  };

  return (
    <div className="relative min-h-screen bg-[#030305] text-slate-200 [font-family:'Inter',sans-serif] selection:bg-fuchsia-500/30 overflow-x-hidden">
      
      {/* Help Button */}
      <button 
        onClick={() => setShowHelp(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-indigo-600/80 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] flex items-center justify-center font-bold text-xl backdrop-blur-md transition-all hover:scale-110 active:scale-95 border border-white/20"
      >
        ?
      </button>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowHelp(false)}></div>
          <div className="relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-[0_0_50px_rgba(79,70,229,0.3)] custom-scrollbar">
            <button 
              onClick={() => setShowHelp(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400 mb-6 flex items-center gap-3">
              <span className="text-2xl">📘</span> Regex Studio Guide
            </h2>
            
            <div className="space-y-6 text-sm text-slate-300">
              <section>
                <h3 className="text-indigo-300 font-bold text-lg mb-2 flex items-center gap-2"><span>1.</span> Output Types</h3>
                <p className="mb-2"><strong className="text-white">Valid Strings:</strong> Generates random sequences of characters that perfectly match your regex rules.</p>
                <p><strong className="text-white">Invalid Strings:</strong> Actively tries to generate chaotic strings that <span className="text-rose-400 italic">fail</span> your regex to test the boundaries of your pattern.</p>
              </section>

              <section>
                <h3 className="text-fuchsia-300 font-bold text-lg mb-2 flex items-center gap-2"><span>2.</span> Regex Flags (/i/ /g/ /m/)</h3>
                <p>Located next to the Regex Input. They change the core behavior of matching:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li><strong className="text-white">/i/ (Case Insensitive):</strong> Letters match both uppercase and lowercase forms (e.g. 'A' = 'a').</li>
                  <li><strong className="text-white">/g/ (Global Search):</strong> Finds ALL occurrences in a string instead of stopping after the first match.</li>
                  <li><strong className="text-white">/m/ (Multiline):</strong> Makes the ^ and $ symbols match the start/end of individual lines instead of the whole text.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-cyan-300 font-bold text-lg mb-2 flex items-center gap-2"><span>3.</span> Analysis Features</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong className="text-white">English Translation:</strong> Instantly translates confusing symbols (like \w or +) into a readable English ruleset.</li>
                  <li><strong className="text-white">Capture Groups (Grp 1):</strong> If you use parenthesis <code>()</code> in your regex, this extracts and displays exactly what data was "caught" inside them.</li>
                  <li><strong className="text-white">Linter Warnings:</strong> A yellow warning ⚠️ appears if you write redundant patterns.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-emerald-300 font-bold text-lg mb-2 flex items-center gap-2"><span>4.</span> Testing Capabilities</h3>
                <p className="mb-2"><strong className="text-white">Manual Test:</strong> Let's you physically type your own custom string. It glows green if the regex accepts it, or red if it rejects it.</p>
                <p><strong className="text-white">Equivalence test:</strong> Compares a second regex pattern against your main one to see if they both create the same language strings.</p>
              </section>
            </div>
            
            <button onClick={() => setShowHelp(false)} className="w-full mt-8 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">Got it!</button>
          </div>
        </div>
      )}

      {/* Animated Glowing Orbs Background */}
      <div className="fixed top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-fuchsia-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse duration-[3s]"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none animate-pulse duration-[4s]"></div>
      <div className="fixed top-[30%] left-[50%] w-[20vw] h-[20vw] bg-cyan-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>

      {/* Title Header */}
      <div className="relative z-10 w-full p-6 text-center border-b border-white/5 bg-black/20 backdrop-blur-lg">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 tracking-tight">Regex Studio</h1>
        <p className="text-slate-400 mt-2 font-medium text-sm">Design, generate, and visualize regex patterns in a dynamic space</p>
      </div>

      <div className="relative z-10 p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1600px] mx-auto">
        {/* LEFT PANEL */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(217,70,239,0.3)] border border-rose-400/20">
              <span className="font-bold text-white text-xl">P</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Palette
            </h2>
          </div>
          
          <p className="text-sm text-slate-400 mb-6 font-medium">Quickly insert pattern tokens</p>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              "a", "b", "c", "|", "*", "+", "?", "()", "[]", "\\d", "\\w", ".", "^", "$",
            ].map((sym, i) => (
              <button
                key={i}
                className="bg-black/40 text-slate-300 py-4 rounded-xl hover:bg-fuchsia-500/10 hover:text-white hover:-translate-y-1 hover:shadow-[0_0_15px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/40 transition-all duration-300 shadow-sm [font-family:'JetBrains_Mono',monospace] text-lg font-semibold border border-white/5 focus:outline-none focus:ring-1 focus:ring-fuchsia-400/50 active:scale-95"
                onClick={() => insertSymbol(sym)}
              >
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-400/20">
                <span className="font-bold text-white text-xl">R</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Regex Input
              </h2>
            </div>
            
            {/* Feature 2: Flags Toggles */}
            <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
               {['i', 'g', 'm'].map(flag => (
                 <button 
                  key={flag}
                  onClick={() => setFlags(f => ({...f, [flag]: !f[flag]}))}
                  className={`w-10 h-10 rounded-lg font-bold transition-all text-sm ${flags[flag] ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50 shadow-sm' : 'text-slate-500 hover:text-slate-300 border border-transparent'}`}
                  title={`Flag: ${flag}`}
                 >
                   /{flag}/
                 </button>
               ))}
            </div>
          </div>

          <div className="flex-grow flex flex-col relative z-10">
            <label className="text-sm text-indigo-200 mb-2 font-medium tracking-wide">
              BUILD YOUR PATTERN
            </label>
            <div className="relative mb-3">
              <input
                className={`w-full px-5 py-5 bg-black/40 [font-family:'JetBrains_Mono',monospace] text-xl border rounded-[1.25rem] focus:outline-none transition-all duration-300 placeholder-slate-600 ${
                  regexError 
                    ? 'text-rose-400 border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-500/5' 
                    : 'text-indigo-200 border-white/10 focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                }`}
                value={regex}
                onChange={(e) => handleRegexChange(e.target.value)}
                placeholder="(a|b)*c"
              />
              {/* Output Error */}
              {regexError && (
                <div className="mt-3 text-rose-400 text-sm font-medium flex items-center gap-3 bg-rose-500/10 py-3 px-4 rounded-xl border border-rose-500/20 animate-[pulse_0.5s_ease-in-out_1]">
                  <span className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center text-xs shrink-0 shadow-inner text-rose-300">!</span>
                  {regexError.charAt(0).toUpperCase() + regexError.slice(1)}
                </div>
              )}
            </div>

            {/* Feature 3: Regex Linter Warnings */}
            {warnings.length > 0 && !regexError && (
               <div className="mb-4 space-y-2">
                 {warnings.map((w, i) => (
                   <div key={i} className="text-amber-400 text-xs font-medium flex items-start gap-2 bg-amber-500/10 py-2 px-3 rounded-lg border border-amber-500/20">
                     <span className="shrink-0 mt-0.5">⚠️</span> {w}
                   </div>
                 ))}
               </div>
            )}
            
            {/* Feature 4: Static English Translation */}
            {regex && !regexError && (
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl shadow-inner">
                <h4 className="text-xs text-indigo-300 font-bold mb-3 uppercase tracking-wider">English Translation</h4>
                <ul className="space-y-2">
                  {translateRegexToEnglish(regex).map((rule, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500/50"></span> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <label className="text-sm text-indigo-200 mb-2 font-medium tracking-wide mt-4">
              GENERATION COUNT: <span className="text-white font-bold">{count}</span>
            </label>
            <div className="relative mb-6 text-white mt-2">
              <input
                type="range"
                min="1"
                max="50"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full h-2 bg-black/50 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-white/10 focus:outline-none"
              />
            </div>
            
            {/* Feature 6: Anti matches toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-[1rem] border border-white/5 h-[48px]">
              <button 
                onClick={() => setGenerationMode("match")} 
                className={`flex-1 rounded-[12px] font-bold text-sm transition-all shadow-sm ${generationMode === "match" ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                 Valid Strings
              </button>
              <button 
                onClick={() => setGenerationMode("anti-match")} 
                className={`flex-1 rounded-[12px] font-bold text-sm transition-all shadow-sm ${generationMode === "anti-match" ? 'bg-rose-500 text-white' : 'text-slate-400 hover:bg-white/5'}`}
              >
                 Invalid Strings
              </button>
            </div>

            <button
              onClick={generateStrings}
              disabled={!!regexError || !regex}
              className={`w-full mt-auto px-6 py-5 rounded-[1.25rem] font-bold text-lg transition-all duration-300 active:scale-95 ${
                (regexError || !regex)
                  ? 'bg-black/50 text-slate-500 cursor-not-allowed border border-white/5'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_35px_rgba(168,85,247,0.5)] border border-white/10 hover:border-white/20'
              }`}
            >
              Generate {generationMode === 'match' ? 'Matching' : 'Invalid'} Strings
            </button>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="bg-[#0a0a0f]/60 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col border border-white/[0.08] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)] border border-cyan-400/20">
              <span className="font-bold text-white text-xl">O</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Output & Tests
            </h2>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-3xl p-5 mb-8 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] min-h-[240px] flex-grow flex flex-col overflow-y-auto max-h-[400px] custom-scrollbar">
            <h3 className="text-xs text-cyan-500 font-bold mb-4 uppercase tracking-[0.2em] flex items-center justify-between">
              <span>{generationMode === "match" ? "Generated Sequences" : "Generated Anti-Matches"}</span>
              <span className="text-white/40">{strings.length} count</span>
            </h3>
            {strings.length > 0 ? (
              <ul className="space-y-3">
                {strings.map((s, i) => (
                  <li
                    key={i}
                    className="flex flex-col bg-white/[0.02] hover:bg-white/[0.04] px-5 py-4 rounded-[1.25rem] border border-white/[0.05] hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className={`[font-family:'JetBrains_Mono',monospace] text-lg ${generationMode === "match" ? 'text-cyan-300' : 'text-rose-400'}`}>{s === "" ? "<empty string>" : s}</span>

                      {generationMode === "match" && (
                         <button
                           onClick={() => playSimulation(s)}
                           className="ml-3 px-4 py-2 bg-black/40 hover:bg-cyan-500/20 border border-white/5 text-slate-300 hover:border-cyan-500/30 rounded-xl transition-all text-sm font-semibold flex items-center gap-2 hover:text-cyan-100 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] focus:outline-none"
                         >
                           <span className="text-cyan-400">▶</span> Play
                         </button>
                      )}
                    </div>
                    
                    {/* Feature 5: Capture Groups Extractor */}
                    {generationMode === "match" && getCaptureGroups(s).length > 0 && (
                       <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/5">
                         {getCaptureGroups(s).map((grp, gId) => {
                           if (grp === undefined) return null; // non-matching optional group
                           return (
                             <span key={gId} className="text-[11px] font-bold px-2 py-1 bg-fuchsia-500/10 text-fuchsia-400 rounded-lg border border-fuchsia-500/20">
                               Grp {gId + 1}: <span className="text-white ml-0.5">{grp}</span>
                             </span>
                           )
                         })}
                       </div>
                    )}

                    {animatingString === s && generationMode === "match" && (
                      <div className="mt-6 p-6 bg-black/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)]">
                        <div className="flex items-center justify-between mb-5">
                          <h4 className="text-[10px] text-cyan-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            Building String
                            {isPlaying && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>}
                          </h4>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-6 min-h-[60px] items-center text-lg">
                          {s.split("").map((char, charIdx) => {
                            if (isPlaying && charIdx > currentStepIndex) return null;
                            const isHighlighted = isPlaying ? charIdx === currentStepIndex : false;
                            const isPast = charIdx < currentStepIndex || (!isPlaying);
                            return (
                              <div 
                                key={charIdx} 
                                className={`w-12 h-12 flex flex-col items-center justify-center font-bold [font-family:'JetBrains_Mono',monospace] rounded-xl transition-all duration-300 ${
                                  isHighlighted 
                                    ? 'bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-110 z-10 border border-cyan-300/30 animate-[pulse_1s_infinite]' 
                                    : isPast 
                                      ? 'bg-white/5 text-slate-300 border border-white/5 transform scale-100 shadow-sm' 
                                      : ''
                                }`}
                              >
                                {char}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="min-h-[64px] flex flex-col justify-center px-5 py-4 bg-white/5 rounded-xl border border-white/5">
                          {isPlaying ? (
                            <div className="text-[14px] text-cyan-200 font-medium flex items-center gap-4 leading-relaxed">
                               <span className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]">i</span>
                               <span>{explainString(regex, s)[currentStepIndex]}</span>
                            </div>
                          ) : (
                            <div className="text-[14px] text-emerald-300 font-medium flex items-center gap-4">
                               <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-sm font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]">✓</span>
                               <span>Generation complete. Pattern matched.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center opacity-70">
                 <div className="w-20 h-20 mb-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden relative">
                   <div className="absolute inset-0 bg-cyan-500/10 blur-xl"></div>
                   <span className="text-4xl opacity-50 relative z-10">✨</span>
                 </div>
                 <p className="text-slate-200 font-bold text-lg tracking-wide">Awaiting Pattern</p>
                 <p className="text-slate-500 text-sm mt-2 font-medium">Enter a pattern & generate sequences</p>
              </div>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-8">
            
            {/* Feature 1: Manual String Tester */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-400 to-green-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <span className="font-bold text-white text-sm">T</span>
                </div>
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                  Manual Test
                </h3>
              </div>
              <div className="relative">
                 <input
                   className={`w-full px-5 py-4 bg-black/40 [font-family:'JetBrains_Mono',monospace] border rounded-xl focus:outline-none transition-all shadow-inner placeholder-slate-600 ${
                     manualTestResult === true ? 'text-emerald-300 border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 bg-emerald-500/5' :
                     manualTestResult === false ? 'text-rose-400 border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 bg-rose-500/5' :
                     'text-slate-300 border-white/10 focus:border-white/30'
                   }`}
                   value={manualTestString}
                   onChange={(e) => testManualString(e.target.value)}
                   placeholder="Type a string to test..."
                 />
                 {manualTestResult === true && <span className="absolute right-4 top-4 text-emerald-400 text-xl animate-[pulse_1s_infinite]">✓</span>}
                 {manualTestResult === false && <span className="absolute right-4 top-4 text-rose-400 text-xl font-bold">✕</span>}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                   <span className="font-bold text-white text-sm">≈</span>
                 </div>
                 <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                   Equivalence
                 </h3>
              </div>
              
              <input
                className="w-full px-5 py-4 bg-black/40 text-amber-200 [font-family:'JetBrains_Mono',monospace] border border-white/10 rounded-xl focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all shadow-inner mb-4 placeholder-slate-600"
                value={regex2}
                onChange={(e) => setRegex2(e.target.value)}
                placeholder="e.g. (b|a)*c"
              />
              <button
                onClick={checkEquivalence}
                className="w-full bg-white/[0.05] hover:bg-amber-500/20 text-white px-5 py-4 rounded-xl font-bold transition-all shadow-md hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] border border-white/10 hover:border-amber-500/30 active:scale-95"
              >
                Verify Equivalence
              </button>

              {equivalence && (
                <div
                  className={`mt-4 p-4 rounded-xl font-bold text-center border backdrop-blur-md transition-all duration-500 animate-[pulse_0.5s_ease-in-out_1] ${
                    equivalence === "Likely Equivalent"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : "bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                  }`}
                >
                  <span className="mr-3 text-lg">{equivalence === "Likely Equivalent" ? "✨" : "⚠️"}</span>
                  {equivalence}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
