# 食堂 · 加入活动（`cafeteria_join_activity`）

> 自动整理于 2026-10-18。扫描本目录下所有 `.mp4`。

**实验用途**：📋 **quiz 场景**（post-quiz 用；干预时不用这个场景）

## 片段结构

每个 (场景, 话题) 下是 **1 个 context + 3 组 action/reaction**。孩子看完 context 后选一个 action，
系统播放对应的 action 片段，孩子预测 Sam 的反应，然后播放对应的 reaction 片段。

## 清单

| 文件 | 角色 | 内容 | 时长 | 音轨 |
|---|---|---|---|---|
| `context_sam-builds_alex-watches.mp4` | context | 情境铺垫（无对白） | 8.0s | ✅ |
| `action_a-ask_alex-asks-join.mp4` | action **a**「开口请求加入」 | Alex 走近，指着积木开口问能不能一起玩 | 2.0s | ✅ |
| `reaction_a-ask_sam-happy-welcomes.mp4` | reaction **a** | Sam 开心点头，让出位置 | 6.1s | ✅ |
| `action_b-watch_alex-hesitates.mp4` | action **b**「在旁边观望」 | Alex 站在一旁害羞地看着，不过去（无对白） | 3.1s | ❌ **缺** |
| `reaction_b-watch_sam-plays-alone.mp4` | reaction **b** | Sam 继续自己搭，没注意到（无对白） | 5.0s | ❌ **缺** |
| `action_c-barge_alex-takes-over.mp4` | action **c**「直接插手接管」 | Alex 挤进去直接接管积木 | 1.7s | ✅ |
| `reaction_c-barge_sam-surprised-moves-away.mp4` | reaction **c** | Sam 惊讶，收拾东西去别处玩 | 6.4s | ✅ |

## 缺音轨的片段

- [ ] `action_b-watch_alex-hesitates.mp4`
- [ ] `reaction_b-watch_sam-plays-alone.mp4`

补音轨做法见 `VideoASD/2026-08-20_context_audio_regen_todo.md`（Veo 3.1 首尾帧插值，画面接近原片，只补环境音、不要对白/音乐）。
