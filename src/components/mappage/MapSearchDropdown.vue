<template>
  <SearchDropdown
    :aria-label="ariaLabel"
    :aria-role="mode === 'academy' ? 'listbox' : 'dialog'"
    :mobile-title="mobileTitle"
  >
    <!-- 학원 검색 자동완성 -->
    <template v-if="mode === 'academy'" #header>
      <span
        v-if="locationSummaryData"
        class="type-size-2xs type-weight-semibold color-dim"
      >
        {{ locationSummaryData.name }}
        <span v-if="locationSummaryData.extra">{{
          locationSummaryData.extra
        }}</span>
        지역 내 학원 리스트
      </span>
    </template>

    <!-- default 슬롯: mode별 본문 -->
    <AcademyListModalBody
      v-if="mode === 'academy'"
      :suggestions="suggestions ?? []"
      @select="(id) => emit('select', id)"
    />
    <ProfileModalBody v-else-if="mode === 'profile'" ref="profileBodyRef" />
    <LocationModalBody v-else-if="mode === 'location'" ref="locationBodyRef" />

    <!-- 프로필일 때 푸터: 학부모만 자녀 추가하기 -->
    <template v-if="mode === 'profile' && isParent" #footer>
      <button
        type="button"
        class="btn btn-ghost"
        @click="profileBodyRef?.openAddChildForm()"
      >
        자녀 추가하기
      </button>
    </template>
    <!-- 장소일 때만 푸터 슬롯 -->
    <template v-if="mode === 'location'" #footer>
      <button type="button" class="btn btn-ghost" @click="emit('close')">
        취소
      </button>
      <button type="button" class="btn btn-primary" @click="emit('apply')">
        학원 보기
      </button>
    </template>
  </SearchDropdown>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import SearchDropdown from "@/components/shared/SearchDropdown.vue";
import AcademyListModalBody from "@/components/modals/AcademyListModalBody.vue";
import ProfileModalBody from "@/components/modals/ProfileModalBody.vue";
import LocationModalBody from "@/components/modals/LocationModalBody.vue";
import { useProfileStore } from "@/stores/profile";

export interface MapSearchDropdownSuggestion {
  id: string;
  primaryText: string;
  secondaryText?: string;
}

export interface MapSearchDropdownLocationSummary {
  name: string;
  extra: string | null;
}

const props = defineProps<{
  mode: "academy" | "profile" | "location";
  locationSummaryData?: MapSearchDropdownLocationSummary | null;
  suggestions?: MapSearchDropdownSuggestion[];
  profilePanelTitle?: string;
}>();

const emit = defineEmits<{
  select: [id: string];
  close: [];
  apply: [];
}>();

const locationBodyRef = ref<InstanceType<typeof LocationModalBody> | null>(null);
const profileBodyRef = ref<InstanceType<typeof ProfileModalBody> | null>(null);

const profileStore = useProfileStore();
const isParent = computed(
  () => profileStore.profile?.user_type === "parent"
);

const ariaLabel = computed(() => {
  if (props.mode === "academy") return "학원 검색 결과";
  if (props.mode === "profile") return "프로필 선택";
  return "동네 찾기";
});

const mobileTitle = computed(() => {
  if (props.mode === "profile") return props.profilePanelTitle ?? "프로필";
  if (props.mode === "location") return "동네 찾기";
  return undefined;
});

defineExpose({
  syncLocationFromStore() {
    locationBodyRef.value?.syncFromStore();
  },
});
</script>
