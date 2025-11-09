// admin.js - ПОЛНОСТЬЮ ЗАМЕНИТЬ СУЩЕСТВУЮЩИЙ ФАЙЛ
class AdminPanel {
    constructor() {
        // Проверяем аутентификацию
        if (!this.checkAuthentication()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentSection = 'dashboard';
        this.news = this.loadFromStorage('news') || [];
        this.products = this.loadFromStorage('products') || [];
        this.contacts = this.loadFromStorage('contacts') || {
            address: 'г. Москва, ул. Неглинная, д. 12',
            phone: '+ 7 991 244-68-08',
            email: 'info@santash.ru',
            hours: 'Пн-Пт: 9:00-18:00'
        };
        this.activityLog = this.loadFromStorage('activityLog') || [];
        
        this.init();
    }

    checkAuthentication() {
        const session = JSON.parse(localStorage.getItem('santash_session') || '{}');
        
        // Проверяем наличие активной сессии
        if (!session.loggedIn) {
            return false;
        }

        // Проверяем время сессии (24 часа)
        const sessionAge = Date.now() - (session.timestamp || 0);
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 часа
        
        if (sessionAge > maxSessionAge) {
            this.destroySession();
            return false;
        }

        return true;
    }

    destroySession() {
        localStorage.removeItem('santash_session');
    }

    init() {
        this.bindEvents();
        this.showSection('dashboard');
        this.updateStats();
        this.renderNewsList();
        this.renderProductsList();
        this.loadContactsForm();
        this.renderActivityLog();
        this.startSessionTimer();
    }

    bindEvents() {
        // Навигация
        document.querySelectorAll('.admin-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // Кнопки действий
        document.getElementById('preview-btn').addEventListener('click', () => {
            window.open('index.html', '_blank');
        });

        document.getElementById('save-all-btn').addEventListener('click', () => {
            this.saveAllChanges();
        });

        // Управление новостями
        document.getElementById('add-news-btn').addEventListener('click', () => {
            this.showNewsForm();
        });

        document.getElementById('cancel-news-btn').addEventListener('click', () => {
            this.hideNewsForm();
        });

        document.getElementById('news-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNews();
        });

        // Управление каталогом
        document.getElementById('add-product-btn').addEventListener('click', () => {
            this.showProductForm();
        });

        document.getElementById('cancel-product-btn').addEventListener('click', () => {
            this.hideProductForm();
        });

        document.getElementById('product-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProduct();
        });

        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterProducts(e.target.value);
        });

        // Управление контактами
        document.getElementById('contacts-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveContacts();
        });

        // Настройки
        document.getElementById('backup-btn').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('restore-btn').addEventListener('click', () => {
            document.getElementById('restore-file').click();
        });

        document.getElementById('restore-file').addEventListener('change', (e) => {
            this.restoreBackup(e.target.files[0]);
        });

        document.getElementById('clear-data-btn').addEventListener('click', () => {
            this.showModal(
                'Очистка всех данных',
                'Вы уверены, что хотите удалить ВСЕ данные? Это действие нельзя отменить.',
                () => this.clearAllData()
            );
        });

        // Кнопка выхода
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-danger';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Выйти';
        logoutBtn.addEventListener('click', () => this.logout());
        document.querySelector('.admin-actions').appendChild(logoutBtn);

        // Модальное окно
        document.getElementById('modal-cancel').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('modal-confirm').addEventListener('click', () => {
            if (this.modalCallback) {
                this.modalCallback();
            }
            this.hideModal();
        });
    }

    logout() {
        this.showModal(
            'Выход из системы',
            'Вы уверены, что хотите выйти из админ-панели?',
            () => {
                this.destroySession();
                window.location.href = 'login.html';
            }
        );
    }

    startSessionTimer() {
        // Таймер для автоматического выхода через 24 часа
        setInterval(() => {
            if (!this.checkAuthentication()) {
                this.showNotification('Сессия истекла. Пожалуйста, войдите снова.', 'error');
                this.logout();
            }
        }, 60 * 60 * 1000); // Проверка каждый час
    }

    showSection(section) {
        // Обновляем активную навигацию
        document.querySelectorAll('.admin-nav a').forEach(link => {
            link.classList.remove('nav-active');
        });
        document.querySelector(`.admin-nav a[href="#${section}"]`).classList.add('nav-active');

        // Скрываем все секции
        document.querySelectorAll('.admin-section').forEach(sec => {
            sec.classList.remove('active');
        });

        // Показываем выбранную секцию
        document.getElementById(section).classList.add('active');
        
        // Обновляем заголовок
        document.getElementById('page-title').textContent = 
            document.querySelector(`.admin-nav a[href="#${section}"]`).textContent.trim();

        this.currentSection = section;
    }

    // ===== УПРАВЛЕНИЕ НОВОСТЯМИ =====
    showNewsForm(newsItem = null) {
        const form = document.getElementById('news-form');
        const container = document.getElementById('news-form-container');
        const title = document.getElementById('news-form-title');

        if (newsItem) {
            title.textContent = 'Редактировать новость';
            this.fillNewsForm(newsItem);
        } else {
            title.textContent = 'Добавить новость';
            form.reset();
            document.getElementById('news-date').value = this.getCurrentDate();
        }

        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }

    hideNewsForm() {
        document.getElementById('news-form-container').style.display = 'none';
        document.getElementById('news-form').reset();
    }

    fillNewsForm(newsItem) {
        document.getElementById('news-id').value = newsItem.id;
        document.getElementById('news-title').value = newsItem.title;
        document.getElementById('news-content').value = newsItem.content;
        document.getElementById('news-date').value = newsItem.date;
        document.getElementById('news-category').value = newsItem.category;
        document.getElementById('news-image').value = newsItem.image || '';
    }

    saveNews() {
        const formData = new FormData(document.getElementById('news-form'));
        const newsId = document.getElementById('news-id').value;
        
        const newsData = {
            id: newsId || Date.now().toString(),
            title: formData.get('news-title'),
            content: formData.get('news-content'),
            date: formData.get('news-date'),
            category: formData.get('news-category'),
            image: formData.get('news-image') || this.getDefaultNewsImage()
        };

        if (newsId) {
            // Редактирование существующей новости
            const index = this.news.findIndex(item => item.id === newsId);
            if (index !== -1) {
                this.news[index] = newsData;
                this.logActivity(`Отредактирована новость: "${newsData.title}"`);
            }
        } else {
            // Добавление новой новости
            this.news.unshift(newsData);
            this.logActivity(`Добавлена новость: "${newsData.title}"`);
        }

        this.saveToStorage('news', this.news);
        this.renderNewsList();
        this.hideNewsForm();
        this.updateStats();
        this.showNotification('Новость успешно сохранена!', 'success');
    }

    editNews(id) {
        const newsItem = this.news.find(item => item.id === id);
        if (newsItem) {
            this.showNewsForm(newsItem);
        }
    }

    deleteNews(id) {
        const newsItem = this.news.find(item => item.id === id);
        this.showModal(
            'Удаление новости',
            `Вы уверены, что хотите удалить новость "${newsItem.title}"?`,
            () => {
                this.news = this.news.filter(item => item.id !== id);
                this.saveToStorage('news', this.news);
                this.renderNewsList();
                this.updateStats();
                this.logActivity(`Удалена новость: "${newsItem.title}"`);
                this.showNotification('Новость удалена!', 'success');
            }
        );
    }

    renderNewsList() {
        const container = document.getElementById('news-list');
        container.innerHTML = '';

        if (this.news.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Новостей пока нет</p>';
            return;
        }

        this.news.forEach(newsItem => {
            const newsElement = document.createElement('div');
            newsElement.className = 'news-item';
            newsElement.innerHTML = `
                <div class="item-content">
                    <h4>${newsItem.title}</h4>
                    <p>${newsItem.content.substring(0, 100)}...</p>
                    <div class="item-meta">
                        <span>${this.formatDate(newsItem.date)}</span> • 
                        <span>${newsItem.category}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="admin.editNews('${newsItem.id}')">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteNews('${newsItem.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            `;
            container.appendChild(newsElement);
        });
    }

    // ===== УПРАВЛЕНИЕ КАТАЛОГОМ =====
    showProductForm(productItem = null) {
        const form = document.getElementById('product-form');
        const container = document.getElementById('product-form-container');
        const title = document.getElementById('product-form-title');

        if (productItem) {
            title.textContent = 'Редактировать товар';
            this.fillProductForm(productItem);
        } else {
            title.textContent = 'Добавить товар';
            form.reset();
        }

        container.style.display = 'block';
        container.scrollIntoView({ behavior: 'smooth' });
    }

    hideProductForm() {
        document.getElementById('product-form-container').style.display = 'none';
        document.getElementById('product-form').reset();
    }

    fillProductForm(productItem) {
        document.getElementById('product-id').value = productItem.id;
        document.getElementById('product-name').value = productItem.name;
        document.getElementById('product-category').value = productItem.category;
        document.getElementById('product-description').value = productItem.description;
        document.getElementById('product-price').value = productItem.price;
        document.getElementById('product-image').value = productItem.image || '';
        document.getElementById('product-rating').value = productItem.rating || '5';
    }

    saveProduct() {
        const formData = new FormData(document.getElementById('product-form'));
        const productId = document.getElementById('product-id').value;
        
        const productData = {
            id: productId || Date.now().toString(),
            name: formData.get('product-name'),
            category: formData.get('product-category'),
            description: formData.get('product-description'),
            price: formData.get('product-price'),
            image: formData.get('product-image') || this.getDefaultProductImage(),
            rating: formData.get('product-rating')
        };

        if (productId) {
            // Редактирование существующего товара
            const index = this.products.findIndex(item => item.id === productId);
            if (index !== -1) {
                this.products[index] = productData;
                this.logActivity(`Отредактирован товар: "${productData.name}"`);
            }
        } else {
            // Добавление нового товара
            this.products.unshift(productData);
            this.logActivity(`Добавлен товар: "${productData.name}"`);
        }

        this.saveToStorage('products', this.products);
        this.renderProductsList();
        this.hideProductForm();
        this.updateStats();
        this.showNotification('Товар успешно сохранен!', 'success');
    }

    editProduct(id) {
        const productItem = this.products.find(item => item.id === id);
        if (productItem) {
            this.showProductForm(productItem);
        }
    }

    deleteProduct(id) {
        const productItem = this.products.find(item => item.id === id);
        this.showModal(
            'Удаление товара',
            `Вы уверены, что хотите удалить товар "${productItem.name}"?`,
            () => {
                this.products = this.products.filter(item => item.id !== id);
                this.saveToStorage('products', this.products);
                this.renderProductsList();
                this.updateStats();
                this.logActivity(`Удален товар: "${productItem.name}"`);
                this.showNotification('Товар удален!', 'success');
            }
        );
    }

    filterProducts(category) {
        const productsToShow = category === 'all' 
            ? this.products 
            : this.products.filter(product => product.category === category);
        
        this.renderProductsList(productsToShow);
    }

    renderProductsList(products = this.products) {
        const container = document.getElementById('products-list');
        container.innerHTML = '';

        if (products.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">Товаров в этой категории пока нет</p>';
            return;
        }

        products.forEach(product => {
            const productElement = document.createElement('div');
            productElement.className = 'product-item';
            productElement.innerHTML = `
                <div class="item-content">
                    <h4>${product.name}</h4>
                    <p>${product.description}</p>
                    <div class="item-meta">
                        <span>${product.price}</span> • 
                        <span>${this.getCategoryName(product.category)}</span>
                    </div>
                </div>
                <div class="item-actions">
                    <button class="btn btn-sm btn-secondary" onclick="admin.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i> Изменить
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="admin.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            `;
            container.appendChild(productElement);
        });
    }

    // ===== УПРАВЛЕНИЕ КОНТАКТАМИ =====
    loadContactsForm() {
        document.getElementById('contact-address').value = this.contacts.address;
        document.getElementById('contact-phone').value = this.contacts.phone;
        document.getElementById('contact-email').value = this.contacts.email;
        document.getElementById('contact-hours').value = this.contacts.hours;
    }

    saveContacts() {
        this.contacts = {
            address: document.getElementById('contact-address').value,
            phone: document.getElementById('contact-phone').value,
            email: document.getElementById('contact-email').value,
            hours: document.getElementById('contact-hours').value
        };

        this.saveToStorage('contacts', this.contacts);
        this.logActivity('Обновлена контактная информация');
        this.updateStats();
        this.showNotification('Контакты успешно обновлены!', 'success');
    }

    // ===== СИСТЕМНЫЕ ФУНКЦИИ =====
    updateStats() {
        document.getElementById('news-count').textContent = this.news.length;
        document.getElementById('products-count').textContent = this.products.length;
        
        const contactsUpdated = this.activityLog.filter(activity => 
            activity.message && activity.message.includes('контактная информация')
        ).length;
        document.getElementById('contacts-updated').textContent = contactsUpdated;
    }

    logActivity(message) {
        const activity = {
            message: message,
            timestamp: new Date().toISOString()
        };
        this.activityLog.unshift(activity);
        
        // Сохраняем только последние 50 действий
        if (this.activityLog.length > 50) {
            this.activityLog = this.activityLog.slice(0, 50);
        }
        
        this.saveToStorage('activityLog', this.activityLog);
        this.renderActivityLog();
    }

    renderActivityLog() {
        const container = document.getElementById('activity-log');
        container.innerHTML = '';

        if (this.activityLog.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">Активности пока нет</p>';
            return;
        }

        this.activityLog.slice(0, 10).forEach(activity => {
            const activityElement = document.createElement('div');
            activityElement.className = 'activity-item';
            activityElement.innerHTML = `
                <div class="activity-text">${activity.message}</div>
                <div class="activity-time">${this.formatDateTime(activity.timestamp)}</div>
            `;
            container.appendChild(activityElement);
        });
    }

    saveAllChanges() {
        this.saveToStorage('news', this.news);
        this.saveToStorage('products', this.products);
        this.saveToStorage('contacts', this.contacts);
        this.showNotification('Все изменения сохранены!', 'success');
    }

    createBackup() {
        const backup = {
            news: this.news,
            products: this.products,
            contacts: this.contacts,
            activityLog: this.activityLog,
            timestamp: new Date().toISOString()
        };

        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `santash-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.logActivity('Создана резервная копия данных');
        this.showNotification('Резервная копия создана!', 'success');
    }

    restoreBackup(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);
                
                this.showModal(
                    'Восстановление данных',
                    'Вы уверены, что хотите восстановить данные из резервной копии? Текущие данные будут заменены.',
                    () => {
                        this.news = backup.news || [];
                        this.products = backup.products || [];
                        this.contacts = backup.contacts || this.contacts;
                        this.activityLog = backup.activityLog || [];
                        
                        this.saveAllChanges();
                        this.renderNewsList();
                        this.renderProductsList();
                        this.loadContactsForm();
                        this.renderActivityLog();
                        this.updateStats();
                        
                        this.logActivity('Данные восстановлены из резервной копии');
                        this.showNotification('Данные успешно восстановлены!', 'success');
                    }
                );
            } catch (error) {
                this.showNotification('Ошибка при чтении файла резервной копии', 'error');
            }
        };
        reader.readAsText(file);
    }

    clearAllData() {
        this.news = [];
        this.products = [];
        this.activityLog = [];
        
        this.saveAllChanges();
        this.renderNewsList();
        this.renderProductsList();
        this.renderActivityLog();
        this.updateStats();
        
        this.logActivity('Все данные очищены');
        this.showNotification('Все данные очищены!', 'success');
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
    showModal(title, message, callback) {
        this.modalCallback = callback;
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal').style.display = 'flex';
    }

    hideModal() {
        document.getElementById('modal').style.display = 'none';
        this.modalCallback = null;
    }

    showNotification(message, type = 'success') {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Добавляем стили для уведомления
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                .notification-content {
                    background: white;
                    padding: 15px 20px;
                    border-radius: 5px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    border-left: 4px solid #28a745;
                }
                .notification.error .notification-content {
                    border-left-color: #dc3545;
                }
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #666;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // Авто-удаление через 5 секунд
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
        
        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getCurrentDate() {
        return new Date().toISOString().split('T')[0];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU');
    }

    getCategoryName(categoryKey) {
        const categories = {
            'materials': 'Строительные материалы',
            'finishing': 'Отделочные материалы',
            'tools': 'Инструменты и оборудование',
            'plumbing': 'Сантехника',
            'electrical': 'Электрика',
            'windows': 'Окна и двери',
            'flooring': 'Напольные покрытия',
            'lighting': 'Освещение',
            'roofing': 'Кровельные материалы',
            'paint': 'Лакокрасочные материалы'
        };
        return categories[categoryKey] || categoryKey;
    }

    getDefaultNewsImage() {
        const images = [
            'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60',
            'https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60',
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }

    getDefaultProductImage() {
        const images = [
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60',
            'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60',
            'https://images.unsplash.com/photo-1572981779307-38f8b0456222?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=60'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }

    saveToStorage(key, data) {
        localStorage.setItem(`santash_${key}`, JSON.stringify(data));
    }

    loadFromStorage(key) {
        const data = localStorage.getItem(`santash_${key}`);
        return data ? JSON.parse(data) : null;
    }
}

// Инициализация админ-панели с проверкой аутентификации
let admin;
document.addEventListener('DOMContentLoaded', () => {
    try {
        admin = new AdminPanel();
        window.admin = admin;
    } catch (error) {
        // Перенаправляем на страницу входа при ошибке аутентификации
        window.location.href = 'login.html';
    }
});