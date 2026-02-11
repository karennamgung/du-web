import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/utilities.scss'

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
