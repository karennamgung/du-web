import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/utilities.scss'

// Android: line-height 내 텍스트가 아래로 치우쳐 보이는 폰트 메트릭 보정 (utilities.scss --leading-trim-y)
if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
  document.documentElement.style.setProperty('--leading-trim-y', '-0.02em')
}

const app = createApp(App)
app.config.errorHandler = (err, instance, info) => {
  console.error('[DU]', info, err)
  const el = document.getElementById('app')
  if (el && !el.querySelector('.du-error-fallback')) {
    const fallback = document.createElement('div')
    fallback.className = 'du-error-fallback'
    fallback.setAttribute('style', 'padding:1rem;font-family:sans-serif;color:#c00;white-space:pre-wrap;')
    fallback.textContent = `오류: ${err instanceof Error ? err.message : String(err)}\n\n브라우저 개발자도구(F12) → Console 탭에서 자세한 내용을 확인하세요.`
    el.appendChild(fallback)
  }
}
app.use(createPinia())
app.use(router)
app.mount('#app')
