import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/LoginView.vue';
import AdminPanel from '../views/AdminPanel.vue';
import Dashboard from '../views/DashboardView.vue';
import ProjectsView from '@/views/ProjectsView.vue';
import ManagerDashboard from '@/views/ManagerDashboard.vue';
import ExecutorView from '@/views/ExecutorView.vue';
import realApi from '../../api/realApi.js';

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
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
    meta: { requiresAuth: true, requiredRole: 'manager' }
  },
  {
    path: '/executor',
    name: 'ExecutorView',
    component: ExecutorView,
    meta: { requiresAuth: true, requiredRole: 'executor' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Упрощенный навигационный гард
router.beforeEach(async (to, from, next) => {
  // Пропускаем публичные страницы
  if (!to.meta.requiresAuth) {
    next();
    return;
  }

  // Проверяем токен в localStorage (а не sessionStorage)
  const authToken = localStorage.getItem('authToken');
  
  if (!authToken) {
    next('/');
    return;
  }

  try {
    const currentUser = await realApi.getCurrentUser(authToken);
    
    // Проверяем роль только если она требуется для маршрута
    if (to.meta.requiredRole && currentUser.role !== to.meta.requiredRole) {
      // Перенаправляем на страницу по умолчанию для роли
      const defaultRoute = {
        admin: '/admin',
        manager: '/manager',
        executor: '/executor'
      }[currentUser.role] || '/';
      
      next(defaultRoute);
      return;
    }
    
    next();
  } catch (err) {
    console.error('Auth check failed:', err);
    localStorage.removeItem('authToken');
    next('/');
  }
});

export default router;