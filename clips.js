/* Curated scenario clip manifest, shared by the PRR app (index.html) and the
   passive video-modeling baseline (baseline.html). index.html also merges
   cases authored in the expert studio into CLIPS at load. */
export const CB = 'assets/videos/clips/';
export const CLIPS = {
  park_make_friends: {
    context: CB + 'park_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: '走过去打招呼', action: CB + 'park_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'park_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: '站着看',   action: CB + 'park_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'park_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: '直接把玩具拿走',   action: CB + 'park_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'park_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
    },
  },
  park_join_activity: {
    context: CB + 'park_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: '问可不可以加入',   action: CB + 'park_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'park_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: '站在旁边，太紧张不敢加入', action: CB + 'park_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'park_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: '直接挤进去自己玩',     action: CB + 'park_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'park_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
    },
  },
  playground_make_friends: {
    context: CB + 'playground_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: '走过去打招呼', action: CB + 'playground_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'playground_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: '站着看',   action: CB + 'playground_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'playground_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: '直接把玩具拿走',   action: CB + 'playground_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'playground_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
      d: { label: '冲过去，凑得很近，大声说要一起玩', action: CB + 'playground_make_friends/action_d-eager_alex-too-eager.mp4',   reaction: CB + 'playground_make_friends/reaction_d-eager_sam-taken-aback.mp4' },
    },
  },
  playground_join_activity: {
    context: CB + 'playground_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: '问可不可以加入',   action: CB + 'playground_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'playground_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: '站在旁边，太紧张不敢加入', action: CB + 'playground_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'playground_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: '直接挤进去自己玩',     action: CB + 'playground_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'playground_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
      d: { label: '冲过去，凑得很近，大声说要一起玩',     action: CB + 'playground_join_activity/action_d-eager_alex-too-eager.mp4',  reaction: CB + 'playground_join_activity/reaction_d-eager_sam-taken-aback.mp4' },
    },
  },
  classroom_make_friends: {
    context: CB + 'classroom_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: '走过去打招呼', action: CB + 'classroom_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'classroom_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: '站着看',   action: CB + 'classroom_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'classroom_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: '直接把玩具拿走',   action: CB + 'classroom_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'classroom_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
      d: { label: '冲过去，凑得很近，大声说要一起玩', action: CB + 'classroom_make_friends/action_d-eager_alex-too-eager.mp4',   reaction: CB + 'classroom_make_friends/reaction_d-eager_sam-taken-aback.mp4' },
    },
  },
  classroom_join_activity: {
    context: CB + 'classroom_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: '问可不可以加入',   action: CB + 'classroom_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'classroom_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: '站在旁边，太紧张不敢加入', action: CB + 'classroom_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'classroom_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: '直接挤进去自己玩',     action: CB + 'classroom_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'classroom_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
      d: { label: '冲过去，凑得很近，大声说要一起玩',     action: CB + 'classroom_join_activity/action_d-eager_alex-too-eager.mp4',  reaction: CB + 'classroom_join_activity/reaction_d-eager_sam-taken-aback.mp4' },
    },
  },
  cafeteria_make_friends: {
    context: CB + 'cafeteria_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: '走过去打招呼', action: CB + 'cafeteria_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'cafeteria_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: '站着看',   action: CB + 'cafeteria_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'cafeteria_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: '直接把玩具拿走',   action: CB + 'cafeteria_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'cafeteria_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
    },
  },
  cafeteria_join_activity: {
    context: CB + 'cafeteria_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: '问可不可以加入',   action: CB + 'cafeteria_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'cafeteria_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: '站在旁边，太紧张不敢加入', action: CB + 'cafeteria_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'cafeteria_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: '直接挤进去自己玩',     action: CB + 'cafeteria_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'cafeteria_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
    },
  },
  park_comfort_friend: {
    context: CB + 'park_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: '安慰她',   action: CB + 'park_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'park_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: '讲个笑话', action: CB + 'park_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'park_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: '走开',     action: CB + 'park_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'park_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
  playground_comfort_friend: {
    context: CB + 'playground_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: '安慰她',   action: CB + 'playground_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'playground_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: '讲个笑话', action: CB + 'playground_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'playground_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: '走开',     action: CB + 'playground_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'playground_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
  classroom_comfort_friend: {
    context: CB + 'classroom_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: '安慰她',     action: CB + 'classroom_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'classroom_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: '讲个笑话',   action: CB + 'classroom_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'classroom_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: '走开',       action: CB + 'classroom_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'classroom_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
  cafeteria_comfort_friend: {
    context: CB + 'cafeteria_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: '安慰她',     action: CB + 'cafeteria_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'cafeteria_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: '讲个笑话',   action: CB + 'cafeteria_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'cafeteria_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: '走开',       action: CB + 'cafeteria_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'cafeteria_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
};

/* Clips get re-rendered in place (same file names), and the study server sends
   no Cache-Control, so a browser that saw the old silent files can keep them for
   days. Bump CLIP_V whenever clips are replaced. */
export const CLIP_V = '20261021b';
for (const c of Object.values(CLIPS)) {
  if (c.context) c.context += `?v=${CLIP_V}`;
  for (const o of Object.values(c.options)) { o.action += `?v=${CLIP_V}`; o.reaction += `?v=${CLIP_V}`; }
}
