# 食堂 · 交朋友（`cafeteria_make_friends`）

> 自动整理于 2026-10-18。扫描本目录下所有 `.mp4`。

**实验用途**：📋 **quiz 场景**（post-quiz 用；干预时不用这个场景）

## 片段结构

每个 (场景, 话题) 下是 **1 个 context + 3 组 action/reaction**。孩子看完 context 后选一个 action，
系统播放对应的 action 片段，孩子预测 Sam 的反应，然后播放对应的 reaction 片段。

## 清单

| 文件 | 角色 | 内容 | 时长 | 音轨 |
|---|---|---|---|---|
| `context_sam-plays_alex-watches.mp4` | context | 情境铺垫（无对白） | 8.0s | ✅ |
| `action_a-approach_alex-waves-hello.mp4` | action **a**「主动打招呼」 | Alex 走过去挥手打招呼 | 2.3s | ✅ |
| `reaction_a-approach_sam-waves-back.mp4` | reaction **a** | Sam 开心地挥手回应 | 5.8s | ✅ |
| `action_b-wait_alex-stays-back.mp4` | action **b**「在旁边等」 | Alex 站在一旁犹豫，不过去（无对白） | 4.0s | ❌ **缺** |
| `reaction_b-wait_sam-plays-alone.mp4` | reaction **b** | Sam 继续自己玩，没注意到（无对白） | 4.0s | ❌ **缺** |
| `action_c-grab_alex-grabs-toy.mp4` | action **c**「直接抢玩具」 | Alex 冲过去抢走玩具 | 2.1s | ✅ |
| `reaction_c-grab_sam-takes-toy-back.mp4` | reaction **c** | Sam 惊讶，把玩具拿回来走开 | 6.0s | ✅ |

## 缺音轨的片段

- [ ] `action_b-wait_alex-stays-back.mp4`
- [ ] `reaction_b-wait_sam-plays-alone.mp4`

补音轨做法见 `VideoASD/2026-08-20_context_audio_regen_todo.md`（Veo 3.1 首尾帧插值，画面接近原片，只补环境音、不要对白/音乐）。
