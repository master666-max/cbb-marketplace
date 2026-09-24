# cbb-marketplace

CBB 本地插件市场。当前收录：

| 插件 | 说明 |
|---|---|
| `cbb-guard` | CBB 守门插件 v0.1.0：冻结线原位保全（覆盖即拦）、红区文件 Write 拦截、决策账引用旁通；三条中文命令（批次自检/状态报告/覆盖复算）。路径可移植（env `CBB_GUARD_ROOT`）。 |

## 安装（ZCode）

1. **Settings → Plugin Management → Discover → `+`** 加本仓为市场源，填 `master666-max/cbb-marketplace`
   （或整条 `https://github.com/master666-max/cbb-marketplace`；亦支持 Git URL / 本地目录 / 文件）；
2. 在列表里安装 **`cbb-guard`**（完整身份 `cbb-guard@cbb-local`），**新会话生效**；
3. 换机器/换项目根：设 env `CBB_GUARD_ROOT=<项目根>`（不带尾斜杠亦可）。
4. 若在反代/受限网络下拉取失败（`RPC failed` / `timed out` / `early EOF`）：设 `ZCODE_HTTP_PROXY=http://host:port`
   ——ZCode 只读这个变量，裸 `http_proxy` 不生效。

## 验证（两发正负对照）

- 已存在的冻结件路径发 Write → 应拦（exit 2）；
- 新路径发 Write → 应放（exit 0）；
- 排查加 `CBB_GUARD_DEBUG=1`。
