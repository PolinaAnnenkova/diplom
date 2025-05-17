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
    user.role = "executor";
    if (user.is_admin) {
      user.role = "admin";
    } else if (user.is_manager) {
      user.role = "manager";
    }
}

function getTokenImpl() {
  return localStorage.getItem("access_token");
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
    localStorage.setItem("access_token", user.access_token)
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

  async getUserById(id) {
    return await getUserByIdImpl(id);
  },

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
  }
};
