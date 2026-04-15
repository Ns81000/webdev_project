// API Configuration
const API_BASE_URL = 'http://localhost:3000';

// DOM Elements
const addBookForm = document.getElementById('addBookForm');
const addBookStatus = document.getElementById('addBookStatus');
const booksGrid = document.getElementById('booksGrid');
const emptyState = document.getElementById('emptyState');
const loadingSpinner = document.getElementById('loadingSpinner');
const refreshBtn = document.getElementById('refreshBtn');
const bookModal = document.getElementById('bookModal');
const bookDetails = document.getElementById('bookDetails');
const modalClose = document.querySelector('.close-trigger');
const toastContainer = document.getElementById('toastContainer');
const clockElement = document.getElementById('clock');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

function initApp() {
    loadBooks();
    updateClock();
    setInterval(updateClock, 1000);

    addBookForm.addEventListener('submit', handleAddBook);
    refreshBtn.addEventListener('click', loadBooks);
    modalClose.addEventListener('click', closeModal);
    
    // Close modal on background click
    bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) closeModal();
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function updateClock() {
    const now = new Date();
    clockElement.textContent = now.toTimeString().split(' ')[0];
}

/**
 * API: Fetch all books
 * GET /books
 */
async function loadBooks() {
    try {
        loadingSpinner.style.display = 'flex';
        booksGrid.innerHTML = '';
        emptyState.style.display = 'none';

        const response = await fetch(`${API_BASE_URL}/books`);
        
        if (!response.ok) throw new Error('CONNECTION_FAILURE');
        
        const books = await response.json();
        displayBooks(books);
    } catch (error) {
        showToast(`ERR: ${error.message}`, 'error');
        console.error('Error loading books:', error);
        emptyState.style.display = 'block';
    } finally {
        setTimeout(() => {
            loadingSpinner.style.display = 'none';
        }, 800); // Slight delay for aesthetic transition
    }
}

/**
 * API: Create a new book
 * POST /books
 */
async function handleAddBook(e) {
    e.preventDefault();
    
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    
    if (!title || !author) {
        showStatus('MISSING_PARAMETERS', 'error');
        return;
    }
    
    try {
        showStatus('COMMITTING...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/books`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, author })
        });
        
        if (!response.ok) throw new Error('COMMIT_REJECTED');
        
        const result = await response.json();
        
        if (result.success) {
            showStatus('SUCCESSFULLY_ARCHIVED', 'success');
            showToast('RECORD_COMMITTED', 'success');
            addBookForm.reset();
            await loadBooks();
        } else {
            throw new Error(result.message || 'UNKNOWN_ERROR');
        }
    } catch (error) {
        showStatus(`ERR: ${error.message}`, 'error');
        showToast(`ERR: ${error.message}`, 'error');
    }
}

/**
 * API: Delete a book by ID
 * DELETE /books/:id
 */
async function deleteBook(id) {
    if (!confirm('PERMANENTLY_ERASE_RECORD?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`, { 
            method: 'DELETE' 
        });
        
        if (!response.ok) throw new Error('ERASE_FAILED');
        
        const result = await response.json();
        
        if (result.succes || result.success) {
            showToast('RECORD_ERASED', 'success');
            closeModal();
            await loadBooks();
        } else {
            throw new Error('NOT_FOUND');
        }
    } catch (error) {
        showToast(`ERR: ${error.message}`, 'error');
    }
}

/**
 * Display books in grid
 */
function displayBooks(books) {
    if (!books || books.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    booksGrid.innerHTML = books.map((book, index) => `
        <article class="record-card" style="animation-delay: ${index * 0.1}s">
            <div class="record-visual" onclick="openBookDetails('${escapeHtml(book.id)}')">
                <span class="cover-glyph">${escapeHtml(book.title.charAt(0))}</span>
                <span class="id-stamp">ID_${escapeHtml(book.id)}</span>
            </div>
            <div class="record-meta">
                <h3 class="record-title">${escapeHtml(book.title)}</h3>
                <span class="record-author">BY ${escapeHtml(book.author)}</span>
                <div class="record-actions">
                    <button class="action-link" onclick="openBookDetails('${escapeHtml(book.id)}')">OPEN_FULL</button>
                    <button class="action-link delete" onclick="deleteBook('${escapeHtml(book.id)}')">ERASE</button>
                </div>
            </div>
        </article>
    `).join('');
}

/**
 * Open book details in modal
 */
async function openBookDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/books/${id}`);
        if (!response.ok) throw new Error('FETCH_FAILED');
        const book = await response.json();
        
        bookDetails.innerHTML = `
            <div class="content-visual">
                ${escapeHtml(book.title.charAt(0))}
            </div>
            <div class="content-data">
                <div class="data-group">
                    <span class="section-tag">_FULL_RECORD_ID</span>
                    <h2 class="record-title" style="font-size: 3rem">${escapeHtml(book.title)}</h2>
                </div>
                <div class="data-group">
                    <span class="section-tag">_CONTRIBUTOR</span>
                    <p class="record-author" style="font-size: 1.2rem">${escapeHtml(book.author)}</p>
                </div>
                <div class="data-group">
                    <span class="section-tag">_METADATA</span>
                    <p style="color: var(--color-text-secondary); font-size: 0.8rem">
                        OBJECT_ID: ${escapeHtml(book.id)}<br>
                        STATUS: VERIFIED_ARCHIVE_ENTRY<br>
                        TIMESTAMP: ${new Date().toISOString()}
                    </p>
                </div>
                <button class="submit-trigger" style="color: var(--color-error)" onclick="deleteBook('${escapeHtml(book.id)}')">
                    <span class="line" style="background: var(--color-error)"></span>
                    <span class="text">ERASE_PERMANENTLY</span>
                </button>
            </div>
        `;
        
        bookModal.classList.add('show');
    } catch (error) {
        showToast(`ERR: ${error.message}`, 'error');
    }
}

/**
 * Close modal
 */
function closeModal() {
    bookModal.classList.remove('show');
}

/**
 * Show status message in form
 */
function showStatus(message, type = 'info') {
    addBookStatus.textContent = message;
    addBookStatus.style.color = type === 'error' ? 'var(--color-error)' : 
                               type === 'success' ? 'var(--color-success)' : 
                               'var(--color-accent)';
    
    setTimeout(() => {
        addBookStatus.textContent = '';
    }, 5000);
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <span class="toast-message">${escapeHtml(message)}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(20px)';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(unsafe) {
    if (!unsafe && unsafe !== 0) return '';
    return String(unsafe)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
