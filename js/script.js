$(document).ready(function() {
    function main() {
        initMenu();
        initResizeHandler();
        resizeImageWindow();
        initImportHandler();
        initImportButtons();
    }

    function initMenu() {
        var pageSelector = '#pages > div';
        var menuSelector = '#topnav ul li';
        $(menuSelector).on('click', function() {
            $(menuSelector).removeClass('active');
            $(this).addClass('active');

            var pageId = "#page" + ($(this).index() + 1);
            $(pageSelector).removeClass('active');
            $(pageId).addClass('active');
        });
    }

    var offset;
    function initResizeHandler() {
        offset = 9;
        resizeImageWindow();
        offset = -6;

        $(window).on('resize', resizeImageWindow);
    }

    function resizeImageWindow() {
        var contentWindow = '.page';
        var navigationBar = '#topnav';
        var newWidth = parseFloat($(navigationBar).css('width')) + offset;
        var newHeight = parseFloat(newWidth, 10) * (14/30); 
        $(contentWindow).css('width', newWidth);
        $(contentWindow).css('height', newHeight);

        var leftImport = $('#page2 #left');
        var rightImport = $('#page2 #right');

        var leftImage = $('#page2 #left #image1');
        var rightImage = $('#page2 #right #image2');

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
    }

    function initImportHandler() {
        var importButton1 = $('#importImg1');
        var importButton2 = $('#importImg2');

        $('#page2 #left').click(function() {
            importButton1.click();
        });
        $('#page2 #right').click(function() {
            importButton2.click();
        });
        $('#confirm1').click(function() {
            handleConfirm('1');
        });
        $('#confirm2').click(function() {
            handleConfirm('2');
        });

        var inputs = document.querySelectorAll('.inputfile');
        Array.prototype.forEach.call(inputs, function(input) {
            var label = input.nextElementSibling;
            var labelVal = label.innerHTML;

            input.addEventListener('change', function(e) {
                var fileName = e.target.value.split('\\').pop();

                if (fileName)
                    label.innerHTML = fileName;
                else
                    label.innerHTML = labelVal;
            });
        });
    }

    function handleConfirm(num) {
        var inputFile = $('.inputOptions #file' + num);
        var inputLabel = $('.inputOptions #inputLabel' + num);
        var inputUrl = $('.inputOptions #urlInput' + num);

        if (inputLabel.hasClass('active')) {
            if (inputFile.val() == '') {
                return;
            }
            var file = inputFile.get(0).files[0];
            var fileType = file["type"];

            var ValidImageTypes = ["image/gif", "image/jpeg", "image/png"];
            if ($.inArray(fileType, ValidImageTypes) < 0) {
                return;
            }
            
            var reader = new FileReader();
            reader.onload = function(e) {
                createCroppie(e.target.result, num, "file");
            };
            reader.readAsDataURL(file);
        }
        if (inputUrl.hasClass('active')) {
            var url = inputUrl.val();
            if (url == '') {
                return;
            }
            isValidImageUrl(url, function(isImage) {
                if (isImage) {
                    createCroppie(url, num, "url");
                }
                else {
                    alert("Not a valid image!");
                }
            });
        }
    }

    function createCroppie(url, num, type) {
        var body = $("body");
        body.addClass("loading");

        var image = $('#page2 * #image' + num);
        var viewportDim = parseFloat(image.css('width'));

        var crop = image.croppie({
            viewport: {
                width: viewportDim,
                height: viewportDim,
            },
            showZoomer: false,
        });
        
        if (type == "url") {
            url = "https://crossorigin.me/" + url;
        }

        crop.croppie('bind', {
            url: url
        });

        removeImageClick(num);
    }

    function removeImageClick(num) {
        var image;
        if (num == '1') {
            image = $('#page2 #left');
        }
        if (num == '2') {
            image = $('#page2 #right');
        }

        if (image) {
            image.off('click');
        }
    }

    function initImportButtons() {
        var inputOptions1 = $('#remodal1 .inputOptions');
        var inputOptions2 = $('#remodal2 .inputOptions');

        var buttonSelector1 = $('#remodal1 .importButtons > button');
        buttonSelector1.on('click', function() {
            buttonSelector1.removeClass('active');
            $(this).addClass('active');

            inputOptions1.children().each(function() {
                $(this).removeClass('active');
            });
            var index = $(this).index() + 1;
            var option = inputOptions1.children().eq(index);
            option.addClass('active');
        });
        var buttonSelector2 = $('#remodal2 .importButtons > button');
        buttonSelector2.on('click', function() {
            buttonSelector2.removeClass('active');
            $(this).addClass('active');

            inputOptions2.children().each(function() {
                $(this).removeClass('active');
            });
            var index = $(this).index() + 1;
            var option = inputOptions2.children().eq(index);
            option.addClass('active');
        });
    }

    function isValidImageUrl(url, callback) {
        $("<img>").on('load', function() {
            callback(true);
        })
        .on('error', function() {
            callback(false);
        })
        .attr({
            src: url
        });
    }

    main();
});
