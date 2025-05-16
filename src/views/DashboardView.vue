<template>
  <div class="dashboard-page">
    <div class="dashboard-container">
      <h1>Добро пожаловать, {{ username }}!</h1>
      <p>Это ваша личная панель управления</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const username = ref('');

onMounted(() => {
  const authData = JSON.parse(localStorage.getItem('auth'));
  if (authData) {
    username.value = authData.username;
  }
});
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 50, 0.1);
  text-align: center;
}

h1 {
  color: #004080;
  margin-bottom: 1rem;
}
</style>