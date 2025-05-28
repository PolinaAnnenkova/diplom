// Ключи для localStorage
const STORAGE_KEYS = {
  USERS: 'mock_users_data',
  PROJECTS: 'mock_projects_data',
  TASKS: 'mock_tasks_data',
  TIME_ENTRIES: 'mock_time_entries_data'
};

// Вспомогательные функции
const getData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const basePath = "http://localhost:5100/";
const usersPath = basePath + "users/";
const projectsPath = basePath + "projects/";
const tasksPath = basePath + "tasks/";
const entriesPath = basePath + "entries/";
const rolesPath = basePath + "roles/";
const loginPath = basePath + "login/";
let token = null;

const commonHeaders = {
  Accept: 'application/json',
};
const commonOptions = {
  headers: commonHeaders
};

const fetchApi = async function(url, options) {
  // const effectiveUrl = baseUrl + url;
  const effectiveOptions = {
    ...commonOptions,
    ...options
  };
  return fetch(url, effectiveOptions);
}

const makeFetcher = function(path) {
  return async function(relPath, options) {
    const effectivePath = path + relPath;
    return fetchApi(effectivePath, options);
  }
}

const usersFetch = makeFetcher(usersPath);
const projectsFetch = makeFetcher(projectsPath);
const tasksFetch = makeFetcher(tasksPath);
const entriesFetch = makeFetcher(entriesPath);
const rolesFetch = makeFetcher(rolesPath);
const loginFetch = makeFetcher(loginPath);

function userSanitizer(user) {
   // Если роль уже есть в данных пользователя - используем её
    if (!user.role) {
        // Проверяем стандартные поля
        if (user.isAdmin) {
            user.role = "admin";
        } else if (user.isManager) {
            user.role = "manager";
        } else {
            // Если нет явных указаний - ставим executor
            user.role = "executor";
        }
    }
    console.log('Sanitized user role:', user.role); // Отладочный вывод
    return user;
}

function getTokenImpl() {
  return localStorage.getItem("auth_token");
}

function authHeader() {
  const tok = getTokenImpl();
  if (!tok) throw new Error("Необходима авторизация");
  return {
    Authorization: `Bearer ${tok}`
  }
}

async function getUserByIdImpl(id) {
  const hdrs = {
    headers: {
      ...commonHeaders,
      ...authHeader()
    }
  }
  console.log(hdrs);
  const resp = await usersFetch(`${id}`, hdrs);
  if (!resp.ok) throw new Error('Ошибка запроса');
  const user = await resp.json();
  if (!user) throw new Error('Пользователь не найден');
  userSanitizer(user);
  return user;
}


export default {
  // ==================== Аутентификация ====================
  async login(credentials) {
    const resp = await loginFetch(`${credentials.login}?password=${credentials.password}`, {method: 'POST'});
    if (!resp.ok) throw new Error('Неверные учетные данные');
    const user = await resp.json();
    localStorage.setItem("auth_token", user.access_token)
    userSanitizer(user)
    return user;
    // const users = getData(STORAGE_KEYS.USERS);
    // const user = users.find(u => 
    //   u.login === credentials.login && 
    //   u.password === credentials.password
    // );
    // if (!user) throw new Error('Неверные учетные данные');
    // return { ...user, token: `mock-token-${user.id}` };
  },

  //async getUserById(id) {
   // return await getUserByIdImpl(id);
  //},

  async getCurrentUser(token) {
    if (!token) throw new Error('Требуется авторизация');
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    console.log(payload);
    const user = await getUserByIdImpl(payload.uid);
    userSanitizer(user);
    if (!user) throw new Error('Пользователь не найден');
    return user;
  },

  async logout() {
    await simulateNetworkDelay();
    return { success: true };
  },

  // ==================== Пользователи ====================
  async getUsers() {
    await simulateNetworkDelay();
    return getData(STORAGE_KEYS.USERS).map(({ password, ...user }) => user);
  },


  async createUser(userData) {
    await simulateNetworkDelay();
    const users = getData(STORAGE_KEYS.USERS);
    const newUser = {
      ...userData,
      id: generateId(users)
    };
    users.push(newUser);
    saveData(STORAGE_KEYS.USERS, users);
    return newUser;
  },

  async updateUser(id, updates) {
    await simulateNetworkDelay();
    const users = getData(STORAGE_KEYS.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index === -1) throw new Error('Пользователь не найден');
    users[index] = { ...users[index], ...updates };
    saveData(STORAGE_KEYS.USERS, users);
    return users[index];
  },

  async deleteUser(id) {
    await simulateNetworkDelay();
    const users = getData(STORAGE_KEYS.USERS);
    const filteredUsers = users.filter(u => u.id !== id);
    if (users.length === filteredUsers.length) {
      throw new Error('Пользователь не найден');
    }
    saveData(STORAGE_KEYS.USERS, filteredUsers);
    return { success: true };
  },

  // ==================== Проекты ====================
  async getProjects() {
    await simulateNetworkDelay();
    return getData(STORAGE_KEYS.PROJECTS);
  },

  async getProjectById(id) {
    await simulateNetworkDelay();
    const project = getData(STORAGE_KEYS.PROJECTS).find(p => p.id === id);
    if (!project) throw new Error('Проект не найден');
    return project;
  },

  async createProject(projectData) {
    await simulateNetworkDelay();
    const projects = getData(STORAGE_KEYS.PROJECTS);
    const newProject = {
      ...projectData,
      id: generateId(projects)
    };
    projects.push(newProject);
    saveData(STORAGE_KEYS.PROJECTS, projects);
    return newProject;
  },

  async updateProject(id, updates) {
    await simulateNetworkDelay();
    const projects = getData(STORAGE_KEYS.PROJECTS);
    const index = projects.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Проект не найден');
    projects[index] = { ...projects[index], ...updates };
    saveData(STORAGE_KEYS.PROJECTS, projects);
    return projects[index];
  },

  async deleteProject(id) {
    await simulateNetworkDelay();
    const projects = getData(STORAGE_KEYS.PROJECTS);
    const filteredProjects = projects.filter(p => p.id !== id);
    if (projects.length === filteredProjects.length) {
      throw new Error('Проект не найден');
    }
    saveData(STORAGE_KEYS.PROJECTS, filteredProjects);
    return { success: true };
  },

  // ==================== Задачи ====================
  async getTasks() {
    await simulateNetworkDelay();
    return getData(STORAGE_KEYS.TASKS);
  },

  async getTaskById(id) {
    await simulateNetworkDelay();
    const task = getData(STORAGE_KEYS.TASKS).find(t => t.id === id);
    if (!task) throw new Error('Задача не найдена');
    return task;
  },

  async createTask(taskData) {
    await simulateNetworkDelay();
    const tasks = getData(STORAGE_KEYS.TASKS);
    const newTask = {
      ...taskData,
      id: generateId(tasks)
    };
    tasks.push(newTask);
    saveData(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  async updateTask(id, updates) {
    await simulateNetworkDelay();
    const tasks = getData(STORAGE_KEYS.TASKS);
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Задача не найдена');
    tasks[index] = { ...tasks[index], ...updates };
    saveData(STORAGE_KEYS.TASKS, tasks);
    return tasks[index];
  },

  async deleteTask(id) {
    await simulateNetworkDelay();
    const tasks = getData(STORAGE_KEYS.TASKS);
    const filteredTasks = tasks.filter(t => t.id !== id);
    if (tasks.length === filteredTasks.length) {
      throw new Error('Задача не найдена');
    }
    saveData(STORAGE_KEYS.TASKS, filteredTasks);
    return { success: true };
  },

  // ==================== Проводки (Time Entries) ====================
  async getTimeEntries() {
    await simulateNetworkDelay();
    return getData(STORAGE_KEYS.TIME_ENTRIES);
  },

  async getTimeEntryById(id) {
    await simulateNetworkDelay();
    const entry = getData(STORAGE_KEYS.TIME_ENTRIES).find(e => e.id === id);
    if (!entry) throw new Error('Проводка не найдена');
    return entry;
  },

  async createTimeEntry(entryData) {
    await simulateNetworkDelay();
    const entries = getData(STORAGE_KEYS.TIME_ENTRIES);
    const newEntry = {
      ...entryData,
      id: generateId(entries),
      date: entryData.date || new Date().toISOString().split('T')[0]
    };
    entries.push(newEntry);
    saveData(STORAGE_KEYS.TIME_ENTRIES, entries);
    return newEntry;
  },

  async updateTimeEntry(id, updates) {
    await simulateNetworkDelay();
    const entries = getData(STORAGE_KEYS.TIME_ENTRIES);
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) throw new Error('Проводка не найдена');
    entries[index] = { ...entries[index], ...updates };
    saveData(STORAGE_KEYS.TIME_ENTRIES, entries);
    return entries[index];
  },

  async deleteTimeEntry(id) {
    await simulateNetworkDelay();
    const entries = getData(STORAGE_KEYS.TIME_ENTRIES);
    const filteredEntries = entries.filter(e => e.id !== id);
    if (entries.length === filteredEntries.length) {
      throw new Error('Проводка не найдена');
    }
    saveData(STORAGE_KEYS.TIME_ENTRIES, filteredEntries);
    return { success: true };
  },
  async getRoles() {
    const hdrs = {
      headers: {
        ...commonHeaders,
        ...authHeader()
      }
    };
    const resp = await fetchApi(basePath + 'roles', hdrs);
    if (!resp.ok) throw new Error('Ошибка загрузки ролей');
    return await resp.json();
  },

 async createRole(name) {
  if (!name) throw new Error("Имя роли обязательно");

  const headers = {
    'Content-Type': 'application/json',
    ...authHeader()
  };

  const queryParams = new URLSearchParams({ name });

  const response = await fetch(`${rolesPath}?${queryParams.toString()}`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.title || 'Ошибка создания роли';
    throw new Error(`Сервер ответил: ${message}`);
  }

  return await response.json(); // Вернёт созданную роль
},

async deleteRole(id) {
  const headers = {
    ...authHeader() // добавляет Authorization: Bearer ...
  };

  const response = await fetch(`${rolesPath}${id}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.title || 'Не удалось удалить роль';
    throw new Error(`Сервер ответил: ${message}`);
  }

  return true;
},
async deleteUser(id) {
  const headers = {
    ...authHeader() // добавляет Authorization: Bearer ...
  };

  const response = await fetch(`${usersPath}${id}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.title || 'Не удалось удалить пользователя';
    throw new Error(`Сервер ответил: ${message}`);
  }

  return true;
},
async deleteTask(id) {
  const headers = {
    ...authHeader() // добавляет Authorization: Bearer ...
  };

  const response = await fetch(`${tasksPath}${id}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.title || 'Не удалось удалить задачу';
    throw new Error(`Сервер ответил: ${message}`);
  }

  return true;
},
async getUsers() {
  const hdrs = {
    headers: {
      ...commonHeaders,
      ...authHeader()
    }
  };
  const resp = await fetchApi(basePath + 'users', hdrs);
  if (!resp.ok) throw new Error('Ошибка загрузки пользователей');
  return await resp.json();
},
async getProjects() {
  try {
    const headers = {
      ...commonHeaders,
      ...authHeader()
    };
    
    const response = await fetch(`${projectsPath}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Ошибка загрузки проектов');
    }

    const projects = await response.json();
    
    // Преобразуем данные из формата API в формат, ожидаемый компонентом
    return projects.map(project => ({
      id: project.code, // или другой уникальный идентификатор, если есть
      code: project.code,
      name: project.name,
      status: project.isActive ? 'active' : 'inactive'
    }));
    
  } catch (error) {
    console.error('Ошибка при загрузке проектов:', error);
    throw error;
  }
},
async getUserById(id) {
  const hdrs = {
    headers: {
      ...commonHeaders,
      ...authHeader()
    }
  };
  const resp = await fetchApi(`${basePath}users/${id}`, hdrs);
  if (!resp.ok) throw new Error(`Ошибка загрузки пользователя с ID ${id}`);
  return await resp.json();
},
 async  registerUser(userData) {
  const headers = {
    'Content-Type': 'application/json',
    ...authHeader() // Добавляем авторизацию, если требуется
  };

  // Формируем параметры запроса
  const queryParams = new URLSearchParams();
  queryParams.append('name', userData.name);
  queryParams.append('password', userData.password);
  if (userData.isAdmin) queryParams.append('isAdmin', 'true');
  if (userData.isManager) queryParams.append('isManager', 'true');

  const response = await fetch(`${loginPath}register?${queryParams.toString()}`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || errorData.title || 'Ошибка регистрации';
    throw new Error(`Сервер ответил: ${message}`);
  }

  return await response.json();
},
async updateUser(userId, userData) {
  try {
    const params = new URLSearchParams();

    if (userData.name) params.append('name', userData.name);
    if (userData.password) params.append('password', userData.password);

    const url = new URL(`${usersPath}${userId}?${params.toString()}`);

    const headers = new Headers({
      ...authHeader() // Без Content-Type, так как нет тела
    });

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: headers
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return null;

  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error(`Ошибка обновления пользователя: ${error.message}`);
  }
},

async  createProject(projectData) {
  try {
    // 1. Создаем URL без параметров
    const url = new URL(projectsPath);
    
    // 2. Добавляем параметры с правильным кодированием
    const params = new URLSearchParams();
    params.append('name', projectData.name); // Автоматическое кодирование
    params.append('isActive', projectData.isActive.toString());
    
    // 3. Получаем правильно закодированную строку запроса
    const queryString = params.toString();
    
    // 4. Формируем полный URL
    url.search = queryString;
    
    // 5. Заголовки с авторизацией
    const headers = new Headers({
      'Accept': 'application/json',
      ...authHeader()
    });

    console.log('Отправляемый URL:', url.toString()); // Для отладки

    // 6. Отправка запроса
    const response = await fetch(url, {
      method: 'POST',
      headers: headers
    });

    // 7. Обработка ответа
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('Ошибка создания проекта:', {
      error: error.message,
      requestData: projectData,
      url: url?.toString()
    });
    throw new Error(`Не удалось создать проект: ${error.message}`);
  }
},

async  updateProject(code, updates) {
  let url;
  try {
    // 1. Валидация параметров
    if (!code) throw new Error('Код проекта обязателен');
    if (!updates || (updates.name === undefined && updates.isActive === undefined)) {
      throw new Error('Не указаны данные для обновления');
    }

    // 2. Формируем URL с query-параметрами
    url = new URL(`${projectsPath}${encodeURIComponent(code)}`);
    const params = new URLSearchParams();

    if (updates.name !== undefined) params.append('name', updates.name);
    if (updates.isActive !== undefined) {
      params.append('isActive', updates.isActive.toString());
    }

    url.search = params.toString();

    // 3. Заголовки запроса
    const headers = new Headers({
      'Accept': 'application/json',
      ...authHeader()
    });

    console.log('Sending PUT to:', url.toString());

    // 4. Отправка запроса
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: headers
    });

    // 5. Обработка ответа
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(responseText || `HTTP error ${response.status}`);
    }

    // Парсим JSON только если есть содержимое
    const result = responseText ? JSON.parse(responseText) : null;
    
    // 6. Проверка структуры ответа
    if (result && !result.code) {
      console.warn('Сервер вернул неожиданную структуру ответа:', result);
      throw new Error('Некорректный формат ответа сервера');
    }

    // 7. Проверка активности
    if (result && updates.isActive !== undefined && result.isActive !== updates.isActive) {
      console.warn('Несоответствие статуса активности:', {
        ожидалось: updates.isActive,
        получено: result.isActive
      });
    }

    return result || { code, name: updates.name, isActive: updates.isActive };

  } catch (error) {
    console.error('Update failed:', {
      code,
      updates,
      url: url?.toString(),
      error: error.message
    });
    throw new Error(`Ошибка обновления проекта: ${error.message}`);
  }
},
async  updateTask(taskData) {
  const url = new URL(`${tasksPath}${taskData.id}`);
  
  // Добавляем параметры в URL
  if (taskData.name) {
    url.searchParams.append('name', taskData.name);
  }
  if (taskData.isActive !== undefined) {
    url.searchParams.append('isActive', taskData.isActive.toString());
  }

  try {
    // 1. Заголовки с авторизацией
    const headers = new Headers({
      'Accept': 'application/json',
      ...authHeader()
    });

    console.log('Updating task at:', url.toString());

    // 2. Отправка PUT-запроса
    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: headers
    });

    // 3. Проверка статуса ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // 4. Успешный ответ (204 No Content)
    console.log('Task updated successfully');
    return;

  } catch (error) {
    console.error('Error updating task:', {
      url: url.toString(),
      error: error.message
    });
    throw new Error(`Не удалось обновить задачу: ${error.message}`);
  }
},
async deleteProject(code) {
  let url;
  try {
    // 1. Валидация параметров
    if (!code) throw new Error('Код проекта обязателен');

    // 2. Формируем URL с кодом в пути
    url = new URL(`${projectsPath}${encodeURIComponent(code)}`);

    // 3. Заголовки с авторизацией
    const headers = new Headers({
      'Accept': 'application/json',
      ...authHeader()
    });

    console.log('Sending DELETE to:', url.toString());

    // 4. Отправка DELETE-запроса
    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers: headers
    });

    // 5. Обработка ответа
    const responseText = await response.text();
    
    if (!response.ok) {
      throw new Error(responseText || `HTTP error ${response.status}`);
    }

    // Если ответ пустой (например, статус 204 No Content)
    if (!responseText) {
      return { success: true, code };
    }

    // Парсим JSON ответ
    return JSON.parse(responseText);

  } catch (error) {
    console.error('Delete project error:', {
      code,
      url: url?.toString(),
      error: error.message
    });
    throw new Error(`Не удалось удалить проект: ${error.message}`);
  }
},
async  getTasks() {
  const url = new URL(`${tasksPath}`);
  
  try {
    // 1. Заголовки с авторизацией
    const headers = new Headers({
      'Accept': 'application/json',
      ...authHeader()
    });

    console.log('Fetching tasks from:', url.toString());

    // 2. Отправка GET-запроса
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: headers
    });

    // 3. Проверка статуса ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // 4. Получение и преобразование данных
    const tasks = await response.json();

    return tasks.map(task => {
      // Создаем корректный объект роли
      const role = task.role || (task.roleId ? { id: task.roleId } : null);
      
      return {
        id: task.id,
        name: task.name,
        project: {
          code: task.project?.code || task.projectCode,
          name: task.project?.name,
          isActive: task.project?.isActive
        },
        projectCode: task.projectCode,
        role: role,
        roleId: task.roleId,
        isActive: task.isActive
      };
    });

  } catch (error) {
    console.error('Error fetching tasks:', {
      url: url.toString(),
      error: error.message
    });
    throw new Error(`Не удалось получить задачи: ${error.message}`);
  }
},
async  assignRoleToUser(roleId, userId) {
  const headers = {
    ...commonHeaders,
    ...authHeader()
  };

  const response = await fetch(`${rolesPath}${roleId}/adduser/${userId}`, {
    method: 'PUT',
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Ошибка назначения роли');
  }

  return await response.json();
},
async  createTask(taskData) {
  const url = new URL(`${tasksPath}`);
  
  // Добавляем параметры в URL
  url.searchParams.append('name', taskData.name);
  url.searchParams.append('projectCode', taskData.projectCode);
  url.searchParams.append('roleId', taskData.roleId.toString());
  if (taskData.isActive !== undefined) {
    url.searchParams.append('isActive', taskData.isActive.toString());
  }

  try {
    // 1. Заголовки с авторизацией
    const headers = new Headers({
      'Accept': 'application/json',
      ...authHeader()
    });

    console.log('Creating task at:', url.toString());

    // 2. Отправка POST-запроса
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: headers
    });

    // 3. Проверка статуса ответа
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    // 4. Получение и преобразование данных ответа
    const createdTask = await response.json();

    // Форматируем ответ согласно ожидаемой структуре
    return {
      id: createdTask.id,
      name: createdTask.name,
      project: {
        code: createdTask.project?.code || createdTask.projectCode,
        name: createdTask.project?.name,
        isActive: createdTask.project?.isActive
      },
      projectCode: createdTask.projectCode,
      role: createdTask.role || (createdTask.roleId ? { id: createdTask.roleId } : null),
      roleId: createdTask.roleId,
      isActive: createdTask.isActive
    };

  } catch (error) {
    console.error('Error creating task:', {
      url: url.toString(),
      error: error.message
    });
    throw new Error(`Не удалось создать задачу: ${error.message}`);
  }
}



};