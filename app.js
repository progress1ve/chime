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
    initializeTelegram();
    initializePlayer();
    initializeNavigation();
    initializeTabs();
    fetchMockData();
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
function initializePlayer() {
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
    
    // Загружаем первую песню
    loadSong(currentSongIndex);
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
    
    // Запускаем обновление прогресса
    updateProgress();
}

// Обработка клика по мини-плееру
function handleMiniPlayerClick(e) {
    // Проверяем, что клик был не по кнопке play-pause
    if (!e.target.closest('#miniPlayPause') && !e.target.closest('.fa-play') && !e.target.closest('.fa-pause')) {
        expandPlayer();
    }
}

// Загрузка информации о песне
function loadSong(index) {
    const song = songs[index];
    document.querySelector('.mini-title').textContent = song.title;
    document.querySelector('.mini-artist').textContent = song.artist;
    document.querySelector('.track-title').textContent = song.title;
    document.querySelector('.track-artist').textContent = song.artist;
    document.querySelector('.mini-cover').style.backgroundImage = `url(${song.cover})`;
    document.querySelector('.cover-art img').src = song.cover;
    document.getElementById('totalTime').textContent = `-${song.duration}`;
    
    // Сброс прогресса
    progressValue = 0;
    document.querySelector('.progress').style.width = '0%';
    document.querySelector('.progress-handle').style.left = '0%';
    document.getElementById('currentTime').textContent = '0:00';
    
    // Сброс лайка
    isLiked = false;
    updateLikeButton();
}

// Переключение песен
function prevSong() {
    currentSongIndex--;
    if (currentSongIndex < 0) {
        currentSongIndex = songs.length - 1;
    }
    loadSong(currentSongIndex);
    restartPlayback();
}

function nextSong() {
    currentSongIndex++;
    if (currentSongIndex > songs.length - 1) {
        currentSongIndex = 0;
    }
    loadSong(currentSongIndex);
    restartPlayback();
}

// Перезапускаем воспроизведение при смене трека
function restartPlayback() {
    if (isPlaying) {
        // Имитируем перезапуск воспроизведения
        progressValue = 0;
        updatePlayState();
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
}

function updateLikeButton() {
    document.getElementById('likeButton').classList.toggle('liked', isLiked);
}

// Обработка клика по прогресс-бару
function handleProgressClick(e) {
    const progressWidth = this.clientWidth;
    const clickedWidth = e.offsetX;
    const percentage = (clickedWidth / progressWidth) * 100;
    progressValue = percentage;
    document.querySelector('.progress').style.width = percentage + '%';
    document.querySelector('.progress-handle').style.left = percentage + '%';
    
    // Обновление текущего времени
    const duration = 48; // 0:48 в секундах
    const current = Math.floor((percentage / 100) * duration);
    const remaining = duration - current;
    
    const minutes = Math.floor(current / 60);
    const seconds = current % 60;
    document.getElementById('currentTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    const remainingMinutes = Math.floor(remaining / 60);
    const remainingSeconds = remaining % 60;
    document.getElementById('totalTime').textContent = `-${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Симуляция обновления прогресса
function updateProgress() {
    if (isPlaying) {
        progressValue += 0.1;
        if (progressValue > 100) {
            progressValue = 0;
            
            // Проверка режима повтора
            if (isRepeating) {
                // Повторить текущую песню
                loadSong(currentSongIndex);
            } else {
                // Перейти к следующей песне
                nextSong();
            }
        }
        document.querySelector('.progress').style.width = progressValue + '%';
        document.querySelector('.progress-handle').style.left = progressValue + '%';
        
        // Обновление времени (симуляция)
        const duration = 48; // 0:48 в секундах
        const current = Math.floor((progressValue / 100) * duration);
        const remaining = duration - current;
        
        const minutes = Math.floor(current / 60);
        const seconds = current % 60;
        document.getElementById('currentTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const remainingMinutes = Math.floor(remaining / 60);
        const remainingSeconds = remaining % 60;
        document.getElementById('totalTime').textContent = `-${remainingMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    requestAnimationFrame(updateProgress);
}

// Развернуть плеер на весь экран
function expandPlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    fullscreenPlayer.classList.add('active');
    isPlayerExpanded = true;
}

// Свернуть плеер обратно в мини-режим
function collapsePlayer() {
    const fullscreenPlayer = document.getElementById('fullscreenPlayer');
    fullscreenPlayer.classList.remove('active');
    isPlayerExpanded = false;
}

// Закрытие полноэкранного плеера
function closeFullscreenPlayer() {
    collapsePlayer();
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
    
    searchInput.addEventListener('input', debounce(function() {
        const query = this.value.trim();
        if (query.length < 2) {
            searchResults.innerHTML = '<div class="search-empty">Введите не менее 2 символов для поиска</div>';
            return;
        }
        
        // Имитация поиска (в реальном приложении здесь был бы запрос к API)
        searchMockResults(query);
    }, 500));
}

// Имитация результатов поиска
function searchMockResults(query) {
    const searchResults = document.getElementById('searchResults');
    query = query.toLowerCase();
    
    // Очищаем предыдущие результаты
    searchResults.innerHTML = '';
    
    // Имитация загрузки
    searchResults.innerHTML = '<div class="search-loading">Поиск...</div>';
    
    // Временная задержка для имитации запроса
    setTimeout(() => {
        // Фильтруем треки, которые содержат поисковый запрос
        const filteredTracks = songs.filter(song => 
            song.title.toLowerCase().includes(query) || 
            song.artist.toLowerCase().includes(query)
        );
        
        if (filteredTracks.length === 0) {
            searchResults.innerHTML = '<div class="search-empty">Ничего не найдено</div>';
            return;
        }
        
        // Создаем HTML для результатов
        let resultsHTML = '';
        
        filteredTracks.forEach((track, index) => {
            resultsHTML += `
                <div class="playlist-item search-result-item" data-index="${index}">
                    <div class="playlist-item-cover" style="background-image: url('${track.cover}')"></div>
                    <div class="playlist-item-info">
                        <h3 class="playlist-item-title">${track.title}</h3>
                        <p class="playlist-item-artist">${track.artist}</p>
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = resultsHTML;
        
        // Добавляем обработчики для найденных треков
        const searchResultItems = document.querySelectorAll('.search-result-item');
        searchResultItems.forEach(item => {
            item.addEventListener('click', () => {
                const trackIndex = parseInt(item.getAttribute('data-index'));
                if (!isNaN(trackIndex) && songs[trackIndex]) {
                    currentSongIndex = trackIndex;
                    loadSong(currentSongIndex);
                    isPlaying = true;
                    updatePlayState();
                    expandPlayer();
                }
            });
        });
    }, 800);
}

// Функциональность лайков
function initializeLikes() {
    // Массив для хранения ID лайкнутых треков
    let likedTracksIds = [];
    
    // Обработчик для кнопки лайка
    likeButton.addEventListener('click', () => {
        toggleLike();
        
        // Добавляем/удаляем трек из лайкнутых
        const currentSong = songs[currentSongIndex];
        const songId = currentSongIndex;
        
        if (isLiked) {
            // Добавляем в лайкнутые, если его там еще нет
            if (!likedTracksIds.includes(songId)) {
                likedTracksIds.push(songId);
                updateLikedTracks();
            }
        } else {
            // Удаляем из лайкнутых
            likedTracksIds = likedTracksIds.filter(id => id !== songId);
            updateLikedTracks();
        }
    });
    
    // Обновление отображения лайкнутых треков
    function updateLikedTracks() {
        const likedTracksContainer = document.getElementById('likedTracks');
        
        // Если нет лайкнутых треков
        if (likedTracksIds.length === 0) {
            likedTracksContainer.innerHTML = '<div class="empty-state">У вас пока нет любимых треков</div>';
            return;
        }
        
        // Создаем HTML для лайкнутых треков
        let likedTracksHTML = '';
        
        likedTracksIds.forEach(id => {
            const track = songs[id];
            if (track) {
                likedTracksHTML += `
                    <div class="playlist-item liked-track" data-index="${id}">
                        <div class="playlist-item-cover" style="background-image: url('${track.cover}')"></div>
                        <div class="playlist-item-info">
                            <h3 class="playlist-item-title">${track.title}</h3>
                            <p class="playlist-item-artist">${track.artist}</p>
                        </div>
                    </div>
                `;
            }
        });
        
        likedTracksContainer.innerHTML = likedTracksHTML;
        
        // Добавляем обработчики для лайкнутых треков
        const likedTrackItems = document.querySelectorAll('.liked-track');
        likedTrackItems.forEach(item => {
            item.addEventListener('click', () => {
                const trackIndex = parseInt(item.getAttribute('data-index'));
                if (!isNaN(trackIndex) && songs[trackIndex]) {
                    currentSongIndex = trackIndex;
                    loadSong(currentSongIndex);
                    isPlaying = true;
                    updatePlayState();
                    expandPlayer();
                }
            });
        });
    }
    
    // Инициализация отображения
    updateLikedTracks();
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

// Улучшенная инициализация плеера с учетом дополнительной функциональности
function initApp() {
    initializePlayer();
    initializeScreenNavigation();
    initializeSearch();
    initializeLikes();
    
    // Инициализация обработчиков для элементов плейлиста на главном экране
    const playlistItems = document.querySelectorAll('.playlist-item:not(.search-result-item):not(.liked-track)');
    playlistItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentSongIndex = index;
            loadSong(currentSongIndex);
            isPlaying = true;
            updatePlayState();
            expandPlayer();
        });
    });
}

// Запуск приложения при загрузке DOM
document.addEventListener('DOMContentLoaded', function() {
    initApp();
}); 