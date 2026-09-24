#!/usr/bin/env node
/**
 * guard.mjs — cbb-guard PreToolUse 守门钩子（U-G02 · 裁定 2026-09-24）
 *
 * 规则（裁定原文见《形态升级-工单-插件化-20260923.md》U-G02；分级=二拦二警照准）：
 *   拦 A  冻结线"覆盖已有文件"——原位保全语义：冻结目录下**新建文件放行、覆盖已有文件拦截**；
 *         Bash 的 rm/del/mv/clean 指向冻结线 → 拦。覆盖范围：迷深实战-{本体库,工作区} 目录
 *         与 迷深实战-{工单,发车件,BUILD-STATE}.md 三件。
 *   拦 B  红区文件 **Write 整体覆盖**——cbb/contracts/*.schema.json、两份在案工单、决策账本身；
 *         Edit 放行（追加段靠 Edit 的 old_string 语义）。
 *   旁通  env CBB_HOOK_BYPASS=<裁定引用> 非空 → 放行，并自动追加"旁通"条目到 决策账.jsonl。
 *         无账引用的绕过 = 硬拦（账引用解锁是唯一合法旁通道）。
 *   其余  exit 0 静默（不加噪音；example-plugin 的 additionalContext 模式会产生每调一行噪音，弃用）。
 *
 * 自检（正负对照）：
 *   printf '%s' '{"tool_name":"Write","tool_input":{"file_path":"D:/…/迷深实战-本体库/ledger.jsonl"}}' | node guard.mjs   → exit 2
 *   printf '%s' '{"tool_name":"Write","tool_input":{"file_path":"D:/…/新建件.md"}}' | node guard.mjs                      → exit 0
 */
import fs from "node:fs";
import path from "node:path";

// 可移植：项目根由 env CBB_GUARD_ROOT 指定（另一台机器/另一路径直接设这个变量即可）；
// 缺省回落到本机原路径（向后兼容，不改既有行为）。
const ROOT = (process.env.CBB_GUARD_ROOT || "d:/zcode专用！！！！危险！！！！！！！！！/正典库构建系统/")
  .replace(/\\/g, "/").toLowerCase().replace(/\/+$/, "") + "/";  // 归一并**保证**尾斜杠（缺则补）
const DECISION_LOG = ROOT + "决策账.jsonl";
const FROZEN_DIRS = [ROOT + "迷深实战-本体库/", ROOT + "迷深实战-工作区/"];
const FROZEN_FILES = [ROOT + "迷深实战-工单.md", ROOT + "迷深实战-发车件.md",
                      ROOT + "迷深实战-build-state.md"];
// 红区（Write 拦）：契约 schema + 两份在案工单（本体构筑-工单 亦为在案工单）+ 决策账
const REDZONE_WRITE = [ROOT + "cbb/contracts/", ROOT + "本体构筑-工单.md",
                       ROOT + "迷深实战-工单.md", ROOT + "决策账.jsonl"];

const norm = (p) => String(p || "").replace(/\\/g, "/").toLowerCase();
const isFrozen = (p) => FROZEN_DIRS.some((d) => p.startsWith(d)) || FROZEN_FILES.includes(p);
const isRedzoneWrite = (p) => REDZONE_WRITE.some((d) => p === d || p.startsWith(d));

let raw = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) raw += chunk;
let input = {};
try { input = raw.trim() ? JSON.parse(raw) : {}; } catch { process.exit(0); } // 解析失败放行（不因钩子坏而阻断）

const tool = (input.tool_name || input.toolName || "").toLowerCase();
const ti = input.tool_input || {};
const rawPath = String(ti.file_path || ti.path || "");
const fp = norm(rawPath);
const cmd = String(ti.command || "");

const bypass = (process.env.CBB_HOOK_BYPASS || "").trim();

if (process.env.CBB_GUARD_DEBUG) {  // 排查用：CBB_GUARD_DEBUG=1 时打印比对内部值
  process.stderr.write(`[cbb-guard:debug] tool=${tool} ROOT=${ROOT} fp=${fp}\n` +
    `[cbb-guard:debug] frozen=${isFrozen(fp)} redzone_write=${isRedzoneWrite(fp)} exists=${fs.existsSync(rawPath)}\n`);
}

function bypassLog(action, target, extra) {
  try {
    fs.appendFileSync(DECISION_LOG, JSON.stringify({
      type: "hook-bypass", ref: bypass, action, target, ...extra, at: new Date().toISOString(),
    }) + "\n");
    return fs.existsSync(DECISION_LOG) ? null : "写后回读：账文件不存在";
  } catch (e) { return e && e.code ? e.code : String(e).slice(0, 60); }
}

function deny(msg, rule, hit) {
  // 回执必带"命中第几条规则 + 触发片段"：不带命中面的拦截无法排障，
  // 人会以为是宿主故障（0.1.1 修 G-1 时补）。
  process.stderr.write(`[cbb-guard] 拦截：${msg}\n` +
    (rule ? `[cbb-guard] 命中：${rule}${hit ? " · " + hit : ""}\n` : "") +
    (bypass ? `[cbb-guard] 旁通引用已设（${bypass}），本应放行——请核对引用是否对应真实裁定\n` :
      `（如为已裁定操作：设 CBB_HOOK_BYPASS=<裁定引用> 后重试，旁通将自动入决策账）\n`));
  process.exit(2);
}

// 旁通（有账引用）：放行并留账
if (bypass) {
  const target = fp || cmd.slice(0, 80);
  const err = bypassLog(`${tool} @ ${target}`, target, { scope: "global(全规则)" });
  if (err) {
    // 0.1.1 修 G-2：留痕写不进去就**不放行**。原实现把 appendFileSync 包在 try/catch 里静默吞掉，
    // 于是「CBB_GUARD_ROOT 指错 / 决策账不可写 / 目录不存在」这类环境错配下，旁通越过了全部规则
    // 却一条账都没留——唯一该有痕迹的越权通道，恰好在这种时候没有痕迹（为空被读成通过）。
    process.stderr.write(
      `[cbb-guard] 拒绝旁通：留痕写不进去，无留痕不越权（原行为是静默放行）\n` +
      `  落点：${DECISION_LOG}\n  原因：${err}\n` +
      `  处置：核对 CBB_GUARD_ROOT 是否指向真实项目根（当前归一值 ${ROOT}），且决策账须可追加\n`);
    process.exit(2);
  }
  process.exit(0);
}

// ---- 拦 A：冻结线 ----
const isBash = tool === "bash";
// 清理动词的识别（0.1.1 修 G-1）。原式 /(rm|del|rmdir|rd|move|ren|erase)\b/ 只锚**词尾**，
// 词首不设界 ⇒ record / third / guard / platform / warm / standard / confirm 这些以 rm|rd|del
// 收尾的普通英文词全命中；只要同一条命令里还提到 迷深实战-*，就被当成"清理冻结线"拦掉。
// 实测（13 例夹具）：误伤 6／漏拦 0——连"测这道门自身的脚本"都因为出现 cbb-guard 一词被拦。
// 现改两条：① 动词必须是**独立词**（前后都不接单词字符），② 真删除的 API 写法单独认。
const RM_WORD = /(?<![\w.~-])(?:rm|rmdir|del|erase|rd|move|ren|mv|unlink)(?![\w-])/i;
const RM_API = /\b(?:os\.(?:remove|unlink|replace|rename)|shutil\.(?:rmtree|move|remove)|fs\.(?:unlinkSync|unlink|rmSync|rm|rename)|Remove-Item)\b/i;
const FROZEN_NAME = /迷深实战-(本体库|工作区|工单|发车件|build-state)/i;

const rmHit = cmd.match(RM_WORD) || cmd.match(RM_API);
const frozenHit = cmd.match(FROZEN_NAME);
if (isBash && rmHit && frozenHit) {
  const from = Math.max(0, rmHit.index - 14);
  deny("冻结线清理/移动操作（迷深实战-* 为资料档，原位保全）",
    "拦A/bash", `动词「${rmHit[0]}」于 …${cmd.slice(from, rmHit.index + rmHit[0].length + 14)}… × 冻结名「${frozenHit[0]}」`);
}
if ((tool === "write" || tool === "edit" || tool === "multiedit") && isFrozen(fp)) {
  const exists = fs.existsSync(rawPath) || fs.existsSync(fp);
  if (exists) {
    deny(`冻结线文件覆盖（${fp.slice(ROOT.length)}）——迷深实战线已冻结为资料档（原位保全），新建文件不受限`,
      "拦A/write", `路径落在冻结清单内且文件已存在`);
  }
  // 新文件：允许（additive）
}

// ---- 拦 B：红区 Write 整体覆盖 ----
if (tool === "write" && isRedzoneWrite(fp)) {
  deny(`红区文件 Write 整体覆盖（${fp.slice(ROOT.length)}）——契约/在案工单/决策账只许追加段（Edit）与账引用旁通`,
    "拦B/write", `路径前缀命中红区清单`);
}

process.exit(0);
