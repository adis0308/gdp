var pConf = {};
showLoading();
try {
    sandboxDetector();
} catch (e) {
    console.log("Sandbox not supported");
}
try {
    localStorage.setItem("gdpcheck", true);
    localStorage.removeItem("gdpcheck");
    window.xStorage = localStorage;
    localStorage.removeItem("jwplayer.captionLabel");
} catch (e) {
    window.xStorage = {
        setItem: function (key, value) {
            return undefined;
        },
        getItem: function (key) {
            return null;
        },
        removeItem: function (key) {
            return undefined;
        },
        clear: function () {
            return undefined;
        },
    };
}
try {
    if (typeof playerConfig !== "undefined" && "iv" in playerConfig) {
        pConf = JSON.parse(_decx(JSON.stringify(playerConfig)));
        preventOpenDevTools();
    } else {
        showMessage("License error!");
        gtagReport("video_error", "License error!", "video_error", false);
    }
} catch (e) {
    showMessage("Javascript error!");
    gtagReport("video_error", "Javascript error!", "video_error", false);
}
var $timez = $("#timez"),
    $resume = $("#resume"),
    $myConfirm = $resume.find(".myConfirm > p:first-child"),
    title = $("meta[name='og:title']").attr("content"),
    poster = $("meta[name='og:image']").attr("content"),
    isLive = false,
    statLogInterval = false,
    statCounted = false,
    latestPlayKey = "latestplay." + pConf.localKey,
    latestPlayTime = xStorage.getItem(latestPlayKey),
    retryKey = "retry." + pConf.localKey,
    retryNumber = getRetryNumber(),
    haveAds = "schedule" in pConf.vastAds && pConf.vastAds.schedule.length > 0,
    p2pEngine = undefined,
    p2pEnabled = pConf.enableP2P && pConf.torrentList.length > 0 && typeof p2pml !== "undefined" && p2pml.core.HybridLoader.isSupported(),
    p2pConfig = {
        segments: {
            swarmId: pConf.localKey,
        },
        loader: {
            trackerAnnounce: pConf.torrentList,
            httpUseRanges: true,
            httpDownloadProbabilitySkipIfNoPeers: true,
        },
    },
    jwp = {
        container: "videoContainer",
        player: null,
        config: {
            aspectratio: "16:9",
            abouttext: "GDPlayer.to",
            aboutlink: "https://gdplayer.to",
            displaydescription: false,
            rewind: false,
            controls: true,
            floating: false,
            hlshtml: true,
            primary: "html5",
            androidhls: true,
            cast: {},
            sources: [],
            tracks: [],
            title: title,
            image: poster,
            autostart: pConf.autoplay,
            mute: pConf.mute,
            preload: pConf.preload,
            repeat: pConf.repeat,
            stretching: pConf.stretching,
            displaytitle: pConf.displayTitle,
            playbackRateControls: pConf.displayRateControls,
            advertising: pConf.vastAds,
            captions: {
                color: pConf.captionsColor,
                backgroundOpacity: 0,
            },
            logo: {
                file: pConf.logoImage,
                link: pConf.logoLink,
                hide: pConf.logoHide,
                position: pConf.logoPosition,
            },
        },
        resumePlayback: function () {
            jwp.player.seek(xStorage.getItem(latestPlayKey));
            $resume.hide();
        },
        destroy: function () {
            if (jwp.player) {
                jwp.player.remove();
                jwp.player = undefined;
            }
        },
        events: {
            ready: function (e) {
                var skinName = pConf.playerSkin,
                    iconRewind = jwp.icons.rewind,
                    iconForward = jwp.icons.forward,
                    changeTextDurationPosition = ["netflix", "hotstar"],
                    btnClassRole = 'class="jw-icon jw-icon-display jw-button-color jw-reset" role="button"';
                if (skinName in jwp.icons) {
                    if ("rewind" in jwp.icons[skinName]) {
                        iconRewind = jwp.icons[skinName].rewind;
                    }
                    if ("forward" in jwp.icons[skinName]) {
                        iconForward = jwp.icons[skinName].forward;
                    }
                }
                $(".jw-display-icon-rewind").html("<div " + btnClassRole + ' onclick="window.customRewind()">' + iconRewind + "</div>");
                $(".jw-display-icon-next")
                    .html("<div " + btnClassRole + ' onclick="window.customForward()">' + iconForward + "</div>")
                    .removeAttr("style");
                if (changeTextDurationPosition.indexOf(skinName) > -1) {
                    $(".jw-slider-time").prepend($(".jw-text-elapsed")).append($(".jw-text-duration"));
                }
                jwp.mediaSession.load();
                showPlayer();
                gtagReport("video_ready_to_play", "Ready To Play", "jwplayer", false);
            },
            beforePlay: function (e) {
                var $iconRewind = $(".jw-icon-rewind"),
                    $btnRewind = $('[button="rewind"]'),
                    $btnForward = $('[button="forward"]');
                if ($iconRewind.length) {
                    $iconRewind.after($btnRewind);
                    $btnRewind.after($btnForward);
                }
            },
            complete: function (e) {
                if (statLogInterval) {
                    clearInterval(statLogInterval);
                    statLogInterval = false;
                }
                xStorage.removeItem(latestPlayKey);
                gtagReport("video_complete", "Playback Has Ended", "jwplayer", false);
            },
            meta: function (e) {
                var timeFormat = "";
                isLive = $(".jwplayer").hasClass("jw-flag-live");
                latestPlayTime = Math.floor(xStorage.getItem(latestPlayKey));
                if (!isLive && pConf.resumePlayback && jwp.player.getPosition() < latestPlayTime) {
                    timeFormat = prettySecond(latestPlayTime);
                    $timez.text(timeFormat);
                    $myConfirm.text($myConfirm.text().replace("hh:mm:ss", timeFormat));
                    $resume.show();
                }
            },
            time: function (e) {
                latestPlayTime = Math.floor(xStorage.getItem(latestPlayKey));
                if (e.position > latestPlayTime) {
                    xStorage.setItem(latestPlayKey, Math.round(e.position));
                    xStorage.removeItem(retryKey);
                }
                if (e.position >= pConf.statCounterRuntime && !statCounted) {
                    statCounter();
                }
            },
            error: function (e) {
                var detail = "sourceError" in e && e.sourceError && "message" in e.sourceError ? e.sourceError.message : "",
                    msg = e.message + " " + detail;
                if (e.code === 301161 && e.sourceError === null) {
                    gtagReport("video_error", "Redirected to https", "jwplayer", false);
                    location.href = location.href.replace("http:", "https:");
                } else {
                    jwp.errorHandler(msg);
                }
            },
        },
        loadPlayer: function (resume) {
            var skinName = pConf.playerSkin,
                iconRewind = jwp.icons.rewind,
                iconForward = jwp.icons.forward;
            if (skinName in jwp.icons) {
                if ("rewind" in jwp.icons[skinName]) {
                    iconRewind = jwp.icons[skinName].rewind;
                }
                if ("forward" in jwp.icons[skinName]) {
                    iconForward = jwp.icons[skinName].forward;
                }
            }
            jwp.player = jwplayer(jwp.container).setup(jwp.config);
            if (p2pEnabled) {
                jwplayer_hls_provider.attach();
                p2pEngine = new p2pml.hlsjs.Engine(p2pConfig);
                p2pml.hlsjs.initJwPlayer(jwp.player, {
                    liveSyncDurationCount: 7,
                    loader: p2pEngine.createLoaderClass(),
                });
            }
            jwp.player.once("ready", jwp.events.ready).once("beforePlay", jwp.events.beforePlay).once("play", visitDirectAds).once("complete playlistComplete", jwp.events.complete).on("meta", jwp.events.meta).on("time", jwp.events.time).on("setupError error", jwp.events.error);
            if (pConf.showDownloadButton && pConf.enableDownloadPage) {
                jwp.player.addButton(
                    jwp.icons.download,
                    pConf.text_download,
                    function () {
                        window.open(pConf.downloadLink, "_blank");
                        return true;
                    },
                    "download"
                );
            }
            if (pConf.smallLogoFile !== "") {
                jwp.player.addButton(
                    pConf.smallLogoFile,
                    "",
                    function () {
                        if (pConf.smallLogoURL !== "") {
                            window.open(pConf.smallLogoURL, "_blank");
                        }
                        return true;
                    },
                    "small_logo"
                );
            }
            jwp.player.addButton(iconRewind, pConf.text_rewind, window.customRewind, "rewind").addButton(iconForward, pConf.text_forward, window.customForward, "forward");
        },
        loadSkin: function () {
            var skinName = pConf.playerSkin,
                skin = {};
            if (skinName !== "" && skinName !== "default") {
                skin = {
                    url: pConf.baseURL + "assets/css/skin/jwplayer/" + pConf.playerSkin + ".css",
                    name: pConf.playerSkin,
                    controlbar: {},
                    timeslider: {},
                    menus: {},
                };
                if (skinName === "netflix") {
                    skin.controlbar = {
                        icons: "#ffffff",
                        iconsActive: "#e50914",
                    };
                    skin.timeslider = {
                        progress: "#e50914",
                        rail: "#5b5b5b",
                    };
                    skin.menus = {
                        background: "#262626",
                        textActive: "#e50914",
                    };
                } else if (skinName === "hotstar") {
                    skin.controlbar = {
                        icons: "#ffffff",
                        iconsActive: "#1f80e0",
                    };
                    skin.timeslider = {
                        progress: "#1f80e0",
                        rail: "rgba(255,255,255,.2)",
                    };
                    skin.menus = {
                        background: "rgba(18,18,18,.95)",
                        textActive: "#1f80e0",
                    };
                }
            } else {
                skin = {
                    controlbar: {
                        iconsActive: pConf.playerColor,
                    },
                    timeslider: {
                        progress: pConf.playerColor,
                    },
                    menus: {
                        background: "#121212",
                        textActive: pConf.playerColor,
                    },
                };
            }
            return skin;
        },
        rewind: function () {
            var seek = 0,
                time = jwp.player.getPosition() - 10;
            if (time > 0) {
                seek = time;
                jwp.player.seek(seek);
            }
        },
        forward: function () {
            var seek = 0,
                time = jwp.player.getPosition() + 10;
            if (time > 0) {
                seek = time;
                jwp.player.seek(seek);
            }
        },
        errorHandler: function (msg) {
            var $servers = $("#servers li"),
                serverLen = $servers.length,
                index = -1;
            retryNumber = getRetryNumber() + 1;
            showLoading();
            if (typeof $servers !== "undefined" && serverLen > 1) {
                index = $("#servers li a").index($(".active"));
                if (index < serverLen - 1) {
                    location.href = $servers
                        .eq(index + 1)
                        .find("a")
                        .attr("href");
                } else {
                    showMessage(msg);
                }
            } else if (retryNumber <= 3) {
                retry(retryNumber);
            } else {
                jwp.msg.custom(msg);
            }
        },
        loadSuccessCallback: function (res) {
            if (res.status !== "fail") {
                jwp.config.title = res.title;
                jwp.config.image = res.poster;
                jwp.config.tracks = res.tracks;
                if (res.filmstrip !== "") {
                    jwp.config.tracks.push({
                        file: res.filmstrip,
                        kind: "thumbnails",
                    });
                }
                if (res.sources.length > 0) {
                    jwp.config.sources = res.sources;
                    jwp.loadPlayer(false);
                } else {
                    jwp.msg.notFound();
                }
            } else {
                jwp.errorHandler(res.message);
            }
        },
        loadErrorCallback: function (xhr, status) {
            if (status === "timeout") {
                jwp.msg.timeout();
            } else {
                failed();
            }
        },
        adBlockerCallback: function (xhr) {
            window.canRunAds = xhr.status > 0;
            if (pConf.blockADB && !window.canRunAds) {
                jwp.destroy();
                adblockerMessage();
            } else {
                loadSources(jwp.loadSuccessCallback, jwp.loadErrorCallback);
            }
        },
        msg: {
            notFound: function () {
                showMessage("Sorry this video is unavailable.");
                gtagReport("video_error", "Sources not found", "jwplayer", false);
            },
            custom: function (msg) {
                showMessage(msg);
                gtagReport("video_error", msg, "jwplayer", false);
            },
            timeout: function () {
                showMessage('Connection timed out! <a href="javascript:void(0)" onclick="xStorage.clear();location.reload()">Reload Page</a>');
                gtagReport("video_error", "Connection timed out", "jwplayer", false);
            },
        },
        mediaSession: {
            updatePositionState: function (state) {
                if ("mediaSession" in navigator) {
                    if ("playbackState" in navigator.mediaSession) {
                        navigator.mediaSession.playbackState = state;
                    }
                    if (!isLive && "setPositionState" in navigator.mediaSession) {
                        navigator.mediaSession.setPositionState({
                            duration: jwp.player.getDuration(),
                            playbackRate: jwp.player.getPlaybackRate(),
                            position: jwp.player.getPosition(),
                        });
                    }
                }
            },
            load: function () {
                if ("mediaSession" in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: jwp.config.title,
                        artwork: [
                            {
                                src: jwp.config.image,
                            },
                        ],
                    });
                    navigator.mediaSession.setActionHandler("play", function () {
                        jwp.player.play();
                        jwp.mediaSession.updatePositionState("playing");
                    });
                    navigator.mediaSession.setActionHandler("pause", function () {
                        if (isLive) {
                            jwp.player.stop();
                        } else {
                            jwp.player.pause();
                        }
                        jwp.mediaSession.updatePositionState("paused");
                    });
                    navigator.mediaSession.setActionHandler("stop", function () {
                        jwp.player.stop();
                        jwp.mediaSession.updatePositionState("paused");
                    });
                    if (!isLive) {
                        navigator.mediaSession.setActionHandler("seekbackward", function () {
                            var seek = 0,
                                time = jwp.player.getPosition() - 10;
                            seek = time <= 0 ? 0 : time;
                            jwp.player.seek(seek);
                            jwp.mediaSession.updatePositionState("none");
                        });
                        navigator.mediaSession.setActionHandler("seekforward", function () {
                            var seek = 0,
                                time = jwp.player.getPosition() + 10;
                            seek = time <= 0 ? 0 : time;
                            jwp.player.seek(seek);
                            jwp.mediaSession.updatePositionState("none");
                        });
                    }
                }
            },
        },
        icons: {
            netflix: {
                rewind: '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-rewind" viewBox="0 0 24 24" focusable="false"><g id="back-10"><path d="M12.4521632,5.01256342 L13.8137335,6.91876181 L12.1862665,8.08123819 L9.27109639,4 L12.1862665,-0.0812381937 L13.8137335,1.08123819 L12.4365066,3.0093558 C17.7568368,3.23786247 22,7.6234093 22,13 C22,18.5228475 17.5228475,23 12,23 C6.4771525,23 2,18.5228475 2,13 C2,11.0297737 2.57187523,9.14190637 3.62872363,7.52804389 L5.30188812,8.6237266 C4.4566948,9.91438076 4,11.4220159 4,13 C4,17.418278 7.581722,21 12,21 C16.418278,21 20,17.418278 20,13 C20,8.73346691 16.6600802,5.24701388 12.4521632,5.01256342 Z M8.47,17 L8.47,11.41 L6.81,11.92 L6.81,10.75 L9.79,9.91 L9.79,17 L8.47,17 Z M14.31,17.15 C13.7499972,17.15 13.2600021,17.0016682 12.84,16.705 C12.4199979,16.4083319 12.0950011,15.9883361 11.865,15.445 C11.6349988,14.901664 11.52,14.2600037 11.52,13.52 C11.52,12.786663 11.6349988,12.1466694 11.865,11.6 C12.0950011,11.0533306 12.4199979,10.6316682 12.84,10.335 C13.2600021,10.0383319 13.7499972,9.89 14.31,9.89 C14.8700028,9.89 15.3599979,10.0383319 15.78,10.335 C16.2000021,10.6316682 16.5249988,11.0533306 16.755,11.6 C16.9850012,12.1466694 17.1,12.786663 17.1,13.52 C17.1,14.2600037 16.9850012,14.901664 16.755,15.445 C16.5249988,15.9883361 16.2000021,16.4083319 15.78,16.705 C15.3599979,17.0016682 14.8700028,17.15 14.31,17.15 Z M14.31,15.97 C14.7500022,15.97 15.1016653,15.7533355 15.365,15.32 C15.6283346,14.8866645 15.76,14.2866705 15.76,13.52 C15.76,12.7533295 15.6283346,12.1533355 15.365,11.72 C15.1016653,11.2866645 14.7500022,11.07 14.31,11.07 C13.8699978,11.07 13.5183346,11.2866645 13.255,11.72 C12.9916653,12.1533355 12.86,12.7533295 12.86,13.52 C12.86,14.2866705 12.9916653,14.8866645 13.255,15.32 C13.5183346,15.7533355 13.8699978,15.97 14.31,15.97 Z M7.72890361,4 L9.81373347,6.91876181 L8.18626653,8.08123819 L5.27109639,4 L8.18626653,-0.0812381937 L9.81373347,1.08123819 L7.72890361,4 Z"></path></g></svg>',
                forward:
                    '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-forward" viewBox="0 0 24 24" focusable="false"><g id="forward-10"><path d="M11.8291288,3.00143042 L10.4575629,1.08123819 L12.0850299,-0.0812381937 L15.0002,4 L12.0850299,8.08123819 L10.4575629,6.91876181 L11.8267943,5.0018379 C7.48849327,5.09398699 4,8.63960287 4,13 C4,17.418278 7.581722,21 12,21 C16.418278,21 20,17.418278 20,13 C20,11.4220159 19.5433052,9.91438076 18.6981119,8.6237266 L20.3712764,7.52804389 C21.4281248,9.14190637 22,11.0297737 22,13 C22,18.5228475 17.5228475,23 12,23 C6.4771525,23 2,18.5228475 2,13 C2,7.53422249 6.38510184,3.09264039 11.8291288,3.00143042 Z M8.56,17 L8.56,11.41 L6.9,11.92 L6.9,10.75 L9.88,9.91 L9.88,17 L8.56,17 Z M14.4,17.15 C13.8399972,17.15 13.3500021,17.0016682 12.93,16.705 C12.5099979,16.4083318 12.1850012,15.988336 11.955,15.445 C11.7249989,14.9016639 11.61,14.2600037 11.61,13.52 C11.61,12.786663 11.7249989,12.1466694 11.955,11.6 C12.1850012,11.0533306 12.5099979,10.6316681 12.93,10.335 C13.3500021,10.0383318 13.8399972,9.89 14.4,9.89 C14.9600028,9.89 15.4499979,10.0383318 15.87,10.335 C16.2900021,10.6316681 16.6149988,11.0533306 16.845,11.6 C17.0750012,12.1466694 17.19,12.786663 17.19,13.52 C17.19,14.2600037 17.0750012,14.9016639 16.845,15.445 C16.6149988,15.988336 16.2900021,16.4083318 15.87,16.705 C15.4499979,17.0016682 14.9600028,17.15 14.4,17.15 Z M14.4,15.97 C14.8400022,15.97 15.1916654,15.7533355 15.455,15.32 C15.7183347,14.8866645 15.85,14.2866705 15.85,13.52 C15.85,12.7533295 15.7183347,12.1533355 15.455,11.72 C15.1916654,11.2866645 14.8400022,11.07 14.4,11.07 C13.9599978,11.07 13.6083346,11.2866645 13.345,11.72 C13.0816654,12.1533355 12.95,12.7533295 12.95,13.52 C12.95,14.2866705 13.0816654,14.8866645 13.345,15.32 C13.6083346,15.7533355 13.9599978,15.97 14.4,15.97 Z M14.4575629,6.91876181 L16.5423928,4 L14.4575629,1.08123819 L16.0850299,-0.0812381937 L19.0002,4 L16.0850299,8.08123819 L14.4575629,6.91876181 Z"></path></g></svg>',
            },
            hotstar: {
                rewind: '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-rewind" viewBox="0 0 24 24" focusable="false"><path d="M12.436 18.191c.557.595.665 1.564.167 2.215-.522.687-1.469.794-2.114.238a1.52 1.52 0 01-.12-.115l-6.928-7.393a1.683 1.683 0 010-2.271l6.929-7.393a1.437 1.437 0 012.21.093c.521.65.419 1.645-.148 2.25l-5.448 5.814a.55.55 0 000 .743l5.453 5.82h-.001zm4.648-6.563a.553.553 0 000 .744l3.475 3.709a1.683 1.683 0 01-.115 2.382c-.61.532-1.519.418-2.075-.175l-4.828-5.152a1.683 1.683 0 010-2.27l4.888-5.218c.56-.599 1.46-.632 2.056-.074.664.621.632 1.751.007 2.418l-3.409 3.636z" fill-rule="evenodd" clip-rule="evenodd"/></svg>',
                forward: '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-forward" viewBox="0 0 24 24" focusable="false"><path d="M11.564 18.19l5.453-5.818a.55.55 0 000-.743l-5.448-5.815c-.567-.604-.67-1.598-.148-2.249.536-.673 1.483-.757 2.115-.186.033.03.065.06.095.093l6.928 7.392a1.683 1.683 0 010 2.272L13.63 20.53a1.439 1.439 0 01-2.125.005 1.588 1.588 0 01-.109-.128c-.498-.65-.39-1.62.166-2.215h.001zm-4.647-6.562L3.508 7.992c-.624-.667-.657-1.797.007-2.418a1.436 1.436 0 012.056.074l4.888 5.217a1.683 1.683 0 010 2.271l-4.827 5.151c-.558.594-1.466.708-2.075.177-.647-.56-.745-1.574-.218-2.262.032-.043.066-.083.103-.122l3.475-3.708a.553.553 0 000-.744z" fill-rule="evenodd" clip-rule="evenodd"/></svg>',
            },
            rewind: '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-rewind" viewBox="0 0 1024 1024" focusable="false"><path d="M455.68 262.712889l-67.072 79.644444-206.904889-174.08 56.775111-38.627555a468.48 468.48 0 1 1-201.216 328.817778l103.310222 13.141333a364.487111 364.487111 0 0 0 713.614223 139.605333 364.373333 364.373333 0 0 0-479.971556-435.541333l-14.904889 5.973333 96.312889 81.066667zM329.955556 379.505778h61.610666v308.167111H329.955556zM564.167111 364.088889c61.269333 0 110.933333 45.511111 110.933333 101.717333v135.566222c0 56.149333-49.664 101.660444-110.933333 101.660445s-110.933333-45.511111-110.933333-101.660445V465.749333c0-56.149333 49.664-101.660444 110.933333-101.660444z m0 56.490667c-27.249778 0-49.322667 20.252444-49.322667 45.226666v135.566222c0 24.974222 22.072889 45.169778 49.322667 45.169778 27.192889 0 49.265778-20.195556 49.265778-45.169778V465.749333c0-24.917333-22.072889-45.169778-49.265778-45.169777z" p-id="7377"></path></svg>',
            forward: '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-forward" viewBox="0 0 1024 1024" focusable="false"><path d="M561.948444 262.712889l67.015112 79.644444 206.961777-174.08-56.832-38.627555a468.48 468.48 0 1 0 201.216 328.817778l-103.310222 13.141333a364.487111 364.487111 0 0 1-713.557333 139.605333 364.373333 364.373333 0 0 1 479.971555-435.541333l14.904889 5.973333-96.369778 81.066667zM329.955556 379.505778h61.610666v308.167111H329.955556zM564.167111 364.088889c61.269333 0 110.933333 45.511111 110.933333 101.717333v135.566222c0 56.149333-49.664 101.660444-110.933333 101.660445s-110.933333-45.511111-110.933333-101.660445V465.749333c0-56.149333 49.664-101.660444 110.933333-101.660444z m0 56.490667c-27.249778 0-49.322667 20.252444-49.322667 45.226666v135.566222c0 24.974222 22.072889 45.169778 49.322667 45.169778 27.192889 0 49.265778-20.195556 49.265778-45.169778V465.749333c0-24.917333-22.072889-45.169778-49.265778-45.169777z" p-id="7407"></path></svg>',
            download: '<svg xmlns="http://www.w3.org/2000/svg" class="jw-svg-icon jw-svg-icon-download" viewBox="0 0 512 512"><path d="M412.907 214.08C398.4 140.693 333.653 85.333 256 85.333c-61.653 0-115.093 34.987-141.867 86.08C50.027 178.347 0 232.64 0 298.667c0 70.72 57.28 128 128 128h277.333C464.213 426.667 512 378.88 512 320c0-56.32-43.84-101.973-99.093-105.92zM256 384L149.333 277.333h64V192h85.333v85.333h64L256 384z"/></svg>',
        },
        customCSS: "<style>.jwplayer.jw-state-buffering .jw-display-icon-display .jw-icon .jw-svg-icon-buffer{color:" + pConf.playerColor + '!important}.jw-sharing-link:active,.jw-sharing-copy:active.jw-sharing-link:hover,.jw-button-color.jw-toggle.jw-off:active:not(.jw-icon-cast),.jw-button-color.jw-toggle.jw-off:focus:not(.jw-icon-cast),.jw-button-color.jw-toggle.jw-off:hover:not(.jw-icon-cast),.jw-button-color.jw-toggle:not(.jw-icon-cast),.jw-button-color:active:not(.jw-icon-cast),.jw-button-color:focus:not(.jw-icon-cast),.jw-button-color:hover:not(.jw-icon-cast),.jw-button-color[aria-expanded=true]:not(.jw-icon-cast),.jw-settings-content-item.jw-settings-item-active,.jw-settings-menu .jw-icon.jw-button-color[aria-checked="true"] .jw-svg-icon{fill:' + pConf.playerColor + ";color:" + pConf.playerColor + ";background-color:transparent}</style>",
    },
    gdPlyr = {
        container: "#videoContainer",
        player: null,
        hlsjs: null,
        shakaPlayer: null,
        videoType: "mp4",
        sources: [],
        tracks: [],
        config: {
            iconPrefix: "gdp",
            ratio: "16:9",
            controls: ["play-large", "pause-large", "rewind", "play", "fast-forward", "mute", "volume", "live", "progress", "current-time", "duration"],
            settings: ["quality", "captions"],
            ads: {
                enabled: false,
                tagUrl: "",
            },
            urls: {
                download: "",
            },
            captions: {
                active: true,
                update: true,
            },
            tooltips: {
                controls: true,
                seek: true,
            },
            iconUrl: pConf.baseURL + "assets/img/plyr-custom.svg",
            blankVideo: pConf.baseURL + "assets/vendor/plyr/blank.mp4",
            autoplay: pConf.autoplay,
            muted: pConf.mute,
            preload: pConf.preload,
            poster: poster,
            loop: {
                active: pConf.repeat,
            },
        },
        destroy: function () {
            if (gdPlyr.hlsjs) {
                gdPlyr.hlsjs.destroy();
                gdPlyr.hlsjs = null;
            }
            if (gdPlyr.shakaPlayer) {
                gdPlyr.shakaPlayer.detach();
                gdPlyr.shakaPlayer.unload();
                gdPlyr.shakaPlayer.destroy();
                gdPlyr.shakaPlayer = null;
            }
            if (gdPlyr.player) {
                gdPlyr.player.destroy();
                gdPlyr.player = null;
            }
        },
        init: function () {
            var lang = window.navigator.languages ? window.navigator.languages[0] : "en";
            lang = lang || window.navigator.language || window.navigator.browserLanguage || window.navigator.userLanguage;
            $.ajax({
                url: pConf.baseURL + "assets/vendor/plyr/translations/" + lang.substring(0, 2) + ".json",
                dataType: "json",
                timeout: 60000,
                success: function (res) {
                    gdPlyr.config.i18n = res;
                    gdPlyr.loadPlayer();
                },
                error: function () {
                    gdPlyr.loadPlayer();
                },
            });
        },
        loadPlayer: function () {
            xStorage.removeItem("plyr");
            shaka.polyfill.installAll();
            if (gdPlyr.videoType === "hls" && Hls.isSupported()) {
                gdPlyr.hls.load(gdPlyr.sources[0].file);
            } else if (gdPlyr.videoType === "mpd" && shaka.Player.isBrowserSupported()) {
                gdPlyr.mpd.load(gdPlyr.sources[0].file);
            } else if (gdPlyr.videoType.indexOf("mp4") > -1) {
                gdPlyr.mp4.load();
            } else {
                gdPlyr.msg.custom("This browser is not supported");
            }
        },
        defaultRes: function (sizes) {
            var label = 360,
                result = label;
            $.each(sizes, function (i, e) {
                if (e >= 1000) label = 1000;
                else if (e >= 900) label = 900;
                else if (e >= 800) label = 800;
                else if (e >= 700) label = 700;
                else if (e >= 600) label = 600;
                else if (e >= 500) label = 500;
                else if (e >= 400) label = 400;
                else if (e >= 300) label = 300;
                else if (e >= 200) label = 200;
                else if (e >= 100) label = 100;
                if (label === pConf.defaultResolution) {
                    result = e;
                    return false;
                }
            });
            return result;
        },
        shortQualities: function (a, b) {
            var x = a.toString().split("."),
                y = b.toString().split(".");
            if (Math.floor(x[0]) === Math.floor(y[0])) {
                return Math.floor(x[1]) - Math.floor(y[1]);
            } else {
                return Math.floor(x[0]) - Math.floor(y[0]);
            }
        },
        resumeChecker: function () {
            var timeFormat = "";
            latestPlayTime = xStorage.getItem(latestPlayKey);
            if (!isLive && pConf.resumePlayback && gdPlyr.player.currentTime < Math.floor(latestPlayTime)) {
                timeFormat = prettySecond(latestPlayTime);
                $timez.text(timeFormat);
                $myConfirm.text($myConfirm.text().replace("hh:mm:ss", timeFormat));
                $resume.show();
            }
        },
        resumePlayback: function () {
            gdPlyr.player.currentTime = Math.floor(xStorage.getItem(latestPlayKey));
            gdPlyr.player.play();
            $resume.hide();
        },
        defaultEvents: function (p) {
            p.speed = 1;
            p.poster = poster;
            p.once("play", visitDirectAds);
            p.once("ended", function () {
                xStorage.removeItem(latestPlayKey);
                if (statLogInterval) {
                    clearInterval(statLogInterval);
                    statLogInterval = false;
                }
                gtagReport("video_complete", "Playback Has Ended", "plyr", false);
            });
            p.once("playing", function (e) {
                gdPlyr.resumeChecker();
            });
            p.on("timeupdate", function () {
                latestPlayTime = Math.floor(xStorage.getItem(latestPlayKey));
                if (gdPlyr.player.currentTime > latestPlayTime) {
                    xStorage.setItem(latestPlayKey, Math.round(gdPlyr.player.currentTime));
                    xStorage.removeItem(retryKey);
                }
                if (gdPlyr.player.currentTime >= pConf.statCounterRuntime && !statCounted) {
                    statCounter();
                }
            });
            p.on("enterfullscreen", function () {
                $(".plyr__video-wrapper").attr("style", "");
                $(".plyr video" + gdPlyr.container)
                    .css("position", "absolute")
                    .css("top", 0)
                    .css("bottom", 0);
            });
            p.on("adsloaded", function (e) {
                gdPlyr.ads.createControls();
            });
            p.on("adspause adscontentpause", function (e) {
                gdPlyr.ads.playing = false;
                $("body .plyr-ads-button").eq(0).removeClass("plyr__control--pressed");
            });
            p.on("adsstart adscontentresume", function (e) {
                gdPlyr.ads.playing = true;
                $("body .plyr-ads-button").eq(0).addClass("plyr__control--pressed");
            });
        },
        html: {
            qualityButtons: 'body button[data-plyr="quality"]',
            autoSpan: 'body button[data-plyr="quality"][value="0"] span',
            loadTitle: function ($plyr, attrStyle) {
                $plyr.append('<div class="plyr-title" style="' + attrStyle + '">' + title + "</div>");
            },
            createOverlaidButton: function (id, label, onclick, text) {
                return '<button type="button" class="plyr__control plyr__control--overlaid" data-plyr="' + id + '" aria-label="' + label + '" onclick="' + onclick + '">' + text + "</button>";
            },
            loadCustomHTML: function () {
                var titleStyles = [],
                    $this = $(".plyr"),
                    $video = $this.find("video"),
                    logoPos = pConf.logoPosition,
                    logoImg = pConf.logoImage,
                    logoMargin = pConf.logoMargin,
                    $logo = $('<a class="plyr-logo plyr-logo-' + logoPos + " " + (pConf.logoHide ? "plyr-logo-hide" : "") + '" href="' + pConf.logoLink + '" target="_blank"></a>'),
                    $img = $('<img alt="Logo" />'),
                    $controls = $(".plyr__controls"),
                    $customControls = $('<div class="plyr__custom__controls"></div>'),
                    seektime = gdPlyr.config.seekTime,
                    rewindText = gdPlyr.config.i18n.rewind.replace("{seektime}", seektime),
                    forwardText = gdPlyr.config.i18n.fastForward.replace("{seektime}", seektime);
                $video.attr("poster", poster);
                $video.addClass("plyr-stretch-" + pConf.stretching);
                $controls.append($customControls);
                $customControls.append($(".plyr__controls > *"));
                $controls.prepend($customControls.find(".plyr__progress__container"));
                if (logoImg !== "") {
                    if (logoPos.indexOf("top-left") > -1) {
                        titleStyles.push("left:");
                    } else if (logoPos.indexOf("top-right") > -1) {
                        titleStyles.push("margin-right:");
                    }
                    $this.append($logo);
                    $logo.append($img);
                    $img.attr("src", logoImg).on("load", function (e) {
                        titleStyles.push(e.currentTarget.width + logoMargin);
                        titleStyles.push("px");
                        if (pConf.displayTitle) {
                            gdPlyr.html.loadTitle($this, titleStyles.join(""));
                        }
                    });
                } else if (pConf.displayTitle) {
                    gdPlyr.html.loadTitle($this, "");
                }
                $("a[data-plyr=download]").removeAttr("download");
                $("body .plyr__control--overlaid")
                    .html($('button[data-plyr="play"]').html())
                    .before(gdPlyr.html.createOverlaidButton("rewind", rewindText, "gdPlyr.player.rewind()", $('button[data-plyr="rewind"]').html()))
                    .after(gdPlyr.html.createOverlaidButton("fast-forward", forwardText, "gdPlyr.player.forward()", $('button[data-plyr="fast-forward"]').html()));
                gdPlyr.mediaSession.load();
                showPlayer();
                gtagReport("video_ready_to_play", "Ready To Play", "plyr", false);
            },
            loadExternalTracks: function () {
                var loadTimeout;
                if (gdPlyr.tracks.length > 0) {
                    $.each(gdPlyr.tracks, function (i, e) {
                        $(".plyr video" + gdPlyr.container).append('<track kind="captions" src="' + e.file.replace("https:", "").replace("http:", "") + '" label="' + e.label + '">');
                    });
                    loadTimeout = setTimeout(function () {
                        gdPlyr.html.hideTextTracks();
                        gdPlyr.player.currentTrack = 0;
                        clearTimeout(loadTimeout);
                    }, 300);
                }
            },
            hideTextTracks: function () {
                var textTracks = document.querySelector(gdPlyr.container).textTracks;
                if (textTracks.length > 0) {
                    textTracks.forEach(function (e, i) {
                        e.mode = "hidden";
                    });
                }
            },
            loadAudio: function (audioButtons, clickCallback) {
                var menuId = $(".plyr__menu__container").attr("id").replace("plyr-settings-", ""),
                    menuItem = "plyr-settings-" + menuId,
                    audioMenu = menuItem + "-audio",
                    audioText = gdPlyr.player.config.i18n.audio,
                    $homeSetting = $("#" + menuItem + "-home"),
                    audioBtnHtml = "",
                    audioDefault = "";

                audioDefault = audioButtons.find(function (e) {
                    return e.checked === "true";
                }).name;
                $.each(audioButtons, function (i, e) {
                    audioBtnHtml += '<button data-plyr="audio" type="button" role="menuitemradio" class="plyr__control" aria-checked="' + e.checked + '" value="' + e.id + '"><span>' + e.name + (e.lang !== "" ? '<span class="plyr__menu__value"><span class="plyr__badge">' + e.lang + "</span></span>" : "") + "</span></button>";
                });
                $homeSetting.find("div[role=menu]").prepend('<button type="button" id="btnAudio' + menuId + '" data-plyr="settings" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true"><span>' + audioText + '<span class="plyr__menu__value">' + audioDefault + "</span></span></button>");

                $homeSetting.after('<div id="' + audioMenu + '" hidden><button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">' + audioText + '</span><span class="plyr__sr-only">Go back to previous menu</span></button><div role="menu">' + audioBtnHtml + "</div></div>");

                $("button#btnAudio" + menuId).click(function () {
                    $("#" + audioMenu).prop("hidden", false);
                    $homeSetting.prop("hidden", true);
                });

                $("#" + audioMenu + " .plyr__control--back").click(function () {
                    $("#" + audioMenu).prop("hidden", true);
                    $homeSetting.prop("hidden", false);
                });

                $('body button[data-plyr="audio"]').click(function () {
                    $('button[data-plyr="audio"]').attr("aria-checked", "false");
                    $(this).attr("aria-checked", "true");
                    $("button#btnAudio" + menuId)
                        .find(".plyr__menu__value")
                        .text($(this).text().replace($(this).find(".plyr__badge").text(), "").trim());
                    $("#" + audioMenu).prop("hidden", true);
                    $homeSetting.prop("hidden", false);
                    clickCallback($(this).val());
                });
            },
        },
        hls: {
            currentTime: 0,
            audioGroupSelected: null,
            textGroupSelected: null,
            levelsAllowed: [],
            audioTracksAllowed: [],
            textTracksAllowed: [],
            config: {
                debug: !pConf.productionMode,
                defaultAudioCodec: "mp4a.40.2",
            },
            events: {
                ready: function (e) {
                    gdPlyr.html.loadCustomHTML();
                    gdPlyr.hls.loadAudio();
                    $(gdPlyr.html.qualityButtons).click(function () {
                        var data = $(this).val().split("."),
                            levelIdx = -1,
                            height = typeof data[0] !== "undefined" ? Math.floor(data[0]) : 0,
                            bitrate = typeof data[1] !== "undefined" ? Math.floor(data[1]) : 0,
                            audio = typeof data[2] !== "undefined" ? data[2] : "",
                            subtitle = typeof data[3] !== "undefined" ? data[3] : "";
                        levelIdx = gdPlyr.hlsjs.levels.findIndex(function (e) {
                            return height > 0 && e.height === height && bitrate > 0 && e.bitrate === bitrate && (typeof e.textGroupIds === subtitle || e.textGroupIds.indexOf(subtitle) > -1) && (typeof e.audioGroupIds === audio || e.audioGroupIds.indexOf(audio) > -1);
                        });
                        gdPlyr.hlsjs.currentLevel = levelIdx;
                        gdPlyr.hls.showLevelText();
                    });
                },
                loadedMetadata: function (e) {
                    var textTracks = document.querySelector(gdPlyr.container).textTracks,
                        level = gdPlyr.hlsjs.levels[0],
                        currentTrack = -1;
                    isLive = typeof level.details !== "undefined" && "live" in level.details && level.details.live;
                    if (isLive) {
                        $(".plyr--full-ui").addClass("plyr--live");
                    }
                    if (textTracks.length === 0) {
                        gdPlyr.html.loadExternalTracks();
                    } else if (gdPlyr.hls.textTracksAllowed.length > 0) {
                        gdPlyr.html.hideTextTracks();
                        currentTrack = gdPlyr.hls.textTracksAllowed[0];
                        gdPlyr.player.currentTrack = currentTrack;
                        gdPlyr.hlsjs.subtitleTrack = gdPlyr.hlsjs.subtitleTracks[currentTrack].id;
                        $.each(gdPlyr.hlsjs.subtitleTracks, function (i, e) {
                            if (gdPlyr.hls.textTracksAllowed.indexOf(e.id) === -1) {
                                $('button[data-plyr="language"][value="' + i + '"]').hide();
                            }
                        });
                    }
                },
                captionsEnabled: function (e) {
                    gdPlyr.html.hideTextTracks();
                    if (gdPlyr.hls.textTracksAllowed.length > 0) {
                        gdPlyr.player.currentTrack = gdPlyr.hls.textTracksAllowed[0];
                    }
                    gdPlyr.hlsjs.subtitleTrack = gdPlyr.player.currentTrack;
                },
                languageChange: function (e) {
                    gdPlyr.html.hideTextTracks();
                    gdPlyr.hlsjs.subtitleTrack = gdPlyr.player.currentTrack;
                },
                levelUpdated: function (e, d) {
                    if (gdPlyr.hls.audioTracksAllowed.length > 0 && "level" in d && gdPlyr.hls.levelsAllowed.indexOf(d.level) === -1 && typeof gdPlyr.hlsjs.levels[d.level] !== "undefined") {
                        gdPlyr.hlsjs.stopLoad();
                        gdPlyr.hlsjs.removeLevel(d.level, gdPlyr.hlsjs.levels[d.level].urlId);
                        gdPlyr.hls.updateLevelsAllowed();
                        gdPlyr.hlsjs.startLoad(gdPlyr.hls.currentTime);
                        gdPlyr.hlsjs.audioTrack = $('button[data-plyr="audio"][aria-checked="true"]').val();
                    }
                    gdPlyr.hls.showLevelText();
                },
                tracksUpdated: function (e, d) {
                    if (d.subtitleTracks.length > 0) {
                        gdPlyr.html.hideTextTracks();
                        gdPlyr.hls.textTracksAllowed = d.subtitleTracks
                            .filter(function (e) {
                                return e.groupId === gdPlyr.hls.textGroupSelected;
                            })
                            .map(function (e) {
                                return e.id;
                            });
                    }
                },
                manifestParsed: function (e, d) {
                    var levelsSelector = gdPlyr.hls.createLevelSelector(),
                        levelSelected = -1;
                    gdPlyr.hls.updateLevelsAllowed();
                    gdPlyr.hls.audioParsed();
                    if (gdPlyr.hls.levelsAllowed.length > 1) {
                        levelSelected = gdPlyr.hls.levelsAllowed[0];
                        gdPlyr.hlsjs.loadLevel = levelSelected;
                        gdPlyr.hlsjs.startLevel = levelSelected;
                        gdPlyr.hlsjs.nextLevel = gdPlyr.hls.levelsAllowed[1];
                        gdPlyr.hlsjs.nextLoadLevel = gdPlyr.hls.levelsAllowed[1];
                        levelsSelector.sort(gdPlyr.shortQualities);
                        gdPlyr.config.quality = {
                            default: 0,
                            options: levelsSelector,
                            forced: true,
                        };
                    }
                    gdPlyr.player = new Plyr(gdPlyr.container, gdPlyr.config);
                    gdPlyr.defaultEvents(gdPlyr.player);
                    gdPlyr.player.on("ready", gdPlyr.hls.events.ready);
                    gdPlyr.player.on("loadedmetadata", gdPlyr.hls.events.loadedMetadata);
                    gdPlyr.player.on("captionsenabled", gdPlyr.hls.events.captionsEnabled);
                    gdPlyr.player.on("languagechange", gdPlyr.hls.events.languageChange);
                },
                error: function (e, d) {
                    var $servers = $("#servers li"),
                        serverLen = $servers.length,
                        index = -1;
                    retryNumber = getRetryNumber() + 1;
                    if (d.type === "mediaError") {
                        var level = gdPlyr.hlsjs.currentLevel;
                        if (gdPlyr.hls.audioTracksAllowed.length > 0 && level > -1 && gdPlyr.hls.levelsAllowed.indexOf(level) === -1 && typeof gdPlyr.hlsjs.levels[level] !== "undefined") {
                            gdPlyr.hlsjs.stopLoad();
                            gdPlyr.hlsjs.removeLevel(level, gdPlyr.hlsjs.levels[level].urlId);
                            gdPlyr.hls.updateLevelsAllowed();
                            gdPlyr.hlsjs.startLoad(gdPlyr.hls.currentTime);
                            gdPlyr.hlsjs.audioTrack = $('button[data-plyr="audio"][aria-checked="true"]').val();
                        }
                        gdPlyr.hls.showLevelText();
                    } else if (d.fatal) {
                        showLoading();
                        if (typeof $servers !== "undefined" && serverLen > 1) {
                            index = $("#servers li a").index($(".active"));
                            if (index < serverLen - 1) {
                                location.href = $servers
                                    .eq(index + 1)
                                    .find("a")
                                    .attr("href");
                            } else if (d.error && "message" in d.error) {
                                gdPlyr.msg.custom("HLS.js Error! " + d.error.message);
                            } else {
                                failed();
                            }
                        } else if (retryNumber < 3) {
                            retry(retryNumber);
                        } else {
                            failed();
                        }
                    }
                },
            },
            loadAudio: function () {
                var audioTracks = gdPlyr.hlsjs.audioTracks,
                    audioButtons = [];
                if (audioTracks.length > 1) {
                    $.each(audioTracks, function (i, e) {
                        if (typeof e.groupId !== "undefined" && (e.groupId === gdPlyr.hls.audioGroupSelected || typeof e.audioCodec === "undefined")) {
                            audioButtons.push({
                                id: e.id,
                                name: e.name,
                                lang: typeof e.lang !== "undefined" ? e.lang.toUpperCase() : "",
                                checked: e.default ? "true" : "false",
                            });
                        }
                    });
                    gdPlyr.html.loadAudio(audioButtons, function (id) {
                        gdPlyr.hlsjs.audioTrack = Number(id);
                    });
                }
            },
            createLevelText: function (e) {
                var qualityText = [];
                if ("height" in e) {
                    qualityText.push(e.height);
                }
                if ("bitrate" in e) {
                    qualityText.push(e.bitrate);
                }
                if (typeof e.audioGroupIds !== "undefined") {
                    qualityText.push(e.audioGroupIds[0]);
                } else {
                    qualityText.push("undefined");
                }
                if (typeof e.textGroupIds !== "undefined") {
                    qualityText.push(e.textGroupIds[0]);
                } else {
                    qualityText.push("undefined");
                }
                return qualityText.join(".");
            },
            createLevelSelector: function () {
                var levels = gdPlyr.hlsjs.levels,
                    levelsSelector = [0];
                if (levels.length > 0) {
                    $.each(levels, function (i, e) {
                        if (typeof e.audioCodec === "undefined" || (typeof e.audioCodec !== "undefined" && e.audioCodec.indexOf("mp4a") > -1)) {
                            levelsSelector.push(gdPlyr.hls.createLevelText(e));
                        }
                    });
                }
                return levelsSelector;
            },
            showLevelText: function () {
                var text = gdPlyr.config.i18n.auto,
                    $menuQuality = $('body button[data-plyr="settings"]:contains("' + gdPlyr.config.i18n.quality + '") > span > span'),
                    level = {};
                if (gdPlyr.hlsjs.currentLevel > -1) {
                    level = gdPlyr.hlsjs.levels[gdPlyr.hlsjs.currentLevel];
                    if (typeof level !== "undefined" && "height" in level) {
                        text = level.height + "p";
                    }
                }
                $menuQuality.text(text);
            },
            updateLevelsAllowed: function () {
                var levels = gdPlyr.hlsjs.levels,
                    latestLevel = -1,
                    levelsLength = 0;
                gdPlyr.hls.levelsAllowed = [];
                if (levels.length > 0) {
                    $.each(levels, function (i, e) {
                        if (typeof e.audioCodec !== "undefined" && e.audioCodec.indexOf("mp4a") > -1) {
                            if (typeof e.audioGroupIds !== "undefined") {
                                gdPlyr.hls.audioGroupSelected = e.audioGroupIds[0];
                            }
                            if (typeof e.textGroupIds !== "undefined") {
                                gdPlyr.hls.textGroupSelected = e.textGroupIds[0];
                            }
                            gdPlyr.hls.levelsAllowed.push(i);
                        } else if (typeof e.audioCodec === "undefined") {
                            gdPlyr.hls.levelsAllowed.push(i);
                        }
                    });
                    gdPlyr.hlsjs.startLevel = gdPlyr.hls.levelsAllowed[0];
                    levelsLength = gdPlyr.hls.levelsAllowed.length;
                }
                if (levelsLength > 1) {
                    latestLevel = gdPlyr.hls.levelsAllowed[levelsLength - 1];
                    gdPlyr.hlsjs.nextLevel = latestLevel;
                    gdPlyr.hlsjs.nextLoadLevel = latestLevel;
                }
                gdPlyr.hlsjs.currentLevel = -1;
            },
            audioParsed: function () {
                var audioTracks = gdPlyr.hlsjs.audioTracks;
                if (audioTracks.length > 1) {
                    gdPlyr.hls.audioTracksAllowed = audioTracks
                        .filter(function (e) {
                            return gdPlyr.hls.audioGroupSelected === null || (gdPlyr.hls.audioGroupSelected !== null && e.groupId === gdPlyr.hls.audioGroupSelected);
                        })
                        .map(function (e) {
                            return e.id;
                        });
                    gdPlyr.hlsjs.audioTrack = gdPlyr.hls.audioTracksAllowed[0];
                }
            },
            load: function (source) {
                gdPlyr.destroy();
                gdPlyr.config.source = {
                    type: "hls",
                    src: source,
                };
                if (p2pEnabled) {
                    p2pEngine = new p2pml.hlsjs.Engine(p2pConfig);
                    gdPlyr.hls.config.liveSyncDuration = 7;
                    gdPlyr.hls.config.loader = p2pEngine.createLoaderClass();
                }
                gdPlyr.hlsjs = new Hls(gdPlyr.hls.config);
                if (p2pEnabled) {
                    p2pml.hlsjs.initHlsJsPlayer(gdPlyr.hlsjs);
                }
                gdPlyr.hlsjs.loadSource(gdPlyr.config.source.src);
                gdPlyr.hlsjs.attachMedia(document.querySelector(gdPlyr.container));
                gdPlyr.hlsjs.on(Hls.Events.MANIFEST_PARSED, gdPlyr.hls.events.manifestParsed);
                gdPlyr.hlsjs.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, gdPlyr.hls.events.tracksUpdated);
                gdPlyr.hlsjs.on(Hls.Events.LEVEL_LOADED, gdPlyr.hls.events.levelUpdated);
                gdPlyr.hlsjs.on(Hls.Events.LEVEL_SWITCHED, gdPlyr.hls.events.levelUpdated);
                gdPlyr.hlsjs.on(Hls.Events.LEVEL_UPDATED, gdPlyr.hls.events.levelUpdated);
                gdPlyr.hlsjs.on(Hls.Events.ERROR, gdPlyr.hls.events.error);
            },
        },
        mpd: {
            config: {
                abr: {
                    enabled: true,
                },
                manifest: {
                    dash: {
                        autoCorrectDrift: true,
                        ignoreEmptyAdaptationSet: true,
                    },
                },
                streaming: {
                    rebufferingGoal: 0.01,
                },
            },
            events: {
                promiseCallback: function (e) {
                    var qualitySelector = [0],
                        variantTracks = gdPlyr.shakaPlayer.getVariantTracks(),
                        textTracks = gdPlyr.shakaPlayer.getTextTracks(),
                        qualityText = [],
                        $video = document.querySelector(gdPlyr.container);
                    $.each(variantTracks, function (i, e) {
                        qualityText = [];
                        if ("height" in e) {
                            qualityText.push(e.height);
                        }
                        if ("bandwidth" in e) {
                            qualityText.push(e.bandwidth);
                        }
                        if ("language" in e) {
                            qualityText.push(e.language);
                        }
                        qualitySelector.push(qualityText.join("."));
                    });
                    if (qualitySelector.length > 1) {
                        qualitySelector.sort(gdPlyr.shortQualities);
                        gdPlyr.config.quality = {
                            default: 0,
                            options: qualitySelector,
                            forced: true,
                        };
                        gdPlyr.mpd.variantChange(0);
                    }
                    if (textTracks.length > 0) {
                        $.each(textTracks, function (i, e) {
                            var addTextTrack = $video.addTextTrack("subtitles", e.label ? e.label : e.language, e.language);
                            addTextTrack.id = e.id;
                            addTextTrack.mode = "hidden";
                        });
                    }
                    gdPlyr.player = new Plyr(gdPlyr.container, gdPlyr.config);
                    gdPlyr.defaultEvents(gdPlyr.player);
                    gdPlyr.player.on("ready", gdPlyr.mpd.events.ready);
                    gdPlyr.player.on("loadedmetadata", gdPlyr.mpd.events.loadedMetadata);
                    gdPlyr.player.on("languagechange", gdPlyr.mpd.events.languageChange);
                    gdPlyr.player.on("qualitychange", gdPlyr.mpd.events.qualityChange);
                    gdPlyr.shakaPlayer.addEventListener("adaptation", function () {
                        gdPlyr.html.showVariantText();
                    });
                },
                errorCallback: function (e) {
                    var $servers = $("#servers li"),
                        serverLen = $servers.length,
                        index = -1,
                        err = {};
                    retryNumber = getRetryNumber() + 1;
                    showLoading();
                    if (typeof $servers !== "undefined" && serverLen > 1) {
                        index = $("#servers li a").index($(".active"));
                        if (index < serverLen - 1) {
                            location.href = $servers
                                .eq(index + 1)
                                .find("a")
                                .attr("href");
                        } else if (typeof e !== "undefined" && "name" in e && "description" in e) {
                            $("#message").css("font-size", "16px");
                            gdPlyr.msg.custom("ShakaPlayer Error! " + e.name + ", " + e.description);
                        } else {
                            showPlayer();
                        }
                    } else if (retryNumber <= 3) {
                        retry(retryNumber);
                    } else if (typeof e !== "undefined" && "code" in e) {
                        err = gdPlyr.mpd.errorDetail(e.code);
                        $("#message").css("font-size", "16px");
                        gdPlyr.msg.custom("ShakaPlayer.js Error! " + err.name + ", " + err.description);
                    } else {
                        showPlayer();
                    }
                },
                ready: function (e) {
                    gdPlyr.html.loadCustomHTML();
                    gdPlyr.mpd.loadAudio();
                    $(gdPlyr.html.qualityButtons).click(function () {
                        gdPlyr.mpd.variantChange($(this).val());
                    });
                },
                loadedMetadata: function (e) {
                    var textTracks = document.querySelector(gdPlyr.container).textTracks;
                    isLive = $(".plyr__time--duration").text() === "00:00";
                    if (isLive) {
                        $(".plyr--full-ui").addClass("plyr--live");
                    }
                    if (textTracks.length > 1) {
                        $('body button[data-plyr="language"][value="0"]').hide();
                        gdPlyr.mpd.enableDefaultTextTrack();
                    } else {
                        gdPlyr.html.loadExternalTracks();
                    }
                },
                languageChange: function (e) {
                    var index = gdPlyr.player.currentTrack,
                        textTracks = gdPlyr.shakaPlayer.getTextTracks(),
                        selected = {};
                    gdPlyr.html.hideTextTracks();
                    if (index > 0) {
                        selected = textTracks[index - 1];
                        gdPlyr.player.currentTrack = 0;
                        gdPlyr.shakaPlayer.selectTextTrack(selected);
                        gdPlyr.shakaPlayer.setTextTrackVisibility(true);
                        gdPlyr.mpd.showTextTrackLabel(index, selected);
                    } else {
                        gdPlyr.player.currentTrack = -1;
                        gdPlyr.shakaPlayer.setTextTrackVisibility(false);
                    }
                },
                qualityChange: function (e) {
                    gdPlyr.mpd.variantChange(gdPlyr.player.quality);
                    gdPlyr.html.showVariantText();
                },
            },
            showTextTrackLabel: function (i, e) {
                $('button[data-plyr="language"]').attr("aria-checked", "false");
                $('button[data-plyr="language"][value="' + i + '"]').attr("aria-checked", "true");
                $('button[data-plyr="settings"]:contains(' + gdPlyr.config.i18n.captions + ") > span > span").text(e.label ? e.label : e.language);
            },
            enableDefaultTextTrack: function () {
                var textTracks = document.querySelector(gdPlyr.container).textTracks;
                if (textTracks.length > 0) {
                    gdPlyr.html.hideTextTracks();
                    gdPlyr.player.currentTrack = 0;
                    gdPlyr.shakaPlayer.selectTextTrack(textTracks[0]);
                    gdPlyr.shakaPlayer.setTextTrackVisibility(true);
                    gdPlyr.mpd.showTextTrackLabel(1, textTracks[0]);
                }
            },
            errorDetail: function (code) {
                if (typeof code !== "undefined" && typeof shakaErrorCodes !== "undefined") {
                    return shakaErrorCodes.find(function (obj) {
                        return obj.code === code;
                    });
                }
                return {
                    code: undefined,
                    name: "Browser Error",
                    description: "Failed to init decoder",
                };
            },
            filterVariantByAudio: function (language) {
                $(gdPlyr.html.qualityButtons).each(function (i, e) {
                    var val = $(this).val();
                    if (val.indexOf("." + language) > -1 || val === "0") {
                        $(this).show();
                    } else {
                        $(this).hide();
                    }
                });
            },
            loadAudio: function () {
                var shakaConfig = gdPlyr.mpd.config,
                    variantTracks = gdPlyr.shakaPlayer.getVariantTracks(),
                    audioList = [],
                    audioButtons = [];
                if (variantTracks.length > 1) {
                    $.each(variantTracks, function (i, e) {
                        if (audioList.indexOf(e.language) === -1) {
                            audioList.push(e.language);
                            audioButtons.push({
                                id: e.language,
                                name: e.label ? e.label : e.language,
                                lang: e.language.toUpperCase(),
                                checked: e.active || i === 0 ? "true" : "false",
                            });
                        }
                    });
                    gdPlyr.mpd.filterVariantByAudio(
                        audioButtons.find(function (e) {
                            return e.checked === "true";
                        }).id
                    );
                }
                gdPlyr.html.loadAudio(audioButtons, function (language) {
                    var selected = variantTracks.find(function (e) {
                        return e.type === "variant" && e.language === language;
                    });
                    shakaConfig.abr.enabled = false;
                    gdPlyr.shakaPlayer.configure(shakaConfig);
                    gdPlyr.shakaPlayer.selectVariantTrack(selected, true);
                    gdPlyr.mpd.filterVariantByAudio(language);
                    gdPlyr.mpd.showVariantText();
                });
            },
            showVariantText: function () {
                var $menuQuality = $('body button[data-plyr="settings"]:contains(' + gdPlyr.config.i18n.quality + ") > span > span"),
                    variant = gdPlyr.shakaPlayer.getVariantTracks().find(function (e) {
                        return e.active;
                    });
                $menuQuality.text(gdPlyr.config.i18n.auto);
                if (typeof variant !== "undefined" && "height" in variant) {
                    $menuQuality.text(variant.height + "p");
                }
            },
            variantChange: function (selected) {
                var shakaConfig = gdPlyr.mpd.config,
                    variantTracks = gdPlyr.shakaPlayer.getVariantTracks();
                if (selected != "0") {
                    shakaConfig.abr.enabled = false;
                    selected = selected.split(".");
                    selected = variantTracks.findIndex(function (e) {
                        return e.type === "variant" && e.height === Math.floor(selected[0]) && e.bandwidth === Math.floor(selected[1]) && typeof e.language !== "undefined" && e.language === selected[2];
                    });
                    gdPlyr.shakaPlayer.configure(shakaConfig);
                    gdPlyr.shakaPlayer.selectVariantTrack(variantTracks[selected], true);
                } else {
                    shakaConfig.abr.enabled = true;
                    gdPlyr.shakaPlayer.configure(shakaConfig);
                }
                gdPlyr.mpd.showVariantText();
            },
            load: function (source) {
                gdPlyr.destroy();
                gdPlyr.config.source = {
                    type: "mpd",
                    src: source,
                };
                gdPlyr.shakaPlayer = new shaka.Player(document.querySelector(gdPlyr.container));
                gdPlyr.shakaPlayer.configure(gdPlyr.mpd.config);
                if (p2pEnabled) {
                    p2pEngine = new p2pml.shaka.Engine(p2pConfig);
                    p2pEngine.initShakaPlayer(gdPlyr.shakaPlayer);
                }
                gdPlyr.shakaPlayer.load(gdPlyr.config.source.src).then(gdPlyr.mpd.events.promiseCallback).catch(gdPlyr.mpd.events.errorCallback);
            },
        },
        mp4: {
            parser: function () {
                var newSources = [],
                    sizes = [],
                    size = 0,
                    sources = gdPlyr.sources,
                    defaultSize = 360;
                $.each(sources, function (i, e) {
                    if (e.label !== "Default" && e.label !== "Original") {
                        size = Math.floor(e.label.replace("p", ""));
                        sizes.push(size);
                        newSources.push({
                            src: e.file,
                            type: e.type,
                            size: size,
                        });
                    }
                });
                if (newSources.length === 0) {
                    defaultSize = Math.floor(sources[0].label.replace("p", ""));
                    newSources.push({
                        src: sources[0].file,
                        type: sources[0].type,
                        size: defaultSize,
                    });
                } else {
                    defaultSize = gdPlyr.defaultRes(sizes);
                }
                return {
                    default: defaultSize,
                    sources: newSources,
                    sizes: sizes,
                };
            },
            load: function () {
                var newTracks = [],
                    parser = gdPlyr.mp4.parser(),
                    kindAttr = "captions",
                    defaultAttr = false;
                gdPlyr.destroy();
                $.each(gdPlyr.tracks, function (i, e) {
                    if ("kind" in e) {
                        kindAttr = e.kind;
                    }
                    defaultAttr = "default" in e && e.default;
                    newTracks.push({
                        src: e.file,
                        label: e.label,
                        kind: kindAttr,
                        default: defaultAttr,
                    });
                });
                gdPlyr.config.quality = {
                    default: parser.default,
                    options: parser.sizes,
                    forced: true,
                };
                gdPlyr.player = new Plyr(gdPlyr.container, gdPlyr.config);
                gdPlyr.player.source = {
                    type: "video",
                    title: title,
                    sources: parser.sources,
                    tracks: newTracks,
                };
                gdPlyr.defaultEvents(gdPlyr.player);
                gdPlyr.player.on("ready", function () {
                    isLive = false;
                    gdPlyr.html.loadCustomHTML();
                });
                gdPlyr.player.once("loadedmetadata", function (e) {
                    gdPlyr.player.currentTrack = 0;
                });
                gdPlyr.player.once("error", function (e) {
                    var $servers = $("#servers li"),
                        serverLen = $servers.length,
                        index = -1,
                        err = gdPlyr.player.media.error;
                    if (err) {
                        showLoading();
                        retryNumber = getRetryNumber() + 1;
                        index = $("#servers li a").index($(".active"));
                        if (typeof $servers !== "undefined" && serverLen > 1 && index < serverLen - 1) {
                            location.href = $servers
                                .eq(index + 1)
                                .find("a")
                                .attr("href");
                        } else if (retryNumber <= 3) {
                            retry(retryNumber);
                        } else if ("message" in err) {
                            gdPlyr.msg.custom(err.message);
                        } else {
                            failed();
                        }
                    }
                });
            },
        },
        ads: {
            manager: null,
            mute: false,
            fullscreen: false,
            playing: false,
            timer: false,
            createControls: function () {
                var timeRemaining = "0",
                    gdp = gdPlyr.player;
                $resume.hide();
                $(".plyr__ads .plyr__controls").remove();
                $("body .plyr__ads").append('<div class="plyr__controls"><div class="plyr__custom__controls"><button type="button" onclick="gdPlyr.ads.events.togglePlay()" class="plyr__controls__item plyr__control plyr-ads-button">' + $('button[data-plyr="play"]').html() + '</button><button type="button" onclick="gdPlyr.ads.events.toggleMute()" class="plyr__control plyr-ads-button">' + $('button[data-plyr="mute"]').html() + '</button><div class="plyr__controls__item plyr__time--current plyr__time"></div><button type="button" onclick="gdPlyr.ads.events.toggleFullscreen()" class="plyr__controls__item plyr__control plyr-ads-button" style="margin-left:auto">' + $('button[data-plyr="fullscreen"]').html() + "</button></div></div>");
                if (gdp && "ads" in gdp && gdp.ads !== null) {
                    gdPlyr.ads.timer = setInterval(function () {
                        timeRemaining = gdPlyr.config.i18n.advertisement + " - " + prettySecond(Math.floor(gdp.ads.manager.getRemainingTime())).toString();
                        $(".plyr__ads").attr("data-badge-text", timeRemaining);
                        $(".plyr__ads .plyr__time").text(timeRemaining);
                    }, 100);
                }
                $("body .plyr-ads-button").click(function () {
                    $(this).toggleClass("plyr__control--pressed");
                });
            },
            events: {
                togglePlay: function () {
                    var gdp = gdPlyr.player;
                    if (gdPlyr.ads.playing) {
                        gdp.ads.manager.pause();
                        gdPlyr.ads.playing = false;
                    } else {
                        gdp.ads.manager.resume();
                        gdPlyr.ads.playing = true;
                    }
                },
                toggleMute: function () {
                    var gdp = gdPlyr.player;
                    if (gdPlyr.ads.mute) {
                        gdPlyr.ads.mute = false;
                        gdp.ads.manager.setVolume(1);
                        gdp.muted = false;
                    } else {
                        gdPlyr.ads.mute = true;
                        gdp.ads.manager.setVolume(0);
                        gdp.muted = true;
                    }
                },
                toggleFullscreen: function () {
                    var gdp = gdPlyr.player;
                    if (gdPlyr.ads.fullscreen) {
                        gdPlyr.ads.fullscreen = false;
                        gdp.fullscreen.exit();
                    } else {
                        gdPlyr.ads.fullscreen = true;
                        gdp.fullscreen.enter();
                    }
                },
            },
        },
        mediaSession: {
            updatePositionState: function (state) {
                if ("mediaSession" in navigator) {
                    if ("playbackState" in navigator.mediaSession) {
                        navigator.mediaSession.playbackState = state;
                    }
                    if (!isLive && "setPositionState" in navigator.mediaSession) {
                        navigator.mediaSession.setPositionState({
                            duration: gdPlyr.player.duration,
                            playbackRate: gdPlyr.player.speed,
                            position: gdPlyr.player.currentTime,
                        });
                    }
                }
            },
            load: function () {
                if ("mediaSession" in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: title,
                        artwork: [
                            {
                                src: poster,
                            },
                        ],
                    });
                    navigator.mediaSession.setActionHandler("play", function () {
                        gdPlyr.player.play();
                        gdPlyr.mediaSession.updatePositionState("playing");
                    });
                    navigator.mediaSession.setActionHandler("pause", function () {
                        if (isLive) {
                            gdPlyr.player.stop();
                        } else {
                            gdPlyr.player.pause();
                        }
                        gdPlyr.mediaSession.updatePositionState("paused");
                    });
                    navigator.mediaSession.setActionHandler("stop", function () {
                        gdPlyr.player.stop();
                        gdPlyr.mediaSession.updatePositionState("paused");
                    });
                    if (!isLive) {
                        navigator.mediaSession.setActionHandler("seekbackward", function () {
                            gdPlyr.player.rewind();
                            gdPlyr.mediaSession.updatePositionState("none");
                        });
                        navigator.mediaSession.setActionHandler("seekforward", function () {
                            gdPlyr.player.forward();
                            gdPlyr.mediaSession.updatePositionState("none");
                        });
                    }
                }
            },
        },
        msg: {
            notFound: function () {
                showMessage("Sorry this video is unavailable.");
                gtagReport("video_error", "Sources not found", "plyr", false);
            },
            custom: function (msg) {
                showMessage(msg);
                gtagReport("video_error", msg, "plyr", false);
            },
            timeout: function () {
                showMessage('Connection timed out! <a href="javascript:void(0)" onclick="xStorage.clear();location.reload()">Reload Page</a>');
                gtagReport("video_error", "Connection timed out", "plyr", false);
            },
            destroy: function (msg) {
                showMessage(msg + ' <a href="javascript:void(0)" onclick="xStorage.clear();location.reload()">Reload Page</a>');
                gtagReport("video_error", msg, "plyr", false);
            },
        },
        customCSS: "<style>.plyr__captions .plyr__caption{color:" + pConf.captionsColor + "!important}.plyr--audio .plyr__control.plyr__tab-focus,.plyr--video .plyr__control.plyr__tab-focus,.plyr__control.plyr__tab-focus{box-shadow:0 0 0 5px rgba(" + pConf.rgbColor + ",.5)!important}.plyr--full-ui input[type=range].plyr__tab-focus::-webkit-slider-runnable-track{box-shadow:0 0 0 5px rgba(" + pConf.rgbColor + ",.5)!important}.plyr--full-ui input[type=range].plyr__tab-focus::-moz-range-track{box-shadow:0 0 0 5px rgba(" + pConf.rgbColor + ",.5)!important}.plyr--full-ui input[type=range].plyr__tab-focus::-ms-track{box-shadow:0 0 0 5px rgba(" + pConf.rgbColor + ",.5)!important}.plyr--audio .plyr__control.plyr__tab-focus,.plyr--audio .plyr__control:hover,.plyr--audio .plyr__control[aria-expanded=true],.plyr--video .plyr__control.plyr__tab-focus,.plyr--video .plyr__control:hover,.plyr--video .plyr__control[aria-expanded=true],.plyr__control--overlaid:focus,.plyr__control--overlaid:hover,.plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]::before,.lds-ellipsis > div{background:" + pConf.playerColor + "!important}.plyr__control--overlaid{background:rgba(" + pConf.rgbColor + ",.8)!important}.plyr--full-ui input[type=range]{color:" + pConf.playerColor + "!important}</style>",
        loadSuccessCallback: function (res) {
            var $servers = $("#servers li"),
                serverLen = $servers.length,
                index = $("#servers li a").index($(".active"));
            retryNumber = getRetryNumber() + 1;
            if (res.status !== "fail") {
                title = res.title;
                poster = res.poster;
                gdPlyr.tracks = res.tracks;
                if ("filmstrip" in res && res.filmstrip !== "") {
                    gdPlyr.config.previewThumbnails = {
                        enabled: true,
                        src: res.filmstrip,
                    };
                }
                if (res.sources.length > 0) {
                    gdPlyr.sources = res.sources;
                    gdPlyr.videoType = res.sources[0].type;
                    gdPlyr.init();
                } else {
                    gdPlyr.msg.notFound();
                }
            } else if (typeof $servers !== "undefined" && serverLen > 1 && index < serverLen - 1) {
                location.href = $servers
                    .eq(index + 1)
                    .find("a")
                    .attr("href");
            } else if (retryNumber <= 3) {
                retry(retryNumber);
            } else {
                gdPlyr.msg.custom(res.message);
            }
        },
        loadErrorCallback: function (xhr, status) {
            if (status === "timeout") {
                gdPlyr.msg.timeout();
            } else {
                failed();
            }
        },
        adBlockerCallback: function (xhr) {
            window.canRunAds = xhr.status > 0;
            if (pConf.blockADB && !window.canRunAds) {
                gdPlyr.destroy();
                adblockerMessage();
            } else {
                loadSources(gdPlyr.loadSuccessCallback, gdPlyr.loadErrorCallback);
            }
        },
    };

if ("player" in pConf) {
    if (pConf.player.indexOf("jwplayer") > -1) {
        $("head").append(jwp.customCSS);
        jwp.config.skin = jwp.loadSkin();
        if (typeof jwplayer().key === "undefined") {
            jwp.config.key = "ITWMv7t88JGzI0xPwW8I0+LveiXX9SWbfdmt0ArUSyc=";
        }
        if (pConf.enableShare) {
            jwp.config.sharing = {
                sites: ["facebook", "twitter", "pinterest", "tumblr", "linkedin", "reddit", "email"],
            };
        }
        if (window.sandboxed) {
            showMessage("Sandboxed embed is not allowed!");
        } else {
            detectAdblocker(jwp.adBlockerCallback);
        }
        window.jwp = jwp;
        window.customRewind = jwp.rewind;
        window.customForward = jwp.forward;
    } else if (pConf.player.indexOf("plyr") > -1) {
        $("head").append(gdPlyr.customCSS);
        if (haveAds) {
            gdPlyr.config.ads = {
                enabled: true,
                tagUrl: pConf.vastAds.schedule[0].tag,
            };
        }
        if (pConf.showDownloadButton && pConf.enableDownloadPage) {
            gdPlyr.config.controls.push("download");
            gdPlyr.config.urls.download = pConf.downloadLink;
        }
        if (pConf.displayRateControls) {
            gdPlyr.config.settings.push("speed");
        }
        gdPlyr.config.controls.push("captions", "settings", "pip", "googlecast", "airplay", "fullscreen");
        if (window.sandboxed) {
            showMessage("Sandboxed embed is not allowed!");
        } else {
            detectAdblocker(gdPlyr.adBlockerCallback);
        }
        window.gdPlyr = gdPlyr;
    }
} else {
    showMessage("The video player is not recognized!");
}

if (typeof document.isFullscreen === "undefined") {
    document.isFullscreen = function () {
        return !((document.fullScreenElement !== undefined && document.fullScreenElement === null) || (document.msFullscreenElement !== undefined && document.msFullscreenElement === null) || (document.mozFullScreen !== undefined && !document.mozFullScreen) || (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen));
    };
}

window.onorientationchange = function (e) {
    var vid = document.getElementsByTagName("video")[0];
    if (e.landscape) {
        if (vid.requestFullscreen) {
            vid.requestFullscreen();
        } else if (vid.mozRequestFullScreen) {
            vid.mozRequestFullScreen();
        } else if (vid.webkitRequestFullscreen) {
            vid.webkitRequestFullscreen();
        }
    }
};

$(document).ajaxSend(function (res, xhr, opt) {
    if (opt.url.indexOf(pConf.apiURL + "ajax/?action=stat") > -1) {
        if (statCounted) {
            xhr.abort();
        } else {
            statCounted = true;
        }
    }
});

function getRetryNumber() {
    return Math.floor(xStorage.getItem(retryKey));
}

function loadSources(sCallback, eCallback) {
    $.ajax({
        url: pConf.apiURL + "api/?" + pConf.apiQuery,
        type: "GET",
        dataType: "json",
        cache: false,
        timeout: 60000,
        success: sCallback,
        error: eCallback,
    });
}

function sandboxDetector() {
    window.sandboxed = false;
    try {
        if (window.frameElement.hasAttribute("sandbox")) {
            window.sandboxed = true;
        }
        return;
    } catch (t) {}
    try {
        document.domain = document.domain;
    } catch (t) {
        try {
            if (-1 != t.toString().toLowerCase().indexOf("sandbox")) {
                window.sandboxed = true;
            }
            return;
        } catch (t) {}
    }
    try {
        if (!window.navigator.plugins["namedItem"]("Chrome PDF Viewer")) return false;
    } catch (e) {
        return false;
    }
    var e = document.createElement("object");
    e.data = "data:application/pdf;base64,aG1t";
    e.style = "position:absolute;top:-500px;left:-500px;visibility:hidden;";
    e.onerror = function () {
        window.sandboxed = true;
    };
    e.onload = function () {
        e.parentNode.removeChild(e);
    };
    document.body.appendChild(e);
    setTimeout(function () {
        if (e.parentNode !== null) {
            e.parentNode.removeChild(e);
        }
    }, 150);
}

function showMessage(msg) {
    if (msg) {
        $("#message").html(msg);
    }
    $("#mContainer, #message").show();
    $("#loading, .jwplayer, .plyr").hide();
}

function showLoading() {
    $("#mContainer, #message, #loading").show();
    $(".jwplayer, .plyr").hide();
}

function showPlayer() {
    $("#mContainer").hide();
    $(".jwplayer, .plyr").show();
}

function prettySecond(s) {
    var num = Math.floor(s, 10),
        hrs = Math.floor(num / 3600),
        min = Math.floor((num - hrs * 3600) / 60),
        sec = num - hrs * 3600 - min * 60;
    if (hrs < 10) {
        hrs = "0" + hrs;
    }
    if (min < 10) {
        min = "0" + min;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    return hrs + ":" + min + ":" + sec;
}

function gtagReport(event, label, category, interaction) {
    if (typeof gtag !== "undefined") {
        gtag("event", event, {
            event_label: label,
            event_category: category,
            non_interaction: interaction,
        });
    }
}

function failed() {
    showMessage('Failed to fetch video sources from server! <a href="javascript:void(0)" onclick="xStorage.clear();location.reload()">Reload Page</a>');
    gtagReport("video_error", "Failed to fetch video sources from server. Try again", "video_error", false);
}

function retry(retryNumber) {
    xStorage.setItem(retryKey, retryNumber);
    xStorage.setItem("autoplay", true);
    xStorage.removeItem("plyr");
    xStorage.removeItem("jwplayer.qualityLabel");
    $.ajax({
        url: pConf.apiURL + "ajax/?action=clear-cache&data=" + pConf.query + "&token=" + pConf.token,
        method: "GET",
        dataType: "json",
        cache: false,
        timeout: 60000,
        success: function (res) {
            location.reload();
        },
        error: function (xhr, status) {
            failed();
        },
    });
}

function preventOpenDevTools() {
    if ("productionMode" in pConf && pConf.productionMode) {
        console.clear();
        var before = new Date().getTime();
        debugger;
        var after = new Date().getTime();
        if (after - before > 200) {
            $("body").text(" Dont open Developer Tools.");
            location.replace("https://www.google.com");
        }
        setTimeout(preventOpenDevTools, 100);
    }
}

function adblockerMessage() {
    gtagReport("adblocker_error", "Disable AdBlocker Message", "ads", false);
    showMessage('<p><img src="' + pConf.baseURL + 'assets/img/stop-sign-hand.webp" width="100" height="100" alt="Stop AdBlocker"></p><p>Please support us by disabling AdBlocker.</p>');
}

function statCounter() {
    $.ajax({
        url: pConf.apiURL + "ajax/?action=stat&data=" + pConf.query + "&token=" + pConf.token,
        method: "GET",
        dataType: "json",
        cache: false,
        timeout: 60000,
    });
}

function visitDirectAds() {
    if (!pConf.disableDirectAds && pConf.visitAdsOnplay && pConf.directAdsLink !== "" && pConf.directAdsLink !== "#") {
        window.open(pConf.directAdsLink, "_blank");
    }
}

function detectAdblocker(callback) {
    $.ajax({
        url: "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=",
        cache: false,
        timeout: 15,
        complete: callback,
    });
}

$(document).on("contextmenu", function (e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
});

if (pConf.pauseOnLeft) {
    var hidden, visibilityChange;
    if (typeof document.hidden !== "undefined") {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
    }

    if (typeof document.addEventListener !== "undefined" && typeof hidden !== "undefined") {
        document.addEventListener(
            visibilityChange,
            function () {
                if (document[hidden]) {
                    if (jwp.player && jwp.player.getState() === "playing") {
                        jwp.player.pause();
                    } else if (gdPlyr.player && gdPlyr.player.playing) {
                        gdPlyr.player.pause();
                    }
                }
            },
            false
        );
    }
}
