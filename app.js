// Main Application Module
const App = {
    currentUser: null,

    init() {
        DataManager.init();
        this.setupEventListeners();
        this.checkAuth();
    },

    setupEventListeners() {
        document.getElementById('loginForm')?.addEventListener('submit', (e) => this.handleLogin(e));
    },

    checkAuth() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        } else {
            this.showLogin();
        }
    },

    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        const user = DataManager.findUser(username, password);
        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.showDashboard();
        } else {
            Utils.showError('Invalid username or password', 'loginError');
        }
    },

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showLogin();
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    },

    showLogin() {
        document.getElementById('loginPage').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    showDashboard() {
        document.getElementById('loginPage').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        // Hide all dashboards
        document.querySelectorAll('.dashboard').forEach(dash => dash.classList.add('hidden'));

        // Show appropriate dashboard
        switch(this.currentUser.role) {
            case 'admin':
                document.getElementById('adminDashboard').classList.remove('hidden');
                AdminDashboard.init();
                break;
            case 'librarian':
                document.getElementById('librarianDashboard').classList.remove('hidden');
                LibrarianDashboard.init();
                break;
            case 'teacher':
                document.getElementById('teacherDashboard').classList.remove('hidden');
                TeacherDashboard.init();
                break;
            case 'student':
                document.getElementById('studentDashboard').classList.remove('hidden');
                StudentDashboard.init();
                break;
        }

        // Update header
        const roleName = this.currentUser.role.charAt(0).toUpperCase() + this.currentUser.role.slice(1);
        document.getElementById('dashboardTitle').textContent = `${roleName} Dashboard`;
        document.getElementById('userName').textContent = this.currentUser.fullName;
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

