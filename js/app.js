// js/app.js

// Основной класс приложения
class WebARApp {
    constructor() {
        this.scene = null;
        this.marker = null;
        this.modelContainer = null;
        this.model = null;
        this.isMarkerFound = false;
        this.isModelLoaded = false;
        
        // Параметры модели
        this.initialScale = { x: 0.25, y: 0.25, z: 0.25 };
        this.currentScale = 1.0;
        this.rotationStep = 15; // градусов
        
        // Элементы интерфейса
        this.statusMessage = document.getElementById('status-message');
        this.controlsPanel = document.getElementById('controls-panel');
        this.instruction = document.getElementById('instruction');
        this.errorPanel = document.getElementById('error-panel');
        this.errorMessage = document.getElementById('error-message');
        this.retryButton = document.getElementById('retry-button');
        
        this.init();
    }
    
    init() {
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }
    
    setup() {
        // Ищем сцену A-Frame
        this.scene = document.querySelector('a-scene');
        if (!this.scene) {
            this.showError('Не удалось найти AR-сцену');
            return;
        }
        
        // Ожидаем инициализации сцены
        this.scene.addEventListener('loaded', () => this.onSceneLoaded());
        
        // Настройка обработчиков ошибок
        window.addEventListener('error', (e) => this.handleGlobalError(e));
        
        // Обработчик повторной попытки
        this.retryButton.addEventListener('click', () => this.retry());
        
        // Инициализация кнопок управления
        this.initControls();
    }
    
    onSceneLoaded() {
        console.log('Сцена A-Frame загружена');
        
        // Находим маркер и контейнер модели
        this.marker = document.getElementById('main-marker');
        this.modelContainer = document.getElementById('model-container');
        
        if (!this.marker || !this.modelContainer) {
            this.showError('Не удалось найти элементы AR-сцены');
            return;
        }
        
        // Загружаем 3D-модель
        this.loadModel();
        
        // Настраиваем обработчики событий маркера
        this.setupMarkerEvents();
        
        // Обновляем статус
        this.updateStatus('Готово. Наведите камеру на маркер');
    }
    
    loadModel() {
       // создаем ассеты для сцены
        const assets = document.createElement('a-assets');
        this.scene.appendChild(assets);
        
        // Добавляем модель в ассеты
        const modelAsset = document.createElement('a-asset-item');
        modelAsset.setAttribute('id', 'robot-model');
        modelAsset.setAttribute('src', 'assets/models/robot.glb');
        assets.appendChild(modelAsset);
                   
        // Создаем сущность для модели
        this.model = document.createElement('a-entity');
        this.model.setAttribute('gltf-model', '#robot-model');
        this.model.setAttribute('position', '0 0 0');
        this.model.setAttribute('scale', '1 1 1');
        this.model.setAttribute('rotation', '0 0 0');
        
        // Добавляем анимацию
        this.model.setAttribute('animation', {
            property: 'rotation',
            to: '0 360 0',
            loop: true,
            dur: 20000,
            easing: 'linear',
            enabled: false
        });
        
        // Добавляем модель в контейнер
        this.modelContainer.appendChild(this.model);
        
        // Обработчики событий загрузки модели
        this.model.addEventListener('model-loaded', () => this.onModelLoaded());
        this.model.addEventListener('model-error', (e) => this.onModelError(e));
                    
        }
        
        assets.appendChild(asset);
    }
    
    onModelLoaded(); {
        console.log('3D модель успешно загружена');
        this.isModelLoaded = true;
        this.updateStatus('Модель загружена');
    }
    
    onModelError(error); {
        console.error('Ошибка загрузки модели:', error);
        this.showError('Не удалось загрузить 3D модель. Проверьте консоль для деталей.');
    }
    
    setupMarkerEvents(); {
        this.marker.addEventListener('markerFound', () => this.onMarkerFound());
        this.marker.addEventListener('markerLost', () => this.onMarkerLost());
    }
    
    onMarkerFound(); {
        console.log('Маркер найден');
        this.isMarkerFound = true;
        
        if (this.isModelLoaded) {
            // Показываем элементы управления
            this.controlsPanel.classList.remove('hidden');
            this.instruction.classList.add('hidden');
            
            // Включаем анимацию
            if (this.model) {
                this.model.setAttribute('animation', 'enabled', true);
            }
        }
    }
    
    onMarkerLost(); {
        console.log('Маркер потерян');
        this.isMarkerFound = false;
        
        // Скрываем элементы управления
        this.controlsPanel.classList.add('hidden');
        this.instruction.classList.remove('hidden');
        
        // Выключаем анимацию
        if (this.model) {
            this.model.setAttribute('animation', 'enabled', false);
        }
    }
    
    initControls() ;{
        // Делегирование событий для кнопок управления
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.control-btn');
            if (!btn) return;
            
            const action = btn.dataset.action;
            this.handleControlAction(action);
        });
        
        // Обработка жестов для мобильных устройств
        this.setupTouchGestures();
    }
    
    handleControlAction(action); {
        if (!this.model || !this.isMarkerFound) return;
        
        switch(action) {
            case 'rotate-left':
                this.rotateModel(-this.rotationStep);
                break;
            case 'rotate-right':
                this.rotateModel(this.rotationStep);
                break;
            case 'scale-up':
                this.scaleModel(1.2);
                break;
            case 'scale-down':
                this.scaleModel(0.833); // 1/1.2
                break;
            case 'reset':
                this.resetModel();
                break;
        }
    }
    
    rotateModel(angle); {
        const currentRotation = this.modelContainer.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        const newRotation = {
            x: currentRotation.x,
            y: currentRotation.y + angle,
            z: currentRotation.z
        };
        this.modelContainer.setAttribute('rotation', newRotation);
    }
    
    scaleModel(factor); {
        this.currentScale *= factor;
        
        // Ограничиваем масштаб (мин 0.1, макс 3.0)
        this.currentScale = Math.max(0.1, Math.min(3.0, this.currentScale));
        
        const newScale = {
            x: this.initialScale.x * this.currentScale,
            y: this.initialScale.y * this.currentScale,
            z: this.initialScale.z * this.currentScale
        };
        
        this.modelContainer.setAttribute('scale', newScale);
    }
    
    resetModel() ;{
        this.currentScale = 1.0;
        this.modelContainer.setAttribute('scale', this.initialScale);
        this.modelContainer.setAttribute('rotation', { x: 0, y: 0, z: 0 });
        
        // Перезапуск анимации
        if (this.model) {
            this.model.setAttribute('animation', 'enabled', false);
            setTimeout(() => {
                this.model.setAttribute('animation', 'enabled', true);
            }, 50);
        }
    }
    
    setupTouchGestures(); {
        let touchStartScale = 1;
        let touchStartDistance = 0;
        
        this.scene.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                // Жест двумя пальцами для масштабирования
                touchStartDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                touchStartScale = this.currentScale;
                e.preventDefault();
            }
        });
        
        this.scene.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && this.isMarkerFound) {
                const currentDistance = this.getTouchDistance(e.touches[0], e.touches[1]);
                const scaleFactor = currentDistance / touchStartDistance;
                this.currentScale = touchStartScale * scaleFactor;
                
                // Ограничиваем масштаб
                this.currentScale = Math.max(0.1, Math.min(3.0, this.currentScale));
                
                const newScale = {
                    x: this.initialScale.x * this.currentScale,
                    y: this.initialScale.y * this.currentScale,
                    z: this.initialScale.z * this.currentScale
                };
                
                this.modelContainer.setAttribute('scale', newScale);
                e.preventDefault();
            }
        });
    }
    
    getTouchDistance(touch1, touch2); {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    updateStatus(message); {
        if (this.statusMessage) {
            this.statusMessage.textContent = message;
        }
    }
    
    showError(message); {
        console.error('WebAR ошибка:', message);
        this.errorMessage.textContent = message;
        this.errorPanel.classList.remove('hidden');
    }
    
    hideError(); {
        this.errorPanel.classList.add('hidden');
    }
    
    handleGlobalError(event); {
        console.error('Глобальная ошибка:', event.error);
        this.showError(`Произошла ошибка: ${event.message}`);
    }
    
    retry(); {
        this.hideError();
        location.reload();
    }


// Инициализация приложения при загрузке страницы
window.addEventListener('load', () => {
    // Проверка поддержки WebGL
    if (!AFRAME.utils.isWebXRAvailable()) {
        const errorPanel = document.getElementById('error-panel');
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Ваш браузер не поддерживает WebXR/WebAR. Пожалуйста, используйте последнюю версию Chrome на Android или Safari на iOS.';
        errorPanel.classList.remove('hidden');
        return;
    }
    
    // Проверка поддержки getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorPanel = document.getElementById('error-panel');
        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = 'Ваше устройство не поддерживает доступ к камере или вы используете HTTP без SSL.';
        errorPanel.classList.remove('hidden');
        return;
    }
    
    // Запуск приложения
    new WebARApp();
});