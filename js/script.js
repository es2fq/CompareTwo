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
        var contentWindow = '.page';
        var navigationBar = '#topnav';
        var newWidth = parseFloat($(navigationBar).css('width')) + offset;
        var newHeight = parseFloat(newWidth, 10) * (14/30); 
        $(contentWindow).css('width', newWidth);
        $(contentWindow).css('height', newHeight);
    }
});
