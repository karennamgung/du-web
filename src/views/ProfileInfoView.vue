<template>
  <div class="profile-info-view">
    <!-- 학부모인 경우: 자녀 목록 및 선택 -->
    <template v-if="profile?.user_type === 'parent'">
      <div class="selection-list">
        <!-- 학부모 카드 -->
        <ProfileCard
          variant="parent"
          :selected="selectedChildIndex === null"
          :show-selector="true"
          select-value="parent"
          :show-edit="editingProfile !== 'parent'"
          :is-editing="editingProfile === 'parent'"
          :nickname="profile?.nickname ?? ''"
          :profile-form="editProfileForm"
          :can-save-profile="canSaveProfile"
          @select="selectParent"
          @edit="openEditProfile('parent')"
          @save="saveProfile"
          @cancel="cancelEditProfile"
          @update:profile-form="editProfileForm = $event"
        />

        <!-- 자녀 카드 (나이 많은 순: 첫째·둘째·셋째...) -->
        <ProfileCard
          v-for="(item, displayIndex) in childrenSortedByAge"
          :key="item.originalIndex"
          variant="child"
          :selected="selectedChildIndex === item.originalIndex"
          :show-selector="true"
          :select-value="String(item.originalIndex)"
          :show-edit="editingChildIndex !== item.originalIndex"
          :is-editing="editingChildIndex === item.originalIndex"
          :show-delete="true"
          :child="item.child"
          :order-label="getChildOrder(displayIndex)"
          :child-form="newChild"
          :can-save-child="canSaveChild"
          :current-year="currentYear"
          @select="selectChild(item.originalIndex)"
          @edit="openEditChild(item.originalIndex)"
          @save="saveChild"
          @cancel="cancelEditChild"
          @delete="deleteChild(item.originalIndex)"
          @update:child-form="newChild = $event"
        />
      </div>

      <!-- 자녀 추가 버튼 (새 자녀 카드가 떠 있으면 숨김) -->
      <button
        v-if="!showAddChildForm"
        type="button"
        class="btn btn-outline w-full"
        @click="openAddChildForm"
      >
        <Icon class="icon-sm" :path="mdiPlus" />
        자녀 추가하기
      </button>

      <!-- 자녀 추가: 수정과 동일한 카드 스타일 -->
      <ProfileCard
        v-if="showAddChildForm"
        variant="child"
        :show-selector="false"
        :show-edit="false"
        :is-editing="true"
        order-label="자녀 추가하기"
        :child-form="newChild"
        :can-save-child="canSaveChild"
        :current-year="currentYear"
        @save="saveChild"
        @cancel="cancelAddChild"
        @update:child-form="newChild = $event"
      />
    </template>

    <!-- 학생인 경우: 학부모와 동일한 카드 레이아웃 -->
    <template v-else-if="profile?.user_type === 'student'">
      <div class="selection-list">
        <ProfileCard
          variant="student"
          :show-selector="false"
          :show-edit="editingProfile !== 'student'"
          :is-editing="editingProfile === 'student'"
          :nickname="profile?.nickname ?? ''"
          :profile-form="editProfileForm"
          :can-save-profile="canSaveProfile"
          @edit="openEditProfile('student')"
          @save="saveProfile"
          @cancel="cancelEditProfile"
          @update:profile-form="editProfileForm = $event"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ProfileCard from '@/components/profile/ProfileCard.vue'
import Icon from '@/components/Icon.vue'
import { mdiPlus } from '@mdi/js'
import { useProfileStore } from '@/stores/profile'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Child } from '@/stores/profile'

const profileStore = useProfileStore()
const auth = useAuthStore()

const profile = computed(() => profileStore.profile)
const children = computed(() => profileStore.children)
/** 나이 많은 순으로 정렬한 자녀 목록 (첫째=나이 많음, 둘째, 셋째...). 각 항목은 원본 배열의 index를 함께 가짐. */
const childrenSortedByAge = computed(() => {
  const list = children.value.map((child, index) => ({ child, originalIndex: index }))
  list.sort((a, b) => (b.child.age ?? 0) - (a.child.age ?? 0))
  return list
})
const selectedChildIndex = computed(() => profileStore.selectedChildIndex)

const showAddChildForm = ref(false)
const editingChildIndex = ref<number | null>(null)
const editingProfile = ref<'parent' | 'student' | null>(null)
const saving = ref(false)
const currentYear = computed(() => new Date().getFullYear())

const editProfileForm = ref({ nickname: '' })

const canSaveProfile = computed(() => {
  return editProfileForm.value.nickname.trim().length > 0
})

const newChild = ref<{
  name: string
  age: number
  gender: 'male' | 'female' | null
}>({
  name: '',
  age: 0,
  gender: null,
})

const canSaveChild = computed(() => {
  return newChild.value.name.trim().length > 0 && newChild.value.age >= 0
})

function getChildOrder(index: number): string {
  const orders = ['첫째 아이', '둘째 아이', '셋째 아이', '넷째 아이', '다섯째 아이', '여섯째 아이', '일곱째 아이', '여덟째 아이', '아홉째 아이', '열째 아이']
  return orders[index] || `${index + 1}째 아이`
}

function selectParent() {
  profileStore.selectChild(null)
}

function selectChild(index: number) {
  profileStore.selectChild(index)
}

function openEditProfile(who: 'parent' | 'student') {
  if (!profile.value) return
  editingChildIndex.value = null
  showAddChildForm.value = false
  editingProfile.value = who
  editProfileForm.value = { nickname: profile.value.nickname ?? '' }
}

function cancelEditProfile() {
  editingProfile.value = null
  editProfileForm.value = { nickname: '' }
}

async function saveProfile() {
  if (!auth.user?.id || !profile.value || saving.value || !canSaveProfile.value) return

  saving.value = true
  try {
    const { error } = await supabase
      .from('profiles')
      // @ts-expect-error Supabase inferred update type can be strict
      .update({
        nickname: editProfileForm.value.nickname.trim(),
      })
      .eq('user_id', auth.user.id)

    if (error) throw error
    await profileStore.refresh()
    editingProfile.value = null
    editProfileForm.value = { nickname: '' }
  } catch (error) {
    console.error('프로필 수정 실패:', error)
    alert('프로필 수정에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

function openEditChild(index: number) {
  const child = children.value[index]
  if (!child) return
  editingProfile.value = null
  showAddChildForm.value = false
  editingChildIndex.value = index
  newChild.value = {
    name: child.name ?? '',
    age: typeof child.age === 'number' ? child.age : 0,
    gender: child.gender ?? null,
  }
}

function cancelEditChild() {
  editingChildIndex.value = null
  newChild.value = {
    name: '',
    age: 0,
    gender: null,
  }
}

async function deleteChild(index: number) {
  if (!auth.user?.id || !profile.value || saving.value) return
  if (!confirm('이 자녀 정보를 삭제할까요?')) return

  saving.value = true
  try {
    const updatedChildren = children.value.filter((_, i) => i !== index)
    const { error } = await supabase
      .from('profiles')
      // @ts-expect-error Supabase inferred update type can be strict
      .update({ children: updatedChildren })
      .eq('user_id', auth.user.id)

    if (error) throw error
    await profileStore.refresh()

    if (editingChildIndex.value === index) {
      editingChildIndex.value = null
      newChild.value = { name: '', age: 0, gender: null }
    } else if (editingChildIndex.value !== null && editingChildIndex.value > index) {
      editingChildIndex.value = editingChildIndex.value - 1
    }
    if (selectedChildIndex.value === index) {
      profileStore.selectChild(updatedChildren.length > 0 ? Math.min(index, updatedChildren.length - 1) : null)
    } else if (selectedChildIndex.value !== null && selectedChildIndex.value > index) {
      profileStore.selectChild(selectedChildIndex.value - 1)
    }
  } catch (error) {
    console.error('자녀 삭제 실패:', error)
    alert('자녀 삭제에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

async function saveChild() {
  if (!auth.user?.id || !profile.value || saving.value) return

  saving.value = true
  try {
  const isEditing = editingChildIndex.value !== null
  const updatedChildren: Child[] = isEditing
    ? children.value.map((c, i) =>
        i === editingChildIndex.value!
          ? {
              name: newChild.value.name.trim(),
              age: newChild.value.age,
              gender: newChild.value.gender,
            }
          : c
      )
    : [
        ...children.value,
        {
          name: newChild.value.name.trim(),
          age: newChild.value.age,
          gender: newChild.value.gender,
        },
      ]

    const { error } = await supabase
      .from('profiles')
      // @ts-expect-error Supabase inferred update type can be strict
      .update({ children: updatedChildren })
      .eq('user_id', auth.user.id)

    if (error) throw error

    // 프로필 스토어 새로고침
    await profileStore.refresh()

    if (isEditing) {
      profileStore.selectChild(editingChildIndex.value)
    } else {
      profileStore.selectChild(updatedChildren.length - 1)
    }

    newChild.value = {
      name: '',
      age: 0,
      gender: null,
    }
    showAddChildForm.value = false
    editingChildIndex.value = null
  } catch (error) {
    console.error('자녀 추가 실패:', error)
    alert('자녀 추가에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

function openAddChildForm() {
  editingProfile.value = null
  editingChildIndex.value = null
  showAddChildForm.value = true
  newChild.value = {
    name: '',
    age: 0,
    gender: null,
  }
}

function cancelAddChild() {
  newChild.value = {
    name: '',
    age: 0,
    gender: null,
  }
  showAddChildForm.value = false
  editingChildIndex.value = null
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.selection-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
  margin-bottom: v.$space-lg;
}
</style>
