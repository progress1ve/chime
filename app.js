let tg = window.Telegram.WebApp;
let userData = null;
let tracksData = null;
let playlistsData = null;
let isPlaying = false;
let isPlayerExpanded = false;

// Функциональность плеера
let currentSongIndex = 0;
let isShuffled = false;
let isRepeating = false;
let isLiked = false;
let progressValue = 0;
let audioPlayer = null;
let currentTrack = null;
let tracks = [];
let likedTracks = [];

// Коды ошибок Telegram WebApp
const TELEGRAM_ERROR_CODES = {
    UNKNOWN: 0,
    STORAGE_FULL: 1,
    STORAGE_UNAUTHORIZED: 2
};

// Проверка доступности Telegram WebApp
const isTelegramWebAppAvailable = () => {
    return typeof window !== 'undefined' && 
           window.Telegram && 
           window.Telegram.WebApp;
};

// Примеры песен
const songs = [
    { 
        title: 'Helen Keller', 
        artist: 'Kai Ca$h', 
        cover: 'https://i.ibb.co/HdSxDT5/album1.jpg', 
        src: 'song1.mp3',
        duration: '0:48' 
    },
    { 
        title: 'Blinding Lights', 
        artist: 'The Weeknd', 
        cover: 'https://i.ibb.co/jyzqGZG/album2.jpg',
        src: 'song2.mp3',
        duration: '0:48' 
    },
    { 
        title: 'Levitating', 
        artist: 'Dua Lipa', 
        cover: 'https://i.ibb.co/C6TJM1Z/album3.jpg',
        src: 'song3.mp3',
        duration: '0:48' 
    }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// Инициализация Telegram WebApp
function initializeTelegram() {
    tg.expand();
    tg.ready();
    
    // Получаем данные пользователя из Telegram (если доступны)
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userData = tg.initDataUnsafe.user;
        updateUserInfo(userData);
    }
}

// Обновление информации о пользователе
function updateUserInfo(user) {
    const greetingElement = document.querySelector('.greeting');
    if (greetingElement && user && user.first_name) {
        greetingElement.textContent = `Hi, ${user.first_name}`;
    }
    
    // Обновить аватар пользователя, если доступен
    const avatarElement = document.querySelector('.user-avatar img');
    if (avatarElement && user && user.photo_url) {
        avatarElement.src = user.photo_url;
    }
}

// Имитация получения данных из API
function fetchMockData() {
    // В реальном приложении здесь был бы запрос к API
    // Например: fetch('/api/playlists').then(response => response.json()).then(data => {...})
    
    // Имитация данных для демонстрации
    playlistsData = [
        {
            id: 1,
            title: "Starlit Reverie",
            artist: "Budiani",
            tracks: 9,
            duration: "3:45",
            cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
        },
        {
            id: 2,
            title: "Midnight Confessions",
            artist: "Astral",
            tracks: 12,
            duration: "4:21",
            cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
        },
        {
            id: 3,
            title: "Dream Sequence",
            artist: "Ethereal",
            tracks: 8,
            duration: "3:12",
            cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80"
        }
    ];
    
    tracksData = {
        featured: {
            title: "Discover weekly",
            description: "The original slow instrumental best playlists",
            artist: "Various Artists",
            duration: "4:30",
            cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"
        }
    };
    
    // Не обновляем DOM здесь, так как элементы уже созданы с примерными данными
    // В реальном приложении вызывали бы функции для обновления DOM
    
    initializePlaylists();
}

// Инициализация элементов плейлиста
function initializePlaylists() {
    const playlistItems = document.querySelectorAll('.playlist-item');
    playlistItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            if (playlistsData && playlistsData[index]) {
                const playlist = playlistsData[index];
                updateNowPlaying(playlist);
            }
        });
    });
    
    // Инициализируем кнопки воспроизведения в плейлистах
    const playButtons = document.querySelectorAll('.playlist-play');
    playButtons.forEach((button, index) => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события
            if (playlistsData && playlistsData[index]) {
                const playlist = playlistsData[index];
                updateNowPlaying(playlist);
                isPlaying = true;
                updatePlayState();
            }
        });
    });
    
    // Инициализация элемента featured card
    const weeklyCard = document.querySelector('.weekly-card');
    if (weeklyCard) {
        const playButton = weeklyCard.querySelector('.play-button');
        if (playButton) {
            playButton.addEventListener('click', function() {
                if (tracksData && tracksData.featured) {
                    // Обновление информации в плеере
                    updateNowPlaying({
                        title: tracksData.featured.title,
                        artist: tracksData.featured.artist,
                        cover: tracksData.featured.cover,
                        duration: tracksData.featured.duration
                    });
                    isPlaying = true;
                    updatePlayState();
                }
            });
        }
    }
}

// Инициализация плеера
async function initializePlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    const closeButton = document.getElementById('closeButton');
    const miniPlayPause = document.getElementById('miniPlayPause');
    const playButton = document.getElementById('playButton');
    const prevButton = document.getElementById('prevButton');
    const nextButton = document.getElementById('nextButton');
    const shuffleButton = document.getElementById('shuffleButton');
    const repeatButton = document.getElementById('repeatButton');
    const likeButton = document.getElementById('likeButton');
    
    // Инициализируем аудио-плеер
    audioPlayer = new Audio();
    
    // Загружаем треки через SoundCloud API
    try {
        tracks = await SOUNDCLOUD_API.getPopularTracks();
        renderTracks(tracks);
    } catch (error) {
        console.error('Error loading tracks:', error);
        tracks = SOUNDCLOUD_API.getFallbackTracks();
        renderTracks(tracks);
    }
    
    // Загружаем первую песню
    if (tracks.length > 0) {
        loadSong(0);
    }
    updatePlayState();
    
    // Инициализируем обработчики событий
    miniPlayer.addEventListener('click', handleMiniPlayerClick);
    closeButton.addEventListener('click', closeFullscreenPlayer);
    miniPlayPause.addEventListener('click', function(e) {
        e.stopPropagation(); // Предотвращаем всплытие события
        togglePlay();
    });
    playButton.addEventListener('click', togglePlay);
    prevButton.addEventListener('click', prevSong);
    nextButton.addEventListener('click', nextSong);
    
    // Обработчики для дополнительных элементов управления
    shuffleButton.addEventListener('click', toggleShuffle);
    repeatButton.addEventListener('click', toggleRepeat);
    likeButton.addEventListener('click', toggleLike);
    
    // Клик по прогресс-бару для перемотки
    document.querySelector('.progress-bar').addEventListener('click', handleProgressClick);
    
    // События аудио-плеера
    audioPlayer.addEventListener('timeupdate', updateProgressFromPlayer);
    audioPlayer.addEventListener('ended', handleTrackEnd);
    
    // Запускаем обновление прогресса
    updateProgressDisplay();
}

// Отрисовка треков на странице
function renderTracks(tracksList) {
    // Получаем контейнер для треков
    const homeScreen = document.getElementById('homeScreen');
    const playlistContainer = homeScreen.querySelector('.playlist');
    
    if (!playlistContainer) return;
    
    // Создаем HTML для каждого трека
    let tracksHTML = '';
    
    tracksList.forEach((track, index) => {
        tracksHTML += `
            <div class="playlist-item" data-index="${index}">
                <div class="playlist-item-cover" style="background-image: url('${track.artworkUrl}')"></div>
                <div class="playlist-item-info">
                    <h3 class="playlist-item-title">${track.title}</h3>
                    <p class="playlist-item-artist">${track.artist}</p>
                </div>
            </div>
        `;
    });
    
    // Обновляем содержимое контейнера
    playlistContainer.innerHTML = tracksHTML;
    
    // Добавляем обработчики для каждого трека
    const playlistItems = playlistContainer.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            if (!isNaN(index) && tracks[index]) {
                currentSongIndex = index;
                loadSong(currentSongIndex);
                isPlaying = true;
                updatePlayState();
                playTrack();
                expandPlayer();
            }
        });
    });
}

// Обработка клика по мини-плееру
function handleMiniPlayerClick(e) {
    // Проверяем, что клик был не по кнопке play-pause
    if (!e.target.closest('#miniPlayPause') && !e.target.closest('.fa-play') && !e.target.closest('.fa-pause')) {
        expandPlayer();
    }
}

// Загрузка информации о песне
async function loadSong(index) {
    if (!tracks[index]) return;
    
    currentTrack = tracks[index];
    
    // Обновляем информацию о треке в интерфейсе
    document.querySelector('.mini-title').textContent = currentTrack.title;
    document.querySelector('.mini-artist').textContent = currentTrack.artist;
    document.querySelector('.track-title').textContent = currentTrack.title;
    document.querySelector('.track-artist').textContent = currentTrack.artist;
    document.querySelector('.mini-cover').style.backgroundImage = `url(${currentTrack.artworkUrl})`;
    document.querySelector('.cover-art img').src = currentTrack.artworkUrl;
    document.getElementById('totalTime').textContent = `-${currentTrack.duration}`;
    
    // Настраиваем источник аудио
    if (audioPlayer) {
        audioPlayer.src = currentTrack.streamUrl;
        audioPlayer.load();
    }
    
    // Сброс прогресса
    progressValue = 0;
    document.querySelector('.progress').style.width = '0%';
    document.querySelector('.progress-handle').style.left = '0%';
    document.getElementById('currentTime').textContent = '0:00';
    
    // Проверяем, лайкнут ли этот трек
    isLiked = likedTracks.some(track => track.id === currentTrack.id);
    updateLikeButton();
}

// Воспроизведение трека
function playTrack() {
    if (audioPlayer && currentTrack) {
        audioPlayer.play()
            .then(() => {
                isPlaying = true;
                updatePlayState();
            })
            .catch(error => {
                console.error('Playback error:', error);
                isPlaying = false;
                updatePlayState();
            });
    }
}

// Пауза трека
function pauseTrack() {
    if (audioPlayer) {
        audioPlayer.pause();
        isPlaying = false;
        updatePlayState();
    }
}

// Переключение песен
function prevSong() {
    if (tracks.length === 0) return;
    
    if (isShuffled) {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        currentSongIndex = randomIndex;
    } else {
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = tracks.length - 1;
        }
    }
    
    loadSong(currentSongIndex);
    if (isPlaying) {
        playTrack();
    }
}

function nextSong() {
    if (tracks.length === 0) return;
    
    if (isShuffled) {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        currentSongIndex = randomIndex;
    } else {
        currentSongIndex++;
        if (currentSongIndex >= tracks.length) {
            currentSongIndex = 0;
        }
    }
    
    loadSong(currentSongIndex);
    if (isPlaying) {
        playTrack();
    }
}

// Обработка дополнительных элементов управления
function toggleShuffle() {
    isShuffled = !isShuffled;
    document.getElementById('shuffleButton').classList.toggle('active', isShuffled);
}

function toggleRepeat() {
    isRepeating = !isRepeating;
    document.getElementById('repeatButton').classList.toggle('active', isRepeating);
}

function toggleLike() {
    isLiked = !isLiked;
    updateLikeButton();
    
    if (isLiked && currentTrack) {
        // Добавляем трек в лайкнутые, если его там еще нет
        if (!likedTracks.some(track => track.id === currentTrack.id)) {
            likedTracks.push(currentTrack);
            updateLikedTracks();
            
            // Сохраняем лайкнутые треки в локальное хранилище
            saveLikedTracks();
        }
    } else if (currentTrack) {
        // Удаляем из лайкнутых
        likedTracks = likedTracks.filter(track => track.id !== currentTrack.id);
        updateLikedTracks();
        
        // Сохраняем лайкнутые треки в локальное хранилище
        saveLikedTracks();
    }
}

// Сохранение лайкнутых треков
function saveLikedTracks() {
    try {
        // Если используется в Telegram WebApp
        if (isTelegramWebAppAvailable()) {
            // Используем Telegram Storage
            window.Telegram.WebApp.CloudStorage.setItem('likedTracks', JSON.stringify(likedTracks), function(error, success) {
                if (error) {
                    console.error('Telegram storage error:', error);
                    // Используем localStorage как запасной вариант
                    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
                }
            });
        } else {
            // Используем обычный localStorage
            localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
        }
    } catch (error) {
        console.error('Error saving liked tracks:', error);
    }
}

// Загрузка лайкнутых треков
function loadLikedTracks() {
    try {
        // Если используется в Telegram WebApp
        if (isTelegramWebAppAvailable()) {
            // Используем Telegram Storage
            window.Telegram.WebApp.CloudStorage.getItem('likedTracks', function(error, value) {
                if (error) {
                    console.error('Telegram storage error:', error);
                    // Используем localStorage как запасной вариант
                    const storedLikedTracks = localStorage.getItem('likedTracks');
                    if (storedLikedTracks) {
                        likedTracks = JSON.parse(storedLikedTracks);
                        updateLikedTracks();
                    }
                } else if (value) {
                    likedTracks = JSON.parse(value);
                    updateLikedTracks();
                }
            });
        } else {
            // Используем обычный localStorage
            const storedLikedTracks = localStorage.getItem('likedTracks');
            if (storedLikedTracks) {
                likedTracks = JSON.parse(storedLikedTracks);
                updateLikedTracks();
            }
        }
    } catch (error) {
        console.error('Error loading liked tracks:', error);
    }
}

function updateLikeButton() {
    const likeButton = document.getElementById('likeButton');
    if (likeButton) {
        likeButton.classList.toggle('liked', isLiked);
        
        // Обновляем иконку сердца
        const likeIcon = likeButton.querySelector('i');
        if (likeIcon) {
            likeIcon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
        }
    }
}

// Обработка клика по прогресс-бару
function handleProgressClick(e) {
    if (!audioPlayer || !currentTrack) return;
    
    const progressWidth = this.clientWidth;
    const clickedWidth = e.offsetX;
    const percentage = (clickedWidth / progressWidth) * 100;
    
    // Устанавливаем текущее время воспроизведения
    const duration = audioPlayer.duration;
    if (duration) {
        const currentTime = (percentage / 100) * duration;
        audioPlayer.currentTime = currentTime;
    }
}

// Обновление прогресса из аудиоплеера
function updateProgressFromPlayer() {
    if (!audioPlayer || !currentTrack) return;
    
    const duration = audioPlayer.duration;
    const currentTime = audioPlayer.currentTime;
    
    if (duration) {
        const percentage = (currentTime / duration) * 100;
        document.querySelector('.progress').style.width = `${percentage}%`;
        document.querySelector('.progress-handle').style.left = `${percentage}%`;
        
        // Обновление текущего времени
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        document.getElementById('currentTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Обновление оставшегося времени
        const remaining = duration - currentTime;
        const remainingMinutes = Math.floor(remaining / 60);
        const remainingSeconds = Math.floor(remaining % 60);
        document.getElementById('totalTime').textContent = `-${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

// Отображение прогресса (для отладки, когда нет реального аудио)
function updateProgressDisplay() {
    requestAnimationFrame(updateProgressDisplay);
}

// Обработка окончания трека
function handleTrackEnd() {
    if (isRepeating) {
        // Повторяем текущий трек
        audioPlayer.currentTime = 0;
        playTrack();
    } else {
        // Переходим к следующему треку
        nextSong();
    }
}

// Переключение воспроизведения/паузы
function togglePlay() {
    if (!audioPlayer || !currentTrack) return;
    
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

// Обновление состояния кнопок воспроизведения
function updatePlayState() {
    // Обновляем иконку в мини-плеере
    const miniPlayPauseIcon = document.querySelector('#miniPlayPause i');
    if (miniPlayPauseIcon) {
        miniPlayPauseIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
    
    // Обновляем иконку в полноэкранном плеере
    const playButtonIcon = document.querySelector('#playButton i');
    if (playButtonIcon) {
        playButtonIcon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }
}

// Обновление информации в плеере
function updateNowPlaying(playlist) {
    const nowPlayingTitle = document.querySelector('.now-playing-title');
    const nowPlayingArtist = document.querySelector('.now-playing-artist');
    const nowPlayingCover = document.querySelector('.now-playing-cover');
    
    if (nowPlayingTitle && nowPlayingArtist) {
        nowPlayingTitle.textContent = playlist.title;
        nowPlayingArtist.textContent = playlist.artist;
        
        if (nowPlayingCover && playlist.cover) {
            nowPlayingCover.style.backgroundImage = `url('${playlist.cover}')`;
        }
    }
    
    // Показать player-bar если он был скрыт
    const playerBar = document.querySelector('.player-bar');
    if (playerBar) {
        playerBar.style.display = 'flex';
    }
    
    // Обновляем длительность трека
    const totalTime = document.querySelector('.total-time');
    if (totalTime && playlist.duration) {
        totalTime.textContent = playlist.duration;
    }
}

// Переключение воспроизведения
function togglePlay() {
    isPlaying = !isPlaying;
    updatePlayState();
}

// Обновление состояния кнопки воспроизведения
function updatePlayState() {
    // Обновляем мини-плеер
    const playButton = document.querySelector('.control-button.play');
    if (playButton) {
        playButton.innerHTML = isPlaying ? '⏸' : '▶';
    }
    
    // Обновляем полноэкранный плеер
    const fsPlayButton = document.querySelector('.fs-control.play');
    if (fsPlayButton) {
        fsPlayButton.innerHTML = isPlaying ? '⏸' : '▶';
    }
}

// Инициализация навигации
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            // Здесь можно добавить логику переключения между разделами приложения
        });
    });
}

// Инициализация вкладок с категориями
function initializeTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            // Здесь можно добавить логику для фильтрации контента по категориям
        });
    });
    
    // Обработчики для кнопок управления плеером
    const controlButtons = document.querySelectorAll('.control-button');
    controlButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события на мини-плеер
            if (button.classList.contains('play')) {
                togglePlay();
            }
            // Для кнопок перемотки можно добавить соответствующую логику
        });
    });
}

// Обработка поиска
function handleSearch() {
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
        searchIcon.addEventListener('click', () => {
            alert('Поиск пока не реализован');
        });
    }
}

// Обработчики для карточек музыки
function initializeMusicCards() {
    const cards = document.querySelectorAll('.music-card');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Логика воспроизведения трека
            const title = card.querySelector('.music-card-title').textContent;
            const artist = card.querySelector('.music-card-artist').textContent;
            updatePlayerInfo(title, artist);
            
            // Включаем воспроизведение
            const playButton = document.querySelector('.play-button');
            playButton.classList.add('playing');
            playButton.innerHTML = '⏸';
        });
    });
}

// Обновление информации в плеере
function updatePlayerInfo(title, artist) {
    const playerTitle = document.querySelector('.player-title');
    const playerArtist = document.querySelector('.player-artist');
    
    if (playerTitle && playerArtist) {
        playerTitle.textContent = title;
        playerArtist.textContent = artist;
    }
}

// Функция для навигации между экранами
function initializeScreenNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.content');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const screenId = item.getAttribute('data-screen');
            
            // Убираем активный класс со всех элементов навигации
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Добавляем активный класс выбранному элементу
            item.classList.add('active');
            
            // Скрываем все экраны
            screens.forEach(screen => screen.classList.add('hidden'));
            
            // Показываем выбранный экран
            document.getElementById(screenId).classList.remove('hidden');
        });
    });
}

// Функциональность поиска
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', debounce(async function() {
        const query = this.value.trim();
        if (query.length < 2) {
            searchResults.innerHTML = '<div class="search-empty">Введите не менее 2 символов для поиска</div>';
            return;
        }
        
        // Показываем индикатор загрузки
        searchResults.innerHTML = '<div class="search-loading">Поиск треков...</div>';
        
        try {
            // Выполняем поиск треков через SoundCloud API
            const searchResults = await SOUNDCLOUD_API.searchTracks(query);
            displaySearchResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="search-error">Произошла ошибка при поиске. Попробуйте позже.</div>';
        }
    }, 500));
}

// Отображение результатов поиска
function displaySearchResults(searchResults) {
    const searchResultsContainer = document.getElementById('searchResults');
    
    if (!searchResultsContainer) return;
    
    // Если результатов нет
    if (!searchResults || searchResults.length === 0) {
        searchResultsContainer.innerHTML = '<div class="search-empty">Ничего не найдено</div>';
        return;
    }
    
    // Создаем HTML для результатов
    let resultsHTML = '';
    
    searchResults.forEach((track, index) => {
        resultsHTML += `
            <div class="playlist-item search-result-item" data-track-id="${track.id}">
                <div class="playlist-item-cover" style="background-image: url('${track.artworkUrl}')"></div>
                <div class="playlist-item-info">
                    <h3 class="playlist-item-title">${track.title}</h3>
                    <p class="playlist-item-artist">${track.artist}</p>
                </div>
            </div>
        `;
    });
    
    // Обновляем контейнер
    searchResultsContainer.innerHTML = resultsHTML;
    
    // Добавляем обработчики для результатов
    const searchItems = searchResultsContainer.querySelectorAll('.search-result-item');
    searchItems.forEach(item => {
        item.addEventListener('click', () => {
            const trackId = item.getAttribute('data-track-id');
            // Находим трек в результатах поиска
            const track = searchResults.find(t => t.id.toString() === trackId);
            
            if (track) {
                // Добавляем трек в список треков, если его там нет
                const existingIndex = tracks.findIndex(t => t.id === track.id);
                
                if (existingIndex === -1) {
                    // Добавляем трек в список и устанавливаем как текущий
                    tracks.push(track);
                    currentSongIndex = tracks.length - 1;
                } else {
                    // Используем существующий трек
                    currentSongIndex = existingIndex;
                }
                
                // Загружаем и воспроизводим трек
                loadSong(currentSongIndex);
                isPlaying = true;
                updatePlayState();
                playTrack();
                expandPlayer();
            }
        });
    });
}

// Обновление отображения лайкнутых треков
function updateLikedTracks() {
    const likedTracksContainer = document.getElementById('likedTracks');
    
    if (!likedTracksContainer) return;
    
    // Если нет лайкнутых треков
    if (likedTracks.length === 0) {
        likedTracksContainer.innerHTML = '<div class="empty-state">У вас пока нет любимых треков</div>';
        return;
    }
    
    // Создаем HTML для лайкнутых треков
    let likedTracksHTML = '';
    
    likedTracks.forEach(track => {
        likedTracksHTML += `
            <div class="playlist-item liked-track" data-track-id="${track.id}">
                <div class="playlist-item-cover" style="background-image: url('${track.artworkUrl}')"></div>
                <div class="playlist-item-info">
                    <h3 class="playlist-item-title">${track.title}</h3>
                    <p class="playlist-item-artist">${track.artist}</p>
                </div>
            </div>
        `;
    });
    
    // Обновляем контейнер
    likedTracksContainer.innerHTML = likedTracksHTML;
    
    // Добавляем обработчики для лайкнутых треков
    const likedItems = likedTracksContainer.querySelectorAll('.liked-track');
    likedItems.forEach(item => {
        item.addEventListener('click', () => {
            const trackId = item.getAttribute('data-track-id');
            // Находим трек в лайкнутых
            const track = likedTracks.find(t => t.id.toString() === trackId);
            
            if (track) {
                // Добавляем трек в список треков, если его там нет
                const existingIndex = tracks.findIndex(t => t.id === track.id);
                
                if (existingIndex === -1) {
                    // Добавляем трек в список и устанавливаем как текущий
                    tracks.push(track);
                    currentSongIndex = tracks.length - 1;
                } else {
                    // Используем существующий трек
                    currentSongIndex = existingIndex;
                }
                
                // Загружаем и воспроизводим трек
                loadSong(currentSongIndex);
                isPlaying = true;
                updatePlayState();
                playTrack();
                expandPlayer();
            }
        });
    });
}

// Развернуть плеер на весь экран
function expandPlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    if (fullscreenPlayer) {
        fullscreenPlayer.classList.add('active');
        isPlayerExpanded = true;
    }
}

// Свернуть плеер обратно в мини-режим
function collapsePlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    if (fullscreenPlayer) {
        fullscreenPlayer.classList.remove('active');
        isPlayerExpanded = false;
    }
}

// Закрытие полноэкранного плеера
function closeFullscreenPlayer() {
    collapsePlayer();
}

// Вспомогательная функция для debounce (отложенного выполнения)
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Инициализация всего приложения
async function initApp() {
    // Инициализируем SoundCloud API
    const clientId = getTelegramData('soundCloudClientId') || 'YOUR_CLIENT_ID';
    SOUNDCLOUD_API.init(clientId);
    
    await initializePlayer();
    initializeScreenNavigation();
    initializeSearch();
    
    // Загружаем лайкнутые треки из хранилища
    loadLikedTracks();
}

// Получение данных из Telegram WebApp
function getTelegramData(key) {
    if (isTelegramWebAppAvailable()) {
        const webApp = window.Telegram.WebApp;
        
        // Проверяем доступность инициализационных данных
        if (webApp.initDataUnsafe && webApp.initDataUnsafe[key]) {
            return webApp.initDataUnsafe[key];
        }
    }
    return null;
} 