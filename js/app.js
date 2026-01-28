// js/app.js

class WebARApp {
    constructor() {
        this.model = null;
        this.isMarkerFound = false;
        this.isModelLoaded = false;
        
        // Настройки
        this.initialScale = { x: 0.5, y: 0.5, z: 0.5 };
        this.currentScale = 1.0;
        this.rotationStep = 30;
        
        // Элементы UI
        this.elements = {
            status: document.getElementById('status-message'),
            controls: document.getElementById('controls-panel'),
            instruction: document.getElementById('instruction'),
            error: document.getElementById('error-panel'),
            errorMsg: document.getElementById('error-message'),
            retryBtn: document.getElementById('retry-button')
        };
        
        this.init();
    }
    
    init() {
        console.log('🚀 Инициализация WebAR приложения');
        
        // Проверка локального сервера
        if (window.location.protocol === 'file:') {
            this.showError('Запускайте через локальный сервер (Live Server в VS Code)');
            return;
        }
        
        // Проверка WebGL
        if (!this.checkWebGL()) {
            this.showError('Ваш браузер не поддерживает WebGL');
            return;
        }
        
        // Настройка сцены
        this.setupScene();
        
        // Кнопки управления
        this.setupControls();
        
        // Кнопка повтора
        this.elements.retryBtn.addEventListener('click', () => location.reload());
    }
    
    checkWebGL() {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    }
    
    setupScene() {
        const scene = document.querySelector('a-scene');
        if (!scene) {
            this.showError('Сцена не найдена');
            return;
        }
        
        // Ждем загрузки сцены
        scene.addEventListener('loaded', () => {
            console.log('✅ Сцена загружена');
            this.onSceneLoaded();
        });
    }
    
    onSceneLoaded() {
        // Находим модель и маркер
        this.model = document.getElementById('robot-model');
        const marker = document.getElementById('main-marker');
        
        if (!this.model) {
            this.showError('Модель не найдена в сцене');
            return;
        }
        
        if (!marker) {
            this.showError('Маркер не найден');
            return;
        }
        
        // События модели
        this.model.addEventListener('model-loaded', () => {
            console.log('✅ 3D модель загружена');
            this.isModelLoaded = true;
            this.elements.status.textContent = 'Готово! Наведите на маркер';
        });
        
        this.model.addEventListener('model-error', (e) => {
            console.error('❌ Ошибка модели:', e);
            this.showError(`Ошибка загрузки модели:<br>
                1. Проверьте файл assets/models/robot.glb<br>
                2. Используйте .glb формат<br>
                3. Попробуйте <a href="#" onclick="useTestModel()">тестовую модель</a>`);
        });
        
        // События маркера
        marker.addEventListener('markerFound', () => {
            console.log('✅ Маркер найден');
            this.isMarkerFound = true;
            
            if (this.isModelLoaded) {
                this.elements.controls.classList.remove('hidden');
                this.elements.instruction.classList.add('hidden');
            }
        });
        
        marker.addEventListener('markerLost', () => {
            console.log('⚠️ Маркер потерян');
            this.isMarkerFound = false;
            this.elements.controls.classList.add('hidden');
            this.elements.instruction.classList.remove('hidden');
        });
        
        this.elements.status.textContent = 'Загрузка модели...';
    }
    
    setupControls() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.control-btn');
            if (!btn || !this.model || !this.isMarkerFound) return;
            
            const action = btn.dataset.action;
            this.handleAction(action);
        });
    }
    
    handleAction(action) {
        const rotation = this.model.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        const scale = this.model.getAttribute('scale') || this.initialScale;
        
        switch(action) {
            case 'rotate-left':
                this.model.setAttribute('rotation', {
                    x: rotation.x,
                    y: rotation.y - this.rotationStep,
                    z: rotation.z
                });
                break;
                
            case 'rotate-right':
                this.model.setAttribute('rotation', {
                    x: rotation.x,
                    y: rotation.y + this.rotationStep,
                    z: rotation.z
                });
                break;
                
            case 'scale-up':
                this.currentScale = Math.min(3.0, this.currentScale * 1.2);
                this.model.setAttribute('scale', {
                    x: this.initialScale.x * this.currentScale,
                    y: this.initialScale.y * this.currentScale,
                    z: this.initialScale.z * this.currentScale
                });
                break;
                
            case 'scale-down':
                this.currentScale = Math.max(0.1, this.currentScale * 0.833);
                this.model.setAttribute('scale', {
                    x: this.initialScale.x * this.currentScale,
                    y: this.initialScale.y * this.currentScale,
                    z: this.initialScale.z * this.currentScale
                });
                break;
                
            case 'reset':
                this.currentScale = 1.0;
                this.model.setAttribute('scale', this.initialScale);
                this.model.setAttribute('rotation', { x: 0, y: 0, z: 0 });
                break;
        }
        
        console.log(`Действие: ${action}, Масштаб: ${this.currentScale}`);
    }
    
    showError(message) {
        console.error('WebAR ошибка:', message);
        if (this.elements.errorMsg) {
            this.elements.errorMsg.innerHTML = message;
            this.elements.error.classList.remove('hidden');
        }
    }
}

// Глобальная функция для тестовой модели
window.useTestModel = function() {
    const model = document.querySelector('#robot-model');
    if (model) {
        model.setAttribute('gltf-model', '');
        model.setAttribute('geometry', 'primitive: box');
        model.setAttribute('material', 'color: #2196F3');
        model.setAttribute('scale', '0.5 0.5 0.5');
        console.log('✅ Используется тестовая модель (куб)');
        document.getElementById('error-panel').classList.add('hidden');
    }
    return false;
};

// Запуск при загрузке
window.addEventListener('load', () => {
    console.log('📱 Загрузка страницы завершена');
    
    try {
        new WebARApp();
    } catch (error) {
        console.error('❌ Фатальная ошибка:', error);
        alert(`Ошибка: ${error.message}\nПроверьте консоль для деталей.`);
    }
});