<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-box">
        <h1>Вход в систему</h1>
        <form @submit.prevent="login">
          <input
            type="text"
            v-model="username"
            placeholder="Логин"
            required
          />
          <input
            type="password"
            v-model="password"
            placeholder="Пароль"
            required
          />
          <button type="submit">Войти</button>
        </form>
        <p v-if="error" class="error-message">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
//import mockApi from '..//..//api/mockApi.js';
import realApi from '..//..//api/realApi.js';
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');

// Функция для создания моковых данных



async function login() {
    try {
    // 1. Получаем токен
    const authResponse = await realApi.login({
      login: username.value,
      password: password.value
    });

    // 2. Сохраняем токен
    localStorage.setItem('authToken', authResponse.access_token);
    
    // 3. Получаем полные данные пользователя
    const currentUser = await realApi.getCurrentUser(authResponse.access_token);
    console.log('Current user data:', currentUser);
    
    // 4. Проверяем роль из токена (как fallback)
    const tokenPayload = JSON.parse(atob(authResponse.access_token.split('.')[1]));
    const tokenRole = tokenPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    console.log('Role from token:', tokenRole);
    
    // 5. Определяем приоритетную роль
    const effectiveRole = currentUser.role || tokenRole || 'executor';
    
    // 6. Сохраняем пользователя
    sessionStorage.setItem('currentUser', JSON.stringify({
      ...currentUser,
      role: effectiveRole
    }));
    
    // 7. Перенаправляем
    switch (effectiveRole.toLowerCase()) {
      case 'admin':
        console.log('Redirecting to /admin');
        router.push('/admin');
        break;
      case 'manager':
        console.log('Redirecting to /manager');
        router.push('/manager');
        break;
      default:
        console.log('Redirecting to /executor');
        router.push('/executor');
    }
    
  } catch (err) {
    console.error('Login error:', err);
    error.value = err.message || 'Ошибка авторизации';
  }
}

</script>

<style scoped>
.login-page {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #007bff;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.login-box {
  background-color: white;
  padding: 2rem 3rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 50, 0.2);
  width: 100%;
  max-width: 400px;
  text-align: center;
}

h1 {
  margin-bottom: 1.5rem;
  color: #004080;
}

form input {
  width: 100%;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border: 1px solid #b0c4de;
  border-radius: 8px;
  font-size: 1rem;
  box-sizing: border-box;
}

form input:focus {
  border-color: #0056b3;
  outline: none;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #007bff;
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

button:hover {
  background-color: #0056b3;
}

.error-message {
  color: red;
  margin-top: 1rem;
  font-size: 0.9rem;
}
</style>