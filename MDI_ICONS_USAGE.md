# Material Design Icons (MDI) 사용 가이드

이 프로젝트에서 Material Design Icons를 사용하는 방법입니다.

## 설치 완료

`@mdi/js` 패키지가 이미 설치되어 있습니다.

## 사용 방법

### 1. 기본 사용법

```vue
<script setup>
import Icon from '@/components/Icon.vue'
import { mdiHome } from '@mdi/js'
</script>

<template>
  <Icon :path="mdiHome" />
</template>
```

### 2. 크기와 색상 지정

```vue
<script setup>
import Icon from '@/components/Icon.vue'
import { mdiAccount } from '@mdi/js'
</script>

<template>
  <!-- 픽셀 크기 지정 -->
  <Icon :path="mdiAccount" :size="24" />
  
  <!-- CSS 단위 사용 -->
  <Icon :path="mdiAccount" size="2rem" />
  
  <!-- 색상 지정 -->
  <Icon :path="mdiAccount" color="#ff0000" />
  
  <!-- currentColor 사용 (부모 요소의 색상 상속) -->
  <Icon :path="mdiAccount" color="currentColor" />
</template>
```

### 3. 기존 스타일 클래스와 함께 사용

```vue
<template>
  <!-- icon-base, icon-lg 등의 클래스가 자동으로 적용됩니다 -->
  <Icon :path="mdiHome" class="icon-lg" />
</template>
```

### 4. 아이콘 찾기

1. [Material Design Icons 웹사이트](https://pictogrammers.com/library/mdi/)에서 원하는 아이콘 검색
2. 아이콘 이름 확인 (예: "home" → `mdiHome`)
3. `@mdi/js`에서 import:

```typescript
import { mdiHome, mdiAccount, mdiHeart } from '@mdi/js'
```

### 5. 실제 사용 예시

#### 기존 코드 (텍스트 아이콘)를 MDI로 교체:

**이전:**
```vue
<button>×</button>
```

**이후:**
```vue
<script setup>
import Icon from '@/components/Icon.vue'
import { mdiClose } from '@mdi/js'
</script>

<template>
  <button>
    <Icon :path="mdiClose" />
  </button>
</template>
```

**이전:**
```vue
<button>{{ isFavorited ? '♥' : '♡' }}</button>
```

**이후:**
```vue
<script setup>
import Icon from '@/components/Icon.vue'
import { mdiHeart, mdiHeartOutline } from '@mdi/js'
</script>

<template>
  <button>
    <Icon :path="isFavorited ? mdiHeart : mdiHeartOutline" />
  </button>
</template>
```

## 자주 사용하는 아이콘

`src/utils/icons.ts` 파일에 자주 사용하는 아이콘들을 모아두었습니다. 필요에 따라 추가하세요.

```typescript
// src/utils/icons.ts에서 import
import { mdiHome, mdiAccount } from '@/utils/icons'
```

## 아이콘 크기 유틸리티

프로젝트의 `_icon.scss`에 정의된 크기 클래스를 사용할 수 있습니다:

- `icon-xs`
- `icon-sm`
- `icon-base` (기본값)
- `icon-md`
- `icon-lg`
- `icon-xl`
- `icon-2xl`

```vue
<Icon :path="mdiHome" class="icon-lg" />
```

## 참고 자료

- [MDI 공식 웹사이트](https://pictogrammers.com/library/mdi/)
- [@mdi/js 패키지 문서](https://www.npmjs.com/package/@mdi/js)
