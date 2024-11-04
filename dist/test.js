document.addEventListener('DOMContentLoaded', () => {
    const logoContainer = document.querySelector('.logo-container');
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');
    const video1 = document.getElementById('video1');
    const video2 = document.getElementById('video2');

    // Ensure video1 is visible on load
    video1.style.opacity = 1;

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

    // Video crossfade logic
    video1.addEventListener('play', () => {
        setTimeout(() => {
            video2.currentTime = 0;
            video2.play();
            video2.style.opacity = 1;
        }, video1.duration * 1000 - 5000); // Start 5 seconds before video1 ends
    });

    video2.addEventListener('ended', () => {
        video1.currentTime = 0;
        video1.play();
        setTimeout(() => {
            video1.style.opacity = 1;
            video2.style.opacity = 0;
        }, 5000); // Smooth transition back to video1
    });

    // Ensure video2 fades out over 5 seconds
    video2.addEventListener('timeupdate', () => {
        if (video2.currentTime >= video2.duration - 5) {
            video2.style.opacity = 1 - (video2.currentTime - (video2.duration - 5)) / 5;
        }
    });
});