$(document).ready(function() {
    function main() {
        initMenu();
        setPostDisplay();
        initIconHandlers();
        initResizeHandler();
        resizeImageWindow();
        initImportHandler();
        initImportButtons();
        initSelectButtons();
        initSort();
        getViewed();
        generateList();
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

    function initIconHandlers() {
        var reloadIcon = $('#reloadIcon');
        var reportIcon = $('#reportIcon');

        reloadIcon.on('click', function() {
            getMainPost();
            resetBarGraph();
        });
        reportIcon.on('click', function() {
            var report = confirm("Report this post?");
            if (report) {
                alert("Post reported.");
                getMainPost();
                resetBarGraph();
            }
        });
    }

    function generateList(sorting = "") {
        $.get("/readpostsfile", function(data) {
            var dataList = data.split('\n');
            for (var i = 0; i < dataList.length; i++) {
                if (dataList[i] === "") {
                    dataList.splice(i, 1);
                }
            }
            if (sorting !== "") {
                dataList = quickSort(dataList, 0, dataList.length - 1, sorting);
            }
            else {
                dataList = quickSort(dataList, 0, dataList.length - 1, "name");
            }

            for (var i = 0; i < dataList.length; i++) {
                if (dataList[i] == "") {
                    continue;
                }
                var post = dataList[i].split("|||");
                var id = post[0];
                var question = post[1];
                var totalVotes = post[2];
                var date = post[3];

                var listPost = document.createElement('div');
                listPost.id = 'post' + id;
                listPost.className = 'listPost hvr-fade';

                var listText = question;
                var infoText = document.createElement('span');
                infoText.style.position = "absolute";
                infoText.style.right = "0.5%";
                infoText.innerHTML = date;
                if (sorting === "popularity") {
                    infoText.innerHTML = totalVotes + " Votes";
                }

                listPost.innerHTML = listText;
                listPost.appendChild(infoText);

                listPost.onclick = function() {
                    $("body").addClass("loading");
                    var theId = this.id.replace('post', '');
                    var postData = "id\=" + theId;
                    var postRequest = $.ajax({
                        type: "POST",
                        url: "/getpostbyid",
                        data: postData,
                        success: function(data) {
                            var obj = JSON.parse(data);

                            currentPost.id = obj.Id
                            currentPost.question = obj.Question;
                            currentPost.date = obj.Date;
                            currentPost.image1 = 'data:image/png;base64,' + obj.Image1.split(' ').join('+');
                            currentPost.image2 = 'data:image/png;base64,' + obj.Image2.split(' ').join('+');
                            currentPost.desc1 = obj.Desc1;
                            currentPost.desc2 = obj.Desc2;
                            currentPost.votes1 = parseInt(obj.Votes1);
                            currentPost.votes2 = parseInt(obj.Votes2);

                            setMainPost();
                            resetBarGraph();

                            $("#topnav ul li").first().click();
                            $("body").removeClass("loading");
                        }
                    });
                };

                if (i > 0) {
                    listPost.style.marginTop = '1vw';
                }

                $('#page3 #list').append(listPost);
            }
        });
    }

    function initSort() {
        var sortBox = $('#sort');
        sortBox.change(function() {
            var value = sortBox.find(":selected").val();

            $("body").addClass("loading");
            deleteList();
            generateList(value);
            $("body").removeClass("loading");
        });
    }

    function quickSort(list, left, right, type) {
        var index;
        if (list.length > 1) {
            index = partition(list, left, right, type);
            if (left < index - 1) {
                quickSort(list, left, index - 1, type);
            }
            if (index < right) {
                quickSort(list, index, right, type);
            }
        }
        return list;
    }

    function partition(list, left, right, type) {
        var pivot = list[Math.floor((right + left) / 2)];
        var i = left;
        var j = right;

        while (i <= j) {
            while (compare(list, i, pivot, type) == -1) {
                i++;
            }
            while (compare(list, j, pivot, type) == 1) {
                j--;
            }
            if (i <= j) {
                swap(list, i, j);
                i++;
                j--;
            }
        }

        return i;
    }

    function compare(list, index, pivot, type) {
        var splitList1 = list[index].split("|||");
        var splitList2 = pivot.split("|||");
        if (type === "name") {
            var question1 = splitList1[1].toLowerCase();
            var question2 = splitList2[1].toLowerCase();
            if (question1 < question2) return -1;
            if (question1 > question2) return 1;
            if (question1 === question2) return 0;
        }
        if (type === "popularity") {
            var totalVotes1 = parseInt(splitList1[2]);
            var totalVotes2 = parseInt(splitList2[2]);
            if (totalVotes1 < totalVotes2) return 1;
            if (totalVotes1 > totalVotes2) return -1;
            if (totalVotes1 == totalVotes2) return 0;
        }
        if (type === "date") {
            var id1 = parseInt(splitList1[0]);
            var id2 = parseInt(splitList2[0]);
            if (id1 < id2) return 1;
            if (id1 > id2) return -1;
            if (id1 == id2) return 0;
        }
        return 1;
    }

    function swap(list, index1, index2) {
        var temp = list[index1];
        list[index1] = list[index2];
        list[index2] = temp;
    }

    function deleteList() {
        var list = $('#list');
        list.empty();
    }

    var postCount;
    var currentPost = {};
    var recentPosts = [];
    var recentPostIndex;
    function setPostDisplay() {
        getMainPost();

        $.get("/getpostcount", function(data) {
            postCount = data;
        })
        .done(function(data) {
            var postContainer = $('#page1 #rightSide');
            for (var i = 0; i < 5; i++) {
                var postData = "id\=" + (postCount - i);
                var postRequest = $.ajax({
                    type: "POST",
                    url: "/getpostbyid",
                    data: postData,
                    success: function(data) {
                        var obj = JSON.parse(data);
                        var recentPost = document.createElement('div');
                        recentPost.innerHTML = obj.Question;
                        recentPost.className = "recentPost hvr-forward";
                        recentPost.style = `\
                            position: relative;
                            width: 100%;
                            font-size: 2vw;
                            word-wrap: break-word;
                            padding-left: 5%;
                            padding-right: 5%;
                        `;
                        recentPost.onclick = function() {
                            $("body").addClass("loading");
                            recentPostIndex = $(this).index() - 3;

                            var clickedPost = recentPosts[recentPostIndex];
                            currentPost.id = clickedPost.id
                            currentPost.question = clickedPost.question;
                            currentPost.date = clickedPost.date;
                            currentPost.image1 = clickedPost.image1;
                            currentPost.image2 = clickedPost.image2;
                            currentPost.desc1 = clickedPost.desc1;
                            currentPost.desc2 = clickedPost.desc2;
                            currentPost.votes1 = clickedPost.votes1;
                            currentPost.votes2 = clickedPost.votes2;
                            setMainPost();
                            resetBarGraph();
                        };
                        postContainer.append(recentPost);

                        recentPosts.push({
                            id: obj.Id,
                            question: obj.Question,
                            date: obj.Date,
                            image1: 'data:image/png;base64,' + obj.Image1.split(' ').join('+'),
                            image2: 'data:image/png;base64,' + obj.Image2.split(' ').join('+'),
                            desc1: obj.Desc1,
                            desc2: obj.Desc2,
                            votes1: parseInt(obj.Votes1),
                            votes2: parseInt(obj.Votes2),
                        });
                    }
                });
            }
        });
    }

    function getMainPost() {
        var body = $("body");
        body.addClass("loading");

        $.get("/getpost", function(data) {
            var obj = JSON.parse(data);

            var image1URL = 'data:image/png;base64,' + obj.Image1.split(' ').join('+');
            var image2URL = 'data:image/png;base64,' + obj.Image2.split(' ').join('+');

            currentPost.id = obj.Id;
            currentPost.question = obj.Question;
            currentPost.date = obj.Date;
            currentPost.image1 = image1URL;
            currentPost.image2 = image2URL;
            currentPost.desc1 = obj.Desc1;
            currentPost.desc2 = obj.Desc2;
            currentPost.votes1 = parseInt(obj.Votes1);
            currentPost.votes2 = parseInt(obj.Votes2);
        })
        .done(function(data) {
            setMainPost();
            body.removeClass("loading");
        });
    }

    function setMainPost() {
        var question = $('#page1 #bottom #questionText');
        var date = $('#page1 #bottom #dateText');
        var image1 = $('#page1 #left #image1');
        var image2 = $('#page1 #right #image2');
        var desc1 = $('#page1 #left #desc1');
        var desc2 = $('#page1 #right #desc2');

        question.text(currentPost.question);
        date.text(currentPost.date);
        image1.attr('src', currentPost.image1);
        image2.attr('src', currentPost.image2);
        desc1.text(currentPost.desc1);
        desc2.text(currentPost.desc2);

        checkVoted();

        $("body").removeClass("loading");
    }

    var voted = false;
    function checkVoted() {
        var votedList = votedValues.split(',');
        if (votedList.includes(currentPost.id)) {
            voted = true;

            var alreadyVoted = $('#alreadyVoted');
            alreadyVoted.css("visibility", "visible");
            alreadyVoted.css("opacity", "1");
        }
        else {
            voted = false;

            var alreadyVoted = $('#alreadyVoted');
            alreadyVoted.css("visibility", "hidden");
            alreadyVoted.css("opacity", "0");
        }
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

            question = mysql_real_escape_string(question);
            desc1 = mysql_real_escape_string(desc1);
            desc2 = mysql_real_escape_string(desc2);

            var image1 = $('#croppedImg1').prop('src').replace('data:image/png;base64,', '');
            var image2 = $('#croppedImg2').prop('src').replace('data:image/png;base64,', '');

            var nextId = parseInt(postCount) + 1;

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

            minutes = (minutes<10?'0':'') + minutes;

            hour = hour % 12;
            if (hour == 0) {
                hour = 12
            }

            var dateString = "Posted on " + hour + ":" + minutes + ampm + ", " + month + " " + day + ", " + year;

            var body = $("body");
            body.addClass("loading");

            var postData =
                "question\=" + question +
                "&desc1\=" + desc1 +
                "&desc2\=" + desc2 +
                "&image1\=" + image1 +
                "&image2\=" + image2 +
                "&date\=" + dateString +
                "&id\=" + nextId;

            var postRequest = $.ajax({
                type: "POST",
                url: "/submit",
                data: postData,
            });

            postRequest.done(function() {
                $.get("/getpostcount", function(data) {
                    postCount = data;
                })

                body.removeClass("loading");
                location.reload();
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
        
        if (type == "url") {
            url = "https://crossorigin.me/" + url;
            loaded = false;
            setTimeout(function() {
                if ($("body").hasClass("loading")) {
                    alert("Sorry, that URL either cannot be accessed or found.");
                    if (croppie1) {
                        croppie1.croppie('destroy');
                    }
                    if (croppie2) {
                        croppie2.croppie('destroy');
                    }
                    resetImportPage();
                    body.removeClass("loading");
                }
            }, 10000);
        }

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

    function resetBarGraph() {
        var chartArea = document.getElementById("chartArea");
        while (chartArea.firstChild) {
            chartArea.removeChild(chartArea.firstChild);
        }
        var newCanvas = document.createElement('canvas');
        newCanvas.id = "barGraph";
        chartArea.appendChild(newCanvas);

        var backButton = document.createElement('div');
        backButton.id = "backButton";
        backButton.className = "hvr-grow";
        chartArea.appendChild(backButton);

        $('#backButton').on('click', function() {
            showHome();
        });

        $('#page1 #chartArea').css('visibility', 'hidden');
        $('#page1 #chartArea').css('opacity', '0');

        $('#page1 #left').fadeIn();
        $('#page1 #right').fadeIn();
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
        $('#seeResults').on('click', function() {
            showGraph();
        });
        $('#backButton').on('click', function() {
            showHome();
        });
    }

    function selectImage(num) {
        if (voted) {
            alert("You've already voted!");
            showGraph();
        }

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
            body.removeClass("loading");

            setViewed(currentPost.id);

            if (num == 1) {
                currentPost.votes1 += 1
                if (recentPostIndex) {
                    recentPosts[recentPostIndex].votes1 += 1;
                }
            }
            if (num == 2) {
                currentPost.votes2 += 1
                if (recentPostIndex) {
                    recentPosts[recentPostIndex].votes2 += 1;
                }
            }

            showGraph();
            deleteList();
            generateList();
            $('#sort').val("name");
        });
    }

    function showGraph() {
        var alreadyVoted = $('#alreadyVoted');
        alreadyVoted.css("visibility", "hidden");
        alreadyVoted.css("opacity", "0");

        voted = true;

        var barGraph = document.getElementById("barGraph");
        var ctx = barGraph.getContext('2d');

        var totalVotes = currentPost.votes1 + currentPost.votes2;
        var percentLeft = (currentPost.votes1 / totalVotes) * 100;
        var percentRight = (currentPost.votes2 / totalVotes) * 100;

        var chart = new Chart(barGraph, {
            type: 'bar',
            data: {
                labels: ["Left", "Right"],
                datasets: [{
                    label: "Percent (%)",
                    backgroundColor: ["#3e95cd", "#8e5ea2"],
                    data: [percentLeft, percentRight]
                }]
            },
            options: {
                animation: {
                    duration: 3000,
                },
                legend: {display: false},
                title: {
                    display: true,
                    text: "Total Votes: " + totalVotes
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            suggestedMin: 0,
                            suggestedMax: 100,
                        },
                        position: "right"
                    }]
                }
            }
        });

        barGraph.style.width = '100%';
        barGraph.style.height = '100%';

        $('#page1 #chartArea').css('visibility', 'visible');
        $('#page1 #chartArea').css('opacity', '1');

        $('#page1 #left').fadeOut();
        $('#page1 #right').fadeOut();
    }

    function showHome() {
        $('#page1 #chartArea').css('visibility', 'hidden');
        $('#page1 #chartArea').css('opacity', '0');
        $('#page1 #left').fadeIn();
        $('#page1 #right').fadeIn();

        var alreadyVoted = $('#alreadyVoted');
        alreadyVoted.css("visibility", "visible");
        alreadyVoted.css("opacity", "1");
    }

    var votedValues = "";
    function getViewed() {
        var allCookies = decodeURIComponent(document.cookie).split(';');
        for (var i = 0; i < allCookies.length; i++) {
            if (allCookies[i].trim().indexOf("voted=") == 0) {
                votedValues = allCookies[i].trim().split("=")[1];
            }
        }
    }

    function setViewed(postId) {
        var d = new Date();
        var numDays = 1000;
        d.setTime(d.getTime() + (numDays*24*60*60*1000));
        var expires = "expires=" + d.toUTCString();
        votedValues += "," + postId;

        document.cookie = "voted=" + votedValues + ";" + expires;
    }

    function deleteCookie(name) {
        document.cookie = name + "=;expires=1";
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

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function mysql_real_escape_string (str) {
        return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
            switch (char) {
                case "\0":
                    return "\\0";
                case "\x08":
                    return "\\b";
                case "\x09":
                    return "\\t";
                case "\x1a":
                    return "\\z";
                case "\n":
                    return "\\n";
                case "\r":
                    return "\\r";
                case "\"":
                case "'":
                case "\\":
                case "%":
                    return "\\"+char; // prepends a backslash to backslash, percent,
                    // and double/single quotes
            }
        });
    }

    main();
});
