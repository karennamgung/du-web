<template>
  <div v-if="!loading" class="map-search-wrap">
    <div ref="searchWrapRef" class="map-search-inner">
      <input
        id="map-search"
        v-model="searchQuery"
        type="search"
        class="map-search-input"
        placeholder="학원명, 주소로 검색"
        autocomplete="off"
        @focus="showSearchDropdown = true"
      />
      <Transition name="dropdown">
        <div v-if="showSearchDropdown && searchQuery.trim()" class="map-search-dropdown">
          <template v-if="searchSuggestions.length">
            <button
              v-for="academy in searchSuggestions"
              :key="academy.id"
              type="button"
              class="map-search-suggestion"
              @click="selectSuggestion(academy)"
            >
              <p>{{ academy.name }}</p>
              <p v-if="academy.address || academy.address_road" class="map-search-suggestion-address color-dim">
                <template v-if="academy.address">{{ academy.address }}</template>
                <template v-if="academy.address && academy.address_road"><br /></template>
                <template v-if="academy.address_road">{{ academy.address_road }}</template>
              </p>
            </button>
          </template>
          <p v-else class="map-search-empty color-dim">검색 결과가 없습니다.</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import type { Academy } from '@/types/academy'

const props = defineProps<{
  academies: Academy[]
  loading: boolean
}>()

const emit = defineEmits<{
  select: [academy: Academy]
  clearSearch: []
}>()

const router = useRouter()
const searchQuery = ref('')
const showSearchDropdown = ref(false)
const searchWrapRef = ref<HTMLElement | null>(null)

watch(searchQuery, (q) => {
  if (!q?.trim()) {
    emit('clearSearch')
  }
})

function onDocumentClick(e: MouseEvent) {
  if (searchWrapRef.value && !searchWrapRef.value.contains(e.target as Node)) {
    showSearchDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

const searchSuggestions = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return props.academies
    .filter((a) => {
      const nameMatch = a.name.toLowerCase().includes(q)
      const addressMatch = (a.address ?? '').toLowerCase().includes(q) || (a.address_road ?? '').toLowerCase().includes(q)
      return nameMatch || addressMatch
    })
    .slice(0, 8)
})

function selectSuggestion(academy: Academy) {
  searchQuery.value = academy.name
  showSearchDropdown.value = false
  emit('select', academy)
  router.push({ name: 'AcademyDetail', params: { id: academy.id } })
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/index' as v;

.map-search-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}

.map-search-inner {
  position: relative;
}

.map-search-input {
  width: 100%;
  min-width: 0;
  @include v.input-base;
}

.map-search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: v.$space-xs;
  max-height: 17.5rem;
  overflow-y: auto;
  background: v.$color-bg-base;
  border: 1px solid v.$color-border-dim;
  border-radius: v.$radius-md;
  z-index: v.$z-canvas;
}

.map-search-suggestion {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  padding: v.$space-md;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font: inherit;
  border-bottom: 1px solid v.$color-border-dim;
  transition: background-color v.$transition-fast;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: v.$color-bg-hover;
  }
}

.map-search-suggestion-address {
  margin-top: v.$space-2xs;
}

.map-search-empty {
  margin: 0;
  padding: v.$space-md;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity v.$transition-fast, transform v.$transition-fast;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
