let tg = window.Telegram.WebApp;
let userData = null;
let tracksData = null;
let playlistsData = null;
let isPlaying = false;
let isPlayerExpanded = false;

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
    // Открытие полноэкранного плеера при нажатии на мини-плеер
    const player = document.getElementById('player');
    if (player) {
        player.addEventListener('click', function(event) {
            // Проверяем, что клик был не по кнопкам управления и не по кнопке закрытия
            if (!event.target.closest('.control-button') && 
                !event.target.closest('.close-button') && 
                !event.target.closest('.down-arrow') && 
                !isPlayerExpanded) {
                expandPlayer();
            }
        });
    }
    
    // Закрытие полноэкранного плеера
    const closeButton = document.getElementById('close-player');
    const downArrow = document.querySelector('.down-arrow');
    
    if (closeButton) {
        closeButton.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события на плеер
            collapsePlayer();
        });
    }
    
    if (downArrow) {
        downArrow.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события на плеер
            collapsePlayer();
        });
    }
    
    // Кнопки управления в полноэкранном плеере
    const fsControls = document.querySelectorAll('.fs-control');
    fsControls.forEach(control => {
        control.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события на плеер
            if (control.classList.contains('play')) {
                togglePlay();
            }
            // Логика для других кнопок управления
        });
    });
    
    // Убедимся, что вложенные элементы не вызывают открытие плеера
    const controlButtons = document.querySelectorAll('.fs-control img, .action-icon img');
    controlButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события
        });
    });
    
    // Полоса прогресса (для демонстрации)
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
        progressBar.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события на плеер
            const progressWidth = progressBar.offsetWidth;
            const clickPosition = event.offsetX;
            const percentage = (clickPosition / progressWidth) * 100;
            
            // Обновляем прогресс
            const progressElement = progressBar.querySelector('.progress');
            if (progressElement) {
                progressElement.style.width = `${percentage}%`;
            }
            
            // Обновление текущего времени
            updateProgressTime(percentage);
        });
    }
    
    // Инициализация элементов action-row
    const actionItems = document.querySelectorAll('.action-item');
    actionItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.stopPropagation(); // Предотвращаем всплытие события на плеер
            // Здесь будет логика обработки действий (лайк, добавление, и т.д.)
            console.log("Action clicked:", item.textContent.trim());
        });
    });
    
    // Имитация прогресса трека (для демо)
    let progressPercent = 30; // Начинаем с 30% для соответствия скриншоту
    setInterval(() => {
        if (isPlaying) {
            progressPercent = (progressPercent + 0.5) % 100;
            const progressElement = document.querySelector('.progress');
            if (progressElement) {
                progressElement.style.width = `${progressPercent}%`;
            }
            
            // Обновление текущего времени
            updateProgressTime(progressPercent);
        }
    }, 1000);
    
    // Добавляем обработчики для клавиш Escape (для закрытия плеера)
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && isPlayerExpanded) {
            collapsePlayer();
        }
    });
}

// Обновление времени воспроизведения
function updateProgressTime(progressPercent) {
    const currentTime = document.querySelector('.current-time');
    const totalTime = document.querySelector('.total-time');
    
    if (currentTime && totalTime) {
        const totalSeconds = 48; // 0:48 в секундах
        const currentSeconds = Math.floor(totalSeconds * (progressPercent / 100));
        const remainingSeconds = totalSeconds - currentSeconds;
        
        const minutes = Math.floor(currentSeconds / 60);
        const seconds = currentSeconds % 60;
        currentTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        const remainingMinutes = Math.floor(remainingSeconds / 60);
        const remainingSecs = remainingSeconds % 60;
        totalTime.textContent = `-${remainingMinutes}:${remainingSecs.toString().padStart(2, '0')}`;
    }
}

// Развернуть плеер на весь экран
function expandPlayer() {
    const body = document.body;
    body.classList.add('player-expanded');
    
    // Скрываем основной контент
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.add('hidden');
    }
    
    // Скрываем хедер и табы
    const header = document.querySelector('.header');
    const tabs = document.querySelector('.category-tabs');
    
    if (header) header.style.opacity = '0';
    if (tabs) tabs.style.opacity = '0';
    
    isPlayerExpanded = true;
    
    // Обновляем состояние кнопки воспроизведения
    updatePlayState();
}

// Свернуть плеер обратно в мини-режим
function collapsePlayer() {
    const body = document.body;
    body.classList.remove('player-expanded');
    
    // Показываем основной контент
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.classList.remove('hidden');
    }
    
    // Показываем хедер и табы
    const header = document.querySelector('.header');
    const tabs = document.querySelector('.category-tabs');
    
    if (header) header.style.opacity = '1';
    if (tabs) tabs.style.opacity = '1';
    
    isPlayerExpanded = false;
    
    // Обновляем состояние кнопки воспроизведения
    updatePlayState();
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