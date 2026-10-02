/* Curated scenario clip manifest, shared by the PRR app (index.html) and the
   passive video-modeling baseline (baseline.html). index.html also merges
   cases authored in the expert studio into CLIPS at load. */
export const CB = 'assets/videos/clips/';
export const CLIPS = {
  park_make_friends: {
    context: CB + 'park_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: 'Walk over and say hi', action: CB + 'park_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'park_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: 'Stand and watch',   action: CB + 'park_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'park_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: 'Just take the toy',   action: CB + 'park_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'park_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
    },
  },
  park_join_activity: {
    context: CB + 'park_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: 'Ask to join in',   action: CB + 'park_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'park_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: 'Stand back, too nervous to join', action: CB + 'park_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'park_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: 'Push in and play alone',     action: CB + 'park_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'park_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
    },
  },
  playground_make_friends: {
    context: CB + 'playground_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: 'Walk over and say hi', action: CB + 'playground_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'playground_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: 'Stand and watch',   action: CB + 'playground_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'playground_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: 'Just take the toy',   action: CB + 'playground_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'playground_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
    },
  },
  playground_join_activity: {
    context: CB + 'playground_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: 'Ask to join in',   action: CB + 'playground_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'playground_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: 'Stand back, too nervous to join', action: CB + 'playground_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'playground_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: 'Push in and play alone',     action: CB + 'playground_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'playground_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
    },
  },
  classroom_make_friends: {
    context: CB + 'classroom_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: 'Walk over and say hi', action: CB + 'classroom_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'classroom_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: 'Stand and watch',   action: CB + 'classroom_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'classroom_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: 'Just take the toy',   action: CB + 'classroom_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'classroom_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
    },
  },
  classroom_join_activity: {
    context: CB + 'classroom_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: 'Ask to join in',   action: CB + 'classroom_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'classroom_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: 'Stand back, too nervous to join', action: CB + 'classroom_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'classroom_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: 'Push in and play alone',     action: CB + 'classroom_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'classroom_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
    },
  },
  cafeteria_make_friends: {
    context: CB + 'cafeteria_make_friends/context_sam-plays_alex-watches.mp4',
    options: {
      a: { label: 'Walk over and say hi', action: CB + 'cafeteria_make_friends/action_a-approach_alex-waves-hello.mp4', reaction: CB + 'cafeteria_make_friends/reaction_a-approach_sam-waves-back.mp4' },
      b: { label: 'Stand and watch',   action: CB + 'cafeteria_make_friends/action_b-wait_alex-stays-back.mp4',    reaction: CB + 'cafeteria_make_friends/reaction_b-wait_sam-plays-alone.mp4' },
      c: { label: 'Just take the toy',   action: CB + 'cafeteria_make_friends/action_c-grab_alex-grabs-toy.mp4',     reaction: CB + 'cafeteria_make_friends/reaction_c-grab_sam-takes-toy-back.mp4' },
    },
  },
  cafeteria_join_activity: {
    context: CB + 'cafeteria_join_activity/context_sam-builds_alex-watches.mp4',
    options: {
      a: { label: 'Ask to join in',   action: CB + 'cafeteria_join_activity/action_a-ask_alex-asks-join.mp4',    reaction: CB + 'cafeteria_join_activity/reaction_a-ask_sam-happy-welcomes.mp4' },
      b: { label: 'Stand back, too nervous to join', action: CB + 'cafeteria_join_activity/action_b-watch_alex-hesitates.mp4',  reaction: CB + 'cafeteria_join_activity/reaction_b-watch_sam-plays-alone.mp4' },
      c: { label: 'Push in and play alone',     action: CB + 'cafeteria_join_activity/action_c-barge_alex-takes-over.mp4', reaction: CB + 'cafeteria_join_activity/reaction_c-barge_sam-surprised-moves-away.mp4' },
    },
  },
  park_comfort_friend: {
    context: CB + 'park_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: 'Comfort her',   action: CB + 'park_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'park_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: 'Tell a joke', action: CB + 'park_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'park_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: 'Walk away',     action: CB + 'park_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'park_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
  playground_comfort_friend: {
    context: CB + 'playground_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: 'Comfort her',   action: CB + 'playground_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'playground_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: 'Tell a joke', action: CB + 'playground_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'playground_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: 'Walk away',     action: CB + 'playground_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'playground_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
  classroom_comfort_friend: {
    context: CB + 'classroom_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: 'Comfort her',     action: CB + 'classroom_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'classroom_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: 'Tell a joke',   action: CB + 'classroom_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'classroom_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: 'Walk away',       action: CB + 'classroom_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'classroom_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
  cafeteria_comfort_friend: {
    context: CB + 'cafeteria_comfort_friend/context_sam-sad_alex-notices.mp4',
    options: {
      a: { label: 'Comfort her',     action: CB + 'cafeteria_comfort_friend/action_a-comfort_alex-comforts.mp4',  reaction: CB + 'cafeteria_comfort_friend/reaction_a-comfort_sam-feels-better.mp4' },
      b: { label: 'Tell a joke',   action: CB + 'cafeteria_comfort_friend/action_b-joke_alex-makes-face.mp4',   reaction: CB + 'cafeteria_comfort_friend/reaction_b-joke_sam-laughs.mp4' },
      c: { label: 'Walk away',       action: CB + 'cafeteria_comfort_friend/action_c-ignore_alex-walks-away.mp4', reaction: CB + 'cafeteria_comfort_friend/reaction_c-ignore_sam-stays-alone.mp4' },
    },
  },
};
