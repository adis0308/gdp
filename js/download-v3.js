var download = {
    config: JSON.parse(_decx(JSON.stringify(playerConfig))),
    sources: [],
    tracks: [],
    parser: {
        tracks: function () {
            var href = "",
                onclick = "";
            if (download.tracks.length > 0) {
                $.each(download.tracks, function (i, e) {
                    href = e.file;
                    if (!download.config.disableDirectAds && download.config.directAdsLink !== "" && download.config.directAdsLink !== "#") {
                        onclick = "onclick=\"showAds('" + download.config.directAdsLink + "')\"";
                    }
                    $("#dlWrapper").append('<a href="' + href + '" class="btn btn-success btn-lg btn-block btn-download" ' + onclick + ">Download " + e.label + " Subtitle</a>");
                });
            }
        },
        sources: function () {
            var href = "",
                onclick = "";
            if (download.sources.length > 0) {
                $.each(download.sources, function (i, e) {
                    href = e.file;
                    if (!download.config.disableDirectAds && download.config.directAdsLink !== "" && download.config.directAdsLink !== "#") {
                        onclick = "onclick=\"showAds('" + download.config.directAdsLink + "')\"";
                    }
                    $("#dlWrapper").append('<a href="' + href + '" class="btn btn-primary btn-lg btn-block btn-download" ' + onclick + ">Download " + e.label + " Video</a>");
                });
            }
        },
    },
    load: function () {
        var $servers = $("#servers li"),
            serverLen = $servers.length,
            $next,
            link = "",
            isOK = false,
            isMP4 = true;
        $.ajax({
            url: download.config.apiURL + "api/?" + download.config.query,
            type: "GET",
            dataType: "json",
            cache: false,
            timeout: 30000,
            beforeSend: function () {
                $("#dlWrapper").html('<div class="d-flex justify-content-center"><div class="spinner-grow text-success" role="status" style="width:5rem;height:5rem"><span class="sr-only">Loading...</span></div></div>');
            },
            success: function (res) {
                if (res.status !== "fail") {
                    if (res.sources.length > 0 && res.sources[0].type.indexOf("video") > -1) {
                        isOK = true;
                        $(".btn-watch").show();
                        $("#dlWrapper").html("");
                        download.sources = res.sources;
                        download.tracks = res.tracks;
                        download.parser.sources();
                        download.parser.tracks();
                    } else {
                        isMP4 = false;
                    }
                }
                if (!isOK) {
                    if (serverLen > 1) {
                        $servers.each(function (i, e) {
                            if ($(this).find("a").hasClass("active") && i < serverLen - 1) {
                                $next = $(this).next();
                                if ($next.length > 0) {
                                    link = $next.find("a").attr("href");
                                    return false;
                                }
                            }
                        });
                        if (link !== "") {
                            window.location.href = link;
                        } else if (!isMP4) {
                            download.msg.mp4Unavailable();
                        } else {
                            download.msg.notFound();
                        }
                    } else if (!isMP4) {
                        download.msg.mp4Unavailable();
                    } else {
                        download.msg.notFound();
                    }
                }
            },
            error: function (xhr, status) {
                showMessage('Failed to fetch video sources from server! <a href="javascript:void(0)" onclick="location.reload()">Reload Page</a>');
            },
        });
    },
    msg: {
        notFound: function () {
            showMessage("Sorry this video is unavailable.");
        },
        mp4Unavailable: function () {
            showMessage("No downloadable mp4 videos.");
        }
    }
};

if (download.config.productionMode) {
    preventOpenDevTools();
}

detectAdblocker(function (xhr) {
    window.canRunAds = xhr.status > 0;
    if (download.config.blockADB && !window.canRunAds) {
        showMessage('<p><img src="assets/img/stop-sign-hand.webp" width="100" height="100"></p><p>Please support us by disabling AdBlocker.</p>');
    } else {
        download.load();
    }
});

$(document).on("contextmenu", function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
});

function detectAdblocker(callback) {
    var canRunAds = true;
    $.ajax({
        url: "https://feeloshu.com/tag.min.js",
        complete: callback
    });
}

function showMessage(msg) {
    $(".btn-watch, .alert, h1").hide();
    $("#dlWrapper").html('<h3 class="text-danger text-center">' + msg + "</h3>");
}

function preventOpenDevTools() {
    console.clear();
    var before = new Date().getTime();
    debugger;
    var after = new Date().getTime();
    if (after - before > 200) {
        $("body").text(" Dont open Developer Tools.");
        window.location.replace("https://www.google.com");
    }
    setTimeout(preventOpenDevTools, 100);
}

function showAds(adsLink) {
    if (typeof adsLink !== "undefined") {
        window.open(adsLink, "_blank");
    }
}
