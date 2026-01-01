// ================================
// Ventry Website JavaScript
// ================================

document.addEventListener('DOMContentLoaded', function() {
    
    // Elements
    const form = document.getElementById('waitlistForm');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const emailInput = document.getElementById('emailInput');
    const submitBtn = form.querySelector('button[type="submit"]');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    // ================================
    // Google Sheets Configuration
    // ================================
    // הוראות: 
    // 1. צור Google Sheet חדש
    // 2. לך ל- Extensions > Apps Script
    // 3. העתק את הקוד מהקובץ google-sheets-script.js
    // 4. פרסם את הסקריפט כ-Web App
    // 5. העתק את ה-URL לכאן:
    
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjC2MSB6KsO4KIVZBcLzVy_AIs41dqsS7KY1F-L1vQWDkVSTJrk9qMi4oT1o1-ViKplg/exec';
    
    // אם אין לך עדיין Google Script, הנתונים יישמרו ב-LocalStorage
    const USE_GOOGLE_SHEETS = GOOGLE_SCRIPT_URL !== 'YOUR_GOOGLE_SCRIPT_URL_HERE';
    
    // ================================
    // Form Submission
    // ================================
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        
        // Validation
        if (!email || !isValidEmail(email)) {
            showError('אנא הזן כתובת מייל תקינה');
            return;
        }
        
        // Check if already submitted
        if (isEmailAlreadySubmitted(email)) {
            showError('המייל כבר נרשם לרשימת ההמתנה');
            return;
        }
        
        // Show loading state
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>שולח...';
        submitBtn.disabled = true;
        
        try {
            if (USE_GOOGLE_SHEETS) {
                // Send to Google Sheets
                await sendToGoogleSheets(email);
            } else {
                // Save locally
                saveToLocalStorage(email);
            }
            
            // Success!
            showSuccess();
            saveEmailToSubmitted(email);
            
            // Track event (optional - for analytics)
            trackEvent('waitlist_signup', { email: email });
            
        } catch (error) {
            console.error('Error:', error);
            showError('אופס! משהו השתבש. אנא נסה שוב מאוחר יותר.');
            
            // Fallback to localStorage
            saveToLocalStorage(email);
            showSuccess();
            
        } finally {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });
    
    // ================================
    // Send to Google Sheets
    // ================================
    async function sendToGoogleSheets(email) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('timestamp', new Date().toISOString());
        formData.append('source', 'website');
        
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        return response.json();
    }
    
    // ================================
    // LocalStorage Functions
    // ================================
    function saveToLocalStorage(email) {
        const waitlist = JSON.parse(localStorage.getItem('ventryWaitlist') || '[]');
        waitlist.push({
            email: email,
            timestamp: new Date().toISOString(),
            source: 'website'
        });
        localStorage.setItem('ventryWaitlist', JSON.stringify(waitlist));
    }
    
    function saveEmailToSubmitted(email) {
        const submitted = JSON.parse(localStorage.getItem('ventrySubmitted') || '[]');
        submitted.push(email);
        localStorage.setItem('ventrySubmitted', JSON.stringify(submitted));
    }
    
    function isEmailAlreadySubmitted(email) {
        const submitted = JSON.parse(localStorage.getItem('ventrySubmitted') || '[]');
        return submitted.includes(email);
    }
    
    // ================================
    // UI Functions
    // ================================
    function showSuccess() {
        form.classList.add('d-none');
        successMessage.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        
        // Scroll to message
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        successMessage.classList.add('d-none');
        
        // Hide after 5 seconds
        setTimeout(() => {
            errorMessage.classList.add('d-none');
        }, 5000);
    }
    
    // ================================
    // Email Validation
    // ================================
    function isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    // ================================
    // Scroll to Top Button
    // ================================
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.classList.add('show');
        } else {
            scrollToTopBtn.classList.remove('show');
        }
    });
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // ================================
    // Smooth Scrolling for Nav Links
    // ================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
    
    // ================================
    // Analytics Tracking (Optional)
    // ================================
    function trackEvent(eventName, data) {
        // כאן תוכל להוסיף Google Analytics או כל מערכת אנליטיקס אחרת
        console.log('Event tracked:', eventName, data);
        
        // Example for Google Analytics 4:
        // if (typeof gtag !== 'undefined') {
        //     gtag('event', eventName, data);
        // }
    }
    
    // ================================
    // Admin Panel (for debugging)
    // ================================
    // הוסף ?admin=true בסוף ה-URL כדי לראות את הנתונים השמורים
    if (window.location.search.includes('admin=true')) {
        console.log('=== Ventry Admin Panel ===');
        const waitlist = JSON.parse(localStorage.getItem('ventryWaitlist') || '[]');
        console.log('Total signups:', waitlist.length);
        console.table(waitlist);
    }
    
    // ================================
    // Animation on Scroll
    // ================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards
    document.querySelectorAll('.card, .benefit-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease';
        observer.observe(card);
    });
    
});

// ================================
// Export Data Function (for admin use)
// ================================
function exportWaitlistData() {
    const waitlist = JSON.parse(localStorage.getItem('ventryWaitlist') || '[]');
    
    if (waitlist.length === 0) {
        alert('אין נתונים לייצא');
        return;
    }
    
    // Convert to CSV
    let csv = 'Email,Timestamp,Source\n';
    waitlist.forEach(item => {
        csv += `${item.email},${item.timestamp},${item.source}\n`;
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventry-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Make it available in console
window.exportWaitlistData = exportWaitlistData;