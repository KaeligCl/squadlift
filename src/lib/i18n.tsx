import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'en' | 'fr'
export const LANGS: Lang[] = ['en', 'fr']
const KEY = 'squadlift:lang'

// Les clés avec un suffixe _one / _other sont des pluriels : t('common.day', { n: 3 }) choisit la bonne forme.
const en = {
  'nav.profile': 'Profile', 'nav.feed': 'Feed', 'nav.friends': 'Friends', 'nav.ranks': 'Ranks', 'nav.log': 'Log a workout',

  'common.back': 'Back', 'common.cancel': 'Cancel', 'common.loading': 'Loading…', 'common.addFriend': 'Add friend',
  'common.day_one': '{n} Day', 'common.day_other': '{n} Days',
  'common.exercise_one': '{n} exercise', 'common.exercise_other': '{n} exercises',
  'common.set_one': '{n} set', 'common.set_other': '{n} sets',
  'common.comment_one': '{n} comment', 'common.comment_other': '{n} comments',
  'common.lbs': '{n} lbs',
  'common.couldNotSave': 'Could not save: {msg}',
  'common.exercisePrompt': 'Exercise name?',
  'common.addSet': '+ Add Set', 'common.addExercise': '+ Add Exercise',
  'common.sessionName': 'SESSION NAME', 'common.sessionNameAria': 'Session name',
  'common.hSet': 'SET', 'common.hLbs': 'LBS', 'common.hReps': 'REPS', 'common.hDone': 'DONE',

  'ago.now': 'Just now', 'ago.min': '{n} min ago',
  'ago.hour_one': '{n} hour ago', 'ago.hour_other': '{n} hours ago',
  'ago.day_one': '{n} day ago', 'ago.day_other': '{n} days ago',

  'auth.tagline': 'Log your lifts and compare with your squad.',
  'auth.displayName': 'Display name', 'auth.email': 'Email', 'auth.password': 'Password (6+ characters)',
  'auth.enterCreds': 'Enter your email and password.',
  'auth.checkInbox': 'Check your inbox to confirm your email, then sign in.',
  'auth.createAccount': 'Create account', 'auth.signIn': 'Sign in',
  'auth.haveAccount': 'I already have an account', 'auth.noAccount': 'Create an account',

  'profile.you': 'You', 'profile.language': 'Language', 'profile.signOut': 'Sign out', 'profile.confirmSignOut': 'Sign out?',
  'profile.workouts': 'WORKOUTS', 'profile.streak': 'STREAK', 'profile.prs': 'PRS',
  'profile.records': 'Personal Records', 'profile.noRecords': 'Finish your first session to set records.',
  'profile.benchTrend': 'Bench volume trend', 'profile.vsLastWeek': '{pct}% vs last week',
  'profile.benchAria': 'Bench press volume over the last 7 weeks', 'profile.week': 'W{n}',

  'ranks.title': 'Squad Standings', 'ranks.streak': 'Streak', 'ranks.volume': 'Volume (Lbs)', 'ranks.sessions': 'Sessions', 'ranks.me': '(Me)',

  'feed.title': 'Squad Feed', 'feed.share': 'Share a session with the squad...',
  'feed.likeError': 'Could not update the like.', 'feed.commentPrompt': 'Your comment?', 'feed.commentError': 'Could not post the comment.',
  'feed.someone': 'Someone', 'feed.noSets': 'No completed sets',
  'feed.empty': 'No sessions yet. Log one, then add friends from the Friends tab.',

  'friends.title': 'My Squad', 'friends.search': 'Search friends...', 'friends.prompt': "Friend's name or username?",
  'friends.notFound': 'Nobody found with that name.', 'friends.confirm': 'Send a request to {name}?',
  'friends.sent': 'Request sent.', 'friends.sentFail': 'Request already sent or already friends.',
  'friends.acceptFail': 'Could not accept the request.', 'friends.wants': 'Wants to join your squad',
  'friends.pending': 'Request sent', 'friends.accept': 'Accept', 'friends.noSession': 'No session yet',
  'friends.empty': 'No friends yet. Tap the add button and enter their name or username.',

  'log.defaultName': 'Workout', 'common.defaultEquipment': 'Barbell',
  'log.title': 'Active Session', 'log.exercise': 'Exercise {n}: {name}',
  'log.pounds': 'Pounds, set {n}', 'log.reps': 'Reps, set {n}', 'log.markDone': 'Mark set {n} done',
  'log.empty': 'Empty session. Add your first exercise to begin.',
  'log.finish': 'Finish & Share Workout', 'log.saveTemplate': 'Save as template', 'log.discard': 'Discard session',
  'log.confirmDiscard': 'Discard this session?', 'log.markOne': 'Mark at least one set as done first.',
  'log.shared': 'Workout shared with the squad.', 'log.addFirst': 'Add an exercise first.',
  'log.savedTemplate': 'Saved. Find it on the + screen.',

  'start.title': 'Start a workout', 'start.empty': 'Start empty session', 'start.pick': 'Or pick a session',
  'start.mine': 'My sessions', 'start.friends': 'Shared by friends',
  'start.shared': 'Shared', 'start.private': 'Private', 'start.delete': 'Delete {name}', 'start.confirmDelete': 'Delete "{name}"?',
  'start.emptyMine': 'No saved session yet. Open one from “Last workout” below, or use “Save as template” during a workout.',
  'start.by': 'by {name} · {summary}', 'start.aFriend': 'A friend',
  'start.emptyFriends': 'Nothing shared yet. Friends can share a saved session from this screen.',
  'start.last': 'Last workout', 'start.noWorkout': 'No workout yet. Finish a session and it will show up here.',
  'start.shareError': 'Could not update sharing.', 'start.deleteError': 'Could not delete the session.',
  'start.alreadySaved': 'Already in My sessions.', 'start.saved': 'Saved to My sessions.',
  'start.saveError': 'Could not save the session.', 'start.updated': 'Session updated.',
  'start.mySession': 'My session', 'start.sharedBy': 'Shared by {name}',
  'start.begin': 'Start session', 'start.edit': 'Edit session', 'start.again': 'Do it again',
  'start.inMine': 'Already in My sessions', 'start.addToMine': 'Add to My sessions',

  'edit.title': 'Edit session', 'edit.exName': 'Exercise {n} name', 'edit.equipment': 'Equipment for {name}',
  'edit.remove': 'Remove {name}', 'edit.pounds': 'Pounds, {name} set {n}', 'edit.reps': 'Reps, {name} set {n}',
  'edit.removeSet': 'Remove set {n} of {name}', 'edit.save': 'Save changes', 'edit.confirmDiscard': 'Discard your changes?',
  'edit.needName': 'Give the session a name.', 'edit.needExercise': 'Add at least one exercise.',
  'edit.needExName': 'Every exercise needs a name.',

  'detail.exercises': 'EXERCISES', 'detail.sets': 'SETS', 'detail.volume': 'VOLUME',
}

type DictKey = keyof typeof en
type Base<K> = K extends `${infer B}_one` ? B : K extends `${infer B}_other` ? B : K
export type TKey = Base<DictKey>
type Vars = Record<string, string | number>
export type TFn = (key: TKey, vars?: Vars) => string

// TypeScript refuse de compiler si une clé manque en français.
const fr: Record<DictKey, string> = {
  'nav.profile': 'Profil', 'nav.feed': 'Fil', 'nav.friends': 'Amis', 'nav.ranks': 'Classement', 'nav.log': 'Enregistrer une séance',

  'common.back': 'Retour', 'common.cancel': 'Annuler', 'common.loading': 'Chargement…', 'common.addFriend': 'Ajouter un ami',
  'common.day_one': '{n} jour', 'common.day_other': '{n} jours',
  'common.exercise_one': '{n} exercice', 'common.exercise_other': '{n} exercices',
  'common.set_one': '{n} série', 'common.set_other': '{n} séries',
  'common.comment_one': '{n} commentaire', 'common.comment_other': '{n} commentaires',
  'common.lbs': '{n} lbs',
  'common.couldNotSave': "Échec de l'enregistrement : {msg}",
  'common.exercisePrompt': "Nom de l'exercice ?",
  'common.addSet': '+ Ajouter une série', 'common.addExercise': '+ Ajouter un exercice',
  'common.sessionName': 'NOM DE LA SÉANCE', 'common.sessionNameAria': 'Nom de la séance',
  'common.hSet': 'SÉRIE', 'common.hLbs': 'LBS', 'common.hReps': 'RÉPS', 'common.hDone': 'FAIT',

  'ago.now': "À l'instant", 'ago.min': 'il y a {n} min',
  'ago.hour_one': 'il y a {n} heure', 'ago.hour_other': 'il y a {n} heures',
  'ago.day_one': 'il y a {n} jour', 'ago.day_other': 'il y a {n} jours',

  'auth.tagline': 'Note tes séances et compare-toi à ta squad.',
  'auth.displayName': 'Nom affiché', 'auth.email': 'E-mail', 'auth.password': 'Mot de passe (6 caractères minimum)',
  'auth.enterCreds': 'Saisis ton e-mail et ton mot de passe.',
  'auth.checkInbox': 'Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi.',
  'auth.createAccount': 'Créer le compte', 'auth.signIn': 'Se connecter',
  'auth.haveAccount': "J'ai déjà un compte", 'auth.noAccount': 'Créer un compte',

  'profile.you': 'Toi', 'profile.language': 'Langue', 'profile.signOut': 'Se déconnecter', 'profile.confirmSignOut': 'Se déconnecter ?',
  'profile.workouts': 'SÉANCES', 'profile.streak': 'STREAK', 'profile.prs': 'RECORDS',
  'profile.records': 'Records personnels', 'profile.noRecords': 'Termine ta première séance pour établir des records.',
  'profile.benchTrend': 'Volume au développé couché', 'profile.vsLastWeek': '{pct}% vs semaine dernière',
  'profile.benchAria': 'Volume au développé couché sur les 7 dernières semaines', 'profile.week': 'S{n}',

  'ranks.title': 'Classement', 'ranks.streak': 'Streak', 'ranks.volume': 'Volume (lbs)', 'ranks.sessions': 'Séances', 'ranks.me': '(Moi)',

  'feed.title': 'Fil de la squad', 'feed.share': 'Partager une séance avec la squad...',
  'feed.likeError': "Impossible de mettre à jour le j'aime.", 'feed.commentPrompt': 'Ton commentaire ?', 'feed.commentError': "Impossible de publier le commentaire.",
  'feed.someone': "Quelqu'un", 'feed.noSets': 'Aucune série terminée',
  'feed.empty': "Aucune séance pour l'instant. Enregistres-en une, puis ajoute des amis depuis l'onglet Amis.",

  'friends.title': 'Ma squad', 'friends.search': 'Rechercher un ami...', 'friends.prompt': "Nom ou identifiant de ton ami ?",
  'friends.notFound': 'Personne trouvé avec ce nom.', 'friends.confirm': 'Envoyer une demande à {name} ?',
  'friends.sent': 'Demande envoyée.', 'friends.sentFail': 'Demande déjà envoyée, ou déjà amis.',
  'friends.acceptFail': "Impossible d'accepter la demande.", 'friends.wants': 'Veut rejoindre ta squad',
  'friends.pending': 'Demande envoyée', 'friends.accept': 'Accepter', 'friends.noSession': 'Aucune séance',
  'friends.empty': "Pas encore d'amis. Touche le bouton d'ajout et saisis son nom ou son identifiant.",

  'log.defaultName': 'Séance', 'common.defaultEquipment': 'Barre',
  'log.title': 'Séance en cours', 'log.exercise': 'Exercice {n} : {name}',
  'log.pounds': 'Livres, série {n}', 'log.reps': 'Répétitions, série {n}', 'log.markDone': 'Marquer la série {n} comme faite',
  'log.empty': 'Séance vide. Ajoute ton premier exercice pour commencer.',
  'log.finish': 'Terminer et partager la séance', 'log.saveTemplate': 'Enregistrer comme modèle', 'log.discard': 'Abandonner la séance',
  'log.confirmDiscard': 'Abandonner cette séance ?', 'log.markOne': "Marque d'abord au moins une série comme faite.",
  'log.shared': 'Séance partagée avec la squad.', 'log.addFirst': "Ajoute d'abord un exercice.",
  'log.savedTemplate': "Enregistrée. Retrouve-la sur l'écran +.",

  'start.title': 'Démarrer une séance', 'start.empty': 'Démarrer une séance vide', 'start.pick': 'Ou choisis une séance',
  'start.mine': 'Mes séances', 'start.friends': 'Partagées par les amis',
  'start.shared': 'Partagée', 'start.private': 'Privée', 'start.delete': 'Supprimer {name}', 'start.confirmDelete': 'Supprimer « {name} » ?',
  'start.emptyMine': "Aucune séance enregistrée. Ouvre-en une depuis « Dernières séances » ci-dessous, ou utilise « Enregistrer comme modèle » pendant une séance.",
  'start.by': 'par {name} · {summary}', 'start.aFriend': 'Un ami',
  'start.emptyFriends': "Rien de partagé pour l'instant. Tes amis peuvent partager une séance enregistrée depuis cet écran.",
  'start.last': 'Dernières séances', 'start.noWorkout': 'Aucune séance pour le moment. Termine-en une et elle apparaîtra ici.',
  'start.shareError': 'Impossible de modifier le partage.', 'start.deleteError': 'Impossible de supprimer la séance.',
  'start.alreadySaved': 'Déjà dans Mes séances.', 'start.saved': 'Ajoutée à Mes séances.',
  'start.saveError': "Impossible d'enregistrer la séance.", 'start.updated': 'Séance mise à jour.',
  'start.mySession': 'Ma séance', 'start.sharedBy': 'Partagée par {name}',
  'start.begin': 'Démarrer la séance', 'start.edit': 'Modifier la séance', 'start.again': 'La refaire',
  'start.inMine': 'Déjà dans Mes séances', 'start.addToMine': 'Ajouter à Mes séances',

  'edit.title': 'Modifier la séance', 'edit.exName': "Nom de l'exercice {n}", 'edit.equipment': 'Matériel pour {name}',
  'edit.remove': 'Retirer {name}', 'edit.pounds': 'Livres, {name} série {n}', 'edit.reps': 'Répétitions, {name} série {n}',
  'edit.removeSet': 'Retirer la série {n} de {name}', 'edit.save': 'Enregistrer les modifications', 'edit.confirmDiscard': 'Abandonner tes modifications ?',
  'edit.needName': 'Donne un nom à la séance.', 'edit.needExercise': 'Ajoute au moins un exercice.',
  'edit.needExName': 'Chaque exercice doit avoir un nom.',

  'detail.exercises': 'EXERCICES', 'detail.sets': 'SÉRIES', 'detail.volume': 'VOLUME',
}

const dicts = { en, fr } as Record<Lang, Record<string, string>>

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const d = dicts[lang]
  let k = key
  if (vars && typeof vars.n === 'number') {
    const one = lang === 'fr' ? vars.n < 2 : vars.n === 1
    const plural = `${key}_${one ? 'one' : 'other'}`
    if (plural in d) k = plural
  }
  const text = d[k] ?? dicts.en[k] ?? key
  return vars ? text.replace(/\{(\w+)\}/g, (_, v: string) => String(vars[v] ?? `{${v}}`)) : text
}

function detect(): Lang {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'en' || saved === 'fr') return saved
  } catch {
    /* stockage indisponible */
  }
  return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

type Ctx = { lang: Lang; locale: string; setLang: (l: Lang) => void; t: TFn }
const I18nContext = createContext<Ctx>({ lang: 'en', locale: 'en-US', setLang: () => {}, t: (k, v) => translate('en', k, v) })
export const useI18n = () => useContext(I18nContext)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detect)

  useEffect(() => {
    document.documentElement.lang = lang // la balise <html lang> suit la langue choisie
    try {
      localStorage.setItem(KEY, lang)
    } catch {
      /* stockage indisponible */
    }
  }, [lang])

  const t = useCallback<TFn>((key, vars) => translate(lang, key, vars), [lang])
  const value = useMemo(() => ({ lang, locale: lang === 'fr' ? 'fr-FR' : 'en-US', setLang: setLangState, t }), [lang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
