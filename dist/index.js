document.addEventListener('DOMContentLoaded', () => {
    const logoContainer = document.querySelector('.logo-container');
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');
    
    // Start with logo animation
    setTimeout(() => {
        logoContainer.classList.add('active');
        
        // Then animate first line
        setTimeout(() => {
            line1.style.opacity = '1';
            line1.classList.add('active');
            
            // Then animate second line
            setTimeout(() => {
                line2.style.opacity = '1';
                line2.classList.add('active');
                
                // Finally animate blue banner and menu
                setTimeout(() => {
                    blueBanner.classList.add('active');
                    centerContainer.classList.add('shifted');
                    
                    menuItems.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 200);
                    });
                }, 1000);
            }, 1200);
        }, 1200);
    }, 500);
}); 