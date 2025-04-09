// Проверяем доступность Telegram WebApp
let tg = window.Telegram?.WebApp;
let isTelegramApp = tg !== undefined;

// Когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', function() {
    // Элементы мини-плеера
    const miniPlayer = document.querySelector('.mini-player');
    const miniPlayPause = document.querySelector('.mini-play-pause');
    
    // Элементы полноэкранного плеера
    const fullscreenPlayer = document.querySelector('.fullscreen-player');
    const closePlayerBtn = document.querySelector('.close-button');
    const playPauseBtn = document.querySelector('.play-button');
    const prevBtn = document.querySelector('.prev-button');
    const nextBtn = document.querySelector('.next-button');
    const shuffleBtn = document.querySelector('.shuffle-button');
    const repeatBtn = document.querySelector('.repeat-button');
    const likeBtn = document.querySelector('.like-button');
    const shareBtn = document.querySelector('.share-button');
    const progressBar = document.querySelector('.progress-bar');
    const progress = document.querySelector('.progress');
    const progressHandle = document.querySelector('.progress-handle');
    const currentTimeDisplay = document.querySelector('.current-time');
    const totalTimeDisplay = document.querySelector('.total-time');
    
    // Элементы навигации
    const navItems = document.querySelectorAll('.nav-item');
    const homeNav = document.querySelector('.nav-home');
    const searchNav = document.querySelector('.nav-search');
    const libraryNav = document.querySelector('.nav-library');
    const profileNav = document.querySelector('.nav-profile');
    
    // Экраны контента
    const homeScreen = document.getElementById('homeScreen');
    const searchScreen = document.getElementById('searchScreen');
    const libraryScreen = document.getElementById('libraryScreen');
    const profileScreen = document.getElementById('profileScreen');
    
    // Элементы поиска
    const searchInput = document.querySelector('.search-input');
    const searchResults = document.querySelector('.search-results');
    
    // Контейнер для списка треков
    const tracksList = document.querySelector('.tracks-list');
    
    // Аудио элемент
    const audio = new Audio();
    
    // Состояние плеера
    let isPlaying = false;
    let currentTrack = 0;
    let isShuffle = false;
    let isRepeat = false;
    let isLiked = false;
    let tracks = [];
    let likedTracks = [];
    
    // Функция загрузки треков через Jamendo API (легальный источник)
    async function fetchMusicTracks() {
        try {
            // Показываем индикатор загрузки
            if (tracksList) {
                tracksList.innerHTML = '<div class="loading">Загрузка треков</div>';
            }
            
            // Проверяем доступность Telegram для получения данных пользователя
            if (isTelegramApp) {
                console.log('Telegram WebApp доступен, можно получить данные пользователя');
                
                // Если открыто из Telegram, получаем Client ID оттуда (в реальности)
                // const clientId = getTelegramData('jamendoClientId');
                // JAMENDO_API.init(clientId);
            }
            
            // Инициализируем Jamendo API 
            // Для получения работающего Client ID нужно зарегистрироваться на developer.jamendo.com
            // Для демо просто не указываем ID - будем использовать локальные треки
            JAMENDO_API.init("a49d2199");
            
            // Получаем треки через API
            const apiTracks = await JAMENDO_API.getPopularTracks();
            
            // Показываем уведомление об использовании демо-режима
            showNotification('Используется демо-режим с локальными треками', 5000);
            
            return apiTracks;
        } catch (error) {
            console.error('Ошибка при загрузке треков:', error);
            showNotification('Ошибка при загрузке треков. Используются локальные треки.', 3000);
            // В случае ошибки возвращаем локальные треки
            return JAMENDO_API.getFallbackTracks();
        }
    }
    
    // Функция инициализации приложения
    async function initApp() {
        try {
            // Загружаем треки через Jamendo API
            tracks = await fetchMusicTracks();
            
            // Загружаем лайкнутые треки из хранилища
            loadLikedTracks();
            
            // Инициализируем интерфейс
            initializeTracks();
            
            // Загружаем первый трек
            loadTrack(0);
            
            console.log('Приложение успешно инициализировано!');
        } catch (error) {
            console.error('Ошибка при инициализации приложения:', error);
            
            // При ошибке загрузки треков через API используем локальные
            tracks = JAMENDO_API.getFallbackTracks();
            initializeTracks();
            loadTrack(0);
        }
    }
    
    // Функция переключения экранов
    function switchScreen(screenId) {
        // Скрываем все экраны
        homeScreen.classList.add('hidden');
        searchScreen.classList.add('hidden');
        libraryScreen.classList.add('hidden');
        profileScreen.classList.add('hidden');
        
        // Показываем нужный экран
        document.getElementById(screenId).classList.remove('hidden');
        
        // Обновляем активную вкладку в навигации
        navItems.forEach(item => item.classList.remove('active'));
        
        // Активируем соответствующую вкладку
        switch(screenId) {
            case 'homeScreen':
                homeNav.classList.add('active');
                break;
            case 'searchScreen':
                searchNav.classList.add('active');
                break;
            case 'libraryScreen':
                libraryNav.classList.add('active');
                break;
            case 'profileScreen':
                profileNav.classList.add('active');
                break;
        }
    }
    
    // Функции плеера
    function loadTrack(trackIndex) {
        if (trackIndex < 0) trackIndex = tracks.length - 1;
        if (trackIndex >= tracks.length) trackIndex = 0;
        
        currentTrack = trackIndex;
        
        // Останавливаем текущий звук и сбрасываем состояние
        audio.pause();
        audio.currentTime = 0;
        
        // Устанавливаем новый источник
        try {
            // Проверяем наличие файла перед загрузкой
            if (!tracks[currentTrack] || !tracks[currentTrack].file) {
                console.error('Трек не найден или не имеет аудио файла');
                showNotification('Трек не найден или не имеет аудио файла');
                return;
            }
            
            audio.src = tracks[currentTrack].file;
            
            // Предзагрузка аудио для лучшей производительности
            audio.load();
            
            // Обновляем информацию в мини-плеере
            updatePlayerInfo();
            
            // Проверяем, лайкнут ли этот трек
            isLiked = likedTracks.some(track => track.id === tracks[currentTrack].id);
            updateLikeButton();
            
            // Сбрасываем состояние прогресса
            updateProgress();
        } catch (error) {
            console.error('Ошибка при загрузке трека:', error);
            // Показываем уведомление пользователю
            showNotification('Ошибка при загрузке трека. Пожалуйста, попробуйте другой трек.');
        }
    }
    
    // Обновление информации о треке как в мини-плеере, так и в полноэкранном
    function updatePlayerInfo() {
        const currentTrackData = tracks[currentTrack];
        
        // Обновляем мини-плеер
        const miniTitle = document.querySelector('.mini-title');
        const miniArtist = document.querySelector('.mini-artist');
        if (miniTitle) miniTitle.textContent = currentTrackData.title;
        if (miniArtist) miniArtist.textContent = currentTrackData.artist;
        
        // Обновляем обложку мини-плеера
        const miniCover = document.querySelector('.mini-cover');
        if (miniCover) {
            miniCover.innerHTML = `<img src="${currentTrackData.cover}" alt="${currentTrackData.title}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        
        // Обновляем информацию в полноэкранном плеере
        const trackTitle = document.querySelector('.fullscreen-player .track-title');
        const trackArtist = document.querySelector('.fullscreen-player .track-artist');
        if (trackTitle) trackTitle.textContent = currentTrackData.title;
        if (trackArtist) trackArtist.textContent = currentTrackData.artist;
        
        // Обновляем обложку в полноэкранном плеере
        const coverArt = document.querySelector('.cover-art div');
        if (coverArt) {
            coverArt.innerHTML = `<img src="${currentTrackData.cover}" alt="${currentTrackData.title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
        }
    }
    
    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    }
    
    function updatePlayPauseIcons() {
        if (isPlaying) {
            if (miniPlayPause) miniPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
            if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            if (miniPlayPause) miniPlayPause.innerHTML = '<i class="fas fa-play"></i>';
            if (playPauseBtn) playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    function togglePlay() {
        if (!audio.src) {
            loadTrack(currentTrack);
        }
        
        try {
            if (isPlaying) {
                audio.pause();
                isPlaying = false;
                updatePlayPauseIcons();
            } else {
                const playPromise = audio.play();
                
                // Учитываем асинхронную природу метода play()
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        isPlaying = true;
                        updatePlayPauseIcons();
                    }).catch(error => {
                        console.error('Ошибка воспроизведения:', error);
                        isPlaying = false;
                        updatePlayPauseIcons();
                        
                        // Показываем понятное сообщение пользователю
                        if (error.name === 'NotSupportedError') {
                            showNotification('Формат аудио не поддерживается вашим браузером.');
                        } else if (error.name === 'NotAllowedError') {
                            showNotification('Автовоспроизведение заблокировано браузером. Пожалуйста, взаимодействуйте со страницей.');
                        } else {
                            showNotification('Не удалось воспроизвести трек. Попробуйте другой.');
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Ошибка при переключении воспроизведения:', error);
            showNotification('Ошибка воспроизведения. Пожалуйста, попробуйте позже.');
        }
    }
    
    function nextTrack() {
        if (isShuffle) {
            // Случайный трек, но не текущий
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * tracks.length);
            } while (tracks.length > 1 && nextIndex === currentTrack);
            
            loadTrack(nextIndex);
        } else {
            loadTrack(currentTrack + 1);
        }
        
        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Ошибка воспроизведения при переходе к следующему треку:', error);
                });
            }
        }
    }
    
    function prevTrack() {
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else {
            loadTrack(currentTrack - 1);
        }
        
        if (isPlaying) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Ошибка воспроизведения при переходе к предыдущему треку:', error);
                });
            }
        }
    }
    
    function updateProgress() {
        const currentTime = audio.currentTime || 0;
        const duration = audio.duration || 0;
        
        // Обновляем текстовые индикаторы времени
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(currentTime);
        if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(duration);
        
        // Обновляем полосу прогресса
        if (duration > 0 && progress && progressHandle) {
            const progressPercent = (currentTime / duration) * 100;
            progress.style.width = `${progressPercent}%`;
            progressHandle.style.left = `${progressPercent}%`;
        } else if (progress && progressHandle) {
            progress.style.width = '0%';
            progressHandle.style.left = '0%';
        }
    }
    
    // Обновление состояния кнопки лайка
    function updateLikeButton() {
        if (likeBtn) {
            const likeIcon = likeBtn.querySelector('i');
            if (likeIcon) {
                likeIcon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
                likeBtn.style.color = isLiked ? '#e91e63' : '';
            }
        }
    }
    
    // Функция для инициализации треков в интерфейсе
    function initializeTracks() {
        if (!tracksList) return;
        
        tracksList.innerHTML = '';
        
        tracks.forEach((track, index) => {
            const trackItem = document.createElement('div');
            trackItem.className = 'track-item';
            trackItem.dataset.index = index;
            
            // Определяем цвет фона для обложки
            const bgColor = index % 6 === 0 ? '#1DB954' : 
                          index % 6 === 1 ? '#3C78C9' : 
                          index % 6 === 2 ? '#9D50BB' :
                          index % 6 === 3 ? '#E91E63' :
                          index % 6 === 4 ? '#FF9800' : '#FFC107';
            
            trackItem.innerHTML = `
                <div class="track-cover" style="background-color: ${bgColor}; color: #000">
                    <img src="${track.cover}" alt="${track.title}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
            `;
            
            trackItem.addEventListener('click', function() {
                loadTrack(index);
                if (fullscreenPlayer) {
                    openFullscreenPlayer();
                }
                
                if (!isPlaying) {
                    togglePlay();
                }
            });
            
            tracksList.appendChild(trackItem);
        });
    }
    
    // Открытие полноэкранного плеера с обновлением информации о треке
    function openFullscreenPlayer() {
        // Убедимся, что информация о треке актуальна перед отображением
        updatePlayerInfo();
        
        // Показываем полноэкранный плеер
        if (fullscreenPlayer) {
            fullscreenPlayer.classList.add('active');
        }
    }
    
    // Функция поиска треков
    async function performSearch(query) {
        if (!searchResults) return;
        
        const searchQuery = query.toLowerCase().trim();
        
        // Получаем элемент для сообщения о пустом поиске
        let searchEmptyMessage = searchResults.querySelector('.search-empty');
        
        if (!searchEmptyMessage) {
            searchEmptyMessage = document.createElement('div');
            searchEmptyMessage.className = 'search-empty';
            searchResults.appendChild(searchEmptyMessage);
        }
        
        if (!searchQuery) {
            searchResults.innerHTML = '';
            searchEmptyMessage.textContent = 'Введите запрос для поиска';
            searchResults.appendChild(searchEmptyMessage);
            return;
        }
        
        // Показываем индикатор загрузки
        searchResults.innerHTML = '<div class="loading">Поиск треков</div>';
        
        try {
            // Поиск через Jamendo API
            const searchResultsData = await JAMENDO_API.searchTracks(searchQuery);
            
            if (!searchResultsData || searchResultsData.length === 0) {
                searchResults.innerHTML = '';
                searchEmptyMessage.textContent = 'Ничего не найдено';
                searchResults.appendChild(searchEmptyMessage);
                return;
            }
            
            // Очищаем результаты
            searchResults.innerHTML = '';
            
            searchResultsData.forEach((track) => {
                const trackItem = document.createElement('div');
                trackItem.className = 'track-item';
                trackItem.dataset.id = track.id;
                
                // Определяем цвет фона для обложки
                const bgColor = parseInt(track.id) % 6 === 0 ? '#1DB954' : 
                              parseInt(track.id) % 6 === 1 ? '#3C78C9' : 
                              parseInt(track.id) % 6 === 2 ? '#9D50BB' :
                              parseInt(track.id) % 6 === 3 ? '#E91E63' :
                              parseInt(track.id) % 6 === 4 ? '#FF9800' : '#FFC107';
                
                trackItem.innerHTML = `
                    <div class="track-cover" style="background-color: ${bgColor}">
                        <img src="${track.cover}" alt="${track.title}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="track-info">
                        <div class="track-title">${track.title}</div>
                        <div class="track-artist">${track.artist}</div>
                    </div>
                `;
                
                // Добавляем обработчик клика
                trackItem.addEventListener('click', function() {
                    // Проверяем, есть ли трек уже в списке
                    const trackIndex = tracks.findIndex(t => t.id === track.id);
                    
                    if (trackIndex !== -1) {
                        // Если трек уже есть, просто играем его
                        loadTrack(trackIndex);
                    } else {
                        // Если трека нет, добавляем его в список треков
                        tracks.push(track);
                        loadTrack(tracks.length - 1);
                    }
                    
                    // Открываем полноэкранный плеер
                    openFullscreenPlayer();
                    
                    if (!isPlaying) {
                        togglePlay();
                    }
                });
                
                searchResults.appendChild(trackItem);
            });
        } catch (error) {
            console.error('Ошибка при выполнении поиска:', error);
            searchResults.innerHTML = '';
            searchEmptyMessage.textContent = 'Произошла ошибка при поиске';
            searchResults.appendChild(searchEmptyMessage);
        }
    }
    
    // Функция для показа уведомлений пользователю
    function showNotification(message, duration = 3000) {
        // Проверяем, существует ли уже уведомление
        let notification = document.querySelector('.audio-notification');
        
        // Если уведомления нет, создаем его
        if (!notification) {
            notification = document.createElement('div');
            notification.className = 'audio-notification';
            notification.style.position = 'fixed';
            notification.style.bottom = '120px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            notification.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(notification);
        }
        
        // Устанавливаем сообщение и показываем уведомление
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Скрываем уведомление через указанное время
        setTimeout(() => {
            notification.style.opacity = '0';
            // Удаляем элемент после затухания
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
    
    // Функция лайка трека
    function toggleLike() {
        if (!tracks[currentTrack]) return;
        
        isLiked = !isLiked;
        updateLikeButton();
        
        if (isLiked) {
            // Проверяем, есть ли уже трек в лайкнутых
            if (!likedTracks.some(track => track.id === tracks[currentTrack].id)) {
                likedTracks.push(tracks[currentTrack]);
                showNotification('Трек добавлен в избранное');
            }
        } else {
            // Удаляем трек из лайкнутых
            likedTracks = likedTracks.filter(track => track.id !== tracks[currentTrack].id);
            showNotification('Трек удален из избранного');
        }
        
        // Сохраняем лайкнутые треки
        saveLikedTracks();
    }
    
    // Сохранение лайкнутых треков
    function saveLikedTracks() {
        try {
            // Если используется в Telegram WebApp
            if (isTelegramApp && tg.CloudStorage) {
                // Используем Telegram Storage
                tg.CloudStorage.setItem('likedTracks', JSON.stringify(likedTracks));
            } else {
                // Используем обычный localStorage
                localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
            }
        } catch (error) {
            console.error('Ошибка при сохранении лайкнутых треков:', error);
        }
    }
    
    // Загрузка лайкнутых треков
    function loadLikedTracks() {
        try {
            // Если используется в Telegram WebApp
            if (isTelegramApp && tg.CloudStorage) {
                tg.CloudStorage.getItem('likedTracks', function(err, value) {
                    if (err) {
                        console.error('Ошибка при получении данных из Telegram:', err);
                        loadFromLocalStorage();
                    } else if (value) {
                        likedTracks = JSON.parse(value);
                    }
                });
            } else {
                loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Ошибка при загрузке лайкнутых треков:', error);
        }
    }
    
    function loadFromLocalStorage() {
        const stored = localStorage.getItem('likedTracks');
        if (stored) {
            likedTracks = JSON.parse(stored);
        }
    }
    
    // Запускаем инициализацию приложения
    initApp();
    
    // Обработчики событий для навигации
    if (homeNav) homeNav.addEventListener('click', () => switchScreen('homeScreen'));
    if (searchNav) searchNav.addEventListener('click', () => switchScreen('searchScreen'));
    if (libraryNav) libraryNav.addEventListener('click', () => switchScreen('libraryScreen'));
    if (profileNav) profileNav.addEventListener('click', () => switchScreen('profileScreen'));
    
    // Обработчики событий для поиска
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            performSearch(this.value);
        });
    }
    
    // Обработчики событий для мини-плеера
    if (miniPlayer) {
        miniPlayer.addEventListener('click', function(e) {
            // Используем метод closest для более надежного определения кликов
            if (e.target.closest('.mini-play-pause')) {
                e.stopPropagation();
                togglePlay();
            } else {
                openFullscreenPlayer();
            }
        });
    }
    
    // Явное делегирование события для кнопки play/pause в мини-плеере
    if (miniPlayPause) {
        miniPlayPause.addEventListener('click', function(e) {
            e.stopPropagation();
            togglePlay();
        });
    }
    
    // Обработчики событий для полноэкранного плеера
    if (closePlayerBtn) {
        closePlayerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (fullscreenPlayer) fullscreenPlayer.classList.remove('active');
        });
    }
    
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            togglePlay();
        });
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            prevTrack();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            nextTrack();
        });
    }
    
    if (shuffleBtn) {
        shuffleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            isShuffle = !isShuffle;
            this.classList.toggle('active');
            if (isShuffle) {
                this.style.color = '#1DB954';
                showNotification('Случайный порядок включен');
            } else {
                this.style.color = '';
                showNotification('Случайный порядок выключен');
            }
        });
    }
    
    if (repeatBtn) {
        repeatBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            isRepeat = !isRepeat;
            this.classList.toggle('active');
            if (isRepeat) {
                this.style.color = '#1DB954';
                showNotification('Повтор включен');
            } else {
                this.style.color = '';
                showNotification('Повтор выключен');
            }
        });
    }
    
    if (likeBtn) {
        likeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleLike();
        });
    }
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (tracks[currentTrack]) {
                const trackInfo = tracks[currentTrack];
                
                if (isTelegramApp) {
                    // Если открыто в Telegram, используем его функции
                    tg.sendData(JSON.stringify({
                        action: 'share_track',
                        track: trackInfo
                    }));
                } else {
                    // В обычном режиме показываем сообщение
                    showNotification(`Поделиться треком: ${trackInfo.title}`);
                }
            }
        });
    }
    
    // Обработчик для обновления прогресса
    audio.addEventListener('timeupdate', updateProgress);
    
    // Обработчик для полосы прогресса
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            e.stopPropagation();
            const width = this.clientWidth;
            const clickX = e.offsetX;
            const duration = audio.duration;
            
            if (duration) {
                audio.currentTime = (clickX / width) * duration;
            }
        });
    }
    
    // Обработчик окончания трека
    audio.addEventListener('ended', function() {
        if (isRepeat) {
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Ошибка повторного воспроизведения:', error);
                });
            }
        } else {
            nextTrack();
        }
    });
    
    // Обработчик загрузки метаданных
    audio.addEventListener('loadedmetadata', updateProgress);
    
    // Обработчик ошибок аудио
    audio.addEventListener('error', function(e) {
        console.error('Ошибка аудио:', e);
        
        // Различные типы ошибок медиа
        let errorMessage = 'Ошибка при воспроизведении аудио';
        
        if (audio.error) {
            switch (audio.error.code) {
                case 1: // MEDIA_ERR_ABORTED
                    errorMessage = 'Воспроизведение прервано пользователем';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorMessage = 'Ошибка сети при загрузке аудио';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorMessage = 'Ошибка декодирования аудио';
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorMessage = 'Формат аудио не поддерживается';
                    break;
            }
        }
        
        // Показываем ошибку пользователю
        showNotification(errorMessage);
        
        // Переключаем на следующий трек при ошибке
        setTimeout(() => nextTrack(), 1000);
    });
    
    // Интеграция с Telegram WebApp
    if (isTelegramApp) {
        // Если открыто из Telegram
        tg.expand();
        tg.ready();
        
        // Показываем кнопку "готово" в Telegram WebApp
        tg.MainButton.text = "Готово";
        tg.MainButton.show();
        
        // Обработчик нажатия на кнопку
        tg.MainButton.onClick(function() {
            // Можно отправить данные о текущем треке боту
            if (tracks[currentTrack]) {
                tg.sendData(JSON.stringify({
                    action: 'current_track',
                    track: tracks[currentTrack]
                }));
            }
        });
    }
}); 