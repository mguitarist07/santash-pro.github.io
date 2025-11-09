// users.js - расширенное управление пользователями
class UserManager {
    constructor() {
        this.users = this.loadUsers();
    }

    loadUsers() {
        const usersData = localStorage.getItem('santash_users');
        if (usersData) {
            return JSON.parse(usersData);
        } else {
            // Создаем администратора по умолчанию
            const defaultAdmin = {
                id: 1,
                username: 'admin',
                password: this.hashPassword('santash2025'),
                email: 'admin@santash.ru',
                role: 'admin',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                active: true
            };
            
            const users = [defaultAdmin];
            this.saveUsers(users);
            return users;
        }
    }

    saveUsers(users) {
        localStorage.setItem('santash_users', JSON.stringify(users));
    }

    hashPassword(password) {
        // Простое хеширование (в реальном приложении используйте bcrypt)
        return btoa(unescape(encodeURIComponent(password))) + '_santash_salt';
    }

    verifyPassword(inputPassword, storedHash) {
        const inputHash = this.hashPassword(inputPassword);
        return inputHash === storedHash;
    }

    authenticate(username, password) {
        const user = this.users.find(u => 
            u.username === username && u.active === true
        );
        
        if (user && this.verifyPassword(password, user.password)) {
            // Обновляем время последнего входа
            user.lastLogin = new Date().toISOString();
            this.saveUsers(this.users);
            return user;
        }
        
        return null;
    }

    createUser(userData) {
        const newUser = {
            id: Date.now(),
            username: userData.username,
            password: this.hashPassword(userData.password),
            email: userData.email,
            role: userData.role || 'editor',
            createdAt: new Date().toISOString(),
            lastLogin: null,
            active: true
        };
        
        this.users.push(newUser);
        this.saveUsers(this.users);
        return newUser;
    }

    updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            // Не позволяем изменять некоторые поля
            delete updates.id;
            delete updates.createdAt;
            
            if (updates.password) {
                updates.password = this.hashPassword(updates.password);
            }
            
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            this.saveUsers(this.users);
            return this.users[userIndex];
        }
        return null;
    }

    deleteUser(userId) {
        this.users = this.users.filter(u => u.id !== userId);
        this.saveUsers(this.users);
    }

    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    }

    getAllUsers() {
        return this.users.filter(u => u.active);
    }
}

// Интеграция с системой аутентификации
class EnhancedAuthSystem extends AuthSystem {
    authenticate(username, password) {
        const userManager = new UserManager();
        const user = userManager.authenticate(username, password);
        return user !== null;
    }
}