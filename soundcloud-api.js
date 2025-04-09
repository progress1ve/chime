/**
 * Модуль для работы с Jamendo API - легальной альтернативой SoundCloud
 * Jamendo предоставляет бесплатный доступ к музыке для некоммерческих проектов
 * Документация: https://developer.jamendo.com/v3.0
 */

// Объект для работы с Jamendo API
const JAMENDO_API = {
    // Базовые настройки API
    baseUrl: 'https://api.jamendo.com/v3.0',
    clientId: '', // Будет установлен при инициализации
    format: 'json',
    
    // Инициализация API с вашим Client ID
    init: function(clientId) {
        if (!clientId) {
            console.warn('Jamendo API Client ID не указан! Используется демо-режим с ограничениями.');
            // В демо-режиме будем использовать предварительно загруженные треки
            return false;
        }
        
        this.clientId = clientId;
        console.log('Jamendo API инициализирован');
        return true;
    },
    
    // Получение популярных треков
    getPopularTracks: async function(limit = 20) {
        try {
            if (!this.clientId) {
                console.warn('Jamendo API не инициализирован, возвращаем демо-треки');
                return this.getFallbackTracks();
            }
            
            const endpoint = `${this.baseUrl}/tracks/`;
            const params = new URLSearchParams({
                client_id: this.clientId,
                format: this.format,
                limit: limit,
                boost: 'popularity_week', // Сортировка по популярности
                include: 'musicinfo stats'
            });
            
            const response = await fetch(`${endpoint}?${params.toString()}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${data.message || response.statusText}`);
            }
            
            // Преобразуем ответ API в формат, понятный для нашего приложения
            return this._formatTracks(data.results);
        } catch (error) {
            console.error('Ошибка при получении популярных треков:', error);
            // В случае ошибки возвращаем запасные треки
            return this.getFallbackTracks();
        }
    },
    
    // Поиск треков
    searchTracks: async function(query, limit = 20) {
        try {
            if (!this.clientId) {
                console.warn('Jamendo API не инициализирован, поиск в демо-треках');
                return this._searchInFallbackTracks(query);
            }
            
            const endpoint = `${this.baseUrl}/tracks/`;
            const params = new URLSearchParams({
                client_id: this.clientId,
                format: this.format,
                limit: limit,
                search: query,
                include: 'musicinfo stats'
            });
            
            const response = await fetch(`${endpoint}?${params.toString()}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${data.message || response.statusText}`);
            }
            
            return this._formatTracks(data.results);
        } catch (error) {
            console.error('Ошибка при поиске треков:', error);
            return this._searchInFallbackTracks(query);
        }
    },
    
    // Получение альбомов
    getAlbums: async function(limit = 10) {
        try {
            if (!this.clientId) {
                console.warn('Jamendo API не инициализирован, возвращаем демо-альбомы');
                return this.getFallbackAlbums();
            }
            
            const endpoint = `${this.baseUrl}/albums/`;
            const params = new URLSearchParams({
                client_id: this.clientId,
                format: this.format,
                limit: limit,
                boost: 'popularity_week'
            });
            
            const response = await fetch(`${endpoint}?${params.toString()}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${data.message || response.statusText}`);
            }
            
            // Преобразуем ответ API в формат, понятный для нашего приложения
            return data.results.map(album => ({
                id: album.id,
                title: album.name,
                artist: album.artist_name,
                cover: album.image,
                trackCount: album.tracks.length
            }));
        } catch (error) {
            console.error('Ошибка при получении альбомов:', error);
            return this.getFallbackAlbums();
        }
    },
    
    // Получение плейлистов
    getPlaylists: async function(limit = 10) {
        try {
            if (!this.clientId) {
                console.warn('Jamendo API не инициализирован, возвращаем демо-плейлисты');
                return this.getFallbackPlaylists();
            }
            
            const endpoint = `${this.baseUrl}/playlists/`;
            const params = new URLSearchParams({
                client_id: this.clientId,
                format: this.format,
                limit: limit
            });
            
            const response = await fetch(`${endpoint}?${params.toString()}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(`Ошибка API: ${data.message || response.statusText}`);
            }
            
            // Преобразуем ответ API в формат, понятный для нашего приложения
            return data.results.map(playlist => ({
                id: playlist.id,
                title: playlist.name,
                trackCount: playlist.tracks.length,
                // У плейлиста нет своей обложки, используем обложку первого трека или заглушку
                cover: playlist.tracks[0]?.image || 'https://via.placeholder.com/200x200?text=Playlist'
            }));
        } catch (error) {
            console.error('Ошибка при получении плейлистов:', error);
            return this.getFallbackPlaylists();
        }
    },
    
    // Преобразование ответа API в формат нашего приложения
    _formatTracks: function(tracks) {
        return tracks.map(track => ({
            id: track.id,
            title: track.name,
            artist: track.artist_name,
            cover: track.image,
            file: track.audio, // Прямая ссылка на аудиофайл
            duration: this._formatDuration(track.duration),
            artworkUrl: track.image,
            streamUrl: track.audio,
            // Дополнительные поля
            genre: track.musicinfo?.tags?.genres?.join(', ') || '',
            plays: track.stats?.tops_total || 0
        }));
    },
    
    // Форматирование длительности в минуты:секунды
    _formatDuration: function(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' + sec : sec}`;
    },
    
    // Поиск в локальных треках (для демо-режима)
    _searchInFallbackTracks: function(query) {
        const tracks = this.getFallbackTracks();
        const lowercaseQuery = query.toLowerCase();
        
        return tracks.filter(track => 
            track.title.toLowerCase().includes(lowercaseQuery) || 
            track.artist.toLowerCase().includes(lowercaseQuery)
        );
    },
    
    // Запасные треки на случай проблем с API или отсутствия ключа
    getFallbackTracks: function() {
        return [
            {
                id: '1',
                title: 'Summer Feeling',
                artist: 'Alex Johnson',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFEQjk1NCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5TdW1tZXI8L3RleHQ+PC9zdmc+',
                file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                duration: '2:47',
                artworkUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFEQjk1NCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5TdW1tZXI8L3RleHQ+PC9zdmc+',
                streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                genre: 'Electronic'
            },
            {
                id: '2',
                title: 'Ocean Waves',
                artist: 'Maria Smith',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNDNzhDOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5PY2VhbjwvdGV4dD48L3N2Zz4=',
                file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                duration: '3:15',
                artworkUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNDNzhDOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5PY2VhbjwvdGV4dD48L3N2Zz4=',
                streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                genre: 'Ambient'
            },
            {
                id: '3',
                title: 'Night Drive',
                artist: 'John Black',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzlENTBCQiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5OaWdodDwvdGV4dD48L3N2Zz4=',
                file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                duration: '4:20',
                artworkUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzlENTBCQiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5OaWdodDwvdGV4dD48L3N2Zz4=',
                streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
                genre: 'Electronic'
            },
            {
                id: '4',
                title: 'Journey Home',
                artist: 'Sarah Miller',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0U5MUU2MyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5Kb3VybmV5PC90ZXh0Pjwvc3ZnPg==',
                file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                duration: '3:52',
                artworkUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0U5MUU2MyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5Kb3VybmV5PC90ZXh0Pjwvc3ZnPg==',
                streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
                genre: 'Ambient'
            },
            {
                id: '5',
                title: 'Sunset Memories',
                artist: 'David Wilson',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGOTgwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5TdW5zZXQ8L3RleHQ+PC9zdmc+',
                file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
                duration: '2:33',
                artworkUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGOTgwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5TdW5zZXQ8L3RleHQ+PC9zdmc+',
                streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
                genre: 'Chill'
            },
            {
                id: '6',
                title: 'Sunshine Day',
                artist: 'Emma Clark',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGQzEwNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjMDAwMDAwIj5TdW5zaGluZTwvdGV4dD48L3N2Zz4=',
                file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
                duration: '3:08',
                artworkUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGQzEwNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjMDAwMDAwIj5TdW5zaGluZTwvdGV4dD48L3N2Zz4=',
                streamUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
                genre: 'Pop'
            }
        ];
    },
    
    // Запасные альбомы
    getFallbackAlbums: function() {
        return [
            {
                id: '101',
                title: 'Summer Collection',
                artist: 'Various Artists',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzFEQjk1NCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5BbGJ1bTwvdGV4dD48L3N2Zz4=',
                trackCount: 12
            },
            {
                id: '102',
                title: 'Ambient Nights',
                artist: 'Chill Masters',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzlENTBCQiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5BbGJ1bTwvdGV4dD48L3N2Zz4=',
                trackCount: 8
            },
            {
                id: '103',
                title: 'Electronic Beats',
                artist: 'Digital Collective',
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGOTgwMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5BbGJ1bTwvdGV4dD48L3N2Zz4=',
                trackCount: 10
            }
        ];
    },
    
    // Запасные плейлисты
    getFallbackPlaylists: function() {
        return [
            {
                id: '201',
                title: 'Relaxing Moments',
                trackCount: 15,
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNDNzhDOSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5QbGF5bGlzdDwvdGV4dD48L3N2Zz4='
            },
            {
                id: '202',
                title: 'Workout Mix',
                trackCount: 20,
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0U5MUU2MyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjRkZGRkZGIj5QbGF5bGlzdDwvdGV4dD48L3N2Zz4='
            },
            {
                id: '203',
                title: 'Focus & Study',
                trackCount: 12,
                cover: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI0ZGQzEwNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjMDAwMDAwIj5QbGF5bGlzdDwvdGV4dD48L3N2Zz4='
            }
        ];
    }
};

// Экспортируем API для использования в других файлах
window.JAMENDO_API = JAMENDO_API; 