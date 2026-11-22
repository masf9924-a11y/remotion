import path from 'node:path';
import fs from 'node:fs';
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {buildModule} from '../src/timeline';
const chrome='/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browserExecutable=fs.existsSync(chrome)?chrome:null;
const serveUrl=await bundle({entryPoint:path.resolve('src/index.ts')});
fs.mkdirSync('out/qa',{recursive:true});
const m=buildModule('m1');const sc=m.scenes.find(s=>s.id==='m1s4')!;
const pause=sc.pauses[0];const answerShow=sc.cues.answer?.show??0;
const composition=await selectComposition({serveUrl,id:'Modulo-1',inputProps:{moduleId:'m1'},browserExecutable});
const targets:[number,string][]=[
  [sc.start+pause.from+90,'quiz-pausa'],
  [sc.start+answerShow+20,'quiz-revela'],
];
for(const [frame,label] of targets){
  await renderStill({serveUrl,composition,frame:Math.round(frame),output:path.resolve('out/qa',`m1s4-${label}.png`),inputProps:{moduleId:'m1'},browserExecutable,scale:0.5});
  console.log('qa',label,Math.round(frame));
}
