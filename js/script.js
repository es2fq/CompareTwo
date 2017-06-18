$(document).ready(function() {
    var pageSelector = '#pages > div';
    var menuSelector = '#topnav ul li';
    $(menuSelector).on('click', function() {
        $(menuSelector).removeClass('active');
        $(this).addClass('active');

        var pageId = "#page" + ($(this).index() + 1);
        $(pageSelector).removeClass('active');
        $(pageId).addClass('active');
    });

    var offset = 9;
    resizeImageWindow();
    offset = -6;

    $(window).on('resize', resizeImageWindow);

    function resizeImageWindow() {
        console.log("resize");
        var imageWindow = '#page1';
        var navigationBar = '#topnav';
        var newWidth = parseFloat($(navigationBar).css('width')) + offset;
        var newHeight = parseFloat(newWidth, 10) * (14/30); 
        $(imageWindow).css('width', newWidth);
        $(imageWindow).css('height', newHeight);
    }
});
