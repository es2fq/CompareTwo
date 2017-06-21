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
        var contentWindow = '.page';
        var navigationBar = '#topnav';
        var newWidth = parseFloat($(navigationBar).css('width')) + offset;
        var newHeight = parseFloat(newWidth, 10) * (14/30); 
        $(contentWindow).css('width', newWidth);
        $(contentWindow).css('height', newHeight);
    }

    var leftImport = $('#page2 #left');
    var rightImport = $('#page2 #right');

    var leftImage = $('#page2 #left #image1');
    var leftViewportDim = parseFloat(leftImage.css('width')) / 2;
    var rightImage = $('#page2 #right #image2');
    var rightViewportDim = parseFloat(rightImage.css('width')) / 2;

    var importButton1 = $('#importImg1');
    var importButton2 = $('#importImg2');

    // var leftCrop = leftImage.croppie({
    //     viewport: {
    //         width: leftViewportDim,
    //         height: leftViewportDim,
    //     }
    // });
    // var rightCrop = rightImage.croppie({
    //     viewport: {
    //         width: rightViewportDim,
    //         height: rightViewportDim,
    //     }
    // });
    
    leftImageDim = parseFloat(leftImport.width() / 2);
    leftImage.css('width', leftImageDim);
    leftImage.css('height', leftImageDim); 
    leftImage.css('margin-left', '25%');
    leftImage.css('margin-top', (parseFloat(leftImport.css('height')) - leftImageDim) / 2);

    rightImageDim = parseFloat(rightImport.width() / 2);
    rightImage.css('width', rightImageDim);
    rightImage.css('height', rightImageDim); 
    rightImage.css('margin-left', '25%');
    rightImage.css('margin-top', (parseFloat(rightImport.css('height')) - rightImageDim) / 2);

    // var imageUrl = "https://assets.rbl.ms/1268721/980x.jpg";
    // leftCrop.croppie('bind', {
    //     url: "https://crossorigin.me/" + imageUrl
    // });
    
    $('#page2 #left').click(function() {
        importButton1.click();
    });
    $('#page2 #right').click(function() {
        importButton2.click();
    });
});
