import axios from 'axios'

// 1. Создаем экземпляр Axios с настройками
const api = axios.create({
  baseURL: '', // Замени на URL твоего API
  headers: {
    'Content-Type': 'application/json', // Указываем, что работаем с JSON
  },
})

// 2. Добавляем интерсептор для автоматической подстановки токена
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}` // Токен в формате "Bearer {token}"
  }
  return config
})

// 3. Экспортируем объект api для использования в компонентах
export default api