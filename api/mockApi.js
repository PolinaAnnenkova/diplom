// Ключи для localStorage
const STORAGE_KEYS = {
  USERS: 'mock_users_data',
  PROJECTS: 'mock_projects_data',
  TASKS: 'mock_tasks_data',
  TIME_ENTRIES: 'mock_time_entries_data', 
  COMPETENCIES: 'mock_competencies_data'
};

const DEFAULT_DATA = {
  USERS: [
    {
      id: 1,
      name: 'Администратор',
      login: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin',
      competencies: [] // Компетенции только для исполнителей
    },
    {
      id: 2,
      name: 'Менеджер',
      login: 'manager',
      password: 'manager123',
      email: 'manager@example.com',
      role: 'manager',
      competencies: []
    },
    {
      id: 3,
      name: 'Исполнитель 1',
      login: 'executor1',
      password: 'executor123',
      email: 'executor1@example.com',
      role: 'executor',
      competencies: [1, 2] // Пример: ID компетенций
    }
  ],
  PROJECTS: [
    {
      id: 1,
      name: 'Проект 1',
      code: 'P001',
      status: 'active'
    }
  ],
   TASKS: [
    {
      id: 1,
      title: 'Разработка интерфейса',
      projectId: 1,
      description: 'Создать UI компоненты для главной страницы',
      status: 'active',
      requiredCompetencies: [2] // Требуется фронтенд разработчик
    },
    {
      id: 2,
      title: 'Разработка API',
      projectId: 1,
      description: 'Создать REST API для приложения',
      status: 'active',
      requiredCompetencies: [1] // Требуется бекенд разработчик
    }
  ],
  TIME_ENTRIES: [
    {
      id: 1,
      taskId: 1,
      userId: 3, // Исполнитель
      date: '2023-05-15',
      hours: 2.5,
      description: 'Работа над компонентами'
    }
  ],
  COMPETENCIES: [
    { id: 1, name: 'Бекенд разработчик' },
    { id: 2, name: 'Фронтенд разработчик' },
    { id: 3, name: 'Тестировщик' },
    { id: 4, name: 'Дизайнер' }
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
    return getData(STORAGE_KEYS.USERS).map(user => {
      const { password, ...userData } = user;
      return userData;
    });
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
      id: generateId(users),
      competencies: userData.role === 'executor' ? (userData.competencies || []) : []
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
    
    // Обновляем компетенции только для исполнителей
    const updatedCompetencies = updates.role === 'executor' 
      ? (updates.competencies || users[index].competencies || [])
      : [];
    
    users[index] = { 
      ...users[index], 
      ...updates,
      competencies: updatedCompetencies
    };
    
    saveData(STORAGE_KEYS.USERS, users);
    return users[index];
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
    const tasks = getData(STORAGE_KEYS.TASKS);
    const competencies = getData(STORAGE_KEYS.COMPETENCIES);
    
    // Добавляем названия компетенций для удобства отображения
    return tasks.map(task => ({
      ...task,
      requiredCompetenciesNames: task.requiredCompetencies
        ? task.requiredCompetencies.map(id => {
            const comp = competencies.find(c => c.id === id);
            return comp ? comp.name : `Unknown (${id})`;
          })
        : []
    }));
  },

  async getTaskById(id) {
    await simulateNetworkDelay();
    const task = getData(STORAGE_KEYS.TASKS).find(t => t.id === id);
    if (!task) throw new Error('Задача не найдена');
    
    // Добавляем названия компетенций
    const competencies = getData(STORAGE_KEYS.COMPETENCIES);
    return {
      ...task,
      requiredCompetenciesNames: task.requiredCompetencies
        ? task.requiredCompetencies.map(id => {
            const comp = competencies.find(c => c.id === id);
            return comp ? comp.name : `Unknown (${id})`;
          })
        : []
    };
  },

  async createTask(taskData) {
    await simulateNetworkDelay();
    const tasks = getData(STORAGE_KEYS.TASKS);
    const newTask = {
      ...taskData,
      id: generateId(tasks),
      // Гарантируем, что requiredCompetencies всегда массив
      requiredCompetencies: Array.isArray(taskData.requiredCompetencies)
        ? taskData.requiredCompetencies
        : []
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
    
    tasks[index] = { 
      ...tasks[index], 
      ...updates,
      // Сохраняем компетенции, если они переданы
      requiredCompetencies: updates.requiredCompetencies !== undefined
        ? Array.isArray(updates.requiredCompetencies)
          ? updates.requiredCompetencies
          : []
        : tasks[index].requiredCompetencies
    };
    
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

  // Метод для поиска задач по требуемым компетенциям
  async getTasksByCompetencies(competencyIds) {
    await simulateNetworkDelay();
    const tasks = getData(STORAGE_KEYS.TASKS);
    return tasks.filter(task => 
      task.requiredCompetencies &&
      task.requiredCompetencies.some(compId => 
        competencyIds.includes(compId)
      )
    );
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
  async getCompetencies() {
    await simulateNetworkDelay();
    return getData(STORAGE_KEYS.COMPETENCIES);
  },

  async getCompetencieById(id) {
    await simulateNetworkDelay();
    const competencie = getData(STORAGE_KEYS.COMPETENCIES).find(c => c.id === id);
    if (!competencie) throw new Error('Компетенция не найдена');
    return competencie;
  },

  async createCompetencie(competencieData) {
    await simulateNetworkDelay();
    const competencies = getData(STORAGE_KEYS.COMPETENCIES);
    const newCompetencie = {
      ...competencieData,
      id: generateId(competencies)
    };
    competencies.push(newCompetencie);
    saveData(STORAGE_KEYS.COMPETENCIES, competencies);
    return newCompetencie;
  },

  async updateCompetencie(id, updates) {
    await simulateNetworkDelay();
    const competencies = getData(STORAGE_KEYS.COMPETENCIES);
    const index = competencies.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Компетенция не найдена');
    competencies[index] = { ...competencies[index], ...updates };
    saveData(STORAGE_KEYS.COMPETENCIES, competencies);
    return competencies[index];
  },

  async deleteCompetencie(id) {
    await simulateNetworkDelay();
    const competencies = getData(STORAGE_KEYS.COMPETENCIES);
    
    // Проверка использования компетенции
    const users = getData(STORAGE_KEYS.USERS);
    const isUsed = users.some(u => 
      u.role === 'executor' && u.competencies.includes(id)
    );
    
    if (isUsed) {
      throw new Error('Компетенция назначена исполнителям и не может быть удалена');
    }
    
    const filteredCompetencies = competencies.filter(c => c.id !== id);
    saveData(STORAGE_KEYS.COMPETENCIES, filteredCompetencies);
    return { success: true };
  },


};