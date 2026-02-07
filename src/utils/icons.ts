/**
 * MDI 아이콘 사용을 위한 유틸리티
 * 
 * 사용 방법:
 * 1. @mdi/js에서 원하는 아이콘을 import
 * 2. Icon 컴포넌트에 path prop으로 전달
 * 
 * 예시:
 * ```vue
 * <script setup>
 * import Icon from '@/components/Icon.vue'
 * import { mdiHome, mdiAccount } from '@mdi/js'
 * </script>
 * 
 * <template>
 *   <Icon :path="mdiHome" />
 *   <Icon :path="mdiAccount" size="24" color="#ff0000" />
 * </template>
 * ```
 */

// 자주 사용하는 아이콘들을 여기에 모아두면 편리합니다
export { mdiHome, mdiAccount, mdiClose, mdiMenu, mdiMagnify, mdiHeart, mdiHeartOutline } from '@mdi/js'
