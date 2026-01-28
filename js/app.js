// js/app.js

class ARController {
    constructor() {
        this.model = null;
        this.isMarkerFound = false;
        this.currentScale = 1.0;
        this.initialScale = { x: 0.5, y: 0.5, z: 0.5 };
        
        console.log('🚀 AR Controller инициализирован');
        this.init();
    }
    
    init() {
        // Ждем загрузки A-Frame
        this.waitForAFrame().then(() => {
            console.log('✅ A-Frame готов');
            this.setup();
        }).catch(error => {
            console.error('❌ A-Frame ошибка:', error);
            document.getElementById('error-message').textContent = 'Ошибка загрузки A-Frame: ' + error.message;
            document.getElementById('error-panel').classList.remove('hidden');
        });
    }
    
    waitForAFrame() {
        return new Promise((resolve, reject) => {
            if (typeof AFRAME !== 'undefined') {
                resolve();
                return;
            }
            
            let attempts = 0;
            const check = () => {
                attempts++;
                if (typeof AFRAME !== 'undefined') {
                    resolve();
                } else if (attempts > 50) {
                    reject(new Error('Таймаут загрузки A-Frame'));
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    
    setup() {
        console.log('⚙️ Настройка AR Controller...');
        
        // Находим модель
        this.model = document.getElementById('model-container');
        if (!this.model) {
            console.error('❌ Модель не найдена');
            return;
        }

        // Добавьте этот код после console.log('✅ Модель найдена:', this.model);
console.log('🖼️ Проверка видимости сцены...');

// 1. Проверяем, видна ли сцена
const scene = document.querySelector('a-scene');
console.log('Сцена найдена:', !!scene);
console.log('Сцена загружена:', scene.hasLoaded);

// 2. Проверяем стили
console.log('Стиль сцены:', scene.style.cssText);

// 3. Проверяем родительский контейнер
const arContainer = document.getElementById('ar-container');
console.log('AR контейнер:', {
    существует: !!arContainer,
    классы: arContainer.className,
    стиль: arContainer.style.cssText
});

// 4. Добавляем тестовый элемент для проверки
setTimeout(() => {
    const testElement = document.createElement('div');
    testElement.style.cssText = 'position:absolute; top:50px; left:50px; color:red; font-size:20px; z-index:10000; background:yellow; padding:10px;';
    testElement.textContent = '✅ WebAR работает!';
    document.body.appendChild(testElement);
    
    // Удаляем через 3 секунды
    setTimeout(() => testElement.remove(), 3000);
}, 1000);

        // Находим маркер
        const marker = document.getElementById('main-marker');
        if (!marker) {
            console.error('❌ Маркер не найден');
            return;
        }
        
        // События маркера
        marker.addEventListener('markerFound', () => {
            console.log('🎯 Маркер найден!');
            this.isMarkerFound = true;
            document.getElementById('controls-panel').classList.remove('hidden');
            document.getElementById('instruction').classList.add('hidden');
        });
        
        marker.addEventListener('markerLost', () => {
            console.log('⚠️ Маркер потерян');
            this.isMarkerFound = false;
            document.getElementById('controls-panel').classList.add('hidden');
            document.getElementById('instruction').classList.remove('hidden');
        });
        
        // Настройка управления
        this.setupControls();
        
        console.log('✅ AR Controller настроен');
    }
    
    setupControls() {
        console.log('⚙️ Настройка управления...');
        
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.control-btn');
            if (!btn || !this.model || !this.isMarkerFound) {
                console.log('Кнопка не активна:', {btn: !!btn, model: !!this.model, marker: this.isMarkerFound});
                return;
            }
            
            const action = btn.dataset.action;
            console.log('📱 Действие:', action);
            this.handleAction(action);
        });
    }
    
    handleAction(action) {
        const rotation = this.model.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        
        switch(action) {
            case 'rotate-left':
                this.model.setAttribute('rotation', {
                    x: rotation.x,
                    y: rotation.y - 45,
                    z: rotation.z
                });
                console.log('↶ Поворот влево');
                break;
                
            case 'rotate-right':
                this.model.setAttribute('rotation', {
                    x: rotation.x,
                    y: rotation.y + 45,
                    z: rotation.z
                });
                console.log('↷ Поворот вправо');
                break;
                
            case 'scale-up':
                this.currentScale = Math.min(3.0, this.currentScale * 1.2);
                this.updateScale();
                console.log('➕ Увеличение, масштаб:', this.currentScale);
                break;
                
            case 'scale-down':
                this.currentScale = Math.max(0.1, this.currentScale * 0.833);
                this.updateScale();
                console.log('➖ Уменьшение, масштаб:', this.currentScale);
                break;
                
            case 'reset':
                this.currentScale = 1.0;
                this.model.setAttribute('rotation', { x: 0, y: 0, z: 0 });
                this.updateScale();
                console.log('🔄 Сброс модели');
                break;
        }
    }
    
    updateScale() {
        const newScale = {
            x: this.initialScale.x * this.currentScale,
            y: this.initialScale.y * this.currentScale,
            z: this.initialScale.z * this.currentScale
        };
        this.model.setAttribute('scale', newScale);
    }
}

// Запуск приложения
window.addEventListener('load', () => {
    console.log('📱 Страница загружена, запуск AR...');
    
    // Даем время загрузиться библиотекам
    setTimeout(() => {
        try {
            const controller = new ARController();
            console.log('🎉 AR Controller создан');
            
            // Сохраняем в глобальной области для отладки
            window.arController = controller;
            
        } catch (error) {
            console.error('💥 Ошибка создания контроллера:', error);
            document.getElementById('error-message').textContent = 'Ошибка: ' + error.message;
            document.getElementById('error-panel').classList.remove('hidden');
        }
    }, 1500);
});