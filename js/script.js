$(document).ready(function() {
    function main() {
        initMenu();
        setPostDisplay();
        initResizeHandler();
        resizeImageWindow();
        initImportHandler();
        initImportButtons();
        initSelectButtons();
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

    var postCount;
    var currentPost = {};
    function setPostDisplay() {
        var body = $("body");
        body.addClass("loading");

        $.get("/getpost", function(data) {
            var obj = JSON.parse(data);

            var image1URL = obj.Image1.split(' ').join('+');
            var image2URL = obj.Image2.split(' ').join('+');

            var question = $('#page1 #bottom #questionText');
            var date = $('#page1 #bottom #dateText');
            var image1 = $('#page1 #left #image1');
            var image2 = $('#page1 #right #image2');
            var desc1 = $('#page1 #left #desc1');
            var desc2 = $('#page1 #right #desc2');

            question.text(obj.Question);
            date.text(obj.Date);
            image1.attr('src', 'data:image/png;base64,' + image1URL);
            image2.attr('src', 'data:image/png;base64,' + image2URL);
            desc1.text(obj.Desc1);
            desc2.text(obj.Desc2);

            currentPost.id = obj.Id;
            currentPost.question = obj.Question;
            currentPost.date = obj.Date;
            currentPost.image1 = image1URL;
            currentPost.image2 = image2URL;
            currentPost.desc1 = obj.Desc1;
            currentPost.desc2 = obj.Desc2;
            currentPost.votes1 = obj.Votes1;
            currentPost.votes2 = obj.Votes2;
        })
        .done(function(data) {
            body.removeClass("loading");     
        });

        $.get("/getpostcount", function(data) {
            postCount = data;
        })
        .done(function(data) {
            var postContainer = $('#page1 #rightSide');
            for (var i = 0; i < 5; i++) {
                var postData = "row\=" + (postCount - i);
                var postRequest = $.ajax({
                    type: "POST",
                    url: "/getpostbyrownumber",
                    data: postData,
                    success: function(data) {
                        var obj = JSON.parse(data);
                        var recentPost = document.createElement('div');
                        recentPost.innerHTML = obj.Question;
                        recentPost.style = `\
                            position: relative;
                            width: 100%;
                            font-size: 2vw;
                            word-wrap: break-word;
                            padding-left: 5%;
                            padding-right: 5%;
                        `;
                        postContainer.append(recentPost);
                    }
                });
            }
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

        var leftCrop = $('#croppedImg1');
        var rightCrop = $('#croppedImg2');

        croppedDim = parseFloat($('#croppedSection').css('height'));
        leftCrop.css('width', croppedDim);
        leftCrop.css('height', croppedDim);
        leftCrop.css('margin-right', croppedDim);
        rightCrop.css('width', croppedDim);
        rightCrop.css('height', croppedDim);

        var description1 = $('#description1');
        var description2 = $('#description2');

        var descriptionWidth = parseFloat($('#croppedSection').css('width')) - 2 * croppedDim;
        description1.css('width', descriptionWidth);
        description1.css('height', croppedDim / 2 - 1.5);
        description2.css('width', descriptionWidth);
        description2.css('height', croppedDim / 2 - 1.5);
        description2.css('top', croppedDim / 2 - 1.5);
    }

    function initImportHandler() {
        var importButton1 = $('#importImg1');
        var importButton2 = $('#importImg2');

        $('#page2 #left').click(function() {
            if ($('#page2').hasClass('active'))
                importButton1.click();
        });
        $('#page2 #right').click(function() {
            if ($('#page2').hasClass('active'))
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

        $('#description1').on('focus', function() {
            $('#croppedImg1').css('border', '3px dashed');
        });
        $('#description1').on('focusout', function() {
            $('#croppedImg1').css('border', 'none');
        });
        $('#description2').on('focus', function() {
            $('#croppedImg2').css('border', '3px dashed');
        });
        $('#description2').on('focusout', function() {
            $('#croppedImg2').css('border', 'none');
        });

        $('#submit').on('click', function() {
            if ($('#question').val() == "") {
                $('#question').css('border-color', 'red');
                return;
            }
            var question = $('#question').val();
            var desc1 = $('#description1').val();
            var desc2 = $('#description2').val();

            var image1 = $('#croppedImg1').prop('src').replace('data:image/png;base64,', '');
            var image2 = $('#croppedImg2').prop('src').replace('data:image/png;base64,', '');

            var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            var currentDate = new Date();
            var year = currentDate.getFullYear();
            var month = monthNames[currentDate.getMonth()];
            var day = currentDate.getDate();
            var hour = currentDate.getHours();
            var minutes = currentDate.getMinutes();
            var seconds = currentDate.getSeconds();

            var ampm = "AM";
            if (12 <= hour) {
                ampm = "PM";
            }

            hour = hour % 12;
            if (hour == 0) {
                hour = 12
            }

            var dateString = "Posted on " + hour + ":" + minutes + ":" + seconds + ampm + ", " + month + " " + day + ", " + year;

            var body = $("body");
            body.addClass("loading");

            var postData =
                "question\=" + question +
                "&desc1\=" + desc1 +
                "&desc2\=" + desc2 +
                "&image1\=" + image1 +
                "&image2\=" + image2 +
                "&date\=" + dateString;

            var postRequest = $.ajax({
                type: "POST",
                url: "/submit",
                data: postData,
            });

            postRequest.done(function() {
                body.removeClass("loading");
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

    var croppie1;
    var croppie2;
    function createCroppie(url, num, type) {
        var body = $("body");
        body.addClass("loading");

        var text = $("#importText");
        text.hide();

        var image = $('#page2 * #image' + num);
        var viewportDim = parseFloat(image.css('width'));

        var crop = image.croppie({
            viewport: {
                width: viewportDim,
                height: viewportDim,
            },
            showZoomer: false,
        });

        if (num == '1') croppie1 = crop;
        if (num == '2') croppie2 = crop;
        
        if (type == "url") {
            url = "https://crossorigin.me/" + url;
        }

        crop.croppie('bind', {
            url: url
        });

        var resetButton = $('#page2 #bottom #resetImport');
        var nextButton = $('#page2 #bottom #nextPage');
        resetButton.show();
        if (croppie1 && croppie2) {
            nextButton.show();
        }

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

    function resetImportPage() {
        $('#importText').show();
        $('#page2 #bottom div').hide();
        $('#page2 #left').click(function() {
            if ($('#page2').hasClass('active'))
                $('#importImg1').click();
        });
        $('#page2 #right').click(function() {
            if ($('#page2').hasClass('active'))
                $('#importImg2').click();
        });

        croppie1 = null;
        croppie2 = null;

        var leftExtraDiv = $('#page2 #left div');
        leftExtraDiv.replaceWith(leftExtraDiv.contents());
        
        var rightExtraDiv = $('#page2 #right div');
        rightExtraDiv.replaceWith(rightExtraDiv.contents());
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

        var nextPage = $('#nextPage');
        nextPage.on('click', function() {
            var body = $("body");
            body.addClass("loading");

            $('#page2 > div').removeClass('active');
            $('#page2 #descriptionPage').addClass('active');

            croppie1.croppie('result', 'base64').then(function(data) {
                var image = $('#croppedImg1');
                image.attr('src', data);
                body.removeClass("loading");
            });
            croppie2.croppie('result', 'base64').then(function(data) {
                var image = $('#croppedImg2');
                image.attr('src', data);
                body.removeClass("loading");
            });
        });
        var prevPage = $('#prevPage');
        prevPage.on('click', function() {
            $('#page2 > div').removeClass('active');
            $('#page2 #importPage').addClass('active'); 
        });

        var resetImports = $('#resetImport');
        resetImports.on('click', function() {
            if (croppie1) {
                croppie1.croppie('destroy');
            }
            if (croppie2) {
                croppie2.croppie('destroy');
            }
            resetImportPage();
        });
    }

    function initSelectButtons() {
        $('#selectButton1').on('click', function() {
            selectImage(1);
        });
        $('#selectButton2').on('click', function() {
            selectImage(2);
        });
    }

    function selectImage(num) {
        var body = $("body");
        body.addClass("loading");

        var postData =
            "id\=" + currentPost.id +
            "&imageNum\=" + num;

        var postRequest = $.ajax({
            type: "POST",
            url: "/incrementvote",
            data: postData,
        });

        postRequest.done(function() {
            if (num == 1) currentPost.votes1 += 1
            if (num == 2) currentPost.votes2 += 1

            var barGraph = document.getElementById("barGraph");
            var ctx = barGraph.getContext('2d');

            var chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["Left", "Right"],
                    datasets: [
                        {
                            label: "Vote Percentages",
                            backgroundColor: ["#3e95cd", "#8e5ea2"],
                            data: [60, 40]
                        }
                    ]
                },
                options: {
                    legend: {display: false},
                    title: {
                        display: true,
                        text: "Vote Percentages"
                    }
                }
            });

            $('#page1 #left').fadeOut();
            $('#page1 #right').fadeOut();
            body.removeClass("loading");
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
