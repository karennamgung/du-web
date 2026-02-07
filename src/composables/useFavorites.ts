import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export function useFavorites() {
  const auth = useAuthStore()
  const favoriteAcademyIds = ref<Set<string>>(new Set())
  const loading = ref(false)

  async function load() {
    if (!auth.user?.id) {
      favoriteAcademyIds.value = new Set()
      return
    }
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('academy_id')
        .eq('user_id', auth.user.id)
      if (error) throw error
      favoriteAcademyIds.value = new Set((data ?? []).map((r) => r.academy_id))
    } catch (e) {
      console.error('Favorites load failed:', e)
      favoriteAcademyIds.value = new Set()
    } finally {
      loading.value = false
    }
  }

  function isFavorited(academyId: string): boolean {
    return favoriteAcademyIds.value.has(academyId)
  }

  async function toggle(academyId: string): Promise<boolean> {
    if (!auth.user?.id) return false
    const current = isFavorited(academyId)
    try {
      if (current) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', auth.user.id)
          .eq('academy_id', academyId)
        if (error) throw error
        favoriteAcademyIds.value = new Set([...favoriteAcademyIds.value].filter((id) => id !== academyId))
        return false
      } else {
        const { error } = await supabase.from('favorites').insert({
          user_id: auth.user.id,
          academy_id: academyId,
        })
        if (error) throw error
        favoriteAcademyIds.value = new Set([...favoriteAcademyIds.value, academyId])
        return true
      }
    } catch (e) {
      console.error('Favorite toggle failed:', e)
      throw e
    }
  }

  watch(
    () => auth.user?.id ?? null,
    (userId) => {
      if (userId) load()
      else favoriteAcademyIds.value = new Set()
    },
    { immediate: true }
  )

  return { favoriteAcademyIds, loading, load, isFavorited, toggle }
}
