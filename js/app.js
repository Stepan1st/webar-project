// js/app.js

class WebARApp {
    constructor() {
        this.model = null;
        this.isMarkerFound = false;
        this.isModelLoaded = false;
        this.initialScale = { x: 0.5, y: 0.5, z: 0.5 };
        this.currentScale = 1.0;
        this.rotationStep = 30;
        
        this.init();
    }
    
    init() {
        console.log('🚀 Инициализация WebAR приложения');
        
        // Ждем загрузки A-Frame
        this.waitForAFrame().then(() => {
            this.setup();
        }).catch(error => {
            this.showError(`A-Frame не загружен: ${error.message}`);
        });
    }
    
    waitForAFrame() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 секунд
            
            const check = () => {
                attempts++;
                if (typeof AFRAME !== 'undefined') {
                    console.log('✅ A-Frame загружен');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Таймаут загрузки A-Frame'));
                } else {
                    setTimeout(check, 100);
                }
            };
            
            check();
        });
    }
    
    setup() {
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
        this.setupControls();
        
        // Кнопка повтора
        document.getElementById('retry-button').addEventListener('click', () => location.reload());
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
            console.warn('Сцена не найдена, возможно AR.js не загрузился');
            this.showError('AR-сцена не найдена. Обновите страницу или проверьте CDN.');
            return;
        }
        
        // Ждем загрузки сцены (с таймаутом)
        const sceneTimeout = setTimeout(() => {
            console.warn('Таймаут загрузки сцены');
            this.showError('Сцена не загрузилась. Проверьте модель или используйте куб для демо.');
        }, 10000);
        
        scene.addEventListener('loaded', () => {
            clearTimeout(sceneTimeout);
            console.log('✅ Сцена загружена');
            this.onSceneLoaded();
        });
    }
    
    onSceneLoaded() {
        this.model = document.getElementById('robot-model');
        const marker = document.getElementById('main-marker');
        
        if (!this.model) {
            console.error('Модель не найдена в DOM');
            this.useFallbackModel();
            return;
        }
        
        if (!marker) {
            console.error('Маркер не найден');
            this.showError('Маркер не настроен');
            return;
        }
        
        // События модели с таймаутом
        const modelTimeout = setTimeout(() => {
            if (!this.isModelLoaded) {
                console.warn('Таймаут загрузки модели');
                this.useFallbackModel();
            }
        }, 8000);
        
        this.model.addEventListener('model-loaded', () => {
            clearTimeout(modelTimeout);
            console.log('✅ 3D модель загружена');
            this.isModelLoaded = true;
            document.getElementById('status-message').textContent = 'Готово! Наведите на маркер';
        });
        
        this.model.addEventListener('model-error', (e) => {
            clearTimeout(modelTimeout);
            console.error('❌ Ошибка модели:', e.detail);
            this.useFallbackModel();
        });
        
        // События маркера
        marker.addEventListener('markerFound', () => {
            console.log('✅ Маркер найден');
            this.isMarkerFound = true;
            
            if (this.isModelLoaded) {
                document.getElementById('controls-panel').classList.remove('hidden');
                document.getElementById('instruction').classList.add('hidden');
            }
        });
        
        marker.addEventListener('markerLost', () => {
            console.log('⚠️ Маркер потерян');
            this.isMarkerFound = false;
            document.getElementById('controls-panel').classList.add('hidden');
            document.getElementById('instruction').classList.remove('hidden');
        });
        
        document.getElementById('status-message').textContent = 'Загрузка модели...';
    }
    
    useFallbackModel() {
        console.log('Использую резервную модель (куб)');
        
        const model = document.getElementById('robot-model');
        if (model) {
            // Удаляем gltf-model и ставим куб
            model.removeAttribute('gltf-model');
            model.setAttribute('geometry', 'primitive: box');
            model.setAttribute('material', 'color: #2196F3; metalness: 0.5');
            model.setAttribute('scale', '0.5 0.5 0.5');
            
            this.isModelLoaded = true;
            document.getElementById('status-message').textContent = 'Готово! Используется демо-модель';
            
            // Показываем сообщение
            const msg = document.createElement('div');
            msg.style.cssText = 'position:absolute; top:10px; right:10px; background:rgba(255,193,7,0.9); padding:10px; border-radius:5px; z-index:1000;';
            msg.innerHTML = 'Используется демо-модель (оригинал не загрузился)';
            document.getElementById('ar-container').appendChild(msg);
            setTimeout(() => msg.remove(), 5000);
        }
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
        const errorMsg = document.getElementById('error-message');
        const errorPanel = document.getElementById('error-panel');
        
        if (errorMsg && errorPanel) {
            errorMsg.innerHTML = message;
            errorPanel.classList.remove('hidden');
        }
    }
}

// Запуск при загрузке
window.addEventListener('load', () => {
    console.log('📱 Загрузка страницы завершена');
    
    // Задержка для загрузки библиотек
    setTimeout(() => {
        try {
            new WebARApp();
        } catch (error) {
            console.error('❌ Фатальная ошибка:', error);
            
            // Показываем простую инструкцию
            const status = document.getElementById('status-message');
            if (status) {
                status.innerHTML = `
                    <span style="color:red">Ошибка инициализации</span><br>
                    <small>${error.message}</small><br><br>
                    <button onclick="location.reload()" style="padding:10px; background:#f44336; color:white; border:none; border-radius:5px;">
                        Перезагрузить
                    </button>
                `;
            }
        }
    }, 1000); // Даем время загрузиться библиотекам
});