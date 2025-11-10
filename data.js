// Data Management Module
const DataManager = {
    // Initialize default data
    init() {
        if (!localStorage.getItem('books')) {
            localStorage.setItem('books', JSON.stringify(this.getDefaultBooks()));
        }
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify(this.getDefaultUsers()));
        }
        if (!localStorage.getItem('transactions')) {
            localStorage.setItem('transactions', JSON.stringify([]));
        }
        // Initialize bookmarks if not exists
        if (!localStorage.getItem('bookmarks')) {
            localStorage.setItem('bookmarks', JSON.stringify([]));
        }
    },

    getDefaultBooks() {
        return [
            {
                id: '1',
                title: 'Introduction to Computer Science',
                author: 'John Smith',
                isbn: '978-0-123456-78-9',
                category: 'Technology',
                totalCopies: 10,
                availableCopies: 8
            },
            {
                id: '2',
                title: 'Advanced Mathematics',
                author: 'Jane Doe',
                isbn: '978-0-987654-32-1',
                category: 'Mathematics',
                totalCopies: 5,
                availableCopies: 3
            },
            {
                id: '3',
                title: 'World History',
                author: 'Robert Johnson',
                isbn: '978-0-555555-55-5',
                category: 'History',
                totalCopies: 7,
                availableCopies: 7
            },
            {
                id: '4',
                title: 'Modern Physics',
                author: 'Emily Chen',
                isbn: '978-0-111111-11-1',
                category: 'Science',
                totalCopies: 6,
                availableCopies: 4
            }
        ];
    },

    getDefaultUsers() {
        return [
            {
                id: '1',
                fullName: 'Admin User',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                adminNumber: 'A001',
                class: ''
            },
            {
                id: '2',
                fullName: 'John Librarian',
                username: 'librarian',
                password: 'lib123',
                role: 'librarian',
                adminNumber: 'L001',
                class: ''
            },
            {
                id: '3',
                fullName: 'Jane Teacher',
                username: 'teacher',
                password: 'teach123',
                role: 'teacher',
                adminNumber: 'T001',
                class: ''
            },
            {
                id: '4',
                fullName: 'Bob Student',
                username: 'student',
                password: 'stud123',
                role: 'student',
                adminNumber: 'S001',
                class: 'Grade 10-A'
            },
            {
                id: '5',
                fullName: 'Alice Student',
                username: 'alice',
                password: 'alice123',
                role: 'student',
                adminNumber: 'S002',
                class: 'Grade 11-B'
            }
        ];
    },

    // Books operations
    getBooks() {
        return JSON.parse(localStorage.getItem('books')) || [];
    },

    saveBooks(books) {
        localStorage.setItem('books', JSON.stringify(books));
    },

    // Generate a unique ID using timestamp and random number to avoid conflicts
    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    addBook(book) {
        const books = this.getBooks();
        book.id = this.generateId();
        books.push(book);
        this.saveBooks(books);
        return book;
    },

    updateBook(id, updates) {
        const books = this.getBooks();
        const index = books.findIndex(b => b.id === id);
        if (index !== -1) {
            books[index] = { ...books[index], ...updates };
            this.saveBooks(books);
            return books[index];
        }
        return null;
    },

    deleteBook(id) {
        const books = this.getBooks().filter(b => b.id !== id);
        this.saveBooks(books);
    },

    // Users operations
    getUsers() {
        return JSON.parse(localStorage.getItem('users')) || [];
    },

    saveUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },

    addUser(user) {
        const users = this.getUsers();
        user.id = this.generateId();
        users.push(user);
        this.saveUsers(users);
        return user;
    },

    updateUser(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            this.saveUsers(users);
            return users[index];
        }
        return null;
    },

    deleteUser(id) {
        const users = this.getUsers().filter(u => u.id !== id);
        this.saveUsers(users);
    },

    findUser(username, password) {
        const users = this.getUsers();
        return users.find(u => u.username === username && u.password === password);
    },

    // Transactions operations
    getTransactions() {
        return JSON.parse(localStorage.getItem('transactions')) || [];
    },

    saveTransactions(transactions) {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    },

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        transaction.id = this.generateId();
        transactions.push(transaction);
        this.saveTransactions(transactions);
        return transaction;
    },

    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { ...transactions[index], ...updates };
            this.saveTransactions(transactions);
            return transactions[index];
        }
        return null;
    },

    // Bookmark operations
    getBookmarks() {
        return JSON.parse(localStorage.getItem('bookmarks')) || [];
    },

    saveBookmarks(bookmarks) {
        localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    },

    // Add a bookmark for a user and book
    addBookmark(userId, bookId) {
        const bookmarks = this.getBookmarks();
        // Check if bookmark already exists
        const existingIndex = bookmarks.findIndex(b => b.userId === userId && b.bookId === bookId);
        if (existingIndex === -1) {
            const bookmark = {
                id: this.generateId(),
                userId: userId,
                bookId: bookId,
                timestamp: new Date().toISOString()
            };
            bookmarks.push(bookmark);
            this.saveBookmarks(bookmarks);
            return bookmark;
        }
        return null; // Already bookmarked
    },

    // Remove a bookmark for a user and book
    removeBookmark(userId, bookId) {
        const bookmarks = this.getBookmarks();
        const initialLength = bookmarks.length;
        const filteredBookmarks = bookmarks.filter(b => !(b.userId === userId && b.bookId === bookId));
        this.saveBookmarks(filteredBookmarks);
        return filteredBookmarks.length < initialLength; // Return true if a bookmark was removed
    },

    // Get bookmarks for a specific book
    getBookmarksForBook(bookId) {
        return this.getBookmarks().filter(b => b.bookId === bookId);
    },

    // Get bookmarks for a specific user
    getBookmarksForUser(userId) {
        return this.getBookmarks().filter(b => b.userId === userId);
    },

    // Helper methods
    getBookByISBN(isbn) {
        return this.getBooks().find(b => b.isbn === isbn);
    },

    getUserByAdminNumber(adminNumber) {
        return this.getUsers().find(u => u.adminNumber === adminNumber);
    },

    getActiveTransactions() {
        return this.getTransactions().filter(t => t.status === 'active');
    },

    getTransactionsByUser(userId) {
        return this.getTransactions().filter(t => t.userId === userId);
    }
};