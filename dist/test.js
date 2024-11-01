document.addEventListener('DOMContentLoaded', () => {
    // Debug logs to ensure script is running
    console.log('Script initialized');
    
    const centerContainer = document.querySelector('.center-container');
    const blueBanner = document.querySelector('.blue-banner');
    const line1 = document.querySelector('.line1');
    const line2 = document.querySelector('.line2');
    const menuItems = document.querySelectorAll('.menu li');
    
    // Debug logs to check if elements are found
    console.log('Elements found:', {
        centerContainer: !!centerContainer,
        blueBanner: !!blueBanner,
        line1: !!line1,
        line2: !!line2,
        menuItems: menuItems.length
    });

    // First ensure the script tag is properly loaded in test.html
    // Add this to test.html before closing body tag:
}); 