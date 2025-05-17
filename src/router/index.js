import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/LoginView.vue';
import AdminPanel from '../views/AdminPanel.vue';
import Dashboard from '../views/DashboardView.vue';
import mockApi from '../../api/mockApi.js';
import realApi from '../../api/realApi.js';
import ProjectsView from '@/views/ProjectsView.vue';
import ManagerDashboard from '@/views/ManagerDashboard.vue'
import ExecutorView from '@/views/ExecutorView.vue';
const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPanel,
    meta: { requiresAuth: true, requiredRole: 'admin' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/manager',
    name: 'ManagerDashboard',
    component: ManagerDashboard,
    meta: { requiresAuth: true }
  },
  {
  path: '/executor',
  name: 'ExecutorView',
  component: ExecutorView,
  meta: { requiresAuth: true}
}

];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Навигационный гард для проверки авторизации
router.beforeEach(async (to, from, next) => {
  const authToken = sessionStorage.getItem('authToken');
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authToken) {
      next('/');
      return;
    }
    
    try {
      const currentUser = await realApi.getCurrentUser(authToken);
      
      if (to.meta.requiredRole && currentUser.role !== to.meta.requiredRole) {
        // Перенаправляем на страницу согласно роли
        switch (currentUser.role) {
          case 'admin': next('/admin'); break;
          case 'manager': next('/manager'); break;
          case 'executor': next('/executor'); break;
          default: next('/');
        }
        return;
      }
      
      next();
    } catch (err) {
      console.error('Ошибка проверки авторизации:', err);
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('currentUser');
      next('/');
    }
  } else {
    next();
  }
});

export default router;
