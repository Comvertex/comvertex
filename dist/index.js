document.addEventListener('DOMContentLoaded', () => {
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

    // Animation setup
    const logoContainer = document.querySelector('.logo-container');
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');

    const splitText = (element) => {
        const text = element.textContent;
        element.textContent = '';
        return [...text].map(char => {
            const span = document.createElement('span');
            span.className = char === ' ' ? 'letter space' : 'letter';
            span.textContent = char === ' ' ? '\u00A0' : char;
            element.appendChild(span);
            return span;
        });
    };

    const line1Letters = splitText(line1);
    const line2Letters = splitText(line2);

    setTimeout(() => {
        logoContainer.classList.add('active');

        setTimeout(() => {
            line1Letters.forEach((letter, index) => {
                setTimeout(() => {
                    letter.classList.add('active');
                }, index * 50);
            });

            setTimeout(() => {
                line2Letters.forEach((letter, index) => {
                    setTimeout(() => {
                        letter.classList.add('active');
                    }, index * 50);
                });

                setTimeout(() => {
                    blueBanner.classList.add('active');
                    centerContainer.classList.add('shifted');

                    menuItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100);
                    });

                    // Show the consent modal at the same time
                    const consentModal = document.getElementById('consent-modal');
                    if (consentModal) {
                        consentModal.classList.add('show');
                    }
                }, 800);
            }, 1000);
        }, 300);
    }, 500);

    // Cookie consent management
    class CookieConsent {
        constructor() {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.init();
                }, 2000);
            });
        }

        init() {
            try {
                this.modal = document.getElementById('consent-modal');
                this.preferencesDiv = document.getElementById('consent-preferences');
                this.marketingToggle = document.getElementById('marketing-toggle');

                if (!this.modal || !this.preferencesDiv || !this.marketingToggle) {
                    console.warn('Some consent modal elements not found');
                    return;
                }

                document.getElementById('accept-all').addEventListener('click', () => this.handleAcceptAll());
                document.getElementById('manage-preferences').addEventListener('click', () => this.showPreferences());
                document.getElementById('save-preferences').addEventListener('click', () => this.savePreferences());
                document.getElementById('reject-all').addEventListener('click', () => this.handleRejectAll());

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

    new CookieConsent();
}); 