<template>
  <div class="residence-form">
    <div class="input-group">
      <label for="residence" class="text-caption-sm">거주지</label>
      <button
        type="button"
        class="btn btn-gray w-full"
        @click="handleLocationClick"
      >
        현재 위치로 설정
      </button>
      </div>
      <div class="input-group">
      <label for="residence" class="text-caption-sm">또는 직접 입력</label>
      <input
        id="residence"
        v-model="residence"
        type="text"
        placeholder="예: 서울시 강남구"
        class="input"
        @input="handleInput"
      />
      <p class="type-size-xs color-dim pl-lg">시/도, 시/군/구 단위로 입력해주세요.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useMyNeighborhoodStore } from "@/stores/myNeighborhood";

interface Props {
  onboardingData: {
    residence: string | null;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update-data": [data: { residence: string | null }];
  "update:canProceed": [value: boolean];
  next: [];
}>();

const myNeighborhood = useMyNeighborhoodStore();
const residence = ref(props.onboardingData.residence || "");

const canProceed = computed(() => residence.value.trim().length > 0);

watch(
  residence,
  () => {
    emit("update:canProceed", canProceed.value);
    emit("update-data", { residence: residence.value.trim() || null });
  },
  { immediate: true },
);

function handleInput() {
  emit("update-data", { residence: residence.value.trim() || null });
}

async function handleLocationClick() {
  myNeighborhood.requestShowMyLocation = true;
  await myNeighborhood.fetchFromLocation();
  if (myNeighborhood.name) {
    residence.value = myNeighborhood.name;
    emit("update-data", { residence: residence.value });
  }
}

function requestNext() {
  if (canProceed.value) {
    emit("update-data", { residence: residence.value.trim() || null });
    emit("next");
  }
}

defineExpose({
  requestNext,
  canProceed,
});
</script>

<style lang="scss" scoped>
.residence-form {
  display: flex;
  flex-direction: column;
  gap: v.$space-md;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: v.$space-xs;
}
</style>
