/* mho2/engine-v2/calcs.ts */
export function bmi(weightKg:number, heightCm:number){
  if(!weightKg||!heightCm) return null;
  const m=heightCm/100;
  return +(weightKg/(m*m)).toFixed(1);
}
export function bmrMifflin(sex:string, age:number, heightCm:number, weightKg:number){
  if([age,heightCm,weightKg].some(v=>v==null)) return null;
  const base = 10*weightKg + 6.25*heightCm - 5*age;
  return (sex==="male") ? base + 5 : base - 161;
}
export function tdee(bmr:number|null, activity:"sedentary"|"light"|"moderate"|"active"|"very_active"){
  if(!bmr) return null;
  const map:any={sedentary:1.2,light:1.375,moderate:1.55,active:1.725,very_active:1.9};
  return +(bmr*(map[activity]||1.2)).toFixed(0);
}