/* scripts/nonclinical-lint.cjs */
const fs=require("fs"), path=require("path");
const rulesPath=path.join(process.cwd(),"mho","compliance","nonClinical.rules.json");
if(!fs.existsSync(rulesPath)){ console.log("nonClinical.rules.json not found. Skip."); process.exit(0); }
const rules=JSON.parse(fs.readFileSync(rulesPath,"utf8"));
const patterns=(rules.blockedTerms||[]).map(r=>new RegExp(r.pattern, r.flags||"gi"));
function walk(d){ const out=[]; for(const e of fs.readdirSync(d,{withFileTypes:true})) {
  const p=path.join(d,e.name); if(e.isDirectory()) out.push(...walk(p));
  else if(/.(ts|tsx|js|jsx|md|txt|json)$/i.test(e.name)) out.push(p);
} return out;}
const roots=["src","mho"].filter(r=>fs.existsSync(r));
let bad=false;
for(const r of roots){ for(const f of walk(path.join(process.cwd(),r))){
  const txt=fs.readFileSync(f,"utf8"); for(const re of patterns){ if(re.test(txt)){ console.error("Clinical term in:",f); bad=true; } }
}}
process.exit(bad?1:0);