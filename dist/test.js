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
}); 