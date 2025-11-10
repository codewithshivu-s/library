// Student Dashboard Module
const StudentDashboard = {
    requestedBooks: [],

    init() {
        this.setupEventListeners();
        this.loadRequestedBooks();
        this.loadCatalog();
    },

    setupEventListeners() {
        document.getElementById('studentCatalogSearch')?.addEventListener('input', Utils.debounce(() => this.filterCatalog(), 300));
        document.getElementById('studentCatalogCategory')?.addEventListener('change', () => this.filterCatalog());
    },

    switchTab(tabName) {
        document.querySelectorAll('#studentDashboard .tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');

        document.querySelectorAll('#studentDashboard .tab-content').forEach(content => content.classList.add('hidden'));
        const tabContent = document.getElementById(`student-tab-${tabName}`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }

        if (tabName === 'search') this.loadCatalog();
        if (tabName === 'requested') this.loadRequestedBooks();
        if (tabName === 'borrowed') this.loadBorrowedBooks();
    },

    filterCatalog() {
        const searchTerm = (document.getElementById('studentCatalogSearch')?.value || '').toLowerCase();
        const category = document.getElementById('studentCatalogCategory')?.value || 'all';
        const books = DataManager.getBooks();
        const container = document.getElementById('studentCatalogList');
        if (!container) return;

        let filteredBooks = books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm) ||
                                book.author.toLowerCase().includes(searchTerm) ||
                                book.isbn.toLowerCase().includes(searchTerm);
            const matchesCategory = category === 'all' || book.category === category;
            return matchesSearch && matchesCategory;
        });

        if (filteredBooks.length === 0) {
            container.innerHTML = '<div class="empty-state">No books found</div>';
            return;
        }

        // Get current user bookmarks
        const currentUserBookmarks = DataManager.getBookmarksForUser(App.currentUser.id);
        
        // Get active transactions to show book status
        const activeTransactions = DataManager.getActiveTransactions();
        const users = DataManager.getUsers();

        container.innerHTML = filteredBooks.map(book => {
            // Check if this book is bookmarked by the current user
            const isBookmarked = currentUserBookmarks.some(b => b.bookId === book.id);
            
            // Check if this book is currently issued
            const transaction = activeTransactions.find(t => t.bookId === book.id);
            const isIssued = !!transaction;
            const issuedTo = isIssued ? users.find(u => u.id === transaction.userId) : null;
            
            return `
                <div class="book-card">
                    <h4>${book.title}</h4>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Category:</strong> <span class="badge badge-blue">${book.category}</span></p>
                    <p><strong>Available:</strong> ${book.availableCopies} / ${book.totalCopies}</p>
                    ${isIssued ? `
                        <p><strong>Status:</strong> <span class="badge badge-red">Issued</span></p>
                        ${issuedTo && issuedTo.id === App.currentUser.id ? 
                            '<p><strong>Issued to:</strong> You</p>' : 
                            `<p><strong>Issued to:</strong> ${issuedTo ? issuedTo.fullName : 'Unknown User'}</p>`}
                    ` : `
                        <p><strong>Status:</strong> <span class="badge badge-green">Available</span></p>
                    `}
                    <div class="actions">
                        <button class="btn ${isBookmarked ? 'btn-warning' : 'btn-secondary'} btn-sm" 
                                onclick="StudentDashboard.toggleBookmark('${book.id}')">
                            ${isBookmarked ? 'Unbookmark' : 'Bookmark'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update category filter
        const categories = ['all', ...new Set(books.map(b => b.category))];
        const categorySelect = document.getElementById('studentCatalogCategory');
        if (categorySelect) {
            // Clear existing options except "All Categories"
            while (categorySelect.children.length > 1) {
                categorySelect.removeChild(categorySelect.lastChild);
            }
            categories.forEach(cat => {
                if (cat !== 'all') {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = cat;
                    categorySelect.appendChild(option);
                }
            });
        }
    },

    loadCatalog() {
        this.filterCatalog();
    },

    loadRequestedBooks() {
        this.requestedBooks = JSON.parse(localStorage.getItem(`student_${App.currentUser.id}_requested`) || '[]');
        const container = document.getElementById('requestedBooksList');
        if (!container) return;

        if (this.requestedBooks.length === 0) {
            container.innerHTML = '<div class="empty-state">No requested books</div>';
            return;
        }

        const books = DataManager.getBooks();
        container.innerHTML = this.requestedBooks.map(book => `
            <div class="book-card">
                <h4>${book.title}</h4>
                <p><strong>Author:</strong> ${book.author}</p>
                <p><strong>ISBN:</strong> ${book.isbn}</p>
                <p><strong>Category:</strong> <span class="badge badge-blue">${book.category}</span></p>
                <p><strong>Status:</strong> 
                    <span class="badge ${book.availableCopies > 0 ? 'badge-green' : 'badge-orange'}">
                        ${book.availableCopies > 0 ? 'Available' : 'Waitlist'}
                    </span>
                </p>
                <div class="actions">
                    <button class="btn btn-danger btn-sm" onclick="StudentDashboard.cancelRequest('${book.id}')">Cancel Request</button>
                </div>
            </div>
        `).join('');
    },

    cancelRequest(bookId) {
        this.requestedBooks = this.requestedBooks.filter(b => b.id !== bookId);
        localStorage.setItem(`student_${App.currentUser.id}_requested`, JSON.stringify(this.requestedBooks));
        Utils.showSuccess('Request cancelled');
        this.loadRequestedBooks();
    },

    loadBorrowedBooks() {
        const transactions = DataManager.getTransactionsByUser(App.currentUser.id);
        const activeTransactions = transactions.filter(t => t.status === 'active');
        const books = DataManager.getBooks();
        const container = document.getElementById('borrowedBooksList');
        if (!container) return;

        if (activeTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No borrowed books</div>';
            return;
        }

        container.innerHTML = activeTransactions.map(trans => {
            const book = books.find(b => b.id === trans.bookId);
            const daysLeft = Utils.getDaysUntilDue(trans.dueDate);
            const isOverdue = daysLeft < 0;
            const isDueSoon = daysLeft >= 0 && daysLeft <= 3;

            return `
                <div class="book-card">
                    <h4>${trans.bookTitle}</h4>
                    <p><strong>Issue Date:</strong> ${Utils.formatDate(trans.issueDate)}</p>
                    <p><strong>Due Date:</strong> ${Utils.formatDate(trans.dueDate)}</p>
                    ${daysLeft !== null ? `
                        <p><strong>Status:</strong> 
                            <span class="badge ${isOverdue ? 'badge-red' : isDueSoon ? 'badge-orange' : 'badge-green'}">
                                ${isOverdue ? 'Overdue' : isDueSoon ? 'Due Soon' : 'Active'}
                            </span>
                        </p>
                        ${isOverdue ? `<p class="alert alert-error">This book is overdue. Please return immediately.</p>` : ''}
                        ${isDueSoon && !isOverdue ? `<p class="alert alert-info">Please return soon to avoid late fees.</p>` : ''}
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    // Bookmark functionality
    toggleBookmark(bookId) {
        const bookmarks = DataManager.getBookmarks();
        const existingBookmark = bookmarks.find(b => b.userId === App.currentUser.id && b.bookId === bookId);
        
        if (existingBookmark) {
            // Remove bookmark
            DataManager.removeBookmark(App.currentUser.id, bookId);
            Utils.showSuccess('Bookmark removed');
        } else {
            // Add bookmark
            DataManager.addBookmark(App.currentUser.id, bookId);
            Utils.showSuccess('Book bookmarked');
        }
        
        // Refresh the catalog view
        this.filterCatalog();
    }
};