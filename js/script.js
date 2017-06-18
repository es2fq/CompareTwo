$(document).ready(function() {
    var menuSelector = '#topnav ul li';
    $(menuSelector).on('click', function() {
        $(menuSelector).removeClass('active');
        $(this).addClass('active');
    });

    resizeImageWindow();
    window.onresize = resizeImageWindow;

    function resizeImageWindow() {
        var imageWindow = '#page1';
        var width = $(imageWindow).css('width');
        var newHeight = parseFloat(width, 10) * (2/3); 
        $(imageWindow).css('height', newHeight);
    }
});
