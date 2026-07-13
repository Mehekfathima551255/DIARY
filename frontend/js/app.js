// Main Application Logic
class App {
    constructor() {
        this.currentView = 'dashboard';
        this.views = {
            dashboard: window.DashboardView,
            editor: window.EditorView,
            insights: window.InsightsView,
            memories: window.DashboardView // Placeholder for memories list view for now
        };
        // Wait for all scripts to load classes onto window
        setTimeout(() => this.init(), 0);
    }

    init() {
        this.setupNavigation();
        this.loadView(this.currentView);
        console.log("Smart Diary initialized.");
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.getAttribute('data-view');
                if (view && this.views[view]) {
                    // Update active class
                    navLinks.forEach(l => l.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    
                    // Load view
                    this.loadView(view);
                }
            });
        });
    }

    loadView(viewName) {
        const container = document.getElementById('view-container');
        const pageTitle = document.getElementById('page-title');
        
        // Update Title
        pageTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
        
        // Clear current view
        container.innerHTML = '';
        
        // Render new view
        const ViewClass = this.views[viewName];
        if (ViewClass) {
            const viewInstance = new ViewClass(container);
            viewInstance.render();
        } else {
            container.innerHTML = `<div class="card"><p>View "${viewName}" not loaded or found.</p></div>`;
        }
    }
}

// Initialize App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
