// Utility Functions
const Utils = {
    // Show success message
    showSuccess(message) {
        // Remove any existing success messages
        const existingMessages = document.querySelectorAll('.success-message');
        existingMessages.forEach(msg => msg.remove());
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        // Add animation class
        setTimeout(() => {
            successDiv.style.animation = 'fadeIn 0.3s ease';
        }, 10);
        
        setTimeout(() => {
            successDiv.style.opacity = '0';
            successDiv.style.transform = 'translateX(100px)';
            setTimeout(() => {
                successDiv.remove();
            }, 300);
        }, 3000);
    },

    // Show error message
    showError(message, elementId) {
        // Default to a general error element if none specified
        const errorElementId = elementId || 'generalError';
        const errorDiv = document.getElementById(errorElementId);
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            
            // Add animation
            errorDiv.style.animation = 'fadeIn 0.3s ease';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorDiv.classList.add('hidden');
            }, 5000);
        } else {
            // If no specific error element, show alert
            alert(message);
        }
    },

    // Format date
    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    },

    // Calculate days until due date
    getDaysUntilDue(dueDate) {
        if (!dueDate) return null;
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    },

    // Generate admin number
    generateAdminNumber(role) {
        const prefix = {
            'admin': 'A',
            'librarian': 'L',
            'teacher': 'T',
            'student': 'S'
        }[role] || 'U';
        const users = DataManager.getUsers();
        const roleUsers = users.filter(u => u.role === role);
        const number = String(roleUsers.length + 1).padStart(4, '0');
        return `${prefix}${number}`;
    },

    // Validate ISBN
    validateISBN(isbn) {
        // Simple validation - can be enhanced
        return isbn.length >= 10;
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};