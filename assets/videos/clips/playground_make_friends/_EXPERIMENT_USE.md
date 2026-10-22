# ⭐ 实验用素材 — 操场 · 交朋友

本目录是 **CHI2027 exploratory study 正式使用的 4 组素材之一**。

## 实验范围（2026-10-01 evaluation plan v1）

- **两个话题**：交朋友（make_friends）、加入活动（join_activity）
- **干预场景**：教室（classroom）、操场（playground）
- park / cafeteria 两个场景留给 quiz（pre-quiz=公园，post-quiz=食堂），干预时不用
- comfort_friend 话题不在本次实验范围内

> 原先用文件夹名加 `*` 前缀做标记，但 `clips.js` 里引用的是不带星号的路径，
> 会导致整组素材加载不出来。已于 2026-10-19 去掉星号，改用本文件做标记。

## 本组素材状态

7 个片段（1 context + 3 组 action/reaction）全部带音轨 ✅

| 片段 | 说明 |
|---|---|
| `context_sam-plays_alex-watches.mp4` | context，2026-10-19 补音轨 |
| `action_b-wait_alex-stays-back.mp4` | action b（无对白选项），2026-10-19 补音轨 |
| `reaction_b-wait_sam-plays-alone.mp4` | reaction b（无对白选项），2026-10-19 补音轨 |
| a / c 选项共 4 个 | 原始素材，自带中文对白 |

`*_noaudio.mp4` 是补音轨前的原始无声版本，代码不引用，留作备份。

## 待办

- [ ] d 选项（"求助"）：本组还缺 `action_d` + `reaction_d`，画面和音频都要从零生成，
      内容设计（Alex 怎么求助、Sam 怎么反应）待定。

## 修订记录

- 2026-10-20：`action_a-approach_alex-waves-hello.mp4` 重新生成（Veo 3.1，首帧=原 action_a 首帧，尾帧=reaction_a 首帧）。
  原版是女孩 Sam 的嘴形+女声在说「你好！我可以和你一起玩吗？」，新版改为男孩 Alex 说；3 秒后音轨静音（去掉 Sam 的笑声）。
  原版备份为 `action_a-approach_alex-waves-hello_girlvoice.mp4`（代码不引用）。AOI 已重算。

- 2026-10-21：`action_d-eager_alex-too-eager.mp4` 重新生成——原版只是热情，看不出问题；新版 Alex 冲到 Sam 面前大声嚷「我也要…快点快点，我们现在就一起…！」，Sam 往后躲（不抢、不撞倒东西）。原版备份为 `action_d-eager_alex-too-eager_v1.mp4`。
