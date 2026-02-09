<template>
  <div class="profile-info-view">
    <!-- 학부모인 경우: 자녀 목록 및 선택 -->
    <template v-if="profile?.user_type === 'parent'">
      <div class="selection-list">
        <!-- 학부모 이름 선택 -->
        <button
          type="button"
          class="selection-item"
          :class="{ active: selectedChildIndex === null }"
          @click="selectParent"
        >
          <div class="avatar-wrapper">
            <img
              v-if="profile.profile_image_url"
              :src="profile.profile_image_url"
              :alt="profile.nickname"
              class="profile-avatar"
            />
            <div
              v-else
              class="profile-avatar default-avatar"
              :style="{ backgroundColor: getDefaultAvatarColor(profile.nickname) }"
            >
              {{ getDefaultAvatarLetter(profile.nickname) }}
            </div>
          </div>
          <div class="selection-content">
            <h3>{{ profile.nickname }}</h3>
            <p class="selection-label">학부모</p>
          </div>
          <span v-if="selectedChildIndex === null" class="check-icon">✓</span>
        </button>

        <!-- 자녀 목록 -->
        <button
          v-for="(child, index) in children"
          :key="index"
          type="button"
          class="selection-item"
          :class="{ active: selectedChildIndex === index }"
          @click="selectChild(index)"
        >
          <div class="selection-content">
            <h3>{{ getChildOrder(index) }} {{ child.name }}</h3>
            <div class="child-details">
              <p>{{ child.birth_year }}년생 (만 {{ getAge(child.birth_year) }}세)</p>
              <p v-if="child.gender" class="gender">
                {{ child.gender === 'male' ? '남자' : '여자' }}
              </p>
              <p v-if="child.education_institution" class="education">
                {{ child.education_institution }}
              </p>
            </div>
          </div>
          <span v-if="selectedChildIndex === index" class="check-icon">✓</span>
        </button>
      </div>

      <!-- 자녀 추가 버튼 -->
      <button
        type="button"
        class="btn btn-outline w-full mt-md"
        @click="showAddChildForm = true"
      >
        + 자녀 추가하기
      </button>

      <!-- 자녀 추가 폼 -->
      <div v-if="showAddChildForm" class="add-child-form">
        <h3 class="form-title">자녀 정보 입력</h3>
        <div class="form-fields">
          <div class="input-group">
            <label>아이 이름</label>
            <input
              v-model="newChild.name"
              type="text"
              placeholder="이름을 입력해주세요"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>출생년도</label>
            <input
              v-model.number="newChild.birthYear"
              type="number"
              placeholder="예: 2015"
              class="input"
              min="2000"
              :max="currentYear"
            />
          </div>
          <div class="input-group">
            <label>재원중인 교육기관</label>
            <input
              v-model="newChild.educationInstitution"
              type="text"
              placeholder="예: OO초등학교 (선택사항)"
              class="input"
            />
          </div>
          <div class="input-group">
            <label>성별</label>
            <div class="gender-options">
              <button
                type="button"
                class="gender-btn"
                :class="{ active: newChild.gender === 'male' }"
                @click="newChild.gender = 'male'"
              >
                남자
              </button>
              <button
                type="button"
                class="gender-btn"
                :class="{ active: newChild.gender === 'female' }"
                @click="newChild.gender = 'female'"
              >
                여자
              </button>
              <button
                type="button"
                class="gender-btn"
                :class="{ active: newChild.gender === null }"
                @click="newChild.gender = null"
              >
                선택안함
              </button>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-outline"
            @click="cancelAddChild"
          >
            취소
          </button>
          <button
            type="button"
            class="btn btn-primary"
            :disabled="!canSaveChild"
            @click="saveChild"
          >
            저장
          </button>
        </div>
      </div>
    </template>

    <!-- 학생인 경우: 학생 정보 표시 -->
    <template v-else-if="profile?.user_type === 'student'">
      <div class="student-profile">
        <div class="student-avatar-section">
          <img
            v-if="profile.profile_image_url"
            :src="profile.profile_image_url"
            :alt="profile.nickname"
            class="student-avatar"
          />
          <div
            v-else
            class="student-avatar default-avatar"
            :style="{ backgroundColor: getDefaultAvatarColor(profile.nickname) }"
          >
            {{ getDefaultAvatarLetter(profile.nickname) }}
          </div>
        </div>
        <div class="info-list">
          <div class="info-item">
            <label>이름</label>
            <p>{{ profile.nickname }}</p>
          </div>
          <div v-if="profile.residence" class="info-item">
            <label>거주지</label>
            <p>{{ profile.residence }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProfileStore } from '@/stores/profile'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Child } from '@/stores/profile'

const profileStore = useProfileStore()
const auth = useAuthStore()

const profile = computed(() => profileStore.profile)
const children = computed(() => profileStore.children)
const selectedChildIndex = computed(() => profileStore.selectedChildIndex)

const showAddChildForm = ref(false)
const saving = ref(false)
const currentYear = computed(() => new Date().getFullYear())

const newChild = ref<{
  name: string
  birthYear: number
  educationInstitution: string | null
  gender: 'male' | 'female' | null
}>({
  name: '',
  birthYear: currentYear.value - 10,
  educationInstitution: null,
  gender: null,
})

const canSaveChild = computed(() => {
  return newChild.value.name.trim().length > 0 && newChild.value.birthYear > 2000
})

function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear
}

function getChildOrder(index: number): string {
  const orders = ['첫째', '둘째', '셋째', '넷째', '다섯째', '여섯째', '일곱째', '여덟째', '아홉째', '열째']
  return orders[index] || `${index + 1}째`
}

const defaultAvatars = [
  { letter: 'K', color: '#8B5CF6' },
  { letter: 'A', color: '#6B7280' },
  { letter: 'B', color: '#10B981' },
  { letter: 'C', color: '#F59E0B' },
  { letter: 'D', color: '#EF4444' },
  { letter: 'E', color: '#3B82F6' },
  { letter: 'F', color: '#EC4899' },
  { letter: 'G', color: '#14B8A6' },
  { letter: 'H', color: '#F97316' },
  { letter: 'I', color: '#6366F1' },
  { letter: 'J', color: '#84CC16' },
  { letter: 'L', color: '#A855F7' },
]

function getDefaultAvatarLetter(nickname: string): string {
  if (!nickname) return 'U'
  const firstChar = nickname.trim().charAt(0).toUpperCase()
  // 한글인 경우 첫 자음으로 변환
  if (/[가-힣]/.test(firstChar)) {
    const code = firstChar.charCodeAt(0) - 0xac00
    const initial = Math.floor(code / 28 / 21)
    const initials = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']
    return initials[initial] || firstChar
  }
  // 영문/숫자인 경우
  if (/[A-Z0-9]/.test(firstChar)) {
    return firstChar
  }
  return 'U'
}

function getDefaultAvatarColor(nickname: string): string {
  if (!nickname) return defaultAvatars[0].color
  const letter = getDefaultAvatarLetter(nickname)
  const avatar = defaultAvatars.find((a) => a.letter === letter)
  return avatar?.color || defaultAvatars[0].color
}

function selectParent() {
  profileStore.selectChild(null)
}

function selectChild(index: number) {
  profileStore.selectChild(index)
}

async function saveChild() {
  if (!auth.user?.id || !profile.value || saving.value) return

  saving.value = true
  try {
    const updatedChildren: Child[] = [
      ...children.value,
      {
        name: newChild.value.name.trim(),
        birth_year: newChild.value.birthYear,
        education_institution: newChild.value.educationInstitution?.trim() || null,
        gender: newChild.value.gender,
      },
    ]

    const { error } = await supabase
      .from('profiles')
      .update({ children: updatedChildren })
      .eq('user_id', auth.user.id)

    if (error) throw error

    // 프로필 스토어 새로고침
    await profileStore.refresh()

    // 새로 추가된 아이 선택
    profileStore.selectChild(updatedChildren.length - 1)

    // 폼 초기화 및 닫기
    newChild.value = {
      name: '',
      birthYear: currentYear.value - 10,
      educationInstitution: null,
      gender: null,
    }
    showAddChildForm.value = false
  } catch (error) {
    console.error('자녀 추가 실패:', error)
    alert('자녀 추가에 실패했습니다. 다시 시도해주세요.')
  } finally {
    saving.value = false
  }
}

function cancelAddChild() {
  newChild.value = {
    name: '',
    birthYear: currentYear.value - 10,
    educationInstitution: null,
    gender: null,
  }
  showAddChildForm.value = false
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

.selection-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: v.$space-md v.$space-lg;
  border: 2px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  background-color: v.$color-bg-base;
  cursor: pointer;
  transition: all v.$transition-base;
  text-align: left;
  gap: v.$space-md;

  &:hover {
    border-color: v.$color-primary;
    background-color: v.$color-primary-dimmer;
  }

  &.active {
    border-color: v.$color-primary;
    background-color: v.$color-primary-dimmer;
  }

  .avatar-wrapper {
    flex-shrink: 0;
  }

  .profile-avatar {
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;

    &.default-avatar {
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: v.$font-weight-bold;
      font-size: 1.25rem;
    }
  }

  .selection-content {
    flex: 1;

    h3 {
      @include v.text-heading-sm;
      margin: 0 0 v.$space-xs 0;
    }

    .selection-label {
      @include v.text-caption;
      color: v.$color-text-dim;
      margin: 0;
    }

    .child-details {
      display: flex;
      flex-direction: column;
      gap: v.$space-2xs;
      margin-top: v.$space-xs;

      p {
        @include v.text-caption;
        color: v.$color-text-dim;
        margin: 0;
      }

      .gender {
        color: v.$color-text-base;
      }

      .education {
        color: v.$color-text-base;
      }
    }
  }

  .check-icon {
    width: 1.5rem;
    height: 1.5rem;
    background-color: v.$color-primary;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    font-weight: bold;
    flex-shrink: 0;
  }
}

.student-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: v.$space-lg;
}

.student-avatar-section {
  display: flex;
  justify-content: center;
}

.student-avatar {
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  object-fit: cover;

  &.default-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: v.$font-weight-bold;
    font-size: 2rem;
  }
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
  width: 100%;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: v.$space-xs;

  label {
    @include v.text-caption;
    color: v.$color-text-dim;
    font-weight: v.$font-weight-semibold;
  }

  p {
    @include v.text-body;
    margin: 0;
  }
}

.add-child-form {
  margin-top: v.$space-lg;
  padding: v.$space-lg;
  background-color: v.$color-bg-dim;
  border-radius: v.$radius-md;

  .form-title {
    @include v.text-heading-sm;
    margin: 0 0 v.$space-md 0;
  }

  .form-fields {
    display: flex;
    flex-direction: column;
    gap: v.$space-md;
  }

  .form-actions {
    display: flex;
    gap: v.$space-sm;
    margin-top: v.$space-lg;
    justify-content: flex-end;
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;

  label {
    @include v.text-heading-sm;
  }

  .input {
    @include v.input-base;
  }
}

.gender-options {
  display: flex;
  gap: v.$space-sm;
}

.gender-btn {
  flex: 1;
  padding: v.$space-sm v.$space-md;
  border: 2px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  background-color: v.$color-bg-base;
  color: v.$color-text-base;
  cursor: pointer;
  transition: all v.$transition-base;

  &:hover {
    border-color: v.$color-primary;
  }

  &.active {
    border-color: v.$color-primary;
    background-color: v.$color-primary-dimmer;
    color: v.$color-primary;
    font-weight: v.$font-weight-semibold;
  }
}
</style>
