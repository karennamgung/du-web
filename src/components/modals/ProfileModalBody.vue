<template>
  <div class="profile-modal-body">
    <!-- 프로필(자녀) 선택: 학부모이고 자녀가 있을 때만 -->
    <div
      v-if="profileStore.profile?.user_type === 'parent' && profileStore.children.length"
      class="profile-modal-section"
    >
      <p class="profile-modal-heading">프로필</p>
      <div class="profile-modal-chips">
        <button
          type="button"
          class="chip"
          :class="{ 'chip-active': profileStore.selectedChildIndex === null }"
          @click="profileStore.selectChild(null)"
        >
          전체
        </button>
        <button
          v-for="(_, idx) in profileStore.children"
          :key="idx"
          type="button"
          class="chip"
          :class="{ 'chip-active': profileStore.selectedChildIndex === idx }"
          @click="profileStore.selectChild(idx)"
        >
          {{ getChildOrderLabel(idx) }}
        </button>
      </div>
    </div>
    <!-- 연령 선택 (지도 필터용) -->
    <div class="profile-modal-section">
      <p class="profile-modal-heading">연령</p>
      <div class="profile-modal-chips">
        <button
          v-for="opt in AGE_GROUP_ORDER"
          :key="'age-' + opt"
          type="button"
          class="chip"
          :class="{ 'chip-active': profileStore.selectedAgeGroupsForMap.includes(opt) }"
          @click="profileStore.toggleAgeGroupForMap(opt)"
        >
          {{ opt }}
        </button>
      </div>
    </div>
    <ProfileInfoView ref="profileInfoViewRef" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProfileInfoView from '@/views/ProfileInfoView.vue'
import { useProfileStore, getChildOrderLabel } from '@/stores/profile'
import { AGE_GROUP_ORDER } from '@/constants/subjectTypes'

const profileStore = useProfileStore()
const profileInfoViewRef = ref<InstanceType<typeof ProfileInfoView> | null>(null)

defineExpose({
  openAddChildForm() {
    profileInfoViewRef.value?.openAddChildForm()
  },
})
</script>

<style scoped lang="scss">
.profile-modal-body {
  min-height: 0;
}

.profile-modal-section {
  margin-bottom: v.$space-md;

  &:last-of-type {
    margin-bottom: v.$space-lg;
  }
}

.profile-modal-heading {
  margin: 0 0 v.$space-xs;
  font-size: 0.75rem;
  font-weight: 600;
  color: v.$color-text-dim;
}

.profile-modal-chips {
  display: flex;
  flex-wrap: wrap;
  gap: v.$space-xs;
}
</style>
