import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Vue3Toastify, { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
const app = createApp(App)
app.use(Vue3Toastify, {
  autoClose: 3000,
});
app.use(router)
export { toast };
app.mount('#app')
