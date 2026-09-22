import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import './assets/styles/main.css'
import { i18n } from './i18n'
import router from './router'

createApp(App).use(createPinia()).use(i18n).use(router).mount('#app')
