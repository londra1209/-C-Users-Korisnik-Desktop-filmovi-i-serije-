// Firebase konfiguracija - ZAMIJENITE SA SVOJIM PODACIMA
const firebaseConfig = {
  apiKey: "AIzaSyCjvIFtsZj381GizPx1fZAAWUUh3ap29JM",
  authDomain: "filmovi-serije.firebaseapp.com",
  databaseURL: "https://filmovi-serije-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "filmovi-serije",
  storageBucket: "filmovi-serije.firebasestorage.app",
  messagingSenderId: "842682561109",
  appId: "1:842682561109:web:3a0b8dd7c986cf53b9dadc"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// API ključ i postavke
const API_KEY = '1cf50e6248dc270629e802686245c2c8';
const API_URL = 'https://api.themoviedb.org/3';
const IMG_PATH = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_PATH = 'https://image.tmdb.org/t/p/w1280';

// Dohvaćamo elemente DOM-a
const genreSelect = document.getElementById('genreSelect');
const yearSelect = document.getElementById('yearSelect');
const results = document.getElementById('results');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsGrid = document.getElementById('resultsGrid');
const heroSlider = document.getElementById('heroSlider');
const movieDetails = document.getElementById('movieDetails');
const pagination = document.getElementById('pagination');
const filterBtns = document.querySelectorAll('.filter-btn');
const trailerModal = document.getElementById('trailerModal');
const trailerClose = document.getElementById('trailerClose');
const trailerPlaceholder = document.getElementById('trailerPlaceholder');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginModal = document.getElementById('loginModal');
const registerModal = document.getElementById('registerModal');
const closeLoginModal = document.getElementById('closeLoginModal');
const closeRegisterModal = document.getElementById('closeRegisterModal');
const loginSubmit = document.getElementById('loginSubmit');
const registerSubmit = document.getElementById('registerSubmit');
const switchToRegister = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const loginSection = document.getElementById('loginSection');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const usernameDisplay = document.getElementById('usernameDisplay');
const favoritesSection = document.getElementById('favoritesSection');
const favoritesGrid = document.getElementById('favoritesGrid');
const favoritesBtn = document.getElementById('favoritesBtn');

// Globalne varijable
let currentPage = 1;
let totalPages = 1;
let currentFilter = 'popular';
let currentType = 'all';
let isSearching = false;
let currentQuery = '';
let currentMovieId = null;
let currentMediaType = null;
let currentUser = null;
let favorites = [];

// Inicijalno učitavanje stranice
document.addEventListener('DOMContentLoaded', () => {
    // Pratimo promjene autentifikacijskog stanja
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            loginSection.style.display = 'none';
            userMenu.style.display = 'flex';
            usernameDisplay.textContent = user.displayName || user.email;
            userAvatar.textContent = (user.displayName || user.email).charAt(0).toUpperCase();
            favoritesBtn.style.display = 'inline-block';
            
            // Učitaj favorite
            loadFavorites();
        } else {
            currentUser = null;
            loginSection.style.display = 'flex';
            userMenu.style.display = 'none';
            favoritesBtn.style.display = 'none';
            if (window.location.hash === '#favorites') {
                favoritesSection.style.display = 'none';
                window.location.hash = '';
            }
        }
    });

    getPopularMovies();
    loadContent('popular', 'all');
    loadGenres();
    populateYearFilter();
    
    // Postavljamo event listenere
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Event listener za godinu
    document.getElementById('yearSelect').addEventListener('change', function() {
        const selectedYear = this.value;
        filterByYear(selectedYear);
    });
    
    // Zatvaranje trailera
    trailerClose.addEventListener('click', closeTrailer);
    trailerModal.addEventListener('click', (e) => {
        if (e.target === trailerModal) {
            closeTrailer();
        }
    });
    
    // Login/Register funkcionalnost
    loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    registerBtn.addEventListener('click', () => registerModal.style.display = 'flex');
    closeLoginModal.addEventListener('click', () => loginModal.style.display = 'none');
    closeRegisterModal.addEventListener('click', () => registerModal.style.display = 'none');
    switchToRegister.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'flex';
    });
    switchToLogin.addEventListener('click', () => {
        registerModal.style.display = 'none';
        loginModal.style.display = 'flex';
    });
    logoutBtn.addEventListener('click', logout);
    
    // Login i registracija
    loginSubmit.addEventListener('click', handleLogin);
    registerSubmit.addEventListener('click', handleRegister);
    
    // Klik izvan modala ga zatvara
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) loginModal.style.display = 'none';
        if (e.target === registerModal) registerModal.style.display = 'none';
    });
    
    // Favoriti
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Uklanjanje active klase sa svih gumba
            filterBtns.forEach(b => b.classList.remove('active'));
            // Dodavanje active klase na kliknuti gumb
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            currentType = filter;
            currentPage = 1;
            
            if (isSearching) {
                searchContent(currentQuery, currentPage, filter);
            } else {
                loadContent(currentFilter, filter);
            }
        });
    });
});

// Funkcija za rukovanje hash promjenama
function handleHashChange() {
    if (window.location.hash === '#favorites') {
        if (currentUser) {
            favoritesSection.style.display = 'block';
            document.querySelector('.hero-slider').style.display = 'none';
            document.querySelector('.section-title').style.display = 'none';
            document.querySelector('.filter-options').style.display = 'none';
            document.querySelector('.pagination').style.display = 'none';
            loadFavorites();
        } else {
            window.location.hash = '';
            loginModal.style.display = 'flex';
        }
    } else {
        favoritesSection.style.display = 'none';
        document.querySelector('.hero-slider').style.display = 'block';
        document.querySelector('.section-title').style.display = 'inline-block';
        document.querySelector('.filter-options').style.display = 'flex';
        document.querySelector('.pagination').style.display = 'flex';
    }
}

// Funkcija za učitavanje favorita
function loadFavorites() {
    if (!currentUser) return;
    
    favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.uid}`)) || [];
    
    if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
            <div class="no-favorites">
                <i class="fas fa-heart" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>Nemate dodanih favorita</p>
            </div>
        `;
    } else {
        favoritesGrid.innerHTML = '';
        favorites.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('movie-card');
            movieCard.dataset.id = movie.id;
            movieCard.dataset.type = movie.media_type;
            
            movieCard.innerHTML = `
                <img src="${movie.poster_path ? IMG_PATH + movie.poster_path : 'https://via.placeholder.com/300x450/333333/ffffff?text=Nema+slike'}" alt="${movie.title || movie.name}" class="movie-poster">
                <div class="movie-info">
                    <h3 class="movie-title">${movie.title || movie.name}</h3>
                    <div class="movie-year">${movie.release_date ? movie.release_date.substring(0, 4) : movie.first_air_date ? movie.first_air_date.substring(0, 4) : 'N/A'} • ${movie.media_type === 'movie' ? 'Film' : 'Serija'}</div>
                    <div class="movie-rating">
                        <i class="fas fa-star star"></i>
                        <span>${movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}</span>
                    </div>
                </div>
                <button class="favorite-btn active">
                    <i class="fas fa-heart"></i>
                </button>
            `;
            
            movieCard.addEventListener('click', () => {
                showMovieDetails(movie.id, movie.media_type);
            });
            
            favoritesGrid.appendChild(movieCard);
        });
    }
}

// Funkcija za dodavanje u favorite
function addToFavorites(movie) {
    if (!currentUser) {
        loginModal.style.display = 'flex';
        return;
    }
    
    favorites = JSON.parse(localStorage.getItem(`favorites_${currentUser.uid}`)) || [];
    
    // Provjeri da li je već u favoritima
    if (favorites.some(fav => fav.id === movie.id && fav.media_type === movie.media_type)) {
        return;
    }
    
    favorites.push(movie);
    localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify(favorites));
    
    // Ažuriraj UI
    const favoriteBtn = document.querySelector(`.movie-card[data-id="${movie.id}"][data-type="${movie.media_type}"] .favorite-btn`);
    if (favoriteBtn) {
        favoriteBtn.classList.add('active');
    }
}

// Funkcija za uklanjanje iz favorita
function removeFromFavorites(id, type) {
    if (!currentUser) return;
    
    favorites = favorites.filter(fav => !(fav.id === id && fav.media_type === type));
    localStorage.setItem(`favorites_${currentUser.uid}`, JSON.stringify(favorites));
    
    // Ažuriraj UI
    if (window.location.hash === '#favorites') {
        loadFavorites();
    }
}

// Funkcija za prijavu s Firebase-om
function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Molimo unesite email i lozinku!');
        return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Uspješna prijava
            loginModal.style.display = 'none';
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
        })
        .catch((error) => {
            // Greška pri prijavi
            const errorCode = error.code;
            let errorMessage = 'Došlo je do greške pri prijavi!';
            
            if (errorCode === 'auth/user-not-found') {
                errorMessage = 'Korisnik s ovim emailom ne postoji!';
            } else if (errorCode === 'auth/wrong-password') {
                errorMessage = 'Pogrešna lozinka!';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Email adresa nije ispravna!';
            } else if (errorCode === 'auth/too-many-requests') {
                errorMessage = 'Previše pokušaja prijave. Pokušajte ponovno kasnije.';
            }
            
            alert(errorMessage);
        });
}

// Funkcija za registraciju s Firebase-om
function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        alert('Molimo popunite sva polja!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Lozinke se ne podudaraju!');
        return;
    }
    
    if (password.length < 6) {
        alert('Lozinka mora imati najmanje 6 znakova!');
        return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Uspješna registracija
            const user = userCredential.user;
            
            // Ažuriraj display name
            return user.updateProfile({
                displayName: name
            });
        })
        .then(() => {
            registerModal.style.display = 'none';
            document.getElementById('registerName').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';
            document.getElementById('registerConfirmPassword').value = '';
        })
        .catch((error) => {
            // Greška pri registraciji
            const errorCode = error.code;
            let errorMessage = 'Došlo je do greške pri registraciji!';
            
            if (errorCode === 'auth/email-already-in-use') {
                errorMessage = 'Korisnik s ovim emailom već postoji!';
            } else if (errorCode === 'auth/invalid-email') {
                errorMessage = 'Email adresa nije ispravna!';
            } else if (errorCode === 'auth/weak-password') {
                errorMessage = 'Lozinka je pre slaba!';
            }
            
            alert(errorMessage);
        });
}

// Funkcija za odjavu
function logout() {
    auth.signOut()
        .then(() => {
            window.location.hash = '';
        })
        .catch((error) => {
            alert('Došlo je do greške pri odjavi!');
        });
}

// Funkcija za dohvaćanje popularnih filmova za hero slider
async function getPopularMovies() {
    try {
        const response = await fetch(`${API_URL}/movie/popular?api_key=${API_KEY}&language=hr`);
        const data = await response.json();
        
        heroSlider.innerHTML = '';
        
        // Prikazujemo prvih 5 filmova u slideru
        data.results.slice(0, 5).forEach((movie, index) => {
            const slide = document.createElement('div');
            slide.classList.add('hero-slide');
            if (index === 0) slide.classList.add('active');
            
            slide.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${BACKDROP_PATH}${movie.backdrop_path})`;
            
            slide.innerHTML = `
                <div class="hero-content">
                    <h2 class="hero-title">${movie.title}</h2>
                    <p class="hero-overview">${movie.overview || 'Opis nije dostupan.'}</p>
                    <div class="hero-rating">
                        <i class="fas fa-star star"></i>
                        <span>${movie.vote_average.toFixed(1)}</span>
                    </div>
                </div>
            `;
            
            heroSlider.appendChild(slide);
        });
        
        // Rotacija slajdova
        let slideIndex = 0;
        const slides = document.querySelectorAll('.hero-slide');
        
        setInterval(() => {
            slides.forEach(slide => slide.classList.remove('active'));
            slideIndex = (slideIndex + 1) % slides.length;
            slides[slideIndex].classList.add('active');
        }, 5000);
        
    } catch (error) {
        console.error('Greška pri dohvaćanju popularnih filmova:', error);
        heroSlider.innerHTML = `<p class="error">Nije moguće učitati popularne filmove.</p>`;
    }
}

// Funkcija za učitavanje sadržaja
async function loadContent(filter, type = 'all', page = 1) {
    try {
        resultsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Učitavam sadržaj...</p>
            </div>
        `;
        
        let endpoint = '';
        
        switch(filter) {
            case 'popular':
                endpoint = type === 'tv' ? '/tv/popular' : '/movie/popular';
                break;
            case 'top_rated':
                endpoint = type === 'tv' ? '/tv/top_rated' : '/movie/top_rated';
                break;
            case 'upcoming':
                endpoint = '/movie/upcoming';
                break;
            default:
                endpoint = '/movie/popular';
        }
        
        const response = await fetch(`${API_URL}${endpoint}?api_key=${API_KEY}&language=hr&page=${page}`);
        const data = await response.json();
        
        displayResults(data.results, type);
        setupPagination(data.total_pages, page);
        
        currentFilter = filter;
        isSearching = false;
        
    } catch (error) {
        console.error('Greška pri učitavanju sadržaja:', error);
        resultsGrid.innerHTML = '<p class="error">Nije moguće učitati sadržaj.</p>';
    }
}

// Učitaj sve TMDB žanrove i popuni select
function loadGenres() {
    fetch(`${API_URL}/genre/movie/list?api_key=${API_KEY}&language=hr`)
        .then(r => r.json())
        .then(data => {
            data.genres.forEach(g => {
                const opt = document.createElement('option');
                opt.value = g.id;
                opt.textContent = g.name;
                genreSelect.appendChild(opt);
            });
        });
}

// Funkcija za popunjavanje godina u dropdown
function populateYearFilter() {
    const yearSelect = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    
    // Očisti postojeće opcije (osim prve)
    yearSelect.innerHTML = '<option value="">Sve godine</option>';
    
    // Dodaj godine od tekuće do 1950
    for (let year = currentYear; year >= 1950; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

// Funkcija za filtriranje po godini
function filterByYear(year) {
    const genreId = document.getElementById('genreSelect').value;
    let url = `${API_URL}/discover/movie?api_key=${API_KEY}&language=hr&sort_by=popularity.desc`;
    
    // Dodaj filter za godinu ako je odabrana
    if (year) {
        url += `&primary_release_year=${year}`;
    }
    
    // Dodaj filter za žanr ako je odabran
    if (genreId) {
        url += `&with_genres=${genreId}`;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Očistite rezultate
            resultsGrid.innerHTML = '';
            
            if (data.results.length === 0) {
                resultsGrid.innerHTML = '<p class="error">Nema rezultata za prikaz.</p>';
                return;
            }
            
            // Prikažite rezultate
            data.results.forEach(item => {
                const title = item.title || item.name;
                let year = '';
                if (item.release_date) {
                    year = item.release_date.substring(0, 4);
                } else if (item.first_air_date) {
                    year = item.first_air_date.substring(0, 4);
                }
                
                let mediaType = item.media_type || 'movie';
                
                const movieCard = document.createElement('div');
                movieCard.classList.add('movie-card');
                movieCard.dataset.id = item.id;
                movieCard.dataset.type = mediaType;
                
                const isFavorite = currentUser && favorites.some(fav => fav.id === item.id && fav.media_type === mediaType);
                
                movieCard.innerHTML = `
                    <img src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/300x450/333333/ffffff?text=Nema+slike'}" alt="${title}" class="movie-poster">
                    <div class="movie-info">
                        <h3 class="movie-title">${title}</h3>
                        <div class="movie-year">${year} • ${mediaType === 'movie' ? 'Film' : 'Serija'}</div>
                        <div class="movie-rating">
                            <i class="fas fa-star star"></i>
                            <span>${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}">
                        <i class="fas fa-heart"></i>
                    </button>
                `;
                
                const favoriteBtn = movieCard.querySelector('.favorite-btn');
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!currentUser) {
                        loginModal.style.display = 'flex';
                        return;
                    }
                    
                    if (favoriteBtn.classList.contains('active')) {
                        favoriteBtn.classList.remove('active');
                        removeFromFavorites(item.id, mediaType);
                    } else {
                        favoriteBtn.classList.add('active');
                        addToFavorites(item);
                    }
                });
                
                movieCard.addEventListener('click', () => {
                    showMovieDetails(item.id, mediaType);
                });
                
                resultsGrid.appendChild(movieCard);
            });
        })
        .catch(error => {
            console.error('Greška pri filtriranju po godini:', error);
            resultsGrid.innerHTML = '<p class="error">Greška pri učitavanju podataka.</p>';
        });
}

// Kad korisnik promijeni žanr, filtriraj
genreSelect.addEventListener('change', () => {
    const genreId = genreSelect.value;
    const selectedYear = document.getElementById('yearSelect').value;
    let url = `${API_URL}/discover/movie?api_key=${API_KEY}&language=hr&sort_by=popularity.desc`;
    
    if (genreId) url += `&with_genres=${genreId}`;
    if (selectedYear) url += `&primary_release_year=${selectedYear}`;

    fetch(url)
        .then(r => r.json())
        .then(data => {
            // Očistite rezultate
            resultsGrid.innerHTML = '';
            
            if (data.results.length === 0) {
                resultsGrid.innerHTML = '<p class="error">Nema rezultata za prikaz.</p>';
                return;
            }
            
            // Prikažite rezultate
            data.results.forEach(item => {
                const title = item.title || item.name;
                let year = '';
                if (item.release_date) {
                    year = item.release_date.substring(0, 4);
                } else if (item.first_air_date) {
                    year = item.first_air_date.substring(0, 4);
                }
                
                let mediaType = item.media_type || 'movie';
                
                const movieCard = document.createElement('div');
                movieCard.classList.add('movie-card');
                movieCard.dataset.id = item.id;
                movieCard.dataset.type = mediaType;
                
                const isFavorite = currentUser && favorites.some(fav => fav.id === item.id && fav.media_type === mediaType);
                
                movieCard.innerHTML = `
                    <img src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/300x450/333333/ffffff?text=Nema+slike'}" alt="${title}" class="movie-poster">
                    <div class="movie-info">
                        <h3 class="movie-title">${title}</h3>
                        <div class="movie-year">${year} • ${mediaType === 'movie' ? 'Film' : 'Serija'}</div>
                        <div class="movie-rating">
                            <i class="fas fa-star star"></i>
                            <span>${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                        </div>
                    </div>
                    <button class="favorite-btn ${isFavorite ? 'active' : ''}">
                        <i class="fas fa-heart"></i>
                    </button>
                `;
                
                const favoriteBtn = movieCard.querySelector('.favorite-btn');
                favoriteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (!currentUser) {
                        loginModal.style.display = 'flex';
                        return;
                    }
                    
                    if (favoriteBtn.classList.contains('active')) {
                        favoriteBtn.classList.remove('active');
                        removeFromFavorites(item.id, mediaType);
                    } else {
                        favoriteBtn.classList.add('active');
                        addToFavorites(item);
                    }
                });
                
                movieCard.addEventListener('click', () => {
                    showMovieDetails(item.id, mediaType);
                });
                
                resultsGrid.appendChild(movieCard);
            });
        });
});

// Funkcija za pretraživanje
async function searchContent(query, page = 1, type = 'all') {
    try {
        resultsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Pretražujem...</p>
            </div>
        `;
        
        const response = await fetch(`${API_URL}/search/multi?api_key=${API_KEY}&language=hr&query=${query}&page=${page}`);
        const data = await response.json();
        
        // Filtriramo rezultate po tipu ako je odabrano
        let filteredResults = data.results;
        if (type !== 'all') {
            filteredResults = data.results.filter(item => item.media_type === type);
        }
        
        displayResults(filteredResults, type);
        setupPagination(data.total_pages, page);
        
        isSearching = true;
        currentQuery = query;
        
    } catch (error) {
        console.error('Greška pri pretraživanju:', error);
        resultsGrid.innerHTML = '<p class="error">Nije moguće izvršiti pretraživanje.</p>';
    }
}

// Funkcija za izvođenje pretrage
function performSearch() {
    const query = searchInput.value.trim();
    
    if (query === '') {
        loadContent('popular', currentType);
        return;
    }
    
    currentPage = 1;
    searchContent(query, currentPage, currentType);
}

// Funkcija za prikaz rezultata
function displayResults(results, type) {
    if (results.length === 0) {
        resultsGrid.innerHTML = '<p class="error">Nema rezultata za prikaz.</p>';
        return;
    }
    
    resultsGrid.innerHTML = '';
    
    results.forEach(item => {
        // Određujemo naslov ili naziv
        const title = item.title || item.name;
        
        // Određujemo godinu
        let year = '';
        if (item.release_date) {
            year = item.release_date.substring(0, 4);
        } else if (item.first_air_date) {
            year = item.first_air_date.substring(0, 4);
        }
        
        // Određujemo vrstu (film ili serija)
        let mediaType = item.media_type;
        if (!mediaType) {
            mediaType = item.title ? 'movie' : 'tv';
        }
        
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.dataset.id = item.id;
        movieCard.dataset.type = mediaType;
        
        // Provjeri je li film u favoritima
        const isFavorite = currentUser && favorites.some(fav => fav.id === item.id && fav.media_type === mediaType);
        
        movieCard.innerHTML = `
            <img src="${item.poster_path ? IMG_PATH + item.poster_path : 'https://via.placeholder.com/300x450/333333/ffffff?text=Nema+slike'}" alt="${title}" class="movie-poster">
            <div class="movie-info">
                <h3 class="movie-title">${title}</h3>
                <div class="movie-year">${year} • ${mediaType === 'movie' ? 'Film' : 'Serija'}</div>
                <div class="movie-rating">
                    <i class="fas fa-star star"></i>
                    <span>${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</span>
                </div>
            </div>
            <button class="favorite-btn ${isFavorite ? 'active' : ''}">
                <i class="fas fa-heart"></i>
            </button>
        `;
        
        // Event listener za favorite
        const favoriteBtn = movieCard.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!currentUser) {
                loginModal.style.display = 'flex';
                return;
            }
            
            if (favoriteBtn.classList.contains('active')) {
                favoriteBtn.classList.remove('active');
                removeFromFavorites(item.id, mediaType);
            } else {
                favoriteBtn.classList.add('active');
                addToFavorites(item);
            }
        });
        
        movieCard.addEventListener('click', () => {
            showMovieDetails(item.id, mediaType);
        });
        
        resultsGrid.appendChild(movieCard);
    });
}

// Funkcija za postavljanje paginacije
function setupPagination(total, current) {
    totalPages = total > 500 ? 500 : total; // TMDB API ograničenje
    currentPage = current;
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Dodajemo tipku za prethodnu stranicu
    paginationHTML += `
        <button class="page-btn" id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    // Dodajemo brojeve stranica
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <button class="page-btn ${i === currentPage ? 'active' : ''}">${i}</button>
        `;
    }
    
    // Dodajemo tipku za sljedeću stranicu
    paginationHTML += `
        <button class="page-btn" id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    pagination.innerHTML = paginationHTML;
    
    // Postavljamo event listenere za paginaciju
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadPage(currentPage);
        }
    });
    
    document.getElementById('nextPage')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadPage(currentPage);
        }
    });
    
    document.querySelectorAll('.page-btn:not(#prevPage):not(#nextPage)').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.textContent);
            loadPage(currentPage);
        });
    });
}

// Funkcija za učitavanje stranice
function loadPage(page) {
    if (isSearching) {
        searchContent(currentQuery, page, currentType);
    } else {
        loadContent(currentFilter, currentType, page);
    }
    
    // Skrolaj na vrh rezultata
    resultsGrid.scrollIntoView({ behavior: 'smooth' });
}

// Funkcija za prikaz detalja o filmu/seriji
async function showMovieDetails(id, type) {
    try {
        movieDetails.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>Učitavam detalje...</p>
            </div>
        `;
        
        movieDetails.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        currentMovieId = id;
        currentMediaType = type;
        
        const response = await fetch(`${API_URL}/${type}/${id}?api_key=${API_KEY}&language=hr`);
        const data = await response.json();
        
        // Dohvaćamo informacije o glumcima
        const creditsResponse = await fetch(`${API_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
        const creditsData = await creditsResponse.json();
        
        // Formatiranje glumaca (prvih 5)
        const cast = creditsData.cast.slice(0, 5).map(actor => actor.name).join(', ');
        
        // Formatiranje žanrova
        const genres = data.genres.map(genre => genre.name);
        
        // Formatiranje godine
        let year = '';
        if (data.release_date) {
            year = data.release_date.substring(0, 4);
        } else if (data.first_air_date) {
            year = data.first_air_date.substring(0, 4);
        }
        
        // Formatiranje trajanja
        let runtime = '';
        if (data.runtime) {
            const hours = Math.floor(data.runtime / 60);
            const minutes = data.runtime % 60;
            runtime = `${hours}h ${minutes}m`;
        } else if (data.episode_run_time && data.episode_run_time.length > 0) {
            runtime = `${data.episode_run_time[0]} min po epizodi`;
        }
        
        movieDetails.innerHTML = `
            <div class="details-content">
                <div class="details-header">
                    <img src="${data.backdrop_path ? BACKDROP_PATH + data.backdrop_path : 'https://via.placeholder.com/800x300/333333/ffffff?text=Nema+slike'}" alt="${data.title || data.name}" class="details-backdrop">
                    <button class="details-close" id="detailsClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="details-body">
                    <h2 class="details-title">${data.title || data.name}</h2>
                    <div class="details-meta">
                        <span class="details-year">${year}</span>
                        <span class="details-runtime">${runtime}</span>
                        <span class="details-rating">
                            <i class="fas fa-star star"></i>
                            ${data.vote_average ? data.vote_average.toFixed(1) : 'N/A'}
                        </span>
                    </div>
                    <div class="details-genres">
                        <strong>Žanrovi:</strong>
                        ${genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                    </div>
                    <p class="details-plot">${data.overview || 'Opis nije dostupan.'}</p>
                    <div class="details-cast">
                        <strong>Glumačka postava:</strong> ${cast || 'Nema informacija o glumcima.'}
                    </div>
                    <button class="trailer-btn" id="trailerBtn">
                        <i class="fab fa-youtube"></i> Pogledaj trailer
                    </button>
                    <div id="trailerInfo"></div>
                </div>
            </div>
        `;
        
        // Zatvaranje detalja
        document.getElementById('detailsClose').addEventListener('click', () => {
            movieDetails.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        // Trailer gumb
        document.getElementById('trailerBtn').addEventListener('click', getTrailer);
        
    } catch (error) {
        console.error('Greška pri dohvaćanju detalja:', error);
        movieDetails.innerHTML = '<p class="error">Nije moguće učitati detalje.</p>';
    }
}

// Funkcija za dohvaćanje i prikaz trailera
async function getTrailer() {
    try {
        const trailerInfo = document.getElementById('trailerInfo');
        trailerInfo.innerHTML = '<p>Tražim trailer...</p>';
        
        const response = await fetch(`${API_URL}/${currentMediaType}/${currentMovieId}/videos?api_key=${API_KEY}`);
        const data = await response.json();
        
        // Pronalazimo YouTube trailer
        const trailer = data.results.find(video => 
            video.type === 'Trailer' && video.site === 'YouTube'
        );
        
        if (trailer) {
            showTrailer(trailer.key);
        } else {
            trailerInfo.innerHTML = '<p class="no-trailer">Nažalost, trailer nije dostupan za ovaj sadržaj.</p>';
        }
        
    } catch (error) {
        console.error('Greška pri dohvaćanju trailera:', error);
        document.getElementById('trailerInfo').innerHTML = '<p class="no-trailer">Greška pri učitavanju trailera.</p>';
    }
}

// Funkcija za prikaz trailera u modalnom prozoru
function showTrailer(youtubeKey) {
    trailerPlaceholder.innerHTML = `
        <iframe class="trailer-iframe" src="https://www.youtube.com/embed/${youtubeKey}?autoplay=1" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    trailerModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Funkcija za zatvaranje trailera
function closeTrailer() {
    trailerModal.style.display = 'none';
    trailerPlaceholder.innerHTML = '';
    document.body.style.overflow = 'auto';
}