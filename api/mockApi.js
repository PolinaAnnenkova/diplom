// Ключи для localStorage
const STORAGE_KEYS = {
  USERS: 'mock_users_data',
  PROJECTS: 'mock_projects_data',
  TASKS: 'mock_tasks_data',
  TIME_ENTRIES: 'mock_time_entries_data'
};

// Начальные данные
const DEFAULT_DATA = {
  USERS: [
    {
      id: 1,
      name: 'Администратор',
      login: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin'
    },
    {
      id: 2,
      name: 'Менеджер',
      login: 'manager',
      password: 'manager123',
      email: 'manager@example.com',
      role: 'manager'
    }
  ],
  PROJECTS: [
    {
      id: 1,
      name: 'Проект 1',
      code: 'P001',
      status: 'active'
    },
    {
      id: 2,
      name: 'Проект 2',
      code: 'P002',
      status: 'active'
    }
  ],
  TASKS: [
    {
      id: 1,
      title: 'Разработка интерфейса',
      projectId: 1,
      description: 'Создать UI компоненты',
      status: 'in_progress'
    }
  ],
  TIME_ENTRIES: [
    {
      id: 1,
      taskId: 1,
      userId: 1,
      date: '2023-05-15',
      hours: 2.5,
      description: 'Работа над компонентами'
    }
  ]
};

// Инициализация данных
const initializeData = () => {
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(DEFAULT_DATA[key]));
    }
  });
};

// Вспомогательные функции
const getData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const saveData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const simulateNetworkDelay = () => 
  new Promise(resolve => setTimeout(resolve, 200));

const generateId = (items) => 
  items.length > 0 ? Math.max(...items.map(item => item.id)) + 1 : 1;

// Инициализируем данные при импорте
initializeData();

export default {
  // ==================== Аутентификация ====================
  async login(credentials) {
    await simulateNetworkDelay();
    const users = getData(STORAGE_KEYS.USERS);
    const user = users.find(u => 
      u.login === credentials.login && 
      u.password === credentials.password
    );
    if (!user) throw new Error('Неверные учетные данные');
    return { ...user, token: `mock-token-${user.id}` };
  },

  async getCurrentUser(token) {
    await simulateNetworkDelay();
    if (!token) throw new Error('Требуется авторизация');
    const userId = parseInt(token.replace('mock-token-', ''));
    const users = getData(STORAGE_KEYS.USERS);
    const user = users.find(u => u.id === userId);
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

  async getUserById(id) {
    await simulateNetworkDelay();
    const user = getData(STORAGE_KEYS.USERS).find(u => u.id === id);
    if (!user) throw new Error('Пользователь не найден');
    const { password, ...userData } = user;
    return userData;
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