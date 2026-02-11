<template>
  <div class="profile-card">
    <label
      v-if="showSelector"
      class="radio-selector mt-2xs"
      :aria-label="`${cardTitle} 선택`"
      @click="$emit('select')"
    >
      <input
        type="radio"
        class="radio-selector__input"
        name="profile-card-select"
        :value="selectValue"
        :checked="selected"
        @change="$emit('select')"
      />
      <span class="radio-selector__dot" aria-hidden="true" />
    </label>
    <div
      class="profile-card-content"
      role="button"
      tabindex="0"
      aria-label="카드 선택"
      @click="onContentClick"
      @keydown.enter.space.prevent="onContentClick"
    >
      <!-- 상단 우측: 비수정 시 삭제(자녀만)·연필(수정), 수정 시 취소·저장 -->
      <div v-if="showEdit || isEditing" class="card-actions-top">
        <template v-if="!isEditing">
          <button
            v-if="variant === 'child' && showDelete"
            type="button"
            class="btn btn-icon-only color-dim"
            aria-label="삭제"
            @click.stop="$emit('delete')"
          >
            <Icon class="icon-sm" :path="mdiTrashCanOutline" />
          </button>
          <button
            type="button"
            class="btn btn-icon-only color-dim"
            aria-label="수정"
            @click.stop="$emit('edit')"
          >
            <Icon class="icon-sm" :path="mdiPencilOutline" />
          </button>
        </template>
        <template v-else>
          <button
            type="button"
            class="btn btn-icon-only color-dim"
            aria-label="취소"
            @click.stop="$emit('cancel')"
          >
            <Icon class="icon-sm" :path="mdiClose" />
          </button>
          <button
            type="button"
            class="btn btn-icon-only color-dim"
            :disabled="!canSaveCurrent"
            aria-label="저장"
            @click.stop="$emit('save')"
          >
            <Icon class="icon-sm" :path="mdiCheck" />
          </button>
        </template>
      </div>

      <!-- 카드 최상단 라벨: 학부모·학생=primary, 자녀(첫째·둘째...)=gray — elevated 구역 밖 -->
      <Tag
        :label="cardTitle"
        :variant="variant === 'child' ? 'gray' : 'primary'"
        size="small"
        class="mb-sm"
      />

      <!-- 편집 시 배경 적용 구역: 닉네임/자녀 폼만 -->
      <div
        v-if="cardRows.length"
        class="profile-card-content__body"
        :class="{ 'profile-card-content__body--elevated': isEditing || withCardStyle }"
      >
        <div class="card-rows">
          <div v-for="row in cardRows" :key="row.key" class="card-row">
            <span class="text-caption">{{ row.label }}</span>
            <template v-if="!isEditing">
              <p class="type-weight-medium">{{ row.display }}</p>
            </template>
            <template v-else-if="row.type === 'text'">
              <input
                :key="`text-${row.key}`"
                :model-value="row.editValue"
                type="text"
                :placeholder="row.placeholder"
                class="input-underline"
                @input="row.onInput(($event.target as HTMLInputElement).value)"
                @click.stop
              />
            </template>
            <template v-else-if="row.type === 'number'">
              <span class="input-underline-group" @click.stop>
                <span class="input-underline-prefix">만</span>
                <input
                  :key="`number-${row.key}`"
                  :model-value="row.editValue"
                  type="number"
                  class="input-underline"
                  :placeholder="row.placeholder"
                  :min="row.min"
                  :max="row.max"
                  @input="
                    row.onInput(
                      Number(($event.target as HTMLInputElement).value),
                    )
                  "
                />
                <span class="input-underline-suffix">세</span>
              </span>
            </template>
            <template v-else-if="row.type === 'gender'">
              <div class="radio-selector-group" @click.stop>
                <label class="radio-selector radio-selector--with-label">
                  <span class="radio-selector__circle">
                    <input
                      type="radio"
                      class="radio-selector__input"
                      :name="row.radioName"
                      value="male"
                      :checked="row.genderValue === 'male'"
                      @change="row.onGender('male')"
                    />
                    <span class="radio-selector__dot" aria-hidden="true" />
                  </span>
                  <span class="radio-selector__label">남아</span>
                </label>
                <label class="radio-selector radio-selector--with-label">
                  <span class="radio-selector__circle">
                    <input
                      type="radio"
                      class="radio-selector__input"
                      :name="row.radioName"
                      value="female"
                      :checked="row.genderValue === 'female'"
                      @change="row.onGender('female')"
                    />
                    <span class="radio-selector__dot" aria-hidden="true" />
                  </span>
                  <span class="radio-selector__label">여아</span>
                </label>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "@/components/shared/Icon.vue";
import Tag from "@/components/shared/Tag.vue";
import { getUserTypeLabel } from "@/stores/profile";
import {
  mdiPencilOutline,
  mdiClose,
  mdiCheck,
  mdiTrashCanOutline,
} from "@mdi/js";

const props = withDefaults(
  defineProps<{
    variant: "parent" | "student" | "child";
    selected?: boolean;
    showEdit?: boolean;
    showSelector?: boolean;
    selectValue?: string;
    isEditing?: boolean;
    nickname?: string;
    profileForm?: { nickname: string };
    canSaveProfile?: boolean;
    child?: { name: string; age: number; gender: "male" | "female" | null };
    orderLabel?: string;
    childForm?: { name: string; age: number; gender: "male" | "female" | null };
    canSaveChild?: boolean;
    currentYear?: number;
    showDelete?: boolean;
    /** true면 배경색·border-radius 적용 (자녀 추가하기 카드 등) */
    withCardStyle?: boolean;
  }>(),
  {
    selected: false,
    withCardStyle: false,
    showEdit: false,
    showSelector: true,
    isEditing: false,
    showDelete: false,
    profileForm: () => ({ nickname: "" }),
    canSaveProfile: false,
    childForm: () => ({ name: "", age: 0, gender: null }),
    canSaveChild: false,
    currentYear: () => new Date().getFullYear(),
  },
);

const emit = defineEmits<{
  select: [];
  edit: [];
  save: [];
  cancel: [];
  delete: [];
  "update:profileForm": [v: { nickname: string }];
  "update:childForm": [
    v: { name: string; age: number; gender: "male" | "female" | null },
  ];
}>();

/** 카드 최상단 라벨: 학부모 / 학생 / 첫째 아이·둘째 아이·셋째 아이 */
const cardTitle = computed(() => {
  if (props.variant === "child") return props.orderLabel ?? "";
  return getUserTypeLabel(props.variant as "parent" | "student");
});

interface CardRowBase {
  key: string;
  label: string;
  display: string;
}
interface CardRowText extends CardRowBase {
  type: "text";
  editValue: string;
  placeholder?: string;
  onInput: (v: string) => void;
}
interface CardRowNumber extends CardRowBase {
  type: "number";
  editValue: number;
  min: number;
  max: number;
  placeholder?: string;
  onInput: (v: number) => void;
}
interface CardRowGender extends CardRowBase {
  type: "gender";
  radioName: string;
  genderValue: "male" | "female" | null;
  onGender: (v: "male" | "female" | null) => void;
}
type CardRow = CardRowText | CardRowNumber | CardRowGender;

/** 좌 라벨 / 우 값 또는 입력 필드용 행 목록. 수정 시에는 항상 profileForm/childForm 값을 사용 */
const cardRows = computed<CardRow[]>(() => {
  if (props.variant === "parent" || props.variant === "student") {
    const saved = props.nickname ?? "";
    const fromForm = props.profileForm?.nickname ?? "";
    return [
      {
        key: "nickname",
        label: "닉네임",
        display: saved,
        type: "text",
        editValue: fromForm || saved,
        placeholder: saved || "닉네임",
        onInput: (v) =>
          emit("update:profileForm", { ...props.profileForm!, nickname: v }),
      },
    ];
  }
  if (props.variant === "child" && (props.child || props.isEditing)) {
    const c = props.child;
    const f = props.childForm!;
    return [
      {
        key: "name",
        label: "닉네임",
        display: c?.name ?? "",
        type: "text",
        editValue: f.name ?? "",
        placeholder: c?.name?.trim() || "" || "닉네임",
        onInput: (v) => emit("update:childForm", { ...f, name: v }),
      },
      {
        key: "age",
        label: "나이",
        display:
          c != null && typeof c.age === "number"
            ? `만 ${c.age}세 (${(props.currentYear ?? new Date().getFullYear()) - c.age}년생)`
            : "",
        type: "number",
        editValue: typeof f.age === "number" ? f.age : 0,
        min: 0,
        max: 100,
        placeholder: typeof c?.age === "number" ? String(c.age) : "나이",
        onInput: (ageNum) => emit("update:childForm", { ...f, age: ageNum }),
      },
      {
        key: "gender",
        label: "성별",
        display: c
          ? c.gender === "male"
            ? "남아"
            : c.gender === "female"
              ? "여아"
              : "—"
          : "",
        type: "gender",
        radioName: `profile-gender-${props.selectValue ?? "child"}`,
        genderValue: f.gender ?? null,
        onGender: (v) => emit("update:childForm", { ...f, gender: v }),
      },
    ];
  }
  return [];
});

const canSaveCurrent = computed(() => {
  if (props.variant === "parent" || props.variant === "student")
    return props.canSaveProfile ?? false;
  return props.canSaveChild ?? false;
});

function onContentClick() {
  if (props.showSelector) {
    emit("select");
  }
}
</script>

<style lang="scss" scoped>
.profile-card {
  display: flex;
  align-items: flex-start;
  gap: v.$space-md;
  padding: 0 0 0 v.$space-3xl;

  text-align: left;

  &--elevated {
    background-color: v.$color-bg-dimmer;
    border-radius: v.$radius-md;
  }
}

.profile-card-content {
  flex: 1;
  min-width: 0;
  position: relative;
  cursor: default;
}

.profile-card-content__body {
  &--elevated {
    background-color: v.$color-bg-dimmer;
    border-radius: v.$radius-md;
    padding: v.$space-lg;
  }
}

.profile-card-content[role="button"] {
  cursor: pointer;
}

.card-actions-top {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: v.$space-md;
}

.card-rows {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: v.$space-sm;
}

.card-row {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
}
</style>
