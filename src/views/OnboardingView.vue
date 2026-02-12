<template>
  <div class="onboarding-container">
    <div class="onboarding-header">
      <h2 class="onboarding-title">{{ currentStepConfig.title }}</h2>
    </div>

    <div class="onboarding-content">
      <div v-if="!currentStepConfig">
        <p>로딩 중...</p>
      </div>
      <template v-else>
        <div class="onboarding-step">
          <p>{{ currentStepConfig.description }}</p>
          <component
            ref="stepRef"
            :is="currentStepConfig.component"
            :onboarding-data="onboardingData"
            @update-data="handleUpdateData"
            @next="handleNext"
            @complete="handleStepComplete"
          />
        </div>
      </template>
    </div>

    <div class="onboarding-footer">
            <button
              v-if="currentStep > 0"
              type="button"
              class="btn btn-outline"
              aria-label="뒤로가기"
              @click="goBack"
            >
              이전
            </button>
            <button
              type="button"
              class="btn btn-primary w-full"
              :disabled="!stepCanProceed"
              @click="onPrimaryAction"
            >
              {{ isLastStep ? "완료" : "다음" }}
            </button>
          </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useProfileStore, type ProfileUpsertPayload } from "@/stores/profile";
import OnboardingStepTerms from "@/components/onboarding/OnboardingStepTerms.vue";
import OnboardingStepUserType from "@/components/onboarding/OnboardingStepUserType.vue";
import OnboardingStepProfile from "@/components/onboarding/OnboardingStepProfile.vue";
import OnboardingStepResidence from "@/components/onboarding/OnboardingStepResidence.vue";
import OnboardingStepChildren from "@/components/onboarding/OnboardingStepChildren.vue";

interface OnboardingData {
  termsAgreed: boolean;
  userType: "parent" | "student" | "academy" | null;
  nickname: string;
  profileImageUrl: string | null;
  residence: string | null;
  children: Array<{
    name: string;
    age: number;
    gender: "male" | "female" | null;
  }>;
}

interface StepConfig {
  title: string;
  description: string;
  component: object;
}

const router = useRouter();
const auth = useAuthStore();
const profile = useProfileStore();

const stepRef = ref<{
  requestNext: () => void;
  canProceed?: { value: boolean };
} | null>(null);
const currentStep = ref(0);
const onboardingData = ref<OnboardingData>({
  termsAgreed: false,
  userType: null,
  nickname: "",
  profileImageUrl: null,
  residence: null,
  children: [],
});

const steps = computed((): StepConfig[] => {
  const baseSteps: StepConfig[] = [
    {
      title: "약관에 동의해주세요",
      description: "서비스 이용을 위해 약관에 동의가 필요합니다.",
      component: OnboardingStepTerms,
    },
    {
      title: "돼지언니와 처음 만나셨네요.\n환영해요.",
      description: "어떤 유형인지 알려주세요.",
      component: OnboardingStepUserType,
    },
    {
      title: "프로필을 만들어보세요",
      description:
        "돼지언니와 함께 할 나의 프로필이예요.",
      component: OnboardingStepProfile,
    },
    {
      title: "거주지를 알려주세요",
      description: "맞춤형 교육 정보를 제공하기 위해 거주 지역이 필요해요.",
      component: OnboardingStepResidence,
    },
  ];

  if (onboardingData.value.userType === "parent") {
    baseSteps.push({
      title: "아이를 등록해주세요",
      description: "맞춤형 교육 정보를 제공하기 위해 아이 정보가 필요해요.",
      component: OnboardingStepChildren,
    });
  }

  return baseSteps;
});

const currentStepConfig = computed(
  () => steps.value[currentStep.value] ?? null,
);

const isLastStep = computed(
  () => currentStep.value >= steps.value.length - 1 && steps.value.length > 0,
);

const stepCanProceed = computed(() => stepRef.value?.canProceed?.value ?? true);

function onPrimaryAction() {
  stepRef.value?.requestNext();
}

function goBack() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function handleUpdateData(data: Partial<OnboardingData>) {
  onboardingData.value = { ...onboardingData.value, ...data };
}

// userType이 변경되면 스텝 조정
watch(
  () => onboardingData.value.userType,
  (newType, oldType) => {
    // userType이 설정되고 현재 스텝이 프로필 이전이면 프로필 스텝으로 이동
    if (newType && !oldType && currentStep.value < 2) {
      // 이미 유형 선택 스텝을 지났으므로 그대로 진행
    }
    // 학부모가 아닌데 아이 등록 스텝에 있으면 이전 스텝으로
    if (newType !== "parent" && currentStep.value >= steps.value.length - 1) {
      currentStep.value = steps.value.length - 2;
    }
  },
);

function handleNext() {
  console.log("[OnboardingView] handleNext 호출:", {
    currentStep: currentStep.value,
    totalSteps: steps.value.length,
    userType: onboardingData.value.userType,
    isLastStep: currentStep.value >= steps.value.length - 1,
  });

  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++;
    console.log("[OnboardingView] 다음 스텝으로 이동:", currentStep.value);
  } else {
    console.log("[OnboardingView] 마지막 스텝, 완료 처리");
    handleComplete();
  }
}

function handleStepComplete() {
  console.log("[OnboardingView] handleStepComplete 호출 (아이 등록 완료)");
  // 아이 등록 단계에서 완료 이벤트가 발생하면 온보딩 전체 완료
  handleComplete();
}

async function handleComplete() {
  if (!auth.user?.id) {
    console.error("[OnboardingView] 완료 시도했지만 인증되지 않음");
    alert("온보딩을 완료하려면 로그인이 필요합니다.");
    // 로그인 모달을 열거나 로그인 페이지로 리디렉션
    return;
  }

  console.log("[OnboardingView] 온보딩 완료 시작:", {
    userType: onboardingData.value.userType,
    nickname: onboardingData.value.nickname,
    hasResidence: !!onboardingData.value.residence,
    hasProfileImage: !!onboardingData.value.profileImageUrl,
    childrenCount: onboardingData.value.children.length,
  });

  try {
    // 필수 필드 검증
    if (!onboardingData.value.userType) {
      throw new Error("사용자 유형을 선택해주세요.");
    }
    if (!onboardingData.value.nickname.trim()) {
      throw new Error("별명을 입력해주세요.");
    }

    // 프로필 저장 (Supabase는 profile 스토어의 upsertProfile에서 수행)
    const profilePayload: ProfileUpsertPayload = {
      id: auth.user.id,
      user_id: auth.user.id,
      user_type: onboardingData.value.userType,
      nickname: onboardingData.value.nickname.trim(),
      residence: onboardingData.value.residence || null,
      onboarding_completed: true,
      profile_image_url: onboardingData.value.profileImageUrl ?? null,
      children:
        onboardingData.value.userType === "parent"
          ? onboardingData.value.children
              .filter((child) => child.name.trim().length > 0)
              .map((child) => ({
                name: child.name.trim(),
                age: child.age,
                gender: child.gender,
              }))
          : [],
    };

    if (profilePayload.children && profilePayload.children.length > 0) {
      console.log("[OnboardingView] 아이 정보 포함:", profilePayload.children);
    }
    console.log("[OnboardingView] 프로필 저장 시도:", profilePayload);
    await profile.upsertProfile(profilePayload);
    console.log("[OnboardingView] 프로필 저장 및 스토어 새로고침 완료");

    // 리디렉션
    console.log(
      "[OnboardingView] 리디렉션 시작:",
      onboardingData.value.userType,
    );
    if (onboardingData.value.userType === "academy") {
      router.push("/admin");
    } else {
      router.push("/");
    }
  } catch (error) {
    console.error("[OnboardingView] 온보딩 완료 실패:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "온보딩 완료 중 오류가 발생했습니다.";
    alert(errorMessage + "\n\n콘솔을 확인해주세요.");
  }
}

onMounted(() => {
  console.log("[OnboardingView] 마운트됨", {
    authenticated: auth.isAuthenticated,
    hasProfile: !!profile.profile,
    onboardingCompleted: profile.isOnboardingCompleted,
  });

  // 인증되지 않은 사용자도 온보딩 페이지는 볼 수 있음
  // 하지만 완료하려면 로그인이 필요함
});
</script>

<style lang="scss" scoped>
.onboarding-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 600px;
  padding: v.$space-lg;
  margin: 0 auto;
  background-color: v.$color-bg-base;
}

.onboarding-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.onboarding-title {
  margin: 0;
  white-space: pre-line;
}

.onboarding-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-top: v.$space-xl;
  width: 100%;
}

.onboarding-step {
  display: flex;
  flex-direction: column;
  gap: v.$space-sm;
  flex: 1;
}

.onboarding-footer {
  display: flex;
  margin-top: auto;
  padding-top: v.$space-xl;
  gap: v.$space-sm;
}
</style>
