import { supabase } from './supabase'
import type { Draft, FeedWorkout, Friend, FriendRequest, LeaderRow, Metric, PastWorkout, Profile, ProfileStats, Template, TemplateExercise } from './types'

const WEEK = 7 * 24 * 3600 * 1000

export async function getProfile(id: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single()
  if (error) throw error
  return data as Profile
}

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const [w, streak] = await Promise.all([
    supabase
      .from('workouts')
      .select('created_at,workout_exercises(name,workout_sets(lbs,reps,done))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(300),
    supabase.rpc('current_streak', { uid: userId }),
  ])
  type Row = { created_at: string; workout_exercises: { name: string; workout_sets: { lbs: number; reps: number; done: boolean }[] }[] }
  const rows = (w.data ?? []) as Row[]
  const best = new Map<string, { lbs: number; date: string }>()
  const weeklyBench = Array<number>(7).fill(0)

  for (const row of rows) {
    const age = Math.floor((Date.now() - new Date(row.created_at).getTime()) / WEEK)
    for (const ex of row.workout_exercises) {
      for (const set of ex.workout_sets) {
        if (!set.done) continue
        const lbs = Number(set.lbs)
        const current = best.get(ex.name)
        if (!current || lbs > current.lbs) best.set(ex.name, { lbs, date: row.created_at })
        if (/bench/i.test(ex.name) && age < 7) weeklyBench[6 - age] += lbs * set.reps
      }
    }
  }
  const records = [...best.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.lbs - a.lbs)
  return { workouts: rows.length, streak: (streak.data as number | null) ?? 0, records, weeklyBench }
}

export async function getFeed(): Promise<FeedWorkout[]> {
  const { data } = await supabase
    .from('workouts')
    .select(
      'id,name,tag,created_at,user_id,profiles(display_name),workout_exercises(position,name,workout_sets(lbs,reps,done)),likes(user_id),comments(count)',
    )
    .order('created_at', { ascending: false })
    .limit(30)
  return (data ?? []) as unknown as FeedWorkout[]
}

// Rafraîchit le feed quand une séance, un like ou un commentaire change chez quelqu'un
export function subscribeFeed(onChange: () => void): () => void {
  let timer: ReturnType<typeof setTimeout>
  const notify = () => {
    clearTimeout(timer)
    timer = setTimeout(onChange, 400)
  }
  const channel = supabase.channel('feed-live')
  for (const table of ['workouts', 'likes', 'comments']) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table }, notify)
  }
  channel.subscribe()
  return () => {
    clearTimeout(timer)
    supabase.removeChannel(channel)
  }
}

export async function setLike(workoutId: string, userId: string, liked: boolean) {
  const q = supabase.from('likes')
  const { error } = liked
    ? await q.insert({ workout_id: workoutId })
    : await q.delete().eq('workout_id', workoutId).eq('user_id', userId)
  if (error) throw error
}

export async function addComment(workoutId: string, body: string) {
  const { error } = await supabase.from('comments').insert({ workout_id: workoutId, body: body.slice(0, 500) })
  if (error) throw error
}

export async function getFriends(me: string): Promise<{ friends: Friend[]; requests: FriendRequest[] }> {
  const [rel, streaks] = await Promise.all([
    supabase
      .from('friendships')
      .select('id,status,requester_id,addressee_id,requester:profiles!requester_id(id,display_name),addressee:profiles!addressee_id(id,display_name)'),
    supabase.rpc('leaderboard', { metric: 'streak' }),
  ])
  const streakOf = new Map<string, number>(((streaks.data ?? []) as LeaderRow[]).map((r) => [r.user_id, Number(r.value)]))
  const friends: Friend[] = []
  const requests: FriendRequest[] = []

  type Rel = { id: number; status: string; requester_id: string; addressee_id: string; requester: Profile; addressee: Profile }
  for (const r of (rel.data ?? []) as unknown as Rel[]) {
    const other = r.requester_id === me ? r.addressee : r.requester
    if (r.status === 'accepted') friends.push({ id: other.id, name: other.display_name, streak: streakOf.get(other.id) ?? 0 })
    else requests.push({ id: r.id, name: other.display_name, incoming: r.addressee_id === me })
  }

  if (friends.length) {
    const { data } = await supabase
      .from('workouts')
      .select('user_id,name,created_at')
      .in('user_id', friends.map((f) => f.id))
      .order('created_at', { ascending: false })
      .limit(100)
    const last = new Map<string, { name: string; created_at: string }>()
    for (const w of (data ?? []) as { user_id: string; name: string; created_at: string }[]) {
      if (!last.has(w.user_id)) last.set(w.user_id, w)
    }
    for (const f of friends) f.last = last.get(f.id)
  }
  return { friends, requests }
}

export async function findProfile(query: string, excludeId: string): Promise<Profile | null> {
  const q = query.replace(/[,()%]/g, '').trim()
  if (!q) return null
  const { data } = await supabase
    .from('profiles')
    .select('id,display_name,username')
    .or(`username.ilike.${q},display_name.ilike.${q}`)
    .neq('id', excludeId)
    .limit(1)
  return (data?.[0] as Profile | undefined) ?? null
}

export async function sendFriendRequest(me: string, other: string) {
  const { error } = await supabase.from('friendships').insert({ requester_id: me, addressee_id: other })
  if (error) throw error
}

export async function acceptFriendRequest(id: number) {
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', id)
  if (error) throw error
}

export async function getLeaderboard(metric: Metric): Promise<LeaderRow[]> {
  const { data } = await supabase.rpc('leaderboard', { metric })
  return ((data ?? []) as LeaderRow[]).map((r) => ({ ...r, value: Number(r.value) }))
}

export async function saveWorkout(draft: Draft) {
  const { error } = await supabase.rpc('save_workout', {
    p_name: draft.name,
    p_tag: 'Strength',
    p_duration: Math.floor((Date.now() - draft.start) / 1000),
    p_exercises: draft.exercises.map((e) => ({
      name: e.name,
      equipment: e.equipment,
      sets: e.sets.map((s) => ({ lbs: s.w, reps: s.r, done: s.d })),
    })),
  })
  if (error) throw error
}

// Mes séances enregistrées + celles que mes amis ont partagées (le filtrage est fait par la base)
export async function getTemplates(): Promise<Template[]> {
  const { data } = await supabase
    .from('workout_templates')
    .select('id,user_id,name,exercises,is_shared,created_at,profiles(display_name)')
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as Template[]
}

export function saveTemplate(draft: Draft) {
  return saveTemplateFrom(
    draft.name,
    draft.exercises.map((e) => ({ name: e.name, equipment: e.equipment, sets: e.sets.map((s) => ({ lbs: s.w, reps: s.r })) })),
  )
}

export async function saveTemplateFrom(name: string, exercises: TemplateExercise[]) {
  const { error } = await supabase.from('workout_templates').insert({ name: name.trim() || 'Workout', exercises })
  if (error) throw error
}

// Mes dernières séances terminées (séries faites uniquement), prêtes à être refaites ou enregistrées
export async function getRecentWorkouts(userId: string): Promise<PastWorkout[]> {
  const { data } = await supabase
    .from('workouts')
    .select('id,name,created_at,workout_exercises(position,name,equipment,workout_sets(set_number,lbs,reps,done))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  type Row = {
    id: string
    name: string
    created_at: string
    workout_exercises: {
      position: number
      name: string
      equipment: string
      workout_sets: { set_number: number; lbs: number; reps: number; done: boolean }[]
    }[]
  }
  return ((data ?? []) as unknown as Row[])
    .map((w) => ({
      id: w.id,
      name: w.name,
      created_at: w.created_at,
      exercises: [...w.workout_exercises]
        .sort((a, b) => a.position - b.position)
        .flatMap((e) => {
          const sets = e.workout_sets
            .filter((s) => s.done)
            .sort((a, b) => a.set_number - b.set_number)
            .map((s) => ({ lbs: Number(s.lbs), reps: s.reps }))
          return sets.length ? [{ name: e.name, equipment: e.equipment, sets }] : []
        }),
    }))
    .filter((w) => w.exercises.length > 0)
}

export async function setTemplateShared(id: string, shared: boolean) {
  const { error } = await supabase.from('workout_templates').update({ is_shared: shared }).eq('id', id)
  if (error) throw error
}

export async function deleteTemplate(id: string) {
  const { error } = await supabase.from('workout_templates').delete().eq('id', id)
  if (error) throw error
}
