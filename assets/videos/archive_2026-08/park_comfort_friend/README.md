# 公园 · 安慰朋友（`park_comfort_friend`）

> 自动整理于 2026-10-18。扫描本目录下所有 `.mp4`。

**实验用途**：❌ **不在本次实验范围内**（实验只用「交朋友」和「加入活动」两个话题）

## 片段结构

每个 (场景, 话题) 下是 **1 个 context + 3 组 action/reaction**。孩子看完 context 后选一个 action，
系统播放对应的 action 片段，孩子预测 Sam 的反应，然后播放对应的 reaction 片段。

## 清单

| 文件 | 角色 | 内容 | 时长 | 音轨 |
|---|---|---|---|---|
| `context_sam-sad_alex-notices.mp4` | context | 情境铺垫（无对白） | 8.0s | ❌ **缺** |
| `context_sam-sad_alex-notices_REGEN.mp4` | context | 情境铺垫（无对白） | 8.0s | ✅ |
| `action_a-comfort_alex-comforts.mp4` | action **a**「安慰她」 | Alex 坐到旁边，轻拍她的肩膀 | 4.1s | ✅ |
| `reaction_a-comfort_sam-feels-better.mp4` | reaction **a** | Sam 抬头露出感激的微笑，好一点了 | 4.0s | ✅ |
| `action_b-joke_alex-makes-face.mp4` | action **b**「讲个笑话」 | Alex 做鬼脸逗她开心 | 3.1s | ✅ |
| `action_b-joke_alex-makes-face_batch-20260807.mp4` | action **b**「讲个笑话」 ⚠️重复/旧版 | Alex 做鬼脸逗她开心 | 2.2s | ✅ |
| `reaction_b-joke_sam-half-smiles_batch-20260807.mp4` | reaction **b** | Sam 勉强笑了一下，但还是有点低落 | 5.9s | ✅ |
| `reaction_b-joke_sam-laughs.mp4` | reaction **b** | Sam 勉强笑了一下，但还是有点低落 | 5.0s | ✅ |
| `action_c-ignore_alex-walks-away.mp4` | action **c**「走开」 | Alex 看了一眼，耸耸肩走开（无对白） | 8.0s | ✅ |
| `reaction_c-ignore_sam-stays-alone.mp4` | reaction **c** | Sam 一个人安静坐着（无对白） | 5.6s | ❌ **缺** |

## 缺音轨的片段

- [ ] `context_sam-sad_alex-notices.mp4`
- [ ] `reaction_c-ignore_sam-stays-alone.mp4`

补音轨做法见 `VideoASD/2026-08-20_context_audio_regen_todo.md`（Veo 3.1 首尾帧插值，画面接近原片，只补环境音、不要对白/音乐）。
