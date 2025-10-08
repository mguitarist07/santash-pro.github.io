// ===== ОСНОВНОЙ JavaScript ДЛЯ ВСЕХ СТРАНИЦ =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing scripts...');

    // ===== УЛУЧШЕННЫЙ СЛАЙДЕР ДЛЯ ГЛАВНОЙ СТРАНИЦЫ =====
    function initSlider() {
        const slides = document.querySelectorAll('.slide');
        const dots = document.querySelectorAll('.slider-dot');
        const prevBtn = document.querySelector('.slider-arrow.prev');
        const nextBtn = document.querySelector('.slider-arrow.next');
        const sliderSection = document.querySelector('.slider-section');
        
        if (slides.length === 0) {
            console.log('No slider found, skipping initialization');
            return null;
        }

        console.log('Initializing slider with', slides.length, 'slides');

        let currentSlide = 0;
        let slideInterval = null;
        const slideDuration = 5000; // 5 секунд
        let isAnimating = false;

        // Создаем индикатор времени
        function createTimerIndicator() {
            const timerIndicator = document.createElement('div');
            timerIndicator.className = 'slider-timer-indicator';
            timerIndicator.innerHTML = `
                <div class="timer-circle">
                    <svg class="timer-svg" viewBox="0 0 36 36">
                        <path class="timer-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        <path class="timer-circle-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                    </svg>
                </div>
            `;
            
            // Добавляем индикатор прямо в слайдер, а не в контролы
            const slider = document.querySelector('.slider');
            if (slider) {
                slider.appendChild(timerIndicator);
            }
            
            return timerIndicator;
        }

        const timerIndicator = createTimerIndicator();
        const timerCircleFill = timerIndicator.querySelector('.timer-circle-fill');

        function updateTimerIndicator(progress) {
            if (timerCircleFill) {
                const circumference = 2 * Math.PI * 15.9155;
                const offset = circumference - (progress * circumference);
                timerCircleFill.style.strokeDasharray = `${circumference} ${circumference}`;
                timerCircleFill.style.strokeDashoffset = offset;
            }
        }

        function showSlide(index, instant = false) {
            if (isAnimating) return;
            isAnimating = true;

            // Скрываем текущий слайд
            slides[currentSlide].classList.remove('active');
            if (dots[currentSlide]) dots[currentSlide].classList.remove('active');
            
            // Обновляем текущий слайд
            currentSlide = index;
            
            // Показываем новый слайд
            if (instant) {
                slides[currentSlide].classList.add('active');
                if (dots[currentSlide]) dots[currentSlide].classList.add('active');
                isAnimating = false;
            } else {
                setTimeout(() => {
                    slides[currentSlide].classList.add('active');
                    if (dots[currentSlide]) dots[currentSlide].classList.add('active');
                    isAnimating = false;
                }, 50);
            }
            
            // Сбрасываем таймер индикатора
            updateTimerIndicator(0);
        }

        function nextSlide() {
            const next = (currentSlide + 1) % slides.length;
            showSlide(next);
        }

        function prevSlide() {
            const prev = (currentSlide - 1 + slides.length) % slides.length;
            showSlide(prev);
        }

        function goToSlide(index) {
            if (index !== currentSlide) {
                showSlide(index);
            }
        }

        function startAutoSlide() {
            let startTime = Date.now();
            let progress = 0;
            
            slideInterval = setInterval(() => {
                const elapsed = Date.now() - startTime;
                progress = elapsed / slideDuration;
                
                if (progress >= 1) {
                    nextSlide();
                    startTime = Date.now();
                    progress = 0;
                }
                
                updateTimerIndicator(progress);
            }, 50); // Обновляем каждые 50ms для плавной анимации
        }

        function stopAutoSlide() {
            if (slideInterval) {
                clearInterval(slideInterval);
                slideInterval = null;
            }
            updateTimerIndicator(0);
        }

        function restartAutoSlide() {
            stopAutoSlide();
            startAutoSlide();
        }

        // Инициализация - показываем первый слайд мгновенно
        function initializeSlider() {
            // Сначала скрываем все слайды
            slides.forEach((slide, index) => {
                slide.classList.remove('active');
                if (dots[index]) dots[index].classList.remove('active');
            });
            
            // Показываем первый слайд
            setTimeout(() => {
                showSlide(0, true);
                startAutoSlide();
            }, 100);
        }

        // Event listeners
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (!isAnimating) {
                    prevSlide();
                    restartAutoSlide();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                if (!isAnimating) {
                    nextSlide();
                    restartAutoSlide();
                }
            });
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                if (!isAnimating && index !== currentSlide) {
                    goToSlide(index);
                    restartAutoSlide();
                }
            });
        });

        // УБРАНА автопауза при наведении и на мобильных устройствах
        // Слайдер теперь всегда работает автоматически

        // Запускаем инициализацию
        initializeSlider();

        return {
            nextSlide,
            prevSlide,
            goToSlide,
            stopAutoSlide,
            startAutoSlide
        };
    }

    // ===== НАВИГАЦИЯ УСЛУГ =====
    function initServicesNavigation() {
        const servicesScrollWrapper = document.querySelector('.services-scroll-wrapper');
        const servicesPrev = document.querySelector('.services-nav.prev');
        const servicesNext = document.querySelector('.services-nav.next');
        const indicators = document.querySelectorAll('.services-indicator');

        if (!servicesScrollWrapper) {
            console.log('No services navigation found');
            return null;
        }

        console.log('Initializing services navigation');

        let currentSlide = 0;
        const slideWidth = 280 + 25;
        const visibleSlides = 4;

        function updateNavigation() {
            const scrollLeft = servicesScrollWrapper.scrollLeft;
            const maxScroll = servicesScrollWrapper.scrollWidth - servicesScrollWrapper.clientWidth;
            
            if (servicesPrev) {
                servicesPrev.classList.toggle('hidden', scrollLeft === 0);
            }
            if (servicesNext) {
                servicesNext.classList.toggle('hidden', scrollLeft >= maxScroll - 10);
            }
            
            // Update indicators
            const newSlide = Math.round(scrollLeft / (slideWidth * visibleSlides));
            if (newSlide !== currentSlide) {
                currentSlide = newSlide;
                indicators.forEach((indicator, index) => {
                    indicator.classList.toggle('active', index === currentSlide);
                });
            }
        }

        function scrollToNext() {
            servicesScrollWrapper.scrollBy({
                left: slideWidth * visibleSlides,
                behavior: 'smooth'
            });
        }

        function scrollToPrev() {
            servicesScrollWrapper.scrollBy({
                left: -slideWidth * visibleSlides,
                behavior: 'smooth'
            });
        }

        function scrollToSlide(index) {
            servicesScrollWrapper.scrollTo({
                left: index * slideWidth * visibleSlides,
                behavior: 'smooth'
            });
        }

        // Event listeners
        if (servicesNext) {
            servicesNext.addEventListener('click', scrollToNext);
        }

        if (servicesPrev) {
            servicesPrev.addEventListener('click', scrollToPrev);
        }

        indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => {
                scrollToSlide(index);
            });
        });

        servicesScrollWrapper.addEventListener('scroll', updateNavigation);
        updateNavigation();

        return {
            scrollToNext,
            scrollToPrev,
            scrollToSlide
        };
    }

    // ===== УПРАВЛЕНИЕ МЕНЮ С АНИМАЦИЕЙ =====
    function initMenu() {
        const menuToggle = document.querySelector('.menu-toggle');
        const closeMenu = document.querySelector('.close-menu');
        const mainNav = document.getElementById('main-nav');

        if (!menuToggle || !mainNav) {
            console.log('Menu elements not found');
            return null;
        }

        console.log('Initializing menu with animations');

        let isMenuOpen = false;

        function openMenu() {
            if (isMenuOpen) return;
            
            // Добавляем анимацию вращения вправо для бургера
            menuToggle.classList.add('rotate-right');
            
            // Открываем меню с небольшой задержкой для синхронизации с анимацией
            setTimeout(() => {
                mainNav.classList.add('active');
                document.body.style.overflow = 'hidden';
                isMenuOpen = true;
            }, 300);
            
            // Убираем класс анимации после завершения
            setTimeout(() => {
                menuToggle.classList.remove('rotate-right');
            }, 600);
        }

        function closeMenuHandler() {
            if (!isMenuOpen) return;
            
            // Добавляем анимацию вращения влево для крестика
            closeMenu.classList.add('rotate-left');
            
            // Закрываем меню с небольшой задержкой для синхронизации с анимацией
            setTimeout(() => {
                mainNav.classList.remove('active');
                document.body.style.overflow = '';
                isMenuOpen = false;
            }, 300);
            
            // Убираем класс анимации после завершения
            setTimeout(() => {
                closeMenu.classList.remove('rotate-left');
            }, 600);
        }

        // Event listeners
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!isMenuOpen) {
                openMenu();
            }
        });

        if (closeMenu) {
            closeMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isMenuOpen) {
                    closeMenuHandler();
                }
            });
        }

        // Закрытие меню при клике вне области
        document.addEventListener('click', (e) => {
            if (isMenuOpen && !e.target.closest('nav') && !e.target.closest('.menu-toggle')) {
                closeMenuHandler();
            }
        });

        // Закрытие меню при нажатии Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMenuHandler();
            }
        });

        // Закрытие меню при изменении ориентации устройства
        window.addEventListener('orientationchange', () => {
            if (isMenuOpen) {
                closeMenuHandler();
            }
        });

        return {
            openMenu,
            closeMenu: closeMenuHandler
        };
    }

    // ===== ВЫПАДАЮЩИЕ МЕНЮ =====
    function initDropdowns() {
        console.log('Initializing dropdowns');

        // Обработка клика по "Каталог" на мобильных
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.parentElement;
                    dropdown.classList.toggle('active');
                    
                    // Закрываем другие dropdown
                    document.querySelectorAll('.dropdown').forEach(otherDropdown => {
                        if (otherDropdown !== dropdown) {
                            otherDropdown.classList.remove('active');
                        }
                    });
                }
            });
        });

        // Ховер для десктопа (только на больших экранах)
        if (window.innerWidth > 768) {
            document.querySelectorAll('.dropdown').forEach(dropdown => {
                dropdown.addEventListener('mouseenter', function() {
                    this.classList.add('active');
                });
                
                dropdown.addEventListener('mouseleave', function() {
                    this.classList.remove('active');
                });
            });
        }

        // Закрытие dropdown при клике вне меню (только на мобильных)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                // На десктопе убираем активные классы и включаем ховер
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
                
                // Переинициализируем ховер для десктопа
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.addEventListener('mouseenter', function() {
                        this.classList.add('active');
                    });
                    
                    dropdown.addEventListener('mouseleave', function() {
                        this.classList.remove('active');
                    });
                });
            } else {
                // На мобильных отключаем ховер
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.replaceWith(dropdown.cloneNode(true));
                });
            }
        });
    }

    // ===== КАТАЛОГ =====
    function initCatalog() {
        const categoryLinks = document.querySelectorAll('.catalog-categories a');
        const filterReset = document.querySelector('.filter-reset');

        if (categoryLinks.length === 0) {
            console.log('No catalog elements found');
            return null;
        }

        console.log('Initializing catalog');

        // Category navigation
        categoryLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Remove active class from all links
                categoryLinks.forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked link
                this.classList.add('active');
                
                // Scroll to catalog section
                const catalogSection = document.querySelector('.catalog');
                if (catalogSection) {
                    window.scrollTo({
                        top: catalogSection.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Reset filters
        if (filterReset) {
            filterReset.addEventListener('click', function() {
                document.querySelectorAll('.filter-option input').forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }
    }

    // ===== FAQ АККОРДЕОН =====
    function initFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');

        if (faqQuestions.length === 0) {
            console.log('No FAQ elements found');
            return null;
        }

        console.log('Initializing FAQ');

        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                const isActive = item.classList.contains('active');
                
                // Close all items
                document.querySelectorAll('.faq-item').forEach(otherItem => {
                    otherItem.classList.remove('active');
                });
                
                // Open clicked item if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    }

    // ===== ПЛАВНАЯ ПРОКРУТКА =====
    function initSmoothScroll() {
        console.log('Initializing smooth scroll');

        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const targetId = this.getAttribute('href');
                
                if (targetId === '#' || targetId === '#!') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    e.preventDefault();
                    
                    const headerHeight = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
                    
                    window.scrollTo({
                        top: targetElement.offsetTop - headerHeight,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    const mainNav = document.getElementById('main-nav');
                    if (mainNav && mainNav.classList.contains('active')) {
                        mainNav.classList.remove('active');
                        document.body.style.overflow = '';
                    }
                }
            });
        });
    }

    // ===== ФОРМЫ =====
    function initForms() {
        console.log('Initializing forms');

        // Newsletter form
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const email = this.querySelector('.newsletter-input').value;
                
                if (email) {
                    console.log('Newsletter subscription:', email);
                    alert('Спасибо за подписку!');
                    this.reset();
                }
            });
        }

        // Contact forms
        const contactForms = document.querySelectorAll('form');
        contactForms.forEach(form => {
            // Пропускаем newsletter форму, если она уже обработана
            if (form.classList.contains('newsletter-form')) return;
            
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('Form submitted');
                alert('Спасибо за заявку! Мы свяжемся с вами в ближайшее время.');
                this.reset();
            });
        });
    }

    // ===== АКТИВНОЕ СОСТОЯНИЕ НАВИГАЦИИ =====
    function setActiveNav() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a[href]');
        
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === currentPage || 
                (currentPage === '' && linkHref === 'index.html') ||
                (currentPage.endsWith('/') && linkHref === 'index.html')) {
                link.classList.add('active');
            }
        });
        
        console.log('Active navigation set for:', currentPage);
    }

    // ===== ИНИЦИАЛИЗАЦИЯ ВСЕХ КОМПОНЕНТОВ =====
    console.log('Starting initialization of all components...');

    // Инициализация компонентов
    const slider = initSlider();
    const servicesNav = initServicesNavigation();
    const menu = initMenu();
    initDropdowns();
    const catalog = initCatalog();
    const faq = initFAQ();
    initSmoothScroll();
    initForms();
    setActiveNav();

    console.log('All components initialized:', {
        slider: !!slider,
        servicesNav: !!servicesNav,
        menu: !!menu,
        catalog: !!catalog,
        faq: !!faq
    });

    // ===== ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ =====
    
    // Анимация при скролле
    function initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.service-card, .value-card, .news-card, .catalog-item, .project-card');
        
        if (animatedElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }

    // Запуск анимаций после небольшой задержки
    setTimeout(initScrollAnimations, 100);
});

// ===== ГЛОБАЛЬНЫЕ ФУНКЦИИ =====
window.showNotification = function(message, type = 'success') {
    // Создаем уведомление если его нет
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }
    
    notification.innerHTML = `
        <div class="notification-content ${type}">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    notification.classList.add('show');
    
    // Автоматическое скрытие
    setTimeout(() => {
        notification.classList.remove('show');
    }, 5000);
    
    // Закрытие по клику
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.remove('show');
    });
};

// Добавляем базовые стили для уведомлений
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    padding: 0;
    z-index: 10000;
    transform: translateX(400px);
    transition: transform 0.3s ease;
    max-width: 400px;
    overflow: hidden;
}

.notification.show {
    transform: translateX(0);
}

.notification-content {
    padding: 15px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;
}

.notification-content.success {
    border-left: 4px solid #1e5734;
}

.notification-content.error {
    border-left: 4px solid #e74c3c;
}

.notification-close {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
}

@media (max-width: 768px) {
    .notification {
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100px);
    }
    
    .notification.show {
        transform: translateY(0);
    }
}
`;

// Добавляем стили если их еще нет
if (!document.querySelector('#notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

// ===== ИНИЦИАЛИЗАЦИЯ АНИМАЦИЙ ПРИ ЗАГРУЗКЕ =====
function initMenuAnimations() {
    const menuToggle = document.querySelector('.menu-toggle');
    const closeMenu = document.querySelector('.close-menu');
    
    if (menuToggle) {
        // Добавляем небольшой эффект при первом появлении бургера
        setTimeout(() => {
            menuToggle.style.opacity = '0';
            menuToggle.style.transform = 'scale(0.8)';
            menuToggle.style.transition = 'all 0.3s ease';
            
            setTimeout(() => {
                menuToggle.style.opacity = '1';
                menuToggle.style.transform = 'scale(1)';
            }, 100);
        }, 500);
    }
}

// Запускаем после полной загрузки страницы
window.addEventListener('load', initMenuAnimations);

console.log('Main JavaScript file loaded successfully');