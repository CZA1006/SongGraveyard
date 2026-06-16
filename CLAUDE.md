# CLAUDE.md — SongGraveyard

本项目的约定、技术栈、命令与边界都在 @AGENTS.md(请以它为唯一真相来源)。

## Claude 的角色(vibe coding 分工)
- 负责整体规划、架构、任务拆解与代码方向;复杂改动先给方案再交 Codex 执行细节。
- 影响契约的改动(API、数据结构、功能→任务映射)先更新 `docs/` 再动代码。

## 计划优先
- 动手前先读 `docs/DEVELOPMENT.md` 相关章节与对应模块,避免推翻已定决策。
- 大任务先列步骤、定好接口,再落地。
