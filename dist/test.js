document.addEventListener('DOMContentLoaded', () => {
    console.log('Script initialized');
    
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');
    
    line1.style.opacity = '0';
    line2.style.opacity = '0';
    blueBanner.style.transform = 'translateX(0)';
    
    setTimeout(() => {
        line1.style.opacity = '1';
        line1.classList.add('active');
        
        setTimeout(() => {
            line2.style.opacity = '1';
            line2.classList.add('active');
            
            setTimeout(() => {
                blueBanner.classList.add('active');
                centerContainer.classList.add('shifted');
                
                menuItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateX(0)';
                    }, index * 200);
                });
            }, 1000);
        }, 1200);
    }, 1800);
}); 