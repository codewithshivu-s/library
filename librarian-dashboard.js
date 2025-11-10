// Librarian Dashboard Module
const LibrarianDashboard = {
    init() {
        this.setupEventListeners();
        // Set default issue date to today
        const today = new Date().toISOString().split('T')[0];
        const issueDateInput = document.getElementById('issueDate');
        if (issueDateInput) {
            issueDateInput.value = today;
        }
        // Set default return days to 4
        const returnDaysInput = document.getElementById('returnDays');
        if (returnDaysInput && !returnDaysInput.value) {
            returnDaysInput.value = 4;
        }
        this.loadIssueReturn();
    },

    setupEventListeners() {
        document.getElementById('issueBookForm')?.addEventListener('submit', (e) => this.handleIssueBook(e));
        document.getElementById('returnBookForm')?.addEventListener('submit', (e) => this.handleReturnBook(e));
        document.getElementById('searchBookISBN')?.addEventListener('input', Utils.debounce(() => this.searchBook(), 300));
        document.getElementById('searchUserAdmin')?.addEventListener('input', Utils.debounce(() => this.searchUser(), 300));
        document.getElementById('returnBookISBN')?.addEventListener('input', Utils.debounce(() => this.searchReturnBook(), 300));
    },

    switchTab(tabName) {
        document.querySelectorAll('#librarianDashboard .tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');

        document.querySelectorAll('#librarianDashboard .tab-content').forEach(content => content.classList.add('hidden'));
        const tabContent = document.getElementById(`librarian-tab-${tabName}`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }

        if (tabName === 'issue-return') this.loadIssueReturn();
        if (tabName === 'catalog') this.loadCatalog();
        if (tabName === 'transactions') this.loadTransactions();
        if (tabName === 'bookmarks') this.loadBookmarks(); // New bookmarks tab
    },

    loadIssueReturn() {
        this.loadActiveIssues();
    },

    searchBook() {
        const isbn = document.getElementById('searchBookISBN').value.trim();
        const bookInfo = document.getElementById('bookInfo');
        
        if (!isbn) {
            bookInfo.classList.add('hidden');
            return;
        }

        const book = DataManager.getBookByISBN(isbn);
        if (book) {
            bookInfo.innerHTML = `
                <div class="alert alert-success">
                    <strong>${book.title}</strong><br>
                    <small>by ${book.author}</small><br>
                    <small>Available: ${book.availableCopies} / ${book.totalCopies}</small>
                </div>
            `;
            bookInfo.classList.remove('hidden');
        } else {
            bookInfo.innerHTML = '<div class="alert alert-error">Book not found</div>';
            bookInfo.classList.remove('hidden');
        }
    },

    searchUser() {
        const adminNumber = document.getElementById('searchUserAdmin').value.trim();
        const userInfo = document.getElementById('userInfo');
        
        if (!adminNumber) {
            userInfo.classList.add('hidden');
            return;
        }

        const user = DataManager.getUserByAdminNumber(adminNumber);
        if (user && (user.role === 'student' || user.role === 'teacher')) {
            userInfo.innerHTML = `
                <div class="alert alert-success">
                    <strong>${user.fullName}</strong><br>
                    <small>Role: ${user.role}</small><br>
                    ${user.class ? `<small>Class: ${user.class}</small>` : ''}
                </div>
            `;
            userInfo.classList.remove('hidden');
        } else if (user) {
            userInfo.innerHTML = '<div class="alert alert-error">Only students and teachers can borrow books</div>';
            userInfo.classList.remove('hidden');
        } else {
            userInfo.innerHTML = '<div class="alert alert-error">User not found</div>';
            userInfo.classList.remove('hidden');
        }
    },

    handleIssueBook(e) {
        e.preventDefault();
        const isbn = document.getElementById('searchBookISBN').value.trim();
        const adminNumber = document.getElementById('searchUserAdmin').value.trim();
        const issueDate = document.getElementById('issueDate').value;
        const returnDays = parseInt(document.getElementById('returnDays').value);

        if (!isbn || !adminNumber || !issueDate || !returnDays || returnDays < 1) {
            Utils.showError('Please fill all fields correctly. Return days must be at least 1.', 'issueError');
            return;
        }

        const book = DataManager.getBookByISBN(isbn);
        const user = DataManager.getUserByAdminNumber(adminNumber);

        if (!book) {
            Utils.showError('Book not found', 'issueError');
            return;
        }

        if (!user) {
            Utils.showError('User not found', 'issueError');
            return;
        }

        if (book.availableCopies <= 0) {
            Utils.showError('No copies available', 'issueError');
            return;
        }

        if (user.role !== 'student' && user.role !== 'teacher') {
            Utils.showError('Only students and teachers can borrow books', 'issueError');
            return;
        }

        // Calculate due date based on return days specified by librarian
        const dueDate = new Date(issueDate);
        dueDate.setDate(dueDate.getDate() + returnDays);

        // Create transaction
        const transaction = {
            bookId: book.id,
            userId: user.id,
            userName: user.fullName,
            bookTitle: book.title,
            type: 'issue',
            issueDate: issueDate,
            dueDate: dueDate.toISOString().split('T')[0],
            status: 'active'
        };

        DataManager.addTransaction(transaction);

        // Update book availability
        DataManager.updateBook(book.id, {
            availableCopies: book.availableCopies - 1
        });

        // Remove bookmarks for this user and book after issuing
        DataManager.removeBookmark(user.id, book.id);

        Utils.showSuccess(`"${book.title}" issued to ${user.fullName} (Due in ${returnDays} days)`);
        this.loadIssueReturn();
        document.getElementById('issueBookForm').reset();
        // Reset to defaults
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('issueDate').value = today;
        document.getElementById('returnDays').value = 7;
        document.getElementById('bookInfo').classList.add('hidden');
        document.getElementById('userInfo').classList.add('hidden');
    },

    searchReturnBook() {
        const isbn = document.getElementById('returnBookISBN').value.trim();
        const returnInfo = document.getElementById('returnInfo');
        
        if (!isbn) {
            returnInfo.classList.add('hidden');
            return;
        }

        const book = DataManager.getBookByISBN(isbn);
        if (!book) {
            returnInfo.innerHTML = '<div class="alert alert-error">Book not found</div>';
            returnInfo.classList.remove('hidden');
            return;
        }

        const activeTransactions = DataManager.getActiveTransactions();
        const transaction = activeTransactions.find(t => t.bookId === book.id);

        if (transaction) {
            const user = DataManager.getUsers().find(u => u.id === transaction.userId);
            returnInfo.innerHTML = `
                <div class="alert alert-success">
                    <strong>${book.title}</strong><br>
                    <small>Issued to: ${user.fullName}</small><br>
                    <small>Issue Date: ${Utils.formatDate(transaction.issueDate)}</small><br>
                    <small>Due Date: ${Utils.formatDate(transaction.dueDate)}</small>
                </div>
            `;
            returnInfo.classList.remove('hidden');
        } else {
            returnInfo.innerHTML = '<div class="alert alert-error">No active issue found for this book</div>';
            returnInfo.classList.remove('hidden');
        }
    },

    handleReturnBook(e) {
        e.preventDefault();
        const isbn = document.getElementById('returnBookISBN').value.trim();

        if (!isbn) {
            Utils.showError('Please enter ISBN', 'returnError');
            return;
        }

        const book = DataManager.getBookByISBN(isbn);
        if (!book) {
            Utils.showError('Book not found', 'returnError');
            return;
        }

        const activeTransactions = DataManager.getActiveTransactions();
        const transaction = activeTransactions.find(t => t.bookId === book.id);

        if (!transaction) {
            Utils.showError('No active issue found for this book', 'returnError');
            return;
        }

        // Update transaction
        DataManager.updateTransaction(transaction.id, {
            returnDate: new Date().toISOString().split('T')[0],
            status: 'completed',
            type: 'return'
        });

        // Update book availability
        DataManager.updateBook(book.id, {
            availableCopies: book.availableCopies + 1
        });

        Utils.showSuccess(`"${book.title}" returned successfully`);
        this.loadIssueReturn();
        document.getElementById('returnBookForm').reset();
        document.getElementById('returnInfo').classList.add('hidden');
    },

    loadActiveIssues() {
        const activeTransactions = DataManager.getActiveTransactions();
        const books = DataManager.getBooks();
        const container = document.getElementById('activeIssuesList');
        if (!container) return;

        if (activeTransactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No active book issues</div>';
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
                    <p><strong>Issued to:</strong> ${trans.userName}</p>
                    <p><strong>ISBN:</strong> ${book ? book.isbn : 'N/A'}</p>
                    <p><strong>Issue Date:</strong> ${Utils.formatDate(trans.issueDate)}</p>
                    <p><strong>Due Date:</strong> ${Utils.formatDate(trans.dueDate)}</p>
                    ${daysLeft !== null ? `
                        <p><strong>Days Left:</strong> 
                            <span class="badge ${isOverdue ? 'badge-red' : isDueSoon ? 'badge-orange' : 'badge-green'}">
                                ${isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                            </span>
                        </p>
                    ` : ''}
                </div>
            `;
        }).join('');
    },

    loadCatalog() {
        const books = DataManager.getBooks();
        const container = document.getElementById('catalogList');
        if (!container) return;

        if (books.length === 0) {
            container.innerHTML = '<div class="empty-state">No books available</div>';
            return;
        }

        // Get current user bookmarks
        const currentUserBookmarks = DataManager.getBookmarksForUser(App.currentUser.id);
        
        // Get active transactions to show book status
        const activeTransactions = DataManager.getActiveTransactions();
        const users = DataManager.getUsers();

        container.innerHTML = books.map(book => {
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
                        <p><strong>Issued to:</strong> ${issuedTo ? issuedTo.fullName : 'Unknown User'}</p>
                    ` : `
                        <p><strong>Status:</strong> <span class="badge badge-green">Available</span></p>
                    `}
                    <div class="actions">
                        <button class="btn ${isBookmarked ? 'btn-warning' : 'btn-secondary'} btn-sm" 
                                onclick="LibrarianDashboard.toggleBookmark('${book.id}')">
                            ${isBookmarked ? 'Unbookmark' : 'Bookmark'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    loadTransactions() {
        const transactions = DataManager.getTransactions();
        const tbody = document.getElementById('librarianTransactionsTableBody');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No transactions found</td></tr>';
            return;
        }

        tbody.innerHTML = transactions.map(trans => {
            const statusClass = trans.status === 'active' ? 'badge-blue' : 
                               trans.status === 'completed' ? 'badge-green' : 
                               trans.status === 'overdue' ? 'badge-red' : 'badge-yellow';
            const typeClass = trans.type === 'issue' ? 'badge-purple' : 
                            trans.type === 'return' ? 'badge-green' : 'badge-orange';
            
            return `
                <tr>
                    <td>${trans.bookTitle}</td>
                    <td>${trans.userName}</td>
                    <td><span class="badge ${typeClass}">${trans.type}</span></td>
                    <td>${Utils.formatDate(trans.issueDate)}</td>
                    <td>${Utils.formatDate(trans.dueDate)}</td>
                    <td>${Utils.formatDate(trans.returnDate)}</td>
                    <td><span class="badge ${statusClass}">${trans.status}</span></td>
                </tr>
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
        this.loadCatalog();
    },

    // Load bookmarks for librarian view (shows who bookmarked what)
    loadBookmarks() {
        const bookmarks = DataManager.getBookmarks();
        const books = DataManager.getBooks();
        const users = DataManager.getUsers();
        const container = document.getElementById('librarianBookmarksList');
        
        if (!container) return;

        if (bookmarks.length === 0) {
            container.innerHTML = '<div class="empty-state">No bookmarks found</div>';
            return;
        }

        // Group bookmarks by book
        const bookmarksByBook = {};
        bookmarks.forEach(bookmark => {
            if (!bookmarksByBook[bookmark.bookId]) {
                bookmarksByBook[bookmark.bookId] = [];
            }
            bookmarksByBook[bookmark.bookId].push(bookmark);
        });

        container.innerHTML = Object.keys(bookmarksByBook).map(bookId => {
            const book = books.find(b => b.id === bookId);
            if (!book) return ''; // Skip if book not found
            
            const bookBookmarks = bookmarksByBook[bookId];
            
            return `
                <div class="book-card">
                    <h4>${book.title}</h4>
                    <p><strong>Author:</strong> ${book.author}</p>
                    <p><strong>ISBN:</strong> ${book.isbn}</p>
                    <p><strong>Category:</strong> <span class="badge badge-blue">${book.category}</span></p>
                    <p><strong>Bookmarked by:</strong></p>
                    <ul>
                        ${bookBookmarks.map(bookmark => {
                            const user = users.find(u => u.id === bookmark.userId);
                            if (!user) return `<li>Unknown User (${Utils.formatDate(bookmark.timestamp)})</li>`;
                            return `<li>${user.fullName} (${user.adminNumber}) ${user.class ? '- ' + user.class : ''} (${Utils.formatDate(bookmark.timestamp)})</li>`;
                        }).join('')}
                    </ul>
                </div>
            `;
        }).join('');
    }
};