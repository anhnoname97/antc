const fs=require('fs'),vm=require('vm');
const dir=process.argv[2],out=process.argv[3];
const D=JSON.parse(fs.readFileSync(dir+'/data.json','utf8'));
const src=fs.readFileSync(dir+'/app.js','utf8').split('\n');
const want=['SIGNS','CHANNELS','TCH','TLV','GROUPS','BK','RTABS','ALERTS','WZCH','WZRQ','WZPR','HOLDTXT','WZRULES','TQ','STATE','LEVEL','PRINC','REFUSE','RESNOTE','NOTCONC','LVSLUG','LVTAB','DOCTAB','ARTTAB','BANKA','BONKHONG','QA','T3','TOOLLIST','SITORDER','DOORDEF','DOORS','LVORDER','TACX','ARTX','KINDNAME','ARTORDER','ARTNO'];
const ctx={D,ic:()=>'',esc:s=>s};Object.assign(ctx,D);vm.createContext(ctx);
for(let i=0;i<src.length;i++){const m=src[i].match(/^var ([A-Z0-9_]+)=/);if(!m||!want.includes(m[1]))continue;
 let j=i+1;while(j<src.length&&!/^(var |function |\/\*)/.test(src[j]))j++;
 let code=src.slice(i,j).join('\n');try{vm.runInContext(code,ctx)}catch(e){console.error(m[1],e.message.slice(0,100))}}
const o={};for(const w of want)o[w]=ctx[w];
o.TACTICS=D.TACTICS.map(t=>({cd:t.cd,t:t.t}));o.CD=D.CD;o.CDSHORT=D.CDSHORT;
o.PB={};for(const k in D.PB)o.PB[k]={title:D.PB[k].title,lead:D.PB[k].lead,s:D.PB[k].blocks.filter(b=>b.s).map(b=>({s:b.s,d:b.d||[]}))};
o.DOCS={};for(const k in D.DOCS)o.DOCS[k]={t:D.DOCS[k].t,kicker:D.DOCS[k].kicker};
o.ARTS={};for(const k in D.ARTS)o.ARTS[k]={t:D.ARTS[k].t,lede:D.ARTS[k].lede};
fs.writeFileSync(out,JSON.stringify(o));console.log(Object.keys(o).filter(k=>o[k]===undefined),fs.statSync(out).size);
