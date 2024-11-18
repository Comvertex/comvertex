document.addEventListener('DOMContentLoaded', () => {
    const logoContainer = document.querySelector('.logo-container');
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');

    // Modified splitText function to handle word spacing
    const splitText = (element) => {
        const text = element.textContent;
        element.textContent = '';
        return [...text].map(char => {
            const span = document.createElement('span');
            span.className = char === ' ' ? 'letter space' : 'letter';
            span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space for spaces
            element.appendChild(span);
            return span;
        });
    };

    const line1Letters = splitText(line1);
    const line2Letters = splitText(line2);

    // Start animation sequence with faster timing
    setTimeout(() => {
        logoContainer.classList.add('active');

        setTimeout(() => {
            line1Letters.forEach((letter, index) => {
                setTimeout(() => {
                    letter.classList.add('active');
                }, index * 50); // Reduced from 70ms
            });

            setTimeout(() => {
                line2Letters.forEach((letter, index) => {
                    setTimeout(() => {
                        letter.classList.add('active');
                    }, index * 50); // Reduced from 70ms
                });

                setTimeout(() => {
                    blueBanner.classList.add('active');
                    centerContainer.classList.add('shifted');
                    
                    menuItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100); // Reduced from 200ms
                    });
                }, 800); // Reduced delay
            }, 1000); // Reduced delay
        }, 300); // Start sooner
    }, 500);

    // Initialize dataLayer if not already initialized
    window.dataLayer = window.dataLayer || [];

    // Function to update consent status
    function updateConsentStatus(consentType, status) {
        window.dataLayer.push({
            event: 'consent_update',
            consentType: consentType,
            consentStatus: status
        });
    }

    // Event listeners for each consent option
    document.querySelectorAll('.consent-options input').forEach(input => {
        input.addEventListener('change', function() {
            updateConsentStatus(this.parentElement.querySelector('label').innerText, this.checked);
        });
    });

    // Check if consent has already been given
    if (!localStorage.getItem('consentGiven')) {
        document.getElementById('consent-banner').classList.add('show');
    }

    // Allow all button
    document.getElementById('allow-all').addEventListener('click', function() {
        document.querySelectorAll('.consent-options input').forEach(input => {
            input.checked = true;
            updateConsentStatus(input.parentElement.querySelector('label').innerText, true);
        });
        localStorage.setItem('consentGiven', 'all');
        document.getElementById('consent-banner').style.display = 'none';
        // Enable all tracking
    });

    // Only selected button
    document.getElementById('only-selected').addEventListener('click', function() {
        const functional = document.getElementById('functional-consent').checked;
        const statistical = document.getElementById('statistical-consent').checked;
        const marketing = document.getElementById('marketing-consent').checked;

        localStorage.setItem('consentGiven', JSON.stringify({ functional, statistical, marketing }));
        document.getElementById('consent-banner').style.display = 'none';
        // Enable tracking based on selections
    });

    // Deny all button
    document.getElementById('deny-all').addEventListener('click', function() {
        document.querySelectorAll('.consent-options input').forEach(input => {
            input.checked = false;
            updateConsentStatus(input.parentElement.querySelector('label').innerText, false);
        });
        localStorage.setItem('consentGiven', 'none');
        document.getElementById('consent-banner').style.display = 'none';
        // Disable all tracking
    });

    // Separate the cookie consent code completely from other scripts
    const initCookieConsent = () => {
        class CookieConsent {
            constructor() {
                // Wait for DOM to be completely loaded
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        this.init();
                    }, 2000);
                });
            }

            init() {
                try {
                    // Get DOM elements
                    this.modal = document.getElementById('consent-modal');
                    this.preferencesDiv = document.getElementById('consent-preferences');
                    this.marketingToggle = document.getElementById('marketing-toggle');
                    
                    if (!this.modal) {
                        console.error('Consent modal not found');
                        return;
                    }

                    // Bind event listeners
                    document.getElementById('accept-all')?.addEventListener('click', () => this.handleAcceptAll());
                    document.getElementById('manage-preferences')?.addEventListener('click', () => this.showPreferences());
                    document.getElementById('save-preferences')?.addEventListener('click', () => this.savePreferences());
                    document.getElementById('reject-all')?.addEventListener('click', () => this.handleRejectAll());

                    // Check consent status
                    this.checkConsentStatus();
                } catch (error) {
                    console.error('Error initializing cookie consent:', error);
                }
            }

            showPreferences() {
                if (this.preferencesDiv && this.modal) {
                    this.preferencesDiv.style.display = 'block';
                    const manageBtn = document.getElementById('manage-preferences');
                    const saveBtn = document.getElementById('save-preferences');
                    const rejectBtn = document.getElementById('reject-all');
                    
                    if (manageBtn) manageBtn.style.display = 'none';
                    if (saveBtn) saveBtn.style.display = 'inline-block';
                    if (rejectBtn) rejectBtn.style.display = 'none';
                }
            }

            handleAcceptAll() {
                this.setConsent('functional', true);
                this.setConsent('marketing', true);
                this.updateGTMConsent(true);
                this.hideModal();
            }

            handleRejectAll() {
                this.setConsent('functional', true);
                this.setConsent('marketing', false);
                this.updateGTMConsent(false);
                this.hideModal();
            }

            savePreferences() {
                if (this.marketingToggle) {
                    this.setConsent('functional', true);
                    this.setConsent('marketing', this.marketingToggle.checked);
                    this.updateGTMConsent(this.marketingToggle.checked);
                    this.hideModal();
                }
            }

            setConsent(type, value) {
                const expires = new Date();
                expires.setDate(expires.getDate() + 365);
                document.cookie = `site_${type}=${value ? 'allow' : 'deny'}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
            }

            updateGTMConsent(allowed) {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'event': 'consent_update',
                    'consent': {
                        'functionality_storage': 'granted',
                        'analytics_storage': allowed ? 'granted' : 'denied',
                        'ad_storage': allowed ? 'granted' : 'denied',
                        'ad_user_data': allowed ? 'granted' : 'denied',
                        'ad_personalization': allowed ? 'granted' : 'denied'
                    }
                });
            }

            checkConsentStatus() {
                const hasConsent = document.cookie.split(';').some(c => 
                    c.trim().startsWith('site_functional=') || 
                    c.trim().startsWith('site_marketing=')
                );
                
                if (!hasConsent && this.modal) {
                    requestAnimationFrame(() => {
                        this.modal.classList.add('show');
                    });
                }
            }

            hideModal() {
                if (this.modal) {
                    this.modal.classList.remove('show');
                }
            }
        }

        return new CookieConsent();
    };

    // Initialize cookie consent
    initCookieConsent();
});

window.addEventListener('load', function() {
    setTimeout(() => {
        const modal = document.getElementById('consent-modal');
        const acceptAllBtn = document.getElementById('accept-all');
        const managePrefsBtn = document.getElementById('manage-preferences');
        const rejectAllBtn = document.getElementById('reject-all');

        if (!modal) {
            console.error('Modal not found');
            return;
        }

        // Show modal if no consent
        const hasConsent = document.cookie.split(';').some(c => 
            c.trim().startsWith('site_functional=') || 
            c.trim().startsWith('site_marketing=')
        );

        if (!hasConsent) {
            modal.classList.add('show');
        }

        // Safely add event listeners only if elements exist
        if (acceptAllBtn) {
            acceptAllBtn.addEventListener('click', function() {
                const expires = new Date();
                expires.setDate(expires.getDate() + 365);
                document.cookie = `site_functional=allow; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                document.cookie = `site_marketing=allow; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                modal.classList.remove('show');
            });
        }

        if (managePrefsBtn) {
            managePrefsBtn.addEventListener('click', function() {
                document.getElementById('consent-preferences').style.display = 'block';
                managePrefsBtn.style.display = 'none';
                document.getElementById('save-preferences').style.display = 'inline-block';
                rejectAllBtn.style.display = 'none';
            });
        }

        if (rejectAllBtn) {
            rejectAllBtn.addEventListener('click', function() {
                const expires = new Date();
                expires.setDate(expires.getDate() + 365);
                document.cookie = `site_functional=allow; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                document.cookie = `site_marketing=deny; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
                modal.classList.remove('show');
            });
        }
    }, 2000);
}); 