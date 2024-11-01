document.addEventListener('DOMContentLoaded', () => {
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');
    
    // Start typing animation after logo appears
    setTimeout(() => {
        line1.style.opacity = 1;
        line1.style.animation = 'typeWriter 1.5s steps(20) forwards, blinkCursor 0.75s step-end infinite';
        
        // Start second line after first completes
        setTimeout(() => {
            line2.style.opacity = 1;
            line2.style.animation = 'typeWriter 1.5s steps(20) forwards, blinkCursor 0.75s step-end infinite';
            
            // Slide in blue banner and shift content
            setTimeout(() => {
                blueBanner.style.transform = 'translateX(-100%)';
                centerContainer.classList.add('shifted');
                
                // Animate menu items
                setTimeout(() => {
                    menuItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.animation = 'fadeInMenu 1s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                        }, index * 200);
                    });
                }, 2400);
            }, 1000);
        }, 2000);
    }, 2400);
}); 