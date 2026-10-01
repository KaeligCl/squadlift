export type Tab = 'profile' | 'feed' | 'log' | 'friends' | 'ranks'
export type Metric = 'streak' | 'volume' | 'sessions'

export type Profile = { id: string; username: string; display_name: string }

// Brouillon de séance (stocké sur le téléphone tant qu'elle n'est pas terminée)
export type SetEntry = { w: number; r: number; d: boolean }
export type Exercise = { name: string; equipment: string; sets: SetEntry[] }
export type Draft = { name: string; start: number; exercises: Exercise[] }

// Séance telle que renvoyée par Supabase
export type DbSet = { lbs: number; reps: number; done: boolean }
export type FeedWorkout = {
  id: string
  name: string
  tag: string
  created_at: string
  user_id: string
  profiles: { display_name: string } | null
  workout_exercises: { position: number; name: string; workout_sets: DbSet[] }[]
  likes: { user_id: string }[]
  comments: { count: number }[]
}

export type ProfileStats = {
  workouts: number
  streak: number
  records: { name: string; lbs: number; date: string }[]
  weeklyBench: number[]
}
export type Friend = { id: string; name: string; streak: number; last?: { name: string; created_at: string } }
export type FriendRequest = { id: number; name: string; incoming: boolean }
export type LeaderRow = { user_id: string; display_name: string; value: number }

// Séance enregistrée (modèle) pouvant être partagée avec les amis
export type TemplateExercise = { name: string; equipment: string; sets: { lbs: number; reps: number }[] }
export type Template = {
  id: string
  user_id: string
  name: string
  exercises: TemplateExercise[]
  is_shared: boolean
  created_at: string
  profiles: { display_name: string } | null
}
