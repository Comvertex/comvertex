document.addEventListener('DOMContentLoaded', () => {
    const logoContainer = document.querySelector('.logo-container');
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');
    const consentBanner = document.getElementById('consent-banner');
    const acceptAllButton = document.getElementById('accept-all');
    const viewPreferencesButton = document.getElementById('view-preferences');
    const savePreferencesButton = document.getElementById('save-preferences');
    const preferencesSection = document.getElementById('preferences-section');
    const continueWithoutAcceptingButton = document.getElementById('continue-without-accepting');

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
        logoContainer?.classList.add('active');

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
                    blueBanner?.classList.add('active');
                    centerContainer?.classList.add('shifted');

                    menuItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }, 800);
            }, 1000);
        }, 300);
    }, 500);

    setTimeout(() => {
        consentBanner.classList.add('visible');
    }, 5000);

    acceptAllButton.addEventListener('click', () => {
        document.cookie = "cmplz_functional=allow; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT";
        document.cookie = "cmplz_marketing=allow; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT";
        consentBanner.style.display = 'none';
    });

    viewPreferencesButton.addEventListener('click', () => {
        preferencesSection.classList.toggle('visible');
        acceptAllButton.style.display = 'none';
        viewPreferencesButton.style.display = 'none';
        continueWithoutAcceptingButton.style.display = 'none';
    });

    savePreferencesButton.addEventListener('click', () => {
        const functionalConsent = document.getElementById('functional-consent').checked ? 'allow' : 'deny';
        const marketingConsent = document.getElementById('marketing-consent').checked ? 'allow' : 'deny';

        document.cookie = `cmplz_functional=${functionalConsent}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
        document.cookie = `cmplz_marketing=${marketingConsent}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;

        consentBanner.style.display = 'none';
    });

    continueWithoutAcceptingButton.addEventListener('click', () => {
        consentBanner.style.display = 'none';
    });
});