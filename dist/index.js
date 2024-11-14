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

    // Accept all button
    document.getElementById('accept-all').addEventListener('click', function() {
        document.querySelectorAll('.consent-options input').forEach(input => {
            input.checked = true;
            updateConsentStatus(input.parentElement.querySelector('label').innerText, true);
        });
        document.getElementById('consent-banner').style.display = 'none';
    });

    // Decline all button
    document.getElementById('decline-all').addEventListener('click', function() {
        document.querySelectorAll('.consent-options input').forEach(input => {
            input.checked = false;
            updateConsentStatus(input.parentElement.querySelector('label').innerText, false);
        });
        document.getElementById('consent-banner').style.display = 'none';
    });

    window.onload = function() {
        if (!localStorage.getItem('consentGiven')) {
            document.getElementById('consent-banner').classList.add('show');
        }
    };

    document.getElementById('allow-all').addEventListener('click', function() {
        localStorage.setItem('consentGiven', 'all');
        document.getElementById('consent-banner').style.display = 'none';
        // Enable all tracking
    });

    document.getElementById('only-selected').addEventListener('click', function() {
        const functional = document.getElementById('functional-consent').checked;
        const statistical = document.getElementById('statistical-consent').checked;
        const marketing = document.getElementById('marketing-consent').checked;

        localStorage.setItem('consentGiven', JSON.stringify({ functional, statistical, marketing }));
        document.getElementById('consent-banner').style.display = 'none';
        // Enable tracking based on selections
    });

    document.getElementById('deny-all').addEventListener('click', function() {
        localStorage.setItem('consentGiven', 'none');
        document.getElementById('consent-banner').style.display = 'none';
        // Disable all tracking
    });
}); 