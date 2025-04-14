// Проверяем доступность Telegram WebApp
let tg = window.Telegram?.WebApp;
let isTelegramApp = tg !== undefined;

// Глобальные переменные для плейлистов
let playlists = [];

// Добавляем переменные для отслеживания воспроизведения плейлиста
let isPlayingPlaylist = false;
let currentPlayingPlaylist = null;
let currentPlaylistIndex = -1;

// Добавляем переменные для контекстного меню
const trackContextMenu = document.getElementById('trackContextMenu');
const addToLikedMenuItem = trackContextMenu ? trackContextMenu.querySelector('.add-to-liked') : null;
const removeFromLikedMenuItem = trackContextMenu ? trackContextMenu.querySelector('.remove-from-liked') : null;
const addToPlaylistMenuItem = trackContextMenu ? trackContextMenu.querySelector('.add-to-playlist') : null;
const shareTrackMenuItem = trackContextMenu ? trackContextMenu.querySelector('.share-track') : null;

// Переменная для хранения информации о треке, для которого открыто контекстное меню
let contextMenuTrack = null;

// Когда DOM полностью загружен
document.addEventListener('DOMContentLoaded', function() {
    // Элементы мини-плеера
    const miniPlayer = document.querySelector('.mini-player');
    const miniPlayPause = document.querySelector('.mini-play-pause');
    const miniProgressBar = document.querySelector('.mini-progress-bar');
    
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
    
    // Элементы медиатеки
    const libraryTabs = document.querySelectorAll('.library-tab');
    const libraryContents = document.querySelectorAll('.library-tab-content');
    const playlistsContainer = document.querySelector('.playlists-container');
    const likedTracksContainer = document.querySelector('.liked-tracks-container');
    const createPlaylistBtn = document.querySelector('.create-playlist');
    
    // Элементы модальных окон
    const createPlaylistModal = document.getElementById('createPlaylistModal');
    const addToPlaylistModal = document.getElementById('addToPlaylistModal');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    const createPlaylistForm = createPlaylistModal ? createPlaylistModal.querySelector('.modal-footer') : null;
    const playlistNameInput = document.getElementById('playlist-name');
    const addToPlaylistList = document.querySelector('.playlists-list');
    const createNewPlaylistBtn = document.querySelector('.create-new-playlist');
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    
    // Добавляем переменные для экрана детального просмотра плейлиста
    const playlistDetailScreen = document.getElementById('playlistDetailScreen');
    const backButton = document.querySelector('.back-button');
    const playlistTitle = document.querySelector('.playlist-detail-title');
    const playlistCoverImage = document.querySelector('.playlist-cover-image');
    const playlistCount = document.querySelector('.playlist-detail-count');
    const playlistTracksContainer = document.querySelector('.playlist-tracks-container');
    const playlistTracksEmpty = document.getElementById('playlist-tracks-empty');
    const playlistPlayButton = document.querySelector('.playlist-play-button');
    const playlistDeleteButton = document.querySelector('.playlist-delete-button');
    
    // Переменная для хранения текущего открытого плейлиста
    let currentPlaylist = null;
    
    // Добавляем переменные для модального окна переименования плейлиста
    const renamePlaylistModal = document.getElementById('renamePlaylistModal');
    const renamePlaylistNameInput = document.getElementById('rename-playlist-name');
    const renameModalCancelButtons = renamePlaylistModal ? renamePlaylistModal.querySelectorAll('.btn-cancel, .modal-close') : [];
    const renameModalSaveButton = renamePlaylistModal ? renamePlaylistModal.querySelector('.btn-create') : null;
    
    // Переменная для хранения ID плейлиста, который переименовываем
    let renamingPlaylistId = null;
    
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
            
            // Загружаем плейлисты из хранилища
            loadPlaylists();
            
            // Инициализируем интерфейс
            initializeTracks();
            
            // Загружаем первый трек
            loadTrack(0);
            
            // Обновляем интерфейс медиатеки
            updateLibraryUI();
            
            // Обновляем счетчик любимых треков
            updateLikedTracksCount();
            
            // Инициализируем Lottie-анимацию микрофона
            initMicAnimation();
            
            console.log('Приложение успешно инициализировано!');
        } catch (error) {
            console.error('Ошибка при инициализации приложения:', error);
            
            // При ошибке загрузки треков через API используем локальные
            tracks = JAMENDO_API.getFallbackTracks();
            initializeTracks();
            loadTrack(0);
        }
    }
    
    // Функция инициализации Lottie-анимации микрофона
    function initMicAnimation() {
        // Проверяем, доступна ли библиотека Lottie и существует ли контейнер
        if (typeof lottie !== 'undefined' && document.getElementById('mic-animation')) {
            // Используем демо-анимацию микрофона из общедоступного репозитория
            // Можно заменить на URL к вашему собственному файлу .tgs или .json
            const micAnimation = lottie.loadAnimation({
                container: document.getElementById('mic-animation'),
                renderer: 'svg',
                loop: true,
                autoplay: true,
                // Ссылка на анимацию микрофона из LottieFiles
                path: 'https://assets9.lottiefiles.com/private_files/lf30_lndgweyu.json'
            });
            
            // Обработка ошибок загрузки анимации
            micAnimation.addEventListener('data_failed', function() {
                console.warn('Не удалось загрузить Lottie-анимацию микрофона');
                // Резервный вариант - эмодзи микрофона
                const micElement = document.getElementById('mic-animation');
                if (micElement) {
                    micElement.innerHTML = '🎤';
                }
            });
        } else {
            // Если библиотека Lottie не загружена, используем эмодзи как запасной вариант
            const micElement = document.getElementById('mic-animation');
            if (micElement) {
                micElement.innerHTML = '🎤';
            }
        }
    }
    
    // Функция переключения экранов
    function switchScreen(screenId) {
        // Скрываем все экраны
        homeScreen.classList.add('hidden');
        searchScreen.classList.add('hidden');
        libraryScreen.classList.add('hidden');
        profileScreen.classList.add('hidden');
        
        // Добавляем скрытие экрана детального просмотра плейлиста
        if (playlistDetailScreen) {
            playlistDetailScreen.classList.add('hidden');
        }
        
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
            case 'playlistDetailScreen': // Для экрана плейлиста активна вкладка медиатеки
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
        const coverImg = document.querySelector('.player-cover-img');
        if (coverImg) {
            coverImg.src = currentTrackData.cover;
            coverImg.alt = currentTrackData.title;
        }
        
        // Устанавливаем цвет фона на основе обложки (опционально)
        if (currentTrackData.cover) {
            // Этот код выполняется только если обложка доступна
            setTimeout(() => {
                try {
                    setBackgroundGradient(currentTrackData.cover);
                } catch (error) {
                    console.log('Не удалось установить фоновый градиент:', error);
                }
            }, 300);
        }
    }
    
    // Функция для создания фона на основе обложки
    function setBackgroundGradient(imageUrl) {
        // Создаем фоновый цвет в зависимости от обложки
        const defaultColor = '#1a1a1a';
        
        if (!imageUrl) {
            document.querySelector('.fullscreen-player').style.background = defaultColor;
            return;
        }
        
        // Используем расширенный набор ярких сплошных цветов без слишком светлых
        const colors = [
            // Насыщенные темные цвета
            '#1E0A0A', // темно-бордовый
            '#0A0A1E', // темно-синий
            '#0A1E0A', // темно-зеленый
            '#1E1E0A', // темно-горчичный
            '#1E0A1E', // темно-фиолетовый
            '#0A1E1E', // темно-бирюзовый
            
            // Насыщенные средние цвета
            '#3D1E20', // винный
            '#1E213D', // глубокий синий
            '#213D1E', // изумрудный
            '#3D391E', // коричневый
            '#301E3D', // баклажановый
            '#1E3D39', // малахитовый
            
            // Более яркие средние тона
            '#4B2324', // бордовый
            '#24264B', // синий джинс
            '#264B24', // зеленый лес
            '#4B4824', // оливковый
            '#3C244B', // фиолетовый
            '#244B46', // темно-бирюзовый
            
            // Яркие цвета
            '#592A2C', // темно-красный
            '#2A2C59', // индиго
            '#2C592A', // хвойный
            '#596C2A', // хаки
            '#462A59', // лавандовый
            '#2A5954', // морской волны
            
            // Очень насыщенные цвета
            '#7C4033', // терракотовый
            '#334080', // грозовой
            '#336633', // травяной
            '#807733', // горчичный
            '#663366', // сливовый
            '#336666', // мурена
            
            // Интенсивные темные цвета
            '#990000', // темно-красный
            '#000099', // темно-синий
            '#009900', // темно-зеленый
            '#999900', // горчица
            '#990099', // маджента
            '#009999', // циан
            
            // Современные смелые цвета
            '#D61C4E', // яркий красный
            '#293462', // кобальтовый
            '#1CD6CE', // яркий бирюзовый
            '#7A0BC0', // яркий фиолетовый
            '#270082', // темно-синий
            
            // Стильные монохромные
            '#222831', // почти черный
            '#393E46', // темно-серый
            '#52575D', // серый
            '#747474', // средне-серый
            
            // Глубокие и богатые
            '#222222', // глубокий черный
            '#30475E', // темно-синий
            '#F05454', // кораллово-красный
            '#121212', // угольно-черный
            
            // Интенсивные современные
            '#B91646', // бургундский
            '#105652', // темно-изумрудный
            '#444444', // графитовый
            '#333333', // темно-серый
            
            // Дизайнерские
            '#2E0249', // глубокий фиолетовый
            '#570A57', // яркий фиолетовый
            '#A91079', // фуксия
            '#333333', // угольный
            
            // Неоновые темные
            '#3F0071', // темно-фиолетовый
            '#150050', // ультрафиолетовый
            '#000000', // чистый черный
            '#1A1A1A', // почти черный
            
            // Винтажные
            '#1A120B', // кофейный
            '#3C2A21', // корица
            '#4D3C2E', // темно-коричневый
            '#3A3B3C'  // темно-серый
        ];
        
        // Получаем более сложный хеш на основе URL изображения
        const hash = imageUrl.split('').reduce((sum, char, index) => {
            return sum + (char.charCodeAt(0) * (index + 1));
        }, 0);
        
        // Выбираем цвет на основе хеша
        const colorIndex = hash % colors.length;
        
        // Устанавливаем сплошной цвет фона с плавным переходом
        const playerElement = document.querySelector('.fullscreen-player');
        playerElement.style.background = colors[colorIndex];
        
        // Опционально: меняем цвет псевдоэлемента (звездного фона) на основе выбранного цвета
        const starOpacity = (colorIndex % 5 + 3) / 10; // от 0.3 до 0.7
        
        // Добавляем стиль для псевдоэлемента
        setTimeout(() => {
            playerElement.classList.remove('color-transition');
            void playerElement.offsetWidth; // Перезапуск анимации
            playerElement.classList.add('color-transition');
        }, 50);
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
        // Если воспроизводится плейлист, обрабатываем это специальным образом
        if (isPlayingPlaylist && currentPlayingPlaylist) {
            let nextIndex = currentPlaylistIndex + 1;
            
            // Если достигли конца плейлиста при нажатии "следующий трек", переходим к началу
            if (nextIndex >= currentPlayingPlaylist.tracks.length) {
                nextIndex = 0;
            }
            
            currentPlaylistIndex = nextIndex;
            playPlaylistTrack(currentPlayingPlaylist, currentPlaylistIndex);
            return;
        }
        
        // Стандартная логика
        if (isShuffle) {
            // Случайный трек, но не текущий
            let nextIndex;
            do {
                nextIndex = Math.floor(Math.random() * tracks.length);
            } while (tracks.length > 1 && nextIndex === currentTrack);
            
            loadTrack(nextIndex);
        } else {
            loadTrack((currentTrack + 1) % tracks.length);
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
        // Если сейчас играет плейлист и прошло мало времени с начала трека
        if (isPlayingPlaylist && currentPlayingPlaylist && audio.currentTime <= 3) {
            let prevIndex = currentPlaylistIndex - 1;
            
            // Если мы на первом треке плейлиста, переходим к последнему
            if (prevIndex < 0) {
                prevIndex = currentPlayingPlaylist.tracks.length - 1;
            }
            
            currentPlaylistIndex = prevIndex;
            playPlaylistTrack(currentPlayingPlaylist, currentPlaylistIndex);
            return;
        }
        
        // Стандартная логика
        if (audio.currentTime > 3) {
            audio.currentTime = 0;
        } else {
            loadTrack((currentTrack - 1 + tracks.length) % tracks.length);
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
        
        // Обновляем полосу прогресса в полноэкранном плеере
        if (duration > 0 && progress && progressHandle) {
            const progressPercent = (currentTime / duration) * 100;
            progress.style.width = `${progressPercent}%`;
            progressHandle.style.left = `${progressPercent}%`;
            
            // Обновляем полосу прогресса в мини-плеере
            if (miniProgressBar) {
                miniProgressBar.style.width = `${progressPercent}%`;
            }
        } else if (progress && progressHandle) {
            progress.style.width = '0%';
            progressHandle.style.left = '0%';
            
            // Сбрасываем прогресс в мини-плеере
            if (miniProgressBar) {
                miniProgressBar.style.width = '0%';
            }
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
            
            trackItem.innerHTML = `
                <div class="track-cover">
                    <img src="${track.cover}" alt="${track.title}" style="width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="track-info">
                    <div class="track-title">${track.title}</div>
                    <div class="track-artist">${track.artist}</div>
                </div>
                <div class="track-actions">
                    <i class="fas fa-ellipsis-v"></i>
                </div>
            `;
            
            // Добавляем обработчик клика на трек
            trackItem.addEventListener('click', function(e) {
                // Проверяем, не кликнули ли на кнопку с точками
                if (!e.target.closest('.track-actions')) {
                    loadTrack(index);
                    if (fullscreenPlayer) {
                        openFullscreenPlayer();
                    }
                    
                    if (!isPlaying) {
                        togglePlay();
                    }
                }
            });
            
            // Обработчик клика на кнопку с тремя точками
            const actionsButton = trackItem.querySelector('.track-actions');
            if (actionsButton) {
                actionsButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    showTrackContextMenu(e, track);
                });
            }
            
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
                trackItem.addEventListener('click', function(e) {
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
                
                // Обновляем интерфейс медиатеки
                updateLibraryUI();
            }
        } else {
            // Удаляем трек из лайкнутых
            likedTracks = likedTracks.filter(track => track.id !== tracks[currentTrack].id);
            showNotification('Трек удален из избранного');
            
            // Обновляем интерфейс медиатеки
            updateLibraryUI();
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
                    // Обновляем счетчик лайкнутых треков
                    updateLikedTracksCount();
                });
            } else {
                loadFromLocalStorage();
                // Обновляем счетчик лайкнутых треков
                updateLikedTracksCount();
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
    
    // Функции для работы с плейлистами
    function loadPlaylists() {
        try {
            const stored = localStorage.getItem('playlists');
            if (stored) {
                playlists = JSON.parse(stored);
            } else {
                playlists = [];
            }
        } catch (error) {
            console.error('Ошибка при загрузке плейлистов:', error);
            playlists = [];
        }
    }
    
    function savePlaylists() {
        try {
            localStorage.setItem('playlists', JSON.stringify(playlists));
        } catch (error) {
            console.error('Ошибка при сохранении плейлистов:', error);
        }
    }
    
    function createPlaylist(name) {
        const newPlaylist = {
            id: Date.now().toString(),
            name: name,
            tracks: []
        };
        
        playlists.push(newPlaylist);
        savePlaylists();
        updateLibraryUI();
        showNotification('Плейлист создан');
    }
    
    function addTrackToPlaylist(playlistId, track) {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // Проверяем, есть ли уже трек в плейлисте
        if (!playlist.tracks.some(t => t.id === track.id)) {
            playlist.tracks.push(track);
            savePlaylists();
            updateLibraryUI();
            showNotification(`Трек добавлен в плейлист "${playlist.name}"`);
        } else {
            showNotification('Этот трек уже в плейлисте');
        }
    }
    
    // Обновление интерфейса медиатеки
    function updateLibraryUI() {
        if (playlistsContainer) {
            // Сохраняем кнопку создания плейлиста, если она существует
            const createPlaylistElement = playlistsContainer.querySelector('.create-playlist');
            
            // Очищаем контейнер
            playlistsContainer.innerHTML = '';
            
            // Добавляем обратно кнопку создания плейлиста
            if (createPlaylistElement) {
                // Используем Bootstrap и улучшаем стиль
                const newCreatePlaylistButton = document.createElement('div');
                newCreatePlaylistButton.className = 'create-playlist';
                
                newCreatePlaylistButton.innerHTML = `
                    <div class="create-playlist-icon">
                        <i class="fas fa-plus"></i>
                    </div>
                    <div class="create-playlist-text">Создать плейлист</div>
                `;
                
                newCreatePlaylistButton.addEventListener('click', openCreatePlaylistModal);
                playlistsContainer.appendChild(newCreatePlaylistButton);
            }
            
            // Добавляем плейлисты
            playlists.forEach(playlist => {
                const playlistElement = document.createElement('div');
                playlistElement.className = 'playlist-item';
                playlistElement.dataset.id = playlist.id;
                
                const hasCoverTrack = playlist.tracks.length > 0;
                const coverUrl = hasCoverTrack ? playlist.tracks[0].cover : '';
                
                // Ограничиваем длину названия
                let displayName = playlist.name;
                if (displayName.length > 20) {
                    displayName = displayName.substring(0, 20) + '...';
                }
                
                playlistElement.innerHTML = `
                    <div class="playlist-cover">
                        ${hasCoverTrack 
                            ? `<img src="${coverUrl}" alt="${playlist.name}">` 
                            : `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #333;">
                                <i class="fas fa-music" style="font-size: 30px; color: #999;"></i>
                               </div>`
                        }
                        <div class="tracks-count-overlay">
                            ${playlist.tracks.length} ${getTracksWord(playlist.tracks.length)}
                        </div>
                    </div>
                    <div class="playlist-info">
                        <div class="playlist-title">${displayName}</div>
                    </div>
                `;
                
                playlistElement.addEventListener('click', function() {
                    openPlaylistDetail(playlist.id);
                });
                
                playlistsContainer.appendChild(playlistElement);
            });
            
            // Показываем или скрываем пустое состояние
            const playlistsEmpty = document.getElementById('playlists-empty');
            if (playlistsEmpty) {
                playlistsEmpty.style.display = playlists.length === 0 ? 'block' : 'none';
            }
        }
        
        // Обновляем информацию о любимых треках
        if (likedTracksContainer) {
            // Очищаем контейнер
            likedTracksContainer.innerHTML = '';
            
            // Добавляем треки
            likedTracks.forEach(track => {
                const trackItem = document.createElement('div');
                trackItem.className = 'track-item';
                
                // Убираем инлайновые стили ширины, так как они теперь в CSS
                
                // Определяем цвет фона для обложки
                const bgColor = parseInt(track.id) % 6 === 0 ? '#1DB954' : 
                               parseInt(track.id) % 6 === 1 ? '#3C78C9' : 
                               parseInt(track.id) % 6 === 2 ? '#9D50BB' :
                               parseInt(track.id) % 6 === 3 ? '#E91E63' :
                               parseInt(track.id) % 6 === 4 ? '#FF9800' : '#FFC107';
                
                // Ограничиваем длину названия и исполнителя
                let displayTitle = track.title;
                let displayArtist = track.artist;
                
                trackItem.innerHTML = `
                    <div class="track-cover" style="background-color: ${bgColor}">
                        <img src="${track.cover}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover;">
                    </div>
                    <div class="track-info">
                        <div class="track-title">${displayTitle}</div>
                        <div class="track-artist">${displayArtist}</div>
                    </div>
                    <div class="track-actions">
                        <i class="fas fa-ellipsis-v"></i>
                    </div>
                `;
                
                // Добавляем обработчик клика
                trackItem.addEventListener('click', function(e) {
                    // Проверяем, не кликнули ли на кнопку с точками
                    if (!e.target.closest('.track-actions')) {
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
                    }
                });
                
                // Обработчик клика на кнопку с тремя точками
                const actionsButton = trackItem.querySelector('.track-actions');
                if (actionsButton) {
                    actionsButton.addEventListener('click', function(e) {
                        e.stopPropagation();
                        showTrackContextMenu(e, track);
                    });
                }
                
                likedTracksContainer.appendChild(trackItem);
            });
            
            // Показываем или скрываем пустое состояние
            const likedEmpty = document.getElementById('liked-empty');
            if (likedEmpty) {
                likedEmpty.style.display = likedTracks.length === 0 ? 'block' : 'none';
            }
        }
        
        // Обновляем счетчик любимых треков
        updateLikedTracksCount();
    }
    
    // Вспомогательная функция для склонения слова "трек"
    function getTracksWord(count) {
        if (count === 1) return 'трек';
        if (count >= 2 && count <= 4) return 'трека';
        return 'треков';
    }
    
    // Обработчики событий для медиатеки
    if (libraryTabs) {
        libraryTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabName = this.dataset.tab;
                
                // Активируем нужную вкладку
                libraryTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Показываем нужное содержимое
                libraryContents.forEach(c => c.classList.remove('active'));
                document.getElementById(`${tabName}-content`).classList.add('active');
            });
        });
    }
    
    // Обработчик для создания плейлиста
    if (createPlaylistBtn) {
        createPlaylistBtn.addEventListener('click', function() {
            openCreatePlaylistModal();
        });
    }
    
    // Функция для открытия модального окна создания плейлиста
    function openCreatePlaylistModal() {
        if (createPlaylistModal) {
            // Используем встроенную Bootstrap 5 функцию показа модального окна
            const modalEl = document.getElementById('createPlaylistModal');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
            
            if (playlistNameInput) {
                setTimeout(() => {
                    playlistNameInput.value = '';
                    playlistNameInput.focus();
                }, 500);
            }
        }
    }
    
    // Функция для закрытия модальных окон
    function closeModal(modal) {
        if (modal) {
            // Используем Bootstrap Modal API для Bootstrap 5
            const modalElement = typeof modal === 'string' ? document.getElementById(modal) : modal;
            const bsModal = bootstrap.Modal.getInstance(modalElement);
            if (bsModal) {
                bsModal.hide();
            }
        }
    }
    
    // Обработчики для модальных окон
    if (modalCloseButtons) {
        modalCloseButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
    }
    
    if (cancelButtons) {
        cancelButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
    }
    
    // Удаляю дублирующийся обработчик кнопки создания плейлиста
    if (createPlaylistForm) {
        createPlaylistForm.addEventListener('click', function(e) {
            // Убираю этот обработчик, так как он дублирует следующий
        });
    }
    
    // Оставляю только один обработчик для кнопки "Создать"
    const createPlaylistButton = document.querySelector('#createPlaylistModal .btn-create');
    if (createPlaylistButton) {
        createPlaylistButton.addEventListener('click', function() {
            const name = playlistNameInput ? playlistNameInput.value.trim() : '';
            if (name) {
                createPlaylist(name);
                closeModal(createPlaylistModal);
            } else {
                showNotification('Введите название плейлиста');
            }
        });
    }
    
    // Оставляю обработчик Enter в поле ввода
    if (playlistNameInput) {
        playlistNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                const name = this.value.trim();
                if (name) {
                    createPlaylist(name);
                    closeModal(createPlaylistModal);
                } else {
                    showNotification('Введите название плейлиста');
                }
            }
        });
    }
    
    // Обработчик для добавления трека в плейлист
    function openAddToPlaylistModal(track) {
        if (!addToPlaylistModal || !track) return;
        
        // Запоминаем трек для добавления в плейлист
        contextMenuTrack = track;
        
        // Обновляем список плейлистов в модальном окне
        updatePlaylistsListInModal();
        
        // Открываем модальное окно
        const modalEl = document.getElementById('addToPlaylistModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }
    
    // Функция для обновления списка плейлистов в модальном окне
    function updatePlaylistsListInModal() {
        if (!addToPlaylistList) return;
        
        // Очищаем список
        addToPlaylistList.innerHTML = '';
        
        // Показываем сообщение, если нет плейлистов
        const emptyMessage = document.querySelector('.playlist-empty-modal');
        
        if (playlists.length === 0) {
            if (emptyMessage) emptyMessage.classList.remove('d-none');
        } else {
            if (emptyMessage) emptyMessage.classList.add('d-none');
            
            // Добавляем плейлисты в список
            playlists.forEach(playlist => {
                const playlistItem = document.createElement('button');
                playlistItem.className = 'list-group-item list-group-item-action d-flex align-items-center bg-dark text-light border-secondary';
                
                // Определяем, есть ли обложка для плейлиста
                const hasCoverTrack = playlist.tracks.length > 0;
                const coverUrl = hasCoverTrack ? playlist.tracks[0].cover : '';
                
                playlistItem.innerHTML = `
                    <div class="playlist-preview-img me-3" style="width: 40px; height: 40px; border-radius: 4px; overflow: hidden;">
                        ${hasCoverTrack 
                            ? `<img src="${coverUrl}" alt="${playlist.name}" style="width: 100%; height: 100%; object-fit: cover;">` 
                            : `<div class="d-flex align-items-center justify-content-center h-100 bg-secondary">
                                <i class="fas fa-music"></i>
                              </div>`
                        }
                    </div>
                    <div>
                        <div class="fw-bold">${playlist.name}</div>
                        <div class="small text-secondary">${playlist.tracks.length} треков</div>
                    </div>
                `;
                
                // Добавляем обработчик клика
                playlistItem.addEventListener('click', function() {
                    if (contextMenuTrack) {
                        addTrackToPlaylist(playlist.id, contextMenuTrack);
                        closeModal(addToPlaylistModal);
                    }
                });
                
                addToPlaylistList.appendChild(playlistItem);
            });
        }
    }
    
    if (createNewPlaylistBtn) {
        createNewPlaylistBtn.addEventListener('click', function() {
            closeModal(addToPlaylistModal);
            openCreatePlaylistModal();
        });
    }
    
    // Добавляем обработчик для кнопки в полноэкранном плеере
    document.querySelector('.fullscreen-player .extra-controls .fas.fa-list').parentElement.addEventListener('click', function() {
        if (tracks[currentTrack]) {
            openAddToPlaylistModal(tracks[currentTrack]);
        }
    });
    
    // Запускаем инициализацию приложения
    initApp();
    
    // Обработчики событий для навигации
    if (homeNav) homeNav.addEventListener('click', () => switchScreen('homeScreen'));
    if (searchNav) searchNav.addEventListener('click', () => switchScreen('searchScreen'));
    if (libraryNav) libraryNav.addEventListener('click', () => switchScreen('libraryScreen'));
    if (profileNav) profileNav.addEventListener('click', () => switchScreen('profileScreen'));
    
    // Установить начальное активное состояние главного меню
    document.addEventListener('DOMContentLoaded', function() {
        // По умолчанию активен экран home
        homeNav.classList.add('active');
        homeScreen.classList.remove('hidden');
        
        // Скрываем остальные экраны
        searchScreen.classList.add('hidden');
        libraryScreen.classList.add('hidden');
        profileScreen.classList.add('hidden');
    });
    
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
            // Не сбрасываем состояние плейлиста при закрытии полноэкранного плеера
            // Это позволит продолжать воспроизведение плейлиста в фоновом режиме
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
    
    // Находим обработчик окончания трека и модифицируем его
    // Существующий обработчик события 'ended' заменяем на новый
    audio.removeEventListener('ended', function() {
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

    // Добавляем новый обработчик
    audio.addEventListener('ended', function() {
        if (isRepeat) {
            // Повторяем текущий трек
            audio.currentTime = 0;
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error('Ошибка повторного воспроизведения:', error);
                });
            }
        } else if (isPlayingPlaylist) {
            // Если это последний трек в плейлисте
            if (currentPlaylistIndex >= currentPlayingPlaylist.tracks.length - 1) {
                // Начинаем плейлист заново
                currentPlaylistIndex = 0;
                playPlaylistTrack(currentPlayingPlaylist, 0);
            } else {
                // Переходим к следующему треку в плейлисте
                currentPlaylistIndex++;
                playPlaylistTrack(currentPlayingPlaylist, currentPlaylistIndex);
            }
        } else {
            // Стандартное поведение - переход к следующему треку
            nextTrack();
        }
    });
    
    // Добавляем сброс состояния плейлиста при выходе из полноэкранного режима
    if (closePlayerBtn) {
        const originalClickHandler = closePlayerBtn.onclick;
        closePlayerBtn.onclick = function(e) {
            if (originalClickHandler) {
                originalClickHandler.call(this, e);
            }
            // Не сбрасываем состояние плейлиста при закрытии полноэкранного плеера
            // Это позволит продолжать воспроизведение плейлиста в фоновом режиме
        };
    }
    
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
    
    // Функции для работы с экраном детального просмотра плейлиста
    function openPlaylistDetail(playlistId) {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return;
        
        // Сохраняем текущий плейлист
        currentPlaylist = playlist;
        
        // Обновляем информацию на экране плейлиста
        if (playlistTitle) {
            // Ограничиваем длину названия для отображения
            let displayName = playlist.name;
            if (displayName.length > 25) {
                displayName = displayName.substring(0, 25) + '...';
            }
            playlistTitle.textContent = displayName;
            
            // Добавляем полное название в title для отображения при наведении
            playlistTitle.setAttribute('title', playlist.name);
        }
        
        // Обновляем обложку
        if (playlistCoverImage) {
            if (playlist.tracks.length > 0) {
                const coverTrack = playlist.tracks[0];
                playlistCoverImage.innerHTML = `<img src="${coverTrack.cover}" alt="${playlist.name}" style="width: 100%; height: 100%; object-fit: cover;">`;
            } else {
                playlistCoverImage.innerHTML = `<div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background-color: #333;"><i class="fas fa-music" style="font-size: 40px; color: #999;"></i></div>`;
            }
        }
        
        // Обновляем счетчик треков
        if (playlistCount) {
            const trackCount = playlist.tracks.length;
            playlistCount.textContent = `${trackCount} ${getTracksWord(trackCount)}`;
        }
        
        // Отображаем треки плейлиста
        updatePlaylistTracks(playlist);
        
        // Переключаемся на экран плейлиста
        switchScreen('playlistDetailScreen');
    }
    
    function updatePlaylistTracks(playlist) {
        if (!playlistTracksContainer) return;
        
        // Очищаем контейнер
        playlistTracksContainer.innerHTML = '';
        
        // Показываем или скрываем пустое состояние
        if (playlistTracksEmpty) {
            if (playlist.tracks.length === 0) {
                playlistTracksEmpty.style.display = 'block';
            } else {
                playlistTracksEmpty.style.display = 'none';
                
                // Добавляем треки
                playlist.tracks.forEach((track, index) => {
                    const trackItem = document.createElement('div');
                    trackItem.className = 'track-item';
                    
                    // Убираем инлайновые стили ширины, так как они теперь в CSS
                    
                    // Определяем цвет фона для обложки
                    const bgColor = parseInt(track.id) % 6 === 0 ? '#1DB954' : 
                                   parseInt(track.id) % 6 === 1 ? '#3C78C9' : 
                                   parseInt(track.id) % 6 === 2 ? '#9D50BB' :
                                   parseInt(track.id) % 6 === 3 ? '#E91E63' :
                                   parseInt(track.id) % 6 === 4 ? '#FF9800' : '#FFC107';
                    
                    // Ограничиваем длину названия и исполнителя
                    let displayTitle = track.title;
                    let displayArtist = track.artist;
                    
                    trackItem.innerHTML = `
                        <div class="track-cover" style="background-color: ${bgColor}">
                            <img src="${track.cover}" alt="${displayTitle}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div class="track-info">
                            <div class="track-title">${displayTitle}</div>
                            <div class="track-artist">${displayArtist}</div>
                        </div>
                        <div class="track-actions">
                            <i class="fas fa-ellipsis-v"></i>
                        </div>
                    `;
                    
                    // Добавляем обработчик клика
                    trackItem.addEventListener('click', function(e) {
                        // Проверяем, не кликнули ли на кнопку с точками
                        if (!e.target.closest('.track-actions')) {
                            playPlaylistTrack(playlist, index);
                        }
                    });
                    
                    // Обработчик клика на кнопку с тремя точками
                    const actionsButton = trackItem.querySelector('.track-actions');
                    if (actionsButton) {
                        actionsButton.addEventListener('click', function(e) {
                            e.stopPropagation();
                            showTrackContextMenu(e, track);
                        });
                    }
                    
                    playlistTracksContainer.appendChild(trackItem);
                });
            }
        }
    }
    
    function playPlaylistTrack(playlist, index) {
        if (!playlist || !playlist.tracks || index >= playlist.tracks.length) return;
        
        // Устанавливаем параметры воспроизведения плейлиста
        isPlayingPlaylist = true;
        currentPlayingPlaylist = playlist;
        currentPlaylistIndex = index;
        
        const track = playlist.tracks[index];
        
        // Ищем трек в основном списке
        let mainIndex = tracks.findIndex(t => t.id === track.id);
        
        if (mainIndex === -1) {
            // Если трек не найден, добавляем его в основной список
            tracks.push(track);
            mainIndex = tracks.length - 1;
        }
        
        // Загружаем и воспроизводим трек
        loadTrack(mainIndex);
        openFullscreenPlayer();
        if (!isPlaying) {
            togglePlay();
        }
    }
    
    function playAllPlaylistTracks(playlist) {
        if (!playlist || !playlist.tracks || playlist.tracks.length === 0) {
            showNotification('В плейлисте нет треков');
            return;
        }
        
        // Устанавливаем параметры воспроизведения плейлиста
        isPlayingPlaylist = true;
        currentPlayingPlaylist = playlist;
        currentPlaylistIndex = 0;
        
        // Добавляем все треки плейлиста в основной массив треков, если их там нет
        playlist.tracks.forEach(track => {
            if (!tracks.some(t => t.id === track.id)) {
                tracks.push(track);
            }
        });
        
        // Находим индекс первого трека плейлиста в основном массиве
        const firstTrack = playlist.tracks[0];
        const mainIndex = tracks.findIndex(t => t.id === firstTrack.id);
        
        if (mainIndex !== -1) {
            // Загружаем и воспроизводим трек
            loadTrack(mainIndex);
            openFullscreenPlayer();
            if (!isPlaying) {
                togglePlay();
            }
        }
    }

    function deletePlaylist(playlistId) {
        // Запрашиваем подтверждение
        const confirmDelete = confirm('Вы уверены, что хотите удалить этот плейлист?');
        
        if (confirmDelete) {
            // Удаляем плейлист
            playlists = playlists.filter(p => p.id !== playlistId);
            
            // Сохраняем изменения
            savePlaylists();
            
            // Обновляем UI
            updateLibraryUI();
            
            // Возвращаемся на экран медиатеки
            switchScreen('libraryScreen');
            
            showNotification('Плейлист удален');
        }
    }

    // Добавим обработчики событий для экрана детального просмотра плейлиста
    if (backButton) {
        backButton.addEventListener('click', function() {
            switchScreen('libraryScreen');
        });
    }

    if (playlistPlayButton) {
        playlistPlayButton.addEventListener('click', function() {
            if (currentPlaylist) {
                playAllPlaylistTracks(currentPlaylist);
            }
        });
    }

    if (playlistDeleteButton) {
        playlistDeleteButton.addEventListener('click', function() {
            if (currentPlaylist) {
                deletePlaylist(currentPlaylist.id);
            }
        });
    }

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

    // Функция для открытия модального окна переименования плейлиста
    function openRenamePlaylistModal(playlistId) {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist || !renamePlaylistModal) return;
        
        // Сохраняем ID плейлиста, который переименовываем
        renamingPlaylistId = playlistId;
        
        // Устанавливаем текущее имя плейлиста в поле ввода
        if (renamePlaylistNameInput) {
            renamePlaylistNameInput.value = playlist.name;
        }
        
        // Открываем модальное окно
        const modalEl = document.getElementById('renamePlaylistModal');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
        
        // Фокусируемся на поле ввода после открытия
        if (renamePlaylistNameInput) {
            setTimeout(() => {
                renamePlaylistNameInput.focus();
                renamePlaylistNameInput.select();
            }, 500);
        }
    }
    
    // Функция для закрытия модального окна переименования плейлиста
    function closeRenamePlaylistModal() {
        // Закрываем модальное окно через Bootstrap API
        closeModal(renamePlaylistModal);
        
        // Сбрасываем ID плейлиста
        renamingPlaylistId = null;
    }
    
    // Функция для применения нового названия плейлиста
    function applyPlaylistRename() {
        if (renamingPlaylistId === null || !renamePlaylistNameInput) return;
        
        const newName = renamePlaylistNameInput.value.trim();
        if (newName === '') {
            showNotification('Название плейлиста не может быть пустым');
            return;
        }
        
        // Находим плейлист
        const playlist = playlists.find(p => p.id === renamingPlaylistId);
        if (!playlist) return;
        
        // Обновляем название
        playlist.name = newName;
        
        // Сохраняем изменения
        savePlaylists();
        
        // Обновляем заголовок на экране плейлиста
        if (playlistTitle && currentPlaylist && currentPlaylist.id === renamingPlaylistId) {
            const titleElement = document.querySelector('.playlist-detail-title');
            if (titleElement) {
                titleElement.textContent = newName;
            }
        }
        
        // Обновляем UI медиатеки
        updateLibraryUI();
        
        // Закрываем модальное окно
        closeRenamePlaylistModal();
        
        showNotification('Плейлист переименован');
    }
    
    // Добавляем обработчики событий для модального окна переименования плейлиста
    if (renameModalCancelButtons) {
        renameModalCancelButtons.forEach(btn => {
            btn.addEventListener('click', closeRenamePlaylistModal);
        });
    }
    
    if (renameModalSaveButton) {
        renameModalSaveButton.addEventListener('click', applyPlaylistRename);
    }
    
    // Добавляем обработчик клавиш для модального окна переименования
    if (renamePlaylistNameInput) {
        renamePlaylistNameInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                applyPlaylistRename();
            } else if (e.key === 'Escape') {
                closeRenamePlaylistModal();
            }
        });
    }

    // Функция для обновления счетчика любимых треков
    function updateLikedTracksCount() {
        const likedCount = document.querySelector('.liked-count');
        if (likedCount) {
            const count = likedTracks.length;
            likedCount.textContent = `${count} ${count === 1 ? 'трек' : count > 1 && count < 5 ? 'трека' : 'треков'}`;
        }
    }

    // Функция отображения контекстного меню трека
    function showTrackContextMenu(event, track) {
        if (!trackContextMenu || !track) return;
        
        // Запоминаем трек, для которого открыто меню
        contextMenuTrack = track;
        
        // Определяем, добавлен ли трек в любимые
        const isLiked = likedTracks.some(t => t.id === track.id);
        
        // Показываем соответствующие пункты меню
        const addToLikedEl = trackContextMenu.querySelector('.add-to-liked');
        const removeFromLikedEl = trackContextMenu.querySelector('.remove-from-liked');
        
        if (addToLikedEl) addToLikedEl.classList.toggle('d-none', isLiked);
        if (removeFromLikedEl) removeFromLikedEl.classList.toggle('d-none', !isLiked);
        
        // Позиционируем меню рядом с курсором
        const x = event.clientX;
        const y = event.clientY;
        
        // Проверяем, чтобы меню не выходило за край экрана
        const menuWidth = 240; // Ширина меню
        const menuHeight = 200; // Примерная высота меню
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        let posX = x;
        let posY = y;
        
        if (x + menuWidth > windowWidth) {
            posX = windowWidth - menuWidth - 10;
        }
        
        if (y + menuHeight > windowHeight) {
            posY = windowHeight - menuHeight - 10;
        }
        
        trackContextMenu.style.left = `${posX}px`;
        trackContextMenu.style.top = `${posY}px`;
        
        // Показываем меню
        trackContextMenu.classList.add('show');
        
        // Добавляем обработчик для закрытия меню при клике вне его
        setTimeout(() => {
            document.addEventListener('click', closeTrackContextMenu);
        }, 10);
    }

    // Функция закрытия контекстного меню
    function closeTrackContextMenu() {
        if (!trackContextMenu) return;
        
        trackContextMenu.classList.remove('show');
        contextMenuTrack = null;
        
        // Удаляем обработчик
        document.removeEventListener('click', closeTrackContextMenu);
    }

    // Добавляем обработчики для пунктов контекстного меню
    if (addToLikedMenuItem) {
        addToLikedMenuItem.addEventListener('click', function() {
            if (!contextMenuTrack) return;
            
            // Проверяем, есть ли уже трек в лайкнутых
            if (!likedTracks.some(track => track.id === contextMenuTrack.id)) {
                likedTracks.push(contextMenuTrack);
                showNotification('Трек добавлен в избранное');
                
                // Сохраняем лайкнутые треки
                saveLikedTracks();
                
                // Обновляем интерфейс медиатеки
                updateLibraryUI();
            }
            
            closeTrackContextMenu();
        });
    }

    if (removeFromLikedMenuItem) {
        removeFromLikedMenuItem.addEventListener('click', function() {
            if (!contextMenuTrack) return;
            
            // Удаляем трек из лайкнутых
            likedTracks = likedTracks.filter(track => track.id !== contextMenuTrack.id);
            showNotification('Трек удален из избранного');
            
            // Сохраняем лайкнутые треки
            saveLikedTracks();
            
            // Обновляем интерфейс медиатеки
            updateLibraryUI();
            
            closeTrackContextMenu();
        });
    }

    if (addToPlaylistMenuItem) {
        addToPlaylistMenuItem.addEventListener('click', function() {
            if (!contextMenuTrack) return;
            
            closeTrackContextMenu();
            openAddToPlaylistModal(contextMenuTrack);
        });
    }

    if (shareTrackMenuItem) {
        shareTrackMenuItem.addEventListener('click', function() {
            if (!contextMenuTrack) return;
            
            // Логика для поделиться треком
            if (isTelegramApp) {
                // Если открыто в Telegram, используем его функции
                tg.sendData(JSON.stringify({
                    action: 'share_track',
                    track: contextMenuTrack
                }));
            } else {
                // В обычном режиме показываем сообщение
                showNotification(`Поделиться треком: ${contextMenuTrack.title}`);
            }
            
            closeTrackContextMenu();
        });
    }

    // Добавляем обработчик для кнопки редактирования плейлиста
    document.querySelector('.playlist-edit-button').addEventListener('click', function(e) {
        e.stopPropagation();
        const playlistId = currentPlaylist ? currentPlaylist.id : null;
        if (playlistId) {
            openRenamePlaylistModal(playlistId);
        }
    });
    
    // Добавляем обработчик для кнопки удаления плейлиста
    document.querySelector('.playlist-delete-button').addEventListener('click', function(e) {
        e.stopPropagation();
        const playlistId = currentPlaylist ? currentPlaylist.id : null;
        if (playlistId) {
            deletePlaylist(playlistId);
        }
    });
}); 