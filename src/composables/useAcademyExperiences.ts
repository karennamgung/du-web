import { type Ref, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { EXPERIENCE_TAGS } from '@/constants/experienceTags'

export type TagCount = { tag_key: string; count: number; label: string }

export function useAcademyExperiences(academyId: Ref<string | null>) {
  const auth = useAuthStore()
  const tagCounts = ref<TagCount[]>([])
  const myTagKeys = ref<Set<string>>(new Set())
  const loading = ref(false)
  const toggling = ref(false)

  function getLabel(key: string): string {
    return EXPERIENCE_TAGS.find((t) => t.key === key)?.label ?? key
  }

  async function load() {
    const id = academyId.value
    if (!id) {
      tagCounts.value = []
      myTagKeys.value = new Set()
      return
    }
    loading.value = true
    try {
      const { data: rows, error } = await supabase
        .from('academy_experience_tags')
        .select('tag_key, user_id')
        .eq('academy_id', id)
      if (error) throw error

      const countByKey = new Map<string, number>()
      const myKeys = new Set<string>()
      for (const r of rows ?? []) {
        if (!r?.tag_key) continue
        countByKey.set(r.tag_key, (countByKey.get(r.tag_key) ?? 0) + 1)
        if (r.user_id === auth.user?.id) myKeys.add(r.tag_key)
      }

      tagCounts.value = EXPERIENCE_TAGS.map((t) => ({
        tag_key: t.key,
        count: countByKey.get(t.key) ?? 0,
        label: t.label,
      }))
      myTagKeys.value = myKeys
    } catch (e) {
      console.error('Academy experiences load failed:', e)
      tagCounts.value = []
      myTagKeys.value = new Set()
    } finally {
      loading.value = false
    }
  }

  function isSelected(tagKey: string): boolean {
    return myTagKeys.value.has(tagKey)
  }

  async function toggle(tagKey: string): Promise<void> {
    const id = academyId.value
    if (!id || !auth.user?.id) return
    toggling.value = true
    try {
      const selected = isSelected(tagKey)
      if (selected) {
        const { error } = await supabase
          .from('academy_experience_tags')
          .delete()
          .eq('user_id', auth.user.id)
          .eq('academy_id', id)
          .eq('tag_key', tagKey)
        if (error) throw error
        myTagKeys.value = new Set([...myTagKeys.value].filter((k) => k !== tagKey))
        const item = tagCounts.value.find((t) => t.tag_key === tagKey)
        if (item) item.count = Math.max(0, item.count - 1)
      } else {
        const { error } = await supabase.from('academy_experience_tags').insert({
          user_id: auth.user.id,
          academy_id: id,
          tag_key: tagKey,
        })
        if (error) throw error
        myTagKeys.value = new Set([...myTagKeys.value, tagKey])
        const item = tagCounts.value.find((t) => t.tag_key === tagKey)
        if (item) item.count += 1
      }
    } catch (e) {
      console.error('Experience tag toggle failed:', e)
      throw e
    } finally {
      toggling.value = false
    }
  }

  watch(
    () => academyId.value,
    () => load(),
    { immediate: true }
  )

  watch(
    () => auth.user?.id ?? null,
    () => load()
  )

  return { tagCounts, myTagKeys, loading, toggling, isSelected, toggle, getLabel }
}
