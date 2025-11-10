// Admin Dashboard Module
const AdminDashboard = {
    passwordVisibility: {},

    init() {
        this.setupEventListeners();
        this.loadOverview();
        this.initIssueReturn();
    },

    initIssueReturn() {
        // Set default issue date to today
        const today = new Date().toISOString().split('T')[0];
        const issueDateInput = document.getElementById('adminIssueDate');
        if (issueDateInput) {
            issueDateInput.value = today;
        }
        // Set default return days to 4
        const returnDaysInput = document.getElementById('adminReturnDays');
        if (returnDaysInput && !returnDaysInput.value) {
            returnDaysInput.value = 4;
        }
    },

    setupEventListeners() {
        document.getElementById('addBookForm')?.addEventListener('submit', (e) => this.handleAddBook(e));
        document.getElementById('addUserForm')?.addEventListener('submit', (e) => this.handleAddUser(e));
        document.getElementById('userRole')?.addEventListener('change', () => this.toggleClassField());
        document.getElementById('adminIssueBookForm')?.addEventListener('submit', (e) => this.handleIssueBook(e));
        document.getElementById('adminReturnBookForm')?.addEventListener('submit', (e) => this.handleReturnBook(e));
        document.getElementById('adminSearchBookISBN')?.addEventListener('input', Utils.debounce(() => this.searchBook(), 300));
        document.getElementById('adminSearchUserAdmin')?.addEventListener('input', Utils.debounce(() => this.searchUser(), 300));
        document.getElementById('adminReturnBookISBN')?.addEventListener('input', Utils.debounce(() => this.searchReturnBook(), 300));
        document.getElementById('adminCatalogSearch')?.addEventListener('input', Utils.debounce(() => this.filterCatalog(), 300));
        document.getElementById('adminCatalogCategory')?.addEventListener('change', () => this.filterCatalog());
        
        // User CSV Event Listeners
        document.getElementById('importUsersCsvBtn')?.addEventListener('click', () => this.importUsersCsv());
        document.getElementById('downloadUsersCsvBtn')?.addEventListener('click', () => this.downloadAllUsersCsv());
        document.getElementById('csvUserFile')?.addEventListener('change', () => this.handleUserFileSelect());
    },

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('#adminDashboard .tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');

        // Show/hide tab content
        document.querySelectorAll('#adminDashboard .tab-content').forEach(content => content.classList.add('hidden'));
        const tabContent = document.getElementById(`tab-${tabName}`);
        if (tabContent) {
            tabContent.classList.remove('hidden');
        }

        // Refresh data
        if (tabName === 'overview') this.loadOverview();
        if (tabName === 'books') this.loadBooks();
        if (tabName === 'users') this.loadUsers();
        if (tabName === 'transactions') this.loadTransactions();
        if (tabName === 'issue-return') {
            this.initIssueReturn();
            this.loadActiveIssues();
        }
        if (tabName === 'catalog') this.loadCatalog();
        if (tabName === 'bookmarks') this.loadBookmarks(); // New bookmarks tab
    },

    loadOverview() {
        const books = DataManager.getBooks();
        const users = DataManager.getUsers();
        const transactions = DataManager.getTransactions();
        const activeTransactions = transactions.filter(t => t.status === 'active');

        document.getElementById('totalBooks').textContent = books.length;
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('activeIssues').textContent = activeTransactions.length;
        document.getElementById('availableBooks').textContent = books.reduce((sum, b) => sum + b.availableCopies, 0);
    },

    handleAddBook(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        // Check if in edit mode
        if (submitBtn.dataset.editing === 'true' && this.editingBookId) {
            this.updateBook(this.editingBookId);
            return;
        }

        const book = {
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            isbn: document.getElementById('bookISBN').value,
            category: document.getElementById('bookCategory').value,
            totalCopies: parseInt(document.getElementById('bookCopies').value),
            availableCopies: parseInt(document.getElementById('bookCopies').value)
        };

        DataManager.addBook(book);
        Utils.showSuccess('Book added successfully!');
        this.loadBooks();
        this.loadOverview();
        document.getElementById('addBookForm').reset();
    },

    loadBooks() {
        const books = DataManager.getBooks();
        const tbody = document.getElementById('booksTableBody');
        if (!tbody) return;

        if (books.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No books found</td></tr>';
            return;
        }

        tbody.innerHTML = books.map(book => `
            <tr>
                <td>${book.title}</td>
                <td>${book.author}</td>
                <td>${book.isbn}</td>
                <td><span class="badge badge-blue">${book.category}</span></td>
                <td>${book.availableCopies}</td>
                <td>${book.totalCopies}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="AdminDashboard.editBook('${book.id}')" style="margin-right: 0.5rem;">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="AdminDashboard.deleteBook('${book.id}')">Delete</button>
                </td>
            </tr>
        `).join('');
    },

    editingBookId: null,

    editBook(id) {
        const book = DataManager.getBooks().find(b => b.id === id);
        if (!book) return;

        this.editingBookId = id;

        // Populate form with book data
        document.getElementById('bookTitle').value = book.title;
        document.getElementById('bookAuthor').value = book.author;
        document.getElementById('bookISBN').value = book.isbn;
        document.getElementById('bookCategory').value = book.category;
        document.getElementById('bookCopies').value = book.totalCopies;

        // Change form to edit mode
        const form = document.getElementById('addBookForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Update Book';
        submitBtn.dataset.editing = 'true';

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    },

    updateBook(id) {
        const book = {
            title: document.getElementById('bookTitle').value,
            author: document.getElementById('bookAuthor').value,
            isbn: document.getElementById('bookISBN').value,
            category: document.getElementById('bookCategory').value,
            totalCopies: parseInt(document.getElementById('bookCopies').value)
        };

        const existingBook = DataManager.getBooks().find(b => b.id === id);
        if (existingBook) {
            // Preserve available copies, adjust if total copies changed
            const copiesDifference = book.totalCopies - existingBook.totalCopies;
            book.availableCopies = Math.max(0, existingBook.availableCopies + copiesDifference);
        } else {
            book.availableCopies = book.totalCopies;
        }

        DataManager.updateBook(id, book);
        Utils.showSuccess('Book updated successfully!');
        this.loadBooks();
        this.loadOverview();

        // Reset form
        document.getElementById('addBookForm').reset();
        const submitBtn = document.querySelector('#addBookForm button[type="submit"]');
        submitBtn.textContent = 'Add Book';
        submitBtn.dataset.editing = 'false';
        this.editingBookId = null;
    },

    deleteBook(id) {
        if (confirm('Are you sure you want to delete this book?')) {
            DataManager.deleteBook(id);
            Utils.showSuccess('Book deleted successfully!');
            this.loadBooks();
            this.loadOverview();
        }
    },

    toggleClassField() {
        const role = document.getElementById('userRole').value;
        const classField = document.getElementById('classFieldContainer');
        const classInput = document.getElementById('userClass');
        
        if (role === 'student') {
            classField.classList.remove('hidden');
            classInput.required = true;
        } else {
            classField.classList.add('hidden');
            classInput.required = false;
            classInput.value = '';
        }
    },

    editingUserId: null,

    handleAddUser(e) {
        e.preventDefault();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        // Check if in edit mode
        if (submitBtn.dataset.editing === 'true' && this.editingUserId) {
            this.updateUser(this.editingUserId);
            return;
        }

        const role = document.getElementById('userRole').value;
        const adminNumber = document.getElementById('userAdminNumber').value || Utils.generateAdminNumber(role);
        
        const user = {
            fullName: document.getElementById('userFullName').value,
            username: document.getElementById('userUsername').value,
            password: document.getElementById('userPassword').value,
            role: role,
            adminNumber: adminNumber,
            class: role === 'student' ? document.getElementById('userClass').value : ''
        };

        DataManager.addUser(user);
        Utils.showSuccess('User added successfully!');
        this.loadUsers();
        this.loadOverview();
        document.getElementById('addUserForm').reset();
        document.getElementById('classFieldContainer').classList.add('hidden');
    },

    loadUsers() {
        const users = DataManager.getUsers();
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No users found</td></tr>';
            return;
        }

        tbody.innerHTML = users.map(user => {
            const userId = user.id;
            const isVisible = this.passwordVisibility[userId] || false;
            return `
                <tr>
                    <td>${user.fullName}</td>
                    <td>${user.username}</td>
                    <td>
                        <span id="password-${userId}">${isVisible ? user.password : '••••••••'}</span>
                        <span class="password-toggle" onclick="AdminDashboard.togglePassword('${userId}')">
                            ${isVisible ? 'Hide' : 'Show'}
                        </span>
                    </td>
                    <td><span class="badge badge-blue">${user.role}</span></td>
                    <td>${user.adminNumber}</td>
                    <td>${user.class || '-'}</td>
                    <td>
                        <button class="btn btn-primary btn-sm" onclick="AdminDashboard.editUser('${user.id}')" style="margin-right: 0.5rem;">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="AdminDashboard.deleteUser('${user.id}')">Delete</button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    togglePassword(userId) {
        this.passwordVisibility[userId] = !this.passwordVisibility[userId];
        this.loadUsers();
    },

    editUser(id) {
        const user = DataManager.getUsers().find(u => u.id === id);
        if (!user) return;

        this.editingUserId = id;

        // Populate form with user data
        document.getElementById('userFullName').value = user.fullName;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userPassword').value = user.password;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userAdminNumber').value = user.adminNumber;
        if (user.role === 'student') {
            document.getElementById('userClass').value = user.class || '';
            this.toggleClassField();
        }

        // Change form to edit mode
        const form = document.getElementById('addUserForm');
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Update User';
        submitBtn.dataset.editing = 'true';

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
    },

    updateUser(id) {
        const role = document.getElementById('userRole').value;
        const user = {
            fullName: document.getElementById('userFullName').value,
            username: document.getElementById('userUsername').value,
            password: document.getElementById('userPassword').value,
            role: role,
            adminNumber: document.getElementById('userAdminNumber').value,
            class: role === 'student' ? document.getElementById('userClass').value : ''
        };

        DataManager.updateUser(id, user);
        Utils.showSuccess('User updated successfully!');
        this.loadUsers();
        this.loadOverview();

        // Reset form
        document.getElementById('addUserForm').reset();
        document.getElementById('classFieldContainer').classList.add('hidden');
        const submitBtn = document.querySelector('#addUserForm button[type="submit"]');
        submitBtn.textContent = 'Add User';
        submitBtn.dataset.editing = 'false';
        this.editingUserId = null;
    },

    deleteUser(id) {
        if (confirm('Are you sure you want to delete this user?')) {
            DataManager.deleteUser(id);
            Utils.showSuccess('User deleted successfully!');
            this.loadUsers();
            this.loadOverview();
        }
    },

    // User CSV Handling Functions
    handleUserFileSelect() {
        // Enable import button when file is selected
        const fileInput = document.getElementById('csvUserFile');
        const importBtn = document.getElementById('importUsersCsvBtn');
        
        if (fileInput.files.length > 0) {
            importBtn.disabled = false;
        } else {
            importBtn.disabled = true;
        }
    },

    importUsersCsv() {
        const fileInput = document.getElementById('csvUserFile');
        const file = fileInput.files[0];
        
        if (!file) {
            Utils.showError('Please select a CSV file first.', 'adminCsvError');
            return;
        }
        
        // Check file type
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            Utils.showError('Please select a valid CSV file.', 'adminCsvError');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                this.parseAndImportUsersCsv(content);
            } catch (error) {
                Utils.showError('Error reading CSV file: ' + error.message, 'adminCsvError');
            }
        };
        reader.onerror = () => {
            Utils.showError('Error reading file. Please try again.', 'adminCsvError');
        };
        reader.readAsText(file);
    },

    parseAndImportUsersCsv(content) {
        const lines = content.split('\n');
        let importedCount = 0;
        
        if (lines.length < 2) {
            Utils.showError('CSV file is empty or invalid', 'adminCsvError');
            return;
        }
        
        // Process each line (skip header)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                // Handle quoted fields that might contain commas
                const values = this.parseCsvLine(line);
                if (values.length >= 6) {
                    // Generate admin number if not provided
                    let adminNumber = values[4].trim().replace(/^"(.*)"$/, '$1');
                    if (!adminNumber) {
                        adminNumber = Utils.generateAdminNumber(values[3].trim().replace(/^"(.*)"$/, '$1'));
                    }
                    
                    const userObj = {
                        fullName: values[0].trim().replace(/^"(.*)"$/, '$1'),
                        username: values[1].trim().replace(/^"(.*)"$/, '$1'),
                        password: values[2].trim().replace(/^"(.*)"$/, '$1'),
                        role: values[3].trim().replace(/^"(.*)"$/, '$1'),
                        adminNumber: adminNumber,
                        class: values[5].trim().replace(/^"(.*)"$/, '$1')
                    };
                    
                    DataManager.addUser(userObj);
                    importedCount++;
                }
            }
        }
        
        Utils.showSuccess(`Successfully imported ${importedCount} users from CSV!`);
        
        // Reset file input
        document.getElementById('csvUserFile').value = '';
        document.getElementById('importUsersCsvBtn').disabled = true;
        
        // Refresh users list and overview
        this.loadUsers();
        this.loadOverview();
    },

    // Helper function to parse CSV line with quoted fields
    parseCsvLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    },

    downloadAllUsersCsv() {
        const users = DataManager.getUsers();
        
        if (users.length === 0) {
            Utils.showError('No users in system to export', 'adminCsvError');
            return;
        }
        
        // Create CSV content
        let csvContent = 'FullName,Username,Password,Role,AdminNumber,Class\n';
        
        users.forEach(user => {
            // Escape quotes and wrap fields in quotes if they contain commas
            const escapedFullName = this.escapeCsvField(user.fullName);
            const escapedUsername = this.escapeCsvField(user.username);
            const escapedPassword = this.escapeCsvField(user.password);
            const escapedRole = this.escapeCsvField(user.role);
            const escapedAdminNumber = this.escapeCsvField(user.adminNumber);
            const escapedClass = this.escapeCsvField(user.class || '');
            
            csvContent += `${escapedFullName},${escapedUsername},${escapedPassword},${escapedRole},${escapedAdminNumber},${escapedClass}\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'library_users.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Utils.showSuccess(`CSV file with ${users.length} users downloaded successfully!`);
    },

    // Helper function to escape CSV fields
    escapeCsvField(field) {
        if (field.includes(',') || field.includes('"')) {
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    },

    // Helper function to escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    loadTransactions() {
        const transactions = DataManager.getTransactions();
        const tbody = document.getElementById('transactionsTableBody');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No transactions found</td></tr>';
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
                    <td>
                        ${trans.status === 'active' ? 
                            `<button class="btn btn-success btn-sm" onclick="AdminDashboard.forceReturnTransaction('${trans.id}')">Force Return</button>` : 
                            `<button class="btn btn-danger btn-sm" onclick="AdminDashboard.deleteTransaction('${trans.id}')">Delete</button>`
                        }
                    </td>
                </tr>
            `;
        }).join('');
    },

    // Issue/Return functionality (same as librarian)
    searchBook() {
        const isbn = document.getElementById('adminSearchBookISBN').value.trim();
        const bookInfo = document.getElementById('adminBookInfo');
        
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
        const adminNumber = document.getElementById('adminSearchUserAdmin').value.trim();
        const userInfo = document.getElementById('adminUserInfo');
        
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
        const isbn = document.getElementById('adminSearchBookISBN').value.trim();
        const adminNumber = document.getElementById('adminSearchUserAdmin').value.trim();
        const issueDate = document.getElementById('adminIssueDate').value;
        const returnDays = parseInt(document.getElementById('adminReturnDays').value);

        if (!isbn || !adminNumber || !issueDate || !returnDays || returnDays < 1) {
            Utils.showError('Please fill all fields correctly. Return days must be at least 1.', 'adminIssueError');
            return;
        }

        const book = DataManager.getBookByISBN(isbn);
        const user = DataManager.getUserByAdminNumber(adminNumber);

        if (!book) {
            Utils.showError('Book not found', 'adminIssueError');
            return;
        }

        if (!user) {
            Utils.showError('User not found', 'adminIssueError');
            return;
        }

        if (book.availableCopies <= 0) {
            Utils.showError('No copies available', 'adminIssueError');
            return;
        }

        if (user.role !== 'student' && user.role !== 'teacher') {
            Utils.showError('Only students and teachers can borrow books', 'adminIssueError');
            return;
        }

        // Calculate due date based on return days
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
        this.loadActiveIssues();
        this.loadOverview();
        this.loadTransactions();
        document.getElementById('adminIssueBookForm').reset();
        // Reset to defaults
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('adminIssueDate').value = today;
        document.getElementById('adminReturnDays').value = 7;
        document.getElementById('adminBookInfo').classList.add('hidden');
        document.getElementById('adminUserInfo').classList.add('hidden');
    },

    searchReturnBook() {
        const isbn = document.getElementById('adminReturnBookISBN').value.trim();
        const returnInfo = document.getElementById('adminReturnInfo');
        
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
        const isbn = document.getElementById('adminReturnBookISBN').value.trim();

        if (!isbn) {
            Utils.showError('Please enter ISBN', 'adminReturnError');
            return;
        }

        const book = DataManager.getBookByISBN(isbn);
        if (!book) {
            Utils.showError('Book not found', 'adminReturnError');
            return;
        }

        const activeTransactions = DataManager.getActiveTransactions();
        const transaction = activeTransactions.find(t => t.bookId === book.id);

        if (!transaction) {
            Utils.showError('No active issue found for this book', 'adminReturnError');
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
        this.loadActiveIssues();
        this.loadOverview();
        this.loadTransactions();
        document.getElementById('adminReturnBookForm').reset();
        document.getElementById('adminReturnInfo').classList.add('hidden');
    },

    loadActiveIssues() {
        const activeTransactions = DataManager.getActiveTransactions();
        const books = DataManager.getBooks();
        const container = document.getElementById('adminActiveIssuesList');
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
                    <div class="actions" style="margin-top: 0.5rem;">
                        <button class="btn btn-success btn-sm" onclick="AdminDashboard.forceReturnTransaction('${trans.id}')">Force Return</button>
                    </div>
                </div>
            `;
        }).join('');
    },

    forceReturnTransaction(transactionId) {
        const transaction = DataManager.getTransactions().find(t => t.id === transactionId);
        if (!transaction) return;

        if (confirm('Force return this book?')) {
            const book = DataManager.getBooks().find(b => b.id === transaction.bookId);
            if (book) {
                DataManager.updateBook(book.id, {
                    availableCopies: book.availableCopies + 1
                });
            }

            DataManager.updateTransaction(transactionId, {
                returnDate: new Date().toISOString().split('T')[0],
                status: 'completed',
                type: 'return'
            });

            Utils.showSuccess('Book returned successfully');
            this.loadActiveIssues();
            this.loadOverview();
            this.loadTransactions();
        }
    },

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const transactions = DataManager.getTransactions().filter(t => t.id !== id);
            DataManager.saveTransactions(transactions);
            Utils.showSuccess('Transaction deleted successfully!');
            this.loadTransactions();
        }
    },

    // Catalog functionality
    filterCatalog() {
        const searchTerm = (document.getElementById('adminCatalogSearch')?.value || '').toLowerCase();
        const category = document.getElementById('adminCatalogCategory')?.value || 'all';
        const books = DataManager.getBooks();
        const container = document.getElementById('adminCatalogList');
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
                        <p><strong>Issued to:</strong> ${issuedTo ? `${issuedTo.fullName} (${issuedTo.adminNumber})` : 'Unknown User'}</p>
                    ` : `
                        <p><strong>Status:</strong> <span class="badge badge-green">Available</span></p>
                    `}
                    <div class="actions">
                        <button class="btn btn-primary btn-sm" onclick="AdminDashboard.editBook('${book.id}')">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="AdminDashboard.deleteBook('${book.id}')">Delete</button>
                        <button class="btn ${isBookmarked ? 'btn-warning' : 'btn-secondary'} btn-sm" 
                                onclick="AdminDashboard.toggleBookmark('${book.id}')">
                            ${isBookmarked ? 'Unbookmark' : 'Bookmark'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Update category filter
        const categories = ['all', ...new Set(books.map(b => b.category))];
        const categorySelect = document.getElementById('adminCatalogCategory');
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
    },

    // Load bookmarks for admin view (shows who bookmarked what)
    loadBookmarks() {
        const bookmarks = DataManager.getBookmarks();
        const books = DataManager.getBooks();
        const users = DataManager.getUsers();
        const container = document.getElementById('adminBookmarksList');
        
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
