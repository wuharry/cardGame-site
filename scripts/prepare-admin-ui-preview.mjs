// Creates a separate, local-only preview. No environment files or production RPCs.
import { cp, mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
// Optional first argument: a new, empty output directory (an existing preview is kept as evidence).
const output = resolve(process.argv[2] ?? resolve(root, "build/admin-ui-20261024/preview"));
await mkdir(dirname(output), { recursive: true });
await mkdir(output); // A previous preview is evidence; never overwrite it.
for (const path of ["src", "public", "package.json", "tsconfig.json", "postcss.config.mjs", "next.config.ts"]) {
  await cp(resolve(root, path), resolve(output, path), { recursive: true,
    filter: source => !source.replaceAll("\\", "/").includes("/public/downloads/") && !/(^|\/)\.env(?:\.|$)/.test(source.replaceAll("\\", "/")) });
}
await symlink(resolve(root, "node_modules"), resolve(output, "node_modules"), process.platform === "win32" ? "junction" : "dir");
const apiPath = resolve(output, "src/app/admin/admin-api.ts");
const source = await readFile(apiPath, "utf8");
const catalog = JSON.parse(await readFile(resolve(root, "src/app/admin/card-catalog.json"), "utf8"));
const deck = Object.fromEntries(Object.entries(catalog.cards).filter(([, card]) => card.art).slice(0, 20).map(([id]) => [id, 3]));
const fixture = `
const previewUser = {id:"fixture-player",email:"player@example.invalid",created_at:"2026-10-01T00:00:00Z",email_confirmed_at:"2026-10-01T00:00:00Z",last_sign_in_at:"2026-10-24T01:00:00Z",suspended:false,has_wallet:true,pack_tickets:3,starter_draws_remaining:20,card_types:20,card_copies:60};
const previewDeck = ${JSON.stringify(deck)};
const previewGuest=(id,platform,version,started,minutes)=>({install_id:id,first_seen:new Date(Date.now()-9*86400000).toISOString(),last_seen:new Date(Date.now()-3600000).toISOString(),online:id.startsWith("1a2b"),stats:{version,platform,state:"menu",launches:4,play_seconds:minutes*60,modes:{pve:{started,wins:Math.floor(started/2),losses:Math.ceil(started/2)-1,draws:0,abandoned:1},lan:{started:0,wins:0,losses:0,draws:0,abandoned:0},pvp:{started:0,wins:0,losses:0,draws:0,abandoned:0},hotseat:{started:1,wins:1,losses:0,draws:0,abandoned:0}}}});
const previewGuests=[previewGuest("1a2b3c4d-0000-4000-8000-000000000001","Android","2026.11.11-R25",3,42),previewGuest("5e6f7a8b-0000-4000-8000-000000000002","Windows","2026.11.03-R24",6,118),previewGuest("9c0d1e2f-0000-4000-8000-000000000003","macOS","2026.11.11-R25",1,9)];

const previewCommerce = {initialized:true,gold:1250,diamonds:80,equipped_emotes:["fixture-emote"],owned_emotes:[{id:"fixture-emote",text:"示範台詞",acquired_at:"2026-10-23T00:00:00Z",request_id:"fixture-unlock"}],transactions:[
 {request_id:"fixture-reward",action:"weekly",item_id:"weekly",item_text:"每週獎勵",terminal_error:"",created_at:"2026-10-24T00:00:00Z",gold_before:900,gold_after:1400,diamonds_before:100,diamonds_after:100,price:null,expected_price:null},
 {request_id:"fixture-pack",action:"buy_pack",item_id:"pack",item_text:"示範卡包",terminal_error:"",created_at:"2026-10-24T00:05:00Z",gold_before:1400,gold_after:1250,diamonds_before:100,diamonds_after:100,price:null,expected_price:null},
 {request_id:"fixture-emote-buy",action:"buy_emote",item_id:"fixture-emote",item_text:"示範台詞",terminal_error:"",created_at:"2026-10-24T00:10:00Z",gold_before:1250,gold_after:1250,diamonds_before:100,diamonds_after:80,price:20,expected_price:20},
 {request_id:"fixture-rejected",action:"buy_pack",item_id:"pack",item_text:"未完成交易",terminal_error:"fixture-error",created_at:"2026-10-24T00:15:00Z",gold_before:1250,gold_after:1250,diamonds_before:80,diamonds_after:80,price:null,expected_price:null}]};
export class AdminAPI {
 async signIn(_email:string, _password:string) {return {account_id:"fixture-admin",email:"preview@example.invalid",access_level:"operator"} as AdminSession;}
 async signOut() {}
 onSessionExpired(_listener:()=>void) {return ()=>{};}
 async sendSetupCode(_email:string) {throw new Error("合成預覽不寄送驗證碼");}
 async verifySetupCode(_email:string, _code:string): Promise<AdminSession> {throw new Error("合成預覽不驗證真實帳號");}
 async updatePassword(_credential:string) {throw new Error("合成預覽不變更密碼");}
 async change(_change:Change) {throw new Error("合成預覽禁止寫入");}
 async rpc<T>(name:string, params:Record<string,unknown>={}):Promise<T> {
  const now=new Date().toISOString();let value:unknown;
  if(name==="tcg_admin_players") value={registered:143,total:1,page:0,page_size:25,players:[previewUser]};
  else if(name==="tcg_admin_player") value={user:previewUser,wallet:{pack_tickets:3,starter_draws_remaining:20,opened_packs:5,last_claim_day:null},collection:previewDeck,restriction:{suspended:false},record:{wins:18,losses:7,draws:2,total:27},receipts:[],audit:[],commerce:previewCommerce,last_submitted_deck:{deck_id:"fixture-deck",cards:previewDeck,submitted_at:now},matches:Array.from({length:5},(_,i)=>({match_id:"fixture-player-"+i,completed_at:new Date(Date.now()-i*3600000).toISOString(),opponent_id:"fixture-opponent",outcome:i<3?"win":"loss",reason:"defeat"}))};
  else if(name==="tcg_admin_play_dashboard") value={generated_at:now,days:28,counts:{registered:142,collection_users:119,admitted_users:90,completed_users:82,guest_installs:230,guest_played:167,guest_online:18,formal_matches:318,guest_play_seconds:34000},daily:Array.from({length:28},(_,i)=>({day:new Date(Date.now()-(27-i)*86400000).toISOString().slice(0,10),registered:2+i%7,guest_installs:5+i%6,guest_active:10+i%9,matches:4+i%8})),servers:[{server_id:"fixture-server",received_at:now,fresh:true,verified_accounts:5,presence:{online_players:5,lobby_players:3,playing_players:2,public_rooms:1,matches:1,protocol:28}}],online_samples:Array.from({length:24},(_,i)=>({minute:new Date(Date.now()-(23-i)*60000).toISOString(),online_connections:4+i%5,lobby_connections:2+i%3,playing_connections:2+i%2})),guest_modes:[{mode:"pve",started:40,wins:20,losses:10,draws:0,abandoned:4},{mode:"pvp",started:20,wins:9,losses:6,draws:2,abandoned:2}],formal_outcomes:{defeat:42,disconnect:3,draws:2}};
  else if(name==="tcg_admin_player_rates") value={page:0,players:[{id:previewUser.id,email:previewUser.email,wins:18,losses:7,draws:2,total:27,win_rate:72,loss_rate:28,verified_match_online:true}]};
  else if(name==="tcg_admin_guest_players") value={page:0,total:previewGuests.length,players:previewGuests};
  else if(name==="tcg_admin_guest_search") value={code:String(params.p_code),players:previewGuests.filter(g=>g.install_id.startsWith(String(params.p_code))).map(g=>({...g,onboarding:{version:"2026.11.11-R25",tutorial_started:1,tutorial_completed:0,tutorial_step:7,tutorial_step_name:"BLOCK",tutorial_steps:16,updated_at:now}}))};
  else if(name==="tcg_admin_growth") value={schema_version:1,generated_at:now,days:28,today:now.slice(0,10),funnel:{installs:42,onboarding_reported:30,tutorial_started:28,tutorial_completed:17,first_match_started:21,first_match_finished:16,second_match_started:9},tutorial_steps:[["MULLIGAN",0,2,0],["SUMMON",3,4,0],["BLOCK",7,3,0],["ATTACK",8,2,0],["COMPLETE",14,12,12],["MORE",15,5,5]].map(([n,step,installs,completed])=>({version:"2026.11.11-R25",step,name:n,steps:16,installs,completed})),retention:Array.from({length:21},(_,i)=>{const day=new Date(Date.now()-(20-i)*86400000).toISOString().slice(0,10);const installs=1+(i*7)%5;return {day,installs,d1:20-i>1?Math.min(installs,i%3):null,d7:20-i>7?Math.min(installs,i%2):null,within7:20-i>7?Math.min(installs,1+i%3):null};}),platforms:[{platform:"Android",installs:25},{platform:"Windows",installs:12},{platform:"macOS",installs:5}],versions:[{version:"2026.11.11-R25",installs:24},{version:"2026.11.03-R24",installs:14},{version:"2026.10.30-R23",installs:4}],turns:[{mode:"casual",samples:40,median:24,p90:34,max:52},{mode:"ranked",samples:22,median:27,p90:38,max:48}],economy:[{action:"buy_pack",receipts:61,gold_in:0,gold_out:9150},{action:"starter_deck",receipts:12,gold_in:0,gold_out:2400},{action:"weekly",receipts:20,gold_in:6000,gold_out:0}]};
  else if(name==="tcg_admin_player_mail") value={items:[],total:0};
  else if(name==="tcg_admin_match_analytics") {
   const all=Array.from({length:40},(_,i)=>({match_id:"fixture-duration-"+i,source:i<25?"server":"self_reported",mode:i<25?"ranked":"pve",version:"2026.10.23-R18",reason:i<25?"defeat":"completed",duration_seconds:[110,240,420,700,1100][i%5],completed_at:new Date(Date.now()-i*3600000).toISOString()}));
   const matches=all.filter(m=>(!params.p_mode||m.mode===params.p_mode)&&(!params.p_version||m.version===params.p_version)&&(!params.p_reason||m.reason===params.p_reason));
   const groups=["server","self_reported"].flatMap(source=>{const rows=matches.filter(m=>m.source===source);if(!rows.length)return [];const times=rows.map(m=>m.duration_seconds).sort((a,b)=>a-b);return [{source,mode:rows[0].mode,version:rows[0].version,reason:rows[0].reason,samples:times.length,avg_seconds:times.reduce((a,b)=>a+b,0)/times.length,median_seconds:times[Math.floor(times.length/2)],p90_seconds:times[Math.ceil(times.length*.9)-1],total_seconds:times.reduce((a,b)=>a+b,0)}]});
   value={schema_version:1,generated_at:now,groups,matches,accounts:[]};
  } else throw new Error("Unknown synthetic RPC: "+name);
  return value as T;
 }
}
`;
await writeFile(apiPath, source.slice(0, source.indexOf("export class AdminAPI")) + fixture + source.slice(source.indexOf("export type PlayerMail")));
const consolePath = resolve(output, "src/app/admin/admin-console.tsx");
await writeFile(consolePath, (await readFile(consolePath, "utf8")).replace('<main className={styles.root}>', '<main className={styles.root}><p role="note" style={{border:"1px solid #d0b87a",padding:12}}>合成資料預覽 · 未連接正式服務 · 所有寫入停用</p>'));
const config = resolve(output, "next.config.ts");
await writeFile(config, (await readFile(config, "utf8")).replace("base-uri 'self';", "connect-src 'self'; base-uri 'self';"));
console.log(`Local synthetic preview prepared: ${output}`);
console.log(`Run: node ${resolve(root, "node_modules/next/dist/bin/next")} dev --webpack --hostname 127.0.0.1 --port 3124`);
