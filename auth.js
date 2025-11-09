// auth.js
class AuthSystem {
    constructor() {
        this.maxAttempts = 3;
        this.lockoutTime = 15 * 60 * 1000; // 15 минут
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
        this.updateAttemptsDisplay();
    }

    bindEvents() {
        // Форма входа
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Переключение видимости пароля
        document.getElementById('togglePassword').addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // Ввод в поля формы
        document.getElementById('username').addEventListener('input', () => {
            this.hideError();
        });

        document.getElementById('password').addEventListener('input', () => {
            this.hideError();
        });
    }

    handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');

        // Проверка блокировки
        if (this.isLockedOut()) {
            this.showError('Слишком много неудачных попыток. Попробуйте позже.');
            return;
        }

        // Валидация
        if (!username || !password) {
            this.showError('Заполните все поля');
            return;
        }

        // Блокируем кнопку во время проверки
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';

        // Имитация проверки (в реальной системе здесь был бы запрос к серверу)
        setTimeout(() => {
            if (this.authenticate(username, password)) {
                this.loginSuccess();
            } else {
                this.loginFailed();
            }
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
        }, 1000);
    }

    authenticate(username, password) {
        // Получаем сохраненные учетные данные или используем значения по умолчанию
        const storedAuth = this.getStoredAuth();
        
        if (storedAuth) {
            return username === storedAuth.username && password === storedAuth.password;
        } else {
            // Значения по умолчанию для первой настройки
            const defaultUsername = 'admin';
            const defaultPassword = 'santash2025';
            
            if (username === defaultUsername && password === defaultPassword) {
                // Сохраняем учетные данные при первом успешном входе
                this.saveAuth({ username: defaultUsername, password: defaultPassword });
                return true;
            }
        }
        
        return false;
    }

    loginSuccess() {
        // Сбрасываем счетчик попыток
        this.resetAttempts();
        
        // Сохраняем сессию
        this.createSession();
        
        // Перенаправляем в админ-панель
        window.location.href = 'admin.html';
    }

    loginFailed() {
        const attempts = this.incrementAttempts();
        const attemptsLeft = this.maxAttempts - attempts;
        
        if (attempts >= this.maxAttempts) {
            this.lockAccount();
            this.showError('Слишком много неудачных попыток. Аккаунт заблокирован на 15 минут.');
        } else {
            this.showError(`Неверный логин или пароль. Осталось попыток: ${attemptsLeft}`);
        }
        
        this.updateAttemptsDisplay();
    }

    isLockedOut() {
        const lockTime = localStorage.getItem('santash_lockout_time');
        if (!lockTime) return false;

        const lockoutEnd = parseInt(lockTime);
        const now = Date.now();

        if (now < lockoutEnd) {
            return true;
        } else {
            // Время блокировки истекло
            localStorage.removeItem('santash_lockout_time');
            localStorage.removeItem('santash_login_attempts');
            return false;
        }
    }

    lockAccount() {
        const lockoutEnd = Date.now() + this.lockoutTime;
        localStorage.setItem('santash_lockout_time', lockoutEnd.toString());
    }

    incrementAttempts() {
        let attempts = parseInt(localStorage.getItem('santash_login_attempts') || '0');
        attempts++;
        localStorage.setItem('santash_login_attempts', attempts.toString());
        return attempts;
    }

    resetAttempts() {
        localStorage.removeItem('santash_login_attempts');
        localStorage.removeItem('santash_lockout_time');
    }

    getAttempts() {
        return parseInt(localStorage.getItem('santash_login_attempts') || '0');
    }

    updateAttemptsDisplay() {
        const attempts = this.getAttempts();
        const attemptsLeft = this.maxAttempts - attempts;
        
        if (attempts > 0) {
            document.getElementById('attemptsWarning').style.display = 'block';
            document.getElementById('attemptsLeft').textContent = attemptsLeft;
        } else {
            document.getElementById('attemptsWarning').style.display = 'none';
        }
    }

    createSession() {
        const session = {
            loggedIn: true,
            timestamp: Date.now(),
            sessionId: this.generateSessionId()
        };
        localStorage.setItem('santash_session', JSON.stringify(session));
    }

    checkAuthState() {
        const session = this.getSession();
        
        if (session && session.loggedIn) {
            // Проверяем, не истекла ли сессия (24 часа)
            const sessionAge = Date.now() - session.timestamp;
            const maxSessionAge = 24 * 60 * 60 * 1000; // 24 часа
            
            if (sessionAge < maxSessionAge) {
                // Автоматический вход
                window.location.href = 'admin.html';
            } else {
                // Сессия истекла
                this.destroySession();
            }
        }
    }

    getSession() {
        const sessionData = localStorage.getItem('santash_session');
        return sessionData ? JSON.parse(sessionData) : null;
    }

    destroySession() {
        localStorage.removeItem('santash_session');
    }

    getStoredAuth() {
        const authData = localStorage.getItem('santash_auth');
        return authData ? JSON.parse(authData) : null;
    }

    saveAuth(authData) {
        localStorage.setItem('santash_auth', JSON.stringify(authData));
    }

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('password');
        const toggleIcon = document.getElementById('togglePassword').querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleIcon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            toggleIcon.className = 'fas fa-eye';
        }
    }

    showError(message) {
        const errorAlert = document.getElementById('errorAlert');
        errorAlert.textContent = message;
        errorAlert.style.display = 'block';
        
        // Авто-скрытие через 5 секунд
        setTimeout(() => {
            this.hideError();
        }, 5000);
    }

    hideError() {
        document.getElementById('errorAlert').style.display = 'none';
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Инициализация системы аутентификации
const authSystem = new AuthSystem();

// Глобальные функции
window.authSystem = authSystem;