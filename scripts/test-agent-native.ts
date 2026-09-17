import {readFile,mkdir,writeFile} from "node:fs/promises";
import {homedir} from "node:os";
import {join,resolve} from "node:path";
import assert from "node:assert/strict";
import {NativeModel} from "../bridge/native-model";
import {makeRoleJob,parseAnswer,agentMeta,type Loop} from "../../heldalive-runtime/cloud/roles";
const config=JSON.parse(await readFile(join(homedir(),"Library/Application Support/HeldAlive/launch/bridge.json"),"utf8"));
const model=new NativeModel(config.python,resolve("bridge/native_model.py"),config.modelPath);
const loop:Loop={id:"native-commissioning",branch:"manager/native-commissioning",createdAt:Date.now(),goal:"Inspect how an agent should record corrected facts.",brief:"Find evidence on stale memories and updates.",stage:"planner",planReviews:0,deliverableReviews:0,instances:[],sequence:0};
const p=process.env.HELD_TEST_RESEARCH === "1" ? JSON.parse(await readFile(".local/qa/edition11/browser-before-grammar-fix.json","utf8")).state.loops[0].pending : makeRoleJob(loop,[],[],[],[],Date.now());
let text="",done=false,usage={tokens:0,inputTokens:0};const started=Date.now();
try{
 await model.ready;
 await model.generate({id:p.id,kind:p.kind,messages:p.messages,agent:agentMeta(p),maxTokens:p.maxTokens,temperature:0.3},event=>{const e=event as {type:string;text?:string;tokens?:number;inputTokens?:number};if(e.type==="chunk")text+=e.text;if(e.type==="done"){done=true;usage={tokens:e.tokens||0,inputTokens:e.inputTokens||0};}},new AbortController().signal);
 assert.ok(done);const answer=parseAnswer(text,p);assert.ok(answer.search!=="none"); if(process.env.HELD_TEST_RESEARCH === "1")assert.ok(answer.sources.includes("S1"));
 await mkdir(".local/qa/edition11",{recursive:true});await writeFile(`.local/qa/edition11/native-agent${process.env.HELD_TEST_RESEARCH === "1" ? "-research" : ""}.json`,JSON.stringify({answer,usage,durationMs:Date.now()-started},null,2));
 console.log("PASS matching native Qwen agent grammar and bounded role output",usage);
}finally{model.close();}
