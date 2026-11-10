const fs=require('fs');const vm=require('vm');
const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync(process.argv[2],'utf8'),ctx);
const {SITS,SGRP,ARTGRP_EXTRA}=ctx;
console.log('situations',SITS.length);
const ids=new Set();SITS.forEach(s=>{if(ids.has(s.id))console.log('DUP',s.id);ids.add(s.id);if(!SGRP.find(g=>g.k===s.g))console.log('BADG',s.id)});
const cov=new Set();SITS.forEach(s=>s.tac.forEach(t=>cov.add(t)));Object.keys(ARTGRP_EXTRA).forEach(k=>cov.add(+k));
const miss=[];for(let i=1;i<=157;i++)if(!cov.has(i))miss.push(i);console.log('unmapped',miss);
console.log(SGRP.map(g=>g.k+':'+SITS.filter(s=>s.g===g.k).length).join(' '));
