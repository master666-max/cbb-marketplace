# cbb-marketplace

CBB 本地插件市场。当前收录：

| 插件 | 说明 |
|---|---|
| `cbb-guard` | CBB 守门插件 v0.1.1：冻结线原位保全（覆盖即拦）、红区文件 Write 拦截、旁通须留痕且可绑定到具体目标；三条中文命令（批次自检/状态报告/覆盖复算）。路径可移植（env `CBB_GUARD_ROOT`）。 |

## 安装（ZCode）

1. **Settings → Plugin Management → Discover → `+`** 加本仓为市场源，填 `master666-max/cbb-marketplace`
   （或整条 `https://github.com/master666-max/cbb-marketplace`；亦支持 Git URL / 本地目录 / 文件）；
2. 在列表里安装 **`cbb-guard`**（完整身份 `cbb-guard@cbb-local`），**新会话生效**；
3. 换机器/换项目根：设 env `CBB_GUARD_ROOT=<项目根>`（不带尾斜杠亦可）。
   **不设且根路径不在本机时，这道门整体静默失效**（它找不到要护的东西）——v0.1.1 起此时若设了旁通会打一行警告。
4. 若在反代/受限网络下拉取失败（`RPC failed` / `timed out` / `early EOF`）：设 `ZCODE_HTTP_PROXY=http://host:port`
   ——ZCode 只读这个变量，裸 `http_proxy` 不生效。

> 非 ZCode 宿主（如 Qoder）没有"添加市场源"的图形入口，也没有用户级技能目录：
> 插件要按宿主的本地插件位直装（`<宿主配置目录>/plugins/cache/<source>/<name>/<version>/`，
> 清单目录名 `.qoder-plugin/`，钩子字段用 `type:"command"`＋`timeout`（秒）＋`${QODER_PLUGIN_ROOT}`）。

## 验证（正负对照）

- 已存在的冻结件路径发 Write → 应拦（exit 2）；
- 新路径发 Write → 应放（exit 0）；
- 设 `CBB_HOOK_BYPASS='<目标前缀>=<裁定引用>'` 后：该前缀下的越权→放且入账，前缀外的越权→仍拦；
- 决策账写不进去时设旁通 → 应拒绝放行（无留痕不越权）；
- 排查加 `CBB_GUARD_DEBUG=1`（打 ROOT/命中内部值），拦截回执本身带 `命中：<规则> · <片段>`。
