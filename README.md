# cbb-marketplace

CBB 本地插件市场。当前收录：

| 插件 | 说明 |
|---|---|
| `cbb-guard` | CBB 守门插件 v0.1.3：冻结线原位保全（覆盖即拦，含裸名 `BUILD-STATE.md`）、红区文件 Write 拦截、旁通须留痕且可绑定到具体目标；三条中文命令（批次自检/状态报告/覆盖复算）。路径可移植（env `CBB_GUARD_ROOT`），**ZCode／Qoder／Claude 三方言钩子随仓附**。 |

## 安装（ZCode）

1. **Settings → Plugin Management → Discover → `+`** 加本仓为市场源，填 `master666-max/cbb-marketplace`
   （或整条 `https://github.com/master666-max/cbb-marketplace`；亦支持 Git URL / 本地目录 / 文件）；
2. 在列表里安装 **`cbb-guard`**（完整身份 `cbb-guard@cbb-local`），**新会话生效**；
3. 换机器/换项目根：设 env `CBB_GUARD_ROOT=<项目根>`（不带尾斜杠亦可）。
   **不设且根路径不在本机时，这道门整体静默失效**（它找不到要护的东西）——v0.1.1 起此时若设了旁通会打一行警告。
4. 若在反代/受限网络下拉取失败（`RPC failed` / `timed out` / `early EOF`）：设 `ZCODE_HTTP_PROXY=http://host:port`
   ——ZCode 只读这个变量，裸 `http_proxy` 不生效。

## 装到非 ZCode 宿主（Qoder／Claude Code）

钩子条目是**宿主方言**，不通用；方言不合时宿主根本不派发，**门既不执行也不报错，与从来没装过完全同形**。
0.1.3 起仓里直接给齐：

| 宿主 | 清单目录 | 钩子文件 | 字段差异 |
|---|---|---|---|
| ZCode | `.zcode-plugin/` | `hooks/hooks.json` | `type:"process"`、`timeoutMs`（毫秒）、`${ZCODE_PLUGIN_ROOT}` |
| Qoder | `.qoder-plugin/` | `hooks/hooks.qoder.json` | `type:"command"`、`timeout`（秒）、`${QODER_PLUGIN_ROOT}`、`async:false` |
| Claude Code | `.claude-plugin/` | `hooks/hooks.qoder.json` 同形态 | 根变量换成 `${CLAUDE_PLUGIN_ROOT}` |

Qoder 无"添加市场源"的图形入口、也没有用户级技能目录 ⇒ 按本地插件位直装：
`<宿主配置目录>/plugins/cache/<source>/cbb-guard/<version>/`（**目录末段必须等于 version**），
清单取 `.qoder-plugin/plugin.json`，并**把 `hooks/hooks.qoder.json` 复制为该安装位里的 `hooks/hooks.json`**
（宿主按这个文件名读），`settings.json#enabledPlugins` 里置 `true`，重启后新会话生效。

## 验证（正负对照；**装完必做，不是排障手段**）

- **在宿主里**拿一个已存在的冻结件发 Write → 应拦（exit 2，回执带 `命中：…`）；
- 覆盖裸名 `BUILD-STATE.md` → 应拦（v0.1.3 起；装了旧版这条会放过，可用来验版本）；
- 新路径发 Write → 应放（exit 0）；
- 设 `CBB_HOOK_BYPASS='<目标前缀>=<裁定引用>'` 后：该前缀下的越权→放且入账，前缀外的越权→仍拦；
- 决策账写不进去时设旁通 → 应拒绝放行（无留痕不越权）；
- 排查加 `CBB_GUARD_DEBUG=1`（打 ROOT/命中内部值）；
- 改这道门必跑回归夹具：`node cbb-guard/tests/guard-suites.mjs` ⇒ **42/42**。
  基线对照（证明夹具真有鉴别力）：`git show fccc5c6:cbb-guard/hooks/guard.mjs > g012.mjs && node cbb-guard/tests/guard-suites.mjs g012.mjs` ⇒ 41/42，唯一不符项就是裸名 BUILD-STATE。

> 前两发（宿主内的冻结覆盖、裸名 BUILD-STATE 覆盖）**没拦住就是没装上**，别接着干活。
