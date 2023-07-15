var main = {
    multiSelectSearch: "<input type='search' class='form-control form-control-sm' autocomplete='off' placeholder='Search'>",
    cookieConfig: {
        domain: "." + document.domain,
        path: "/",
    },
    init: function () {
        // bootstap tooltip init
        loadTooltip();

        // bootstrap custom input init
        bsCustomFileInput.init();

        // datatables default config
        if (typeof $.fn.DataTable !== "undefined") {
            $.fn.DataTable.ext.pager.simple_numbers_no_ellipses = function (page, pages) {
                var numbers = [];
                var buttons = 4;
                var half = Math.floor(buttons / 2);

                var _range = function (len, start) {
                    var end;
                    var out = [];
                    if (typeof start === "undefined") {
                        start = 0;
                    } else {
                        end = start;
                        start = len;
                    }
                    for (var i = start; i < end; i++) {
                        out.push(i);
                    }
                    return out;
                };
                if (pages <= buttons) {
                    numbers = _range(0, pages);
                } else if (page <= half) {
                    numbers = _range(0, buttons);
                } else if (page >= pages - 1 - half) {
                    numbers = _range(pages - buttons, pages);
                } else {
                    numbers = _range(page - half, page + half + 1);
                }
                numbers.DT_el = "span";
                return ["first", "previous", numbers, "next", "last"];
            };

            $.extend(true, $.fn.dataTable.defaults, {
                destroy: true,
                stateSave: true,
                responsive: true,
                processing: true,
                paging: true,
                pagingType: "simple_numbers_no_ellipses",
                deferRender: true,
                rowReorder: true,
                searchDelay: 2000,
                language: {
                    //"url": "//cdn.datatables.net/plug-ins/9dcbecd42ad/i18n/Indonesian.json",
                    decimal: "",
                    emptyTable: "No data available in table",
                    info: "Showing _START_ to _END_ of _TOTAL_ entries",
                    infoEmpty: "Showing 0 to 0 of 0 entries",
                    infoFiltered: "(filtered from _MAX_ total entries)",
                    infoPostFix: "",
                    thousands: ",",
                    lengthMenu: "Show _MENU_ entries",
                    loadingRecords: "Loading...",
                    processing: "Processing...",
                    search: "Search:",
                    zeroRecords: "No matching records found",
                    aria: {
                        sortAscending: ": activate to sort column ascending",
                        sortDescending: ": activate to sort column descending",
                    },
                    paginate: {
                        first: '<i class="fas fa-step-backward"></i>',
                        last: '<i class="fas fa-step-forward"></i>',
                        next: '<i class="fas fa-chevron-right"></i>',
                        previous: '<i class="fas fa-chevron-left"></i>',
                    },
                },
            });
        }

        // owl-carousel init
        $(".carousel").carousel({
            interval: 5000,
            pause: "hover",
        });

        // bootstrap sweetalert2
        $(".sweet-overlay").click(function () {
            $(this).hide();
            $(".sweet-alert").removeClass("showSweetAlert visible").addClass("hideSweetAlert");
        });

        // select2 init
        if (typeof $.fn.select2 !== "undefined") {
            $(".select2").select2({
                theme: "bootstrap4",
            });
        }

        // scroll to top
        $(window).on("scroll", function () {
            var $g = $("#gotoTop");
            if (document.body.scrollTop > 640 || document.documentElement.scrollTop > 640) {
                $g.fadeIn();
            } else {
                $g.fadeOut();
            }
        });

        $("#gotoTop").on("click", function () {
            $("html,body").animate(
                {
                    scrollTop: 0,
                },
                "slow"
            );
        });

        // ajax public init
        ajaxPOST(
            adminURL + "ajax/public/",
            {
                action: "get_load_balancer_list",
            },
            function (res) {
                localStorage.setItem("lb", JSON.stringify(res.result));
            },
            function (xhr) {
                localStorage.setItem("lb", "[]");
            }
        );

        // action toolbar init
        var $btnToolbar = $("#toolbar .btn-hidden"),
            checkAllCallback = function () {
                var itemChecked = [],
                    item = 'table > tbody tr td:first-child input[type="checkbox"]';
                if ($(this).prop("checked")) {
                    $(item).prop("checked", true);
                } else {
                    $(item).prop("checked", false);
                }
                itemChecked = $(item + ":checked");
                if (itemChecked.length > 0) {
                    $btnToolbar.removeClass("d-none");
                } else {
                    $btnToolbar.addClass("d-none");
                }
            };

        // datatables checkbox init
        var checkboxAll = 'tr:first-child th:first-child input[type="checkbox"]',
            checkboxItems = 'table > tbody tr td:first-child input[type="checkbox"]';
        $("table > thead > " + checkboxAll + ", table > tfoot > " + checkboxAll).change(checkAllCallback);
        $(document).on("click", checkboxItems, function () {
            var itemChecked = $(checkboxItems + ":checked");
            if (itemChecked.length > 0) {
                $btnToolbar.removeClass("d-none");
            } else {
                $btnToolbar.addClass("d-none");
            }
        });

        // toastify init
        var admType = Cookies.get("adm-type", main.cookieConfig),
            admMsg = Cookies.get("adm-message", main.cookieConfig);
        if (typeof admMsg !== "undefined") {
            showToast(admMsg.trim(), admType, function () {
                Cookies.remove("adm-type", main.cookieConfig);
                Cookies.remove("adm-message", main.cookieConfig);
            });
        }

        // supported sites collapse init
        var clSites = localStorage.getItem("collapseSites");
        clSites = clSites !== null ? clSites.replace("true", "show") : "hide";
        $("#collapseSites").collapse(clSites);
        $("#collapseSites")
            .on("shown.bs.collapse", function () {
                localStorage.setItem("collapseSites", true);
            })
            .on("hidden.bs.collapse", function () {
                localStorage.removeItem("collapseSites", true);
            });

        $("#txtSearchHost").on("blur keyup change", function () {
            searchHost($(this).val().toLowerCase());
        });

        // show/hide password
        $(".btn-shp").click(function () {
            var e = $(this).data("shp");
            if (typeof e !== "undefined") {
                if ($(e).attr("type") === "password") {
                    $(e).attr("type", "text");
                    $(this).find(".fas").removeClass("fa-eye").addClass("fa-eye-slash");
                } else {
                    $(e).attr("type", "password");
                    $(this).find(".fas").removeClass("fa-eye-slash").addClass("fa-eye");
                }
            }
        });

        $("#user").change(function () {
            $.ajax({
                url: adminURL + "ajax/public/",
                type: "POST",
                data: {
                    action: "check_username",
                    username: $(this).val(),
                },
                success: function (res) {
                    var msg = res.status !== "fail" ? "" : res.message;
                    ajaxValidation("#user", msg);
                },
                error: function (xhr) {},
            });
        });

        $("#email").change(function () {
            $.ajax({
                url: adminURL + "ajax/public/",
                type: "POST",
                data: {
                    action: "check_email",
                    email: $(this).val(),
                },
                success: function (res) {
                    var msg = res.status !== "fail" ? "" : res.message;
                    ajaxValidation("#email", msg);
                },
                error: function (xhr) {},
            });
        });

        $("#retype_password").change(function () {
            var el = "#retype_password";
            if ($(this).val() !== $("#password").val()) {
                matchValidation(el, "The confirm password must be the same as the password");
            } else {
                matchValidation(el, "");
            }
        });
    },
};
var dashboard = {
    videosURL: adminURL + "ajax/videos-list/",
    popularVideos: {
        list: function () {
            if ($("#tbPopularVideos").length) {
                $("#tbPopularVideos").DataTable({
                    ajax: dashboard.videosURL + "?popular=true",
                    serverSide: true,
                    columns: [
                        {
                            data: "title",
                            responsivePriority: 0,
                            render: function (value, type, row, meta) {
                                if (value === "") value = "(No Title)";
                                return '<div class="title" contentEditable="true" data-toggle="tooltip" title="' + value + '">' + value + "</div>";
                            },
                        },
                        {
                            data: "host",
                            className: "text-center",
                            render: function (value, type, row, meta) {
                                if (row.alt_count > 0) {
                                    return '<div class="dropdown"><button class="btn btn-outline-default btn-sm dropdown-toggle alt" type="button" data-toggle="dropdown" aria-expanded="false" data-id="' + row.id + '"><img src="' + imgCDNURL + "assets/img/logo/" + value + '.png" width="16" height="16"></button><div class="dropdown-menu shadow border-0" style="max-height:240px"></div></div>';
                                } else {
                                    return '<a href="' + row.link + '" target="_blank" title="' + (typeof vidHosts[value] !== "undefined" ? vidHosts[value] : value).replace("|Additional Host", "").replace("|New", "") + '" data-toggle="tooltip"><img src="' + imgCDNURL + "assets/img/logo/" + value + '.png" width="16" height="16"></a>';
                                }
                            },
                        },
                        {
                            data: "views",
                            className: "text-right",
                        },
                        {
                            data: "name",
                        },
                        {
                            data: "added",
                            className: "text-right",
                        },
                        {
                            data: "id",
                            className: "text-center",
                            render: function (value, type, row) {
                                return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + btnCopyEmbed(row.actions.embed_code) + btnEmbed(row.actions.embed) + btnDownload(row.actions.download) + '<div class="dropdown-divider"></div>' + btnEditItem(adminURL + "videos/edit/?id=" + value) + '<button data-id="' + value + '" onclick="videos.cache.clear.single($(this));" class="dropdown-item" type="button"><i class="fas fa-eraser mr-2"></i>Clear Cache</button></div></div>';
                            },
                        },
                    ],
                    ordering: false,
                    lengthMenu: [7],
                    pageLength: 7,
                    searching: false,
                    bLengthChange: false,
                    info: false,
                    paging: true,
                    columnDefs: [
                        {
                            orderable: false,
                            targets: [0, 1, 2, 3, 4, 5],
                        },
                        {
                            visible: true,
                            targets: [0, 1],
                            className: "noVis",
                        },
                    ],
                    drawCallback: function (settings) {
                        loadTooltip();
                        $("#tbPopularVideos button.alt").click(function () {
                            videos.alternatives.get($(this));
                        });
                        $("#tbPopularVideos button.copy-embed").click(function () {
                            copyText($(this).data("text"), "Embed");
                        });
                    },
                });
            }
        },
    },
    recentVideos: {
        list: function () {
            if ($("#tbRecentVideos").length) {
                $("#tbRecentVideos").DataTable({
                    ajax: dashboard.videosURL + "?recent=true",
                    serverSide: true,
                    columns: [
                        {
                            data: "title",
                            responsivePriority: 0,
                            render: function (value, type, row, meta) {
                                if (value === "") value = "(No Title)";
                                return '<div class="title" contentEditable="true" data-toggle="tooltip" title="' + value + '">' + value + "</div>";
                            },
                        },
                        {
                            data: "host",
                            className: "text-center",
                            render: function (value, type, row, meta) {
                                if (row.alt_count > 0) {
                                    return '<div class="dropdown"><button class="btn btn-outline-default btn-sm dropdown-toggle alt" type="button" data-toggle="dropdown" aria-expanded="false" data-id="' + row.id + '"><img src="' + imgCDNURL + "assets/img/logo/" + value + '.png" width="16" height="16"></button><div class="dropdown-menu shadow border-0" style="max-height:240px"></div></div>';
                                } else {
                                    return '<a href="' + row.link + '" target="_blank" title="' + (typeof vidHosts[value] !== "undefined" ? vidHosts[value] : value).replace("|Additional Host", "").replace("|New", "") + '" data-toggle="tooltip"><img src="' + imgCDNURL + "assets/img/logo/" + value + '.png" width="16" height="16"></a>';
                                }
                            },
                        },
                        {
                            data: "views",
                            className: "text-right",
                        },
                        {
                            data: "name",
                        },
                        {
                            data: "added",
                            className: "text-right",
                        },
                        {
                            data: "id",
                            className: "text-center",
                            render: function (value, type, row) {
                                return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + btnCopyEmbed(row.actions.embed_code) + btnEmbed(row.actions.embed) + btnDownload(row.actions.download) + '<div class="dropdown-divider"></div>' + btnEditItem(adminURL + "videos/edit/?id=" + value) + '<button data-id="' + value + '" onclick="videos.cache.clear.single($(this));" class="dropdown-item" type="button"><i class="fas fa-eraser mr-2"></i>Clear Cache</button></div></div>';
                            },
                        },
                    ],
                    ordering: false,
                    lengthMenu: [7],
                    pageLength: 7,
                    searching: false,
                    bLengthChange: false,
                    info: false,
                    paging: true,
                    columnDefs: [
                        {
                            orderable: false,
                            targets: [0, 1, 2, 3, 4, 5],
                        },
                        {
                            visible: true,
                            targets: [0, 1],
                            className: "noVis",
                        },
                    ],
                    drawCallback: function (settings) {
                        loadTooltip();
                        $("#tbRecentVideos button.alt").click(function () {
                            videos.alternatives.get($(this));
                        });
                        $("#tbRecentVideos button.copy-embed").click(function () {
                            copyText($(this).data("text"), "Embed");
                        });
                    },
                });
            }
        },
    },
    chart: {
        videoStatus: function (el) {
            var chart,
                $chart = document.querySelector(el + " > .chart"),
                $load = $(el + " > .fa-spin"),
                options = {
                    chart: {
                        id: "videoStatus",
                        type: "donut",
                    },
                    legend: {
                        position: "bottom",
                    },
                    series: [],
                    labels: ["Good", "Broken", "Warning"],
                    colors: ["#28a745", "#dc3545", "#feb019"],
                };
            if ($chart !== null) {
                $load.show();
                $chart.style.display = "none";
                ajaxPOST(
                    adminURL + "ajax/dashboard/",
                    {
                        action: "videos_status",
                    },
                    function (res) {
                        $load.hide();
                        $chart.style.display = "block";
                        if (res.status !== "fail") {
                            options.series[0] = res.result.good;
                            options.series[1] = res.result.broken;
                            options.series[2] = res.result.warning;
                        }
                        chart = new ApexCharts($chart, options);
                        chart.render();
                    },
                    function (xhr) {
                        $load.hide();
                        $chart.style.display = "block";
                        chart = new ApexCharts($chart, options);
                        chart.render();
                    }
                );
            } else {
                $load.hide();
            }
        },
        serverStatus: function (el) {
            var chart,
                $chart = document.querySelector(el + " > .chart"),
                $load = $(el + " > .fa-spin"),
                options = {
                    chart: {
                        id: "serverStatus",
                        type: "pie",
                    },
                    legend: {
                        position: "bottom",
                    },
                    series: [],
                    labels: [],
                };
            if ($chart !== null) {
                $load.show();
                $chart.style.display = "none";
                ajaxPOST(
                    adminURL + "ajax/dashboard/",
                    {
                        action: "servers_status",
                    },
                    function (res) {
                        $load.hide();
                        if (res.status !== "fail") {
                            $chart.style.display = "block";
                            options.labels = Object.keys(res.result);
                            options.series = Object.values(res.result);
                            chart = new ApexCharts($chart, options);
                            chart.render();
                        }
                    },
                    function (xhr) {
                        $load.hide();
                        $chart.style.display = "block";
                        chart = new ApexCharts($chart, options);
                        chart.render();
                    }
                );
            } else {
                $load.hide();
            }
        },
        views: {
            apex: undefined,
            options: {
                series: [
                    {
                        name: "Visitors",
                        data: [],
                    },
                ],
                chart: {
                    id: "chartViews",
                    type: "area",
                    height: 300,
                    toolbar: {
                        show: false,
                    },
                },
                dataLabels: {
                    enabled: false,
                },
                markers: {
                    size: 0,
                    style: "hollow",
                },
                xaxis: {
                    type: "datetime",
                    tickAmount: 6,
                    labels: {
                        datetimeUTC: false,
                    },
                },
                tooltip: {
                    x: {
                        format: "dd MMM yyyy",
                    },
                },
                fill: {
                    type: "gradient",
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.7,
                        opacityTo: 0.9,
                        stops: [0, 100],
                    },
                },
            },
            load: function (filter) {
                var $load = $("#views > .fas"),
                    options = dashboard.chart.views.options;
                $load.show();
                ajaxPOST(
                    adminURL + "ajax/dashboard/",
                    {
                        action: "views",
                        filter: filter,
                    },
                    function (res) {
                        $load.hide();
                        if (res.status !== "fail") {
                            if (res.result.length < 30) {
                                options.dataLabels.enabled = true;
                            }
                            options.series = [
                                {
                                    name: "Visitors",
                                    data: res.result,
                                },
                            ];
                            dashboard.chart.views.apex.updateOptions(options);
                        }
                    },
                    function (xhr) {
                        $load.hide();
                    }
                );
            },
        },
    },
    supportChecker: function () {
        if (location.href.indexOf("/dashboard") > -1) {
            var $md = $("#modalExtApps"),
                changeStatus = function (id, status, app) {
                    if (status) {
                        app = app ? "Installed" : "Enabled";
                        $(id).html('<i class="fas fa-check-circle text-success mr-2"></i>' + app);
                    } else {
                        app = app ? "Uninstalled" : "Disabled";
                        $(id).html('<i class="fas fa-times-circle text-danger mr-2"></i>' + app);
                    }
                };
            $md.find(".btn-success").html('<i class="fas fa-spin fa-refresh mr-2"></i>Re-check').prop("disable", true);
            ajaxPOST(
                adminURL + "ajax/settings/",
                {
                    action: "get_dependencies",
                },
                function (res) {
                    var keys;
                    if ("result" in res) {
                        keys = Object.keys(res.result);
                        $.each(keys, function (i, v) {
                            changeStatus("#php_" + v, res.result[v], v === "chrome");
                        });
                        $md.find(".btn-success").text("Re-check").prop("disable", false);
                        if (res.status === "fail") {
                            $md.modal("show");
                        } else {
                            $md.modal("hide");
                        }
                    }
                },
                function (xhr) {
                    $md.find(".btn-success").text("Re-check").prop("disable", false);
                    $md.modal("show");
                }
            );
        }
    },
};
var gdrive_accounts = {
    url: adminURL + "ajax/gdrive-accounts/",
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                gdrive_accounts.url,
                {
                    id: id,
                    action: "delete",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete the '" + $e.data("name") + "' account. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        gdrive_accounts.delete.ajax(
                            $e.data("id"),
                            function (res) {
                                if (res.status === "ok") {
                                    gdrive_accounts.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            }
        },
        multi: function () {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllGDA, #ckAllGDA1").prop("checked", false);
            $("#tbGDAccounts tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            gdrive_accounts.reload();
                            if (failed.length > 0) {
                                swalInfo("The " + deleted.length + " accounts have been successfully deleted and the other " + failed.length + " accounts failed to be deleted.");
                            } else {
                                swalSuccess("These " + total + " accounts have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        gdrive_accounts.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete these " + ids.length + " accounts. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the accounts you want to delete first.");
            }
        },
    },
    update_status: {
        ajax: function (data, sCallback, eCallback) {
            ajaxPOST(gdrive_accounts.url, data, sCallback, eCallback);
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                gdrive_accounts.update_status.ajax(
                    {
                        id: $e.data("id"),
                        status: $e.data("status"),
                        action: "update_status",
                    },
                    function (res) {
                        if (res.status !== "fail") {
                            gdrive_accounts.reload();
                            swalSuccess(res.message);
                        } else {
                            swalError(res.message);
                        }
                    },
                    function (xhr) {
                        swalError(xhr.responseText);
                    }
                );
            }
        },
    },
    list: function () {
        if ($("#tbGDAccounts").length) {
            $("#tbGDAccounts").DataTable({
                ajax: adminURL + "ajax/gdrive-accounts-list/",
                serverSide: true,
                columns: [
                    {
                        data: "id",
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            return btnCheckbox(value, "gda");
                        },
                    },
                    {
                        data: "email",
                        responsivePriority: 0,
                    },
                    {
                        data: "status",
                        responsivePriority: 1,
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            var icon = "fa-times-circle text-danger",
                                title = "Disable",
                                status = 0,
                                newStatus = 1;
                            if (value === "1") {
                                icon = "fa-check-circle text-success";
                                title = "Enable";
                                status = 1;
                                newStatus = 0;
                            }
                            return '<a href="javascript:void(0)" role="button" data-id="' + row.id + '" data-status="' + newStatus + '" class="status" data-toggle="tooltip" title="' + title + '"><i class="fas fa-lg ' + icon + '"></i></a>';
                        },
                    },
                    {
                        data: "created",
                        className: "text-center",
                    },
                    {
                        data: "modified",
                        className: "text-center",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 2,
                        render: function (value, type, row) {
                            return '<div class="dropdown">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + btnEditItem(adminURL + "gdrive/edit/?id=" + value) + btnDeleteItem(value, row.email) + "</div></div>";
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [0, 5],
                    },
                    {
                        visible: true,
                        targets: [0, 1, 5],
                        className: "noVis",
                    },
                ],
                order: [[1, "asc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("#tbGDAccounts a.status").click(function () {
                        gdrive_accounts.update_status.single($(this));
                    });
                    $("#tbGDAccounts button.delete").click(function () {
                        gdrive_accounts.delete.single($(this));
                    });
                },
            });
        }
    },
    reload: function () {
        $("#ckAllGDA, #ckAllGDA1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbGDAccounts").DataTable().ajax.reload(null, false);
    },
};
var gdrive_files = {
    url: adminURL + "ajax/gdrive-files/",
    update_status: {
        ajax: function (data, sCallback, eCallback) {
            ajaxPOST(gdrive_files.url, data, sCallback, eCallback);
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                gdrive_files.update_status.ajax(
                    {
                        id: $e.data("id"),
                        email: $_GET("email"),
                        action: $e.data("status"),
                    },
                    function (res) {
                        if (res.status !== "fail") {
                            gdrive_files.reload();
                            swalSuccess(res.message);
                        } else {
                            swalError(res.message);
                        }
                    },
                    function (xhr) {
                        swalError(xhr.responseText);
                    }
                );
            }
        },
        multi: function (newStatus) {
            var ids = [],
                updated = [],
                failed = [];
            $("#ckAllGDF, #ckAllGDF1").prop("checked", false);
            $("#tbGDFiles tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            updated.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = updated.length + failed.length;
                        if (total >= ids.length) {
                            gdrive_files.reload();
                            if (failed.length > 0) {
                                swalInfo(updated.length + " files have been updated successfully and " + failed.length + " other files failed to update.");
                            } else {
                                swalSuccess("These " + total + " files have been successfully updated.");
                            }
                        } else {
                            updateNow(ids[nextIndex], nextIndex);
                        }
                    },
                    updateNow = function (id, currentIndex) {
                        gdrive_files.update_status.ajax(
                            {
                                id: id,
                                email: $_GET("email"),
                                action: newStatus,
                            },
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will change the status of those " + ids.length + " files to " + newStatus + ".",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-primary",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        updateNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the files that you want to change the status of first.");
            }
        },
    },
    reload: function () {
        $("#ckAllGDF, #ckAllGDF1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbGDFiles").DataTable().ajax.reload(null, false);
    },
    list: function () {
        if ($("#tbGDFiles").length) {
            var email = $("select#email").val(),
                md5Email = md5(email);
            $("#tbGDFiles")
                .on("preXhr.dt", function (e, s, data) {
                    var p = s._iDisplayStart - s._iDisplayLength;
                    data.private = $("#onlyPrivate").is(":checked");
                    data.onlyFolder = $("#onlyFolder").is(":checked");
                    if (email !== null) {
                        data.email = email;
                        data.folder_id = $_GET("folder_id");
                    }
                    if (p >= 0) {
                        data.token = localStorage.getItem("nextPageToken-" + md5Email + "-" + p);
                    }
                })
                .DataTable({
                    ajax: adminURL + "ajax/gdrive-files-list/",
                    serverSide: true,
                    info: false,
                    pagingType: "simple",
                    columns: [
                        {
                            data: "id",
                            responsivePriority: 0,
                            className: "text-center",
                            render: function (value, type, row, meta) {
                                return btnCheckbox(value, "gdf");
                            },
                        },
                        {
                            data: "title",
                            responsivePriority: 1,
                            render: function (value, type, row, meta) {
                                if ("type" in row.mimeType && row.mimeType.type.indexOf(".folder") === -1) {
                                    return '<div class="title" contentEditable="true" data-toggle="tooltip" title="' + value + '"><img src="' + row.mimeType.icon + '" class="mr-2">' + value + "</div>";
                                } else {
                                    if (row.id !== "") {
                                        return '<a href="' + adminURL + "gdrive/files/?email=" + row.email + "&folder_id=" + row.id + '" class="title" data-toggle="tooltip" title="' + value + '"><img src="' + row.mimeType.icon + '" class="mr-2">' + value + "</a>";
                                    } else {
                                        return '<a href="' + adminURL + "gdrive/files/?email=" + row.email + '" class="title" data-toggle="tooltip" title="Back">' + value + "</a>";
                                    }
                                }
                            },
                        },
                        {
                            data: "desc",
                            responsivePriority: 2,
                            render: function (value, type, row, meta) {
                                return '<div class="title" contentEditable="true" data-toggle="tooltip" title="' + value + '">' + value + "</div>";
                            },
                        },
                        {
                            data: "shared",
                            className: "text-center",
                            render: function (value, type, row, meta) {
                                return '<i class="fas fa-lg fa-' + (value ? "check-circle text-success" : "times-circle text-danger") + '"></i>';
                            },
                        },
                        {
                            data: "modifiedDate",
                            className: "text-right",
                        },
                        {
                            data: "actions",
                            className: "text-center",
                            responsivePriority: 3,
                            render: function (value, type, row, meta) {
                                if (row.id !== "") {
                                    var html = '<button type="button" class="dropdown-item rename" data-id="' + value.id + '" data-name="' + row.title + '"><i class="fas fa-pen-to-square mr-2"></i>Rename</button>';
                                    if (value.shared) {
                                        html += '<button type="button" class="dropdown-item private" data-id="' + value.id + '" data-status="private" title="Make it Private"><i class="fas fa-eye-slash mr-2"></i>Private</button>';
                                    } else {
                                        html += '<button type="button" class="dropdown-item public" data-id="' + value.id + '" data-status="public" title="Share with the Public"><i class="fas fa-eye mr-2"></i>Public</button>';
                                    }
                                    html += '<button type="button" class="dropdown-item delete" data-id="' + value.id + '" data-name="' + row.title + (row.desc !== "" ? " - " + row.desc : "") + '"><i class="fas fa-trash mr-2"></i>Delete</button>';
                                    if ("type" in row.mimeType && row.mimeType.type.indexOf(".folder") === -1) {
                                        html += '<div class="dropdown-divider"></div><a class="dropdown-item" href="' + value.view + '" target="_blank"><i class="fas fa-binoculars mr-2"></i>View</a><a class="dropdown-item" href="' + value.download + '" target="_blank"><i class="fas fa-download mr-2"></i>Download</a><a class="dropdown-item" href="' + value.preview + '" target="_blank"><i class="fas fa-magnifying-glass mr-2"></i>Preview</a><div class="dropdown-divider"></div>' + btnEmbed(value.embed_link) + btnDownload(value.download_link) + btnCopyEmbed(value.embed_code);
                                    }
                                    return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + html + "</div></div>";
                                } else {
                                    return "";
                                }
                            },
                        },
                    ],
                    columnDefs: [
                        {
                            orderable: false,
                            targets: [0, 2, 3, 5],
                        },
                        {
                            visible: true,
                            targets: [0, 1, 2],
                            className: "noVis",
                        },
                    ],
                    order: [[4, "desc"]],
                    drawCallback: function (s) {
                        if (email !== null && typeof s.json.token !== "undefined" && s.json.token !== null && s.json.token !== "") {
                            localStorage.setItem("nextPageToken-" + md5Email + "-" + s._iDisplayStart, s.json.token);
                        }
                        $("#tbGDFiles button.public, #tbGDFiles button.private").click(function () {
                            gdrive_files.update_status.single($(this));
                        });
                        $("#tbGDFiles button.delete").click(function () {
                            gdrive_files.delete.single($(this));
                        });
                        $("#tbGDFiles button.rename").click(function () {
                            gdrive_files.rename($(this));
                        });
                        $("#tbGDFiles button.copy-embed").click(function () {
                            copyText($(this).data("text"), "Embed");
                        });
                        gdrive_files.loadDrives();
                        loadTooltip();
                    },
                });
        }
    },
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                gdrive_files.url,
                {
                    id: id,
                    email: $_GET("email"),
                    action: "delete",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete the '" + $e.data("name") + "' file.",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        gdrive_files.delete.ajax(
                            $e.data("id"),
                            function (res) {
                                if (res.status !== "fail") {
                                    gdrive_files.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            }
        },
        multi: function () {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllGDF, #ckAllGDF1").prop("checked", false);
            $("#tbGDFiles tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            gdrive_files.reload();
                            if (failed.length > 0) {
                                swalInfo("The " + deleted.length + " files have been successfully deleted and the other " + failed.length + " files failed to be deleted.");
                            } else {
                                swalSuccess("The " + total + " files have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        gdrive_files.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete these " + ids.length + " files.",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-primary",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the files you want to delete first.");
            }
        },
    },
    newFolder: function () {
        swal(
            {
                title: "Create New Folder",
                type: "input",
                showLoaderOnConfirm: true,
                showCancelButton: true,
                closeOnConfirm: false,
                cancelButtonClass: "btn-secondary",
                confirmButtonClass: "btn-success",
                inputPlaceholder: "Folder Name",
                confirmButtonText: "Save",
            },
            function (name) {
                if (name === false) return false;
                if (name.trim() === "") {
                    swal.showInputError("You need to write something!");
                    return false;
                }
                var parent_id = $_GET("folder_id");
                parent_id = parent_id !== null ? parent_id : "root";
                $.ajax({
                    url: gdrive_files.url,
                    method: "POST",
                    dataType: "json",
                    data: "action=new_folder&name=" + name + "&parent_id=" + parent_id + "&email=" + $("select#email").val(),
                    success: function (res) {
                        if (res.status !== "fail") {
                            gdrive_files.reload();
                            swalSuccess(res.message);
                        } else {
                            swalError(res.message);
                        }
                    },
                    error: function (xhr) {
                        swalError(xhr.responseText);
                    },
                });
            }
        );
    },
    changeEmail: function ($e) {
        var url = location.href.split("?"),
            key = "",
            i;
        for (i in localStorage) {
            key = localStorage.key(i);
            if (key.indexOf("gdrive/files") > -1) {
                localStorage.removeItem(key);
            }
        }
        location.href = url[0] + "?email=" + $e.val();
    },
    import: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                gdrive_files.url,
                {
                    id: id,
                    action: "gdrive_import",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            gdrive_files.import.ajax(
                $e.data("id"),
                function (res) {
                    if (res.status !== "fail") {
                        swalSuccess(res.message);
                    } else {
                        swalError(res.message);
                    }
                },
                function (xhr) {
                    swalError(xhr.responseText);
                }
            );
        },
        multi: function () {
            var ids = [],
                imported = [],
                failed = [];
            $("#ckAllGDF, #ckAllGDF1").prop("checked", false);
            $("#tbGDFiles tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            imported.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = imported.length + failed.length;
                        if (total >= ids.length) {
                            if (failed.length > 0) {
                                swalInfo("The " + imported.length + " files have been successfully imported and the other " + failed.length + " files failed to be imported.");
                            } else {
                                swalSuccess("The " + total + " files have been successfully imported.");
                            }
                            gdrive_files.reload();
                        } else {
                            importNow(ids[nextIndex], nextIndex);
                        }
                    },
                    importNow = function (id, currentIndex) {
                        gdrive_files.import.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                importNow(ids[0], 0);
            } else {
                swalWarning("Please check the files you want to import first.");
            }
        },
    },
    loadDrives: function () {
        var $opt = $("#drives").find("optgroup");
        ajaxPOST(
            gdrive_files.url,
            {
                email: $_GET("email"),
                action: "shared-drives",
            },
            function (data) {
                if (data.result.length) {
                    $opt.html("");
                    for (var i in data.result) {
                        $opt.append('<option value="' + data.result[i].id + '" ' + ($_GET("folder_id") === data.result[i].id ? "selected" : "") + ">" + data.result[i].name + "</option>");
                    }
                }
            },
            function (xhr) {
                console.log(xhr);
            }
        );
    },
    rename: function ($e) {
        swal(
            {
                title: "Rename File/Folder",
                type: "input",
                inputValue: $e.data("name"),
                showLoaderOnConfirm: true,
                showCancelButton: true,
                closeOnConfirm: false,
                cancelButtonClass: "btn-secondary",
                confirmButtonClass: "btn-success",
                inputPlaceholder: "File/Folder Name",
                confirmButtonText: "Update",
            },
            function (name) {
                if (name === false) return false;
                if (name.trim() === "") {
                    swal.showInputError("You need to write something!");
                    return false;
                }
                $.ajax({
                    url: gdrive_files.url,
                    method: "POST",
                    dataType: "json",
                    data: "action=renameFileFolder&name=" + name + "&id=" + $e.data("id") + "&email=" + $("select#email").val(),
                    success: function (res) {
                        if (res.status !== "fail") {
                            gdrive_files.reload();
                            swalSuccess(res.message);
                        } else {
                            swalError(res.message);
                        }
                    },
                    error: function (xhr) {
                        swalError(xhr.responseText);
                    },
                });
            }
        );
    },
};
var gdrive_backup_files = {
    url: adminURL + "ajax/gdrive-backup-files/",
    reload: function () {
        $("#ckAllGDBF, #ckAllGDBF1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbGDBackupFiles").DataTable().ajax.reload(null, false);
    },
    list: function () {
        if ($("#tbGDBackupFiles").length) {
            $("#tbGDBackupFiles").DataTable({
                ajax: adminURL + "ajax/gdrive-backup-files-list/",
                serverSide: true,
                columns: [
                    {
                        data: "id",
                        responsivePriority: 0,
                        className: "text-center",
                        render: function (value) {
                            return btnCheckbox(value, "gdbf");
                        },
                    },
                    {
                        data: "gdrive_id",
                        responsivePriority: 1,
                        render: function (value) {
                            return gdriveViewLink(value);
                        },
                    },
                    {
                        data: "mirror_id",
                        responsivePriority: 2,
                        render: function (value) {
                            return gdriveViewLink(value);
                        },
                    },
                    {
                        data: "mirror_email",
                    },
                    {
                        data: "added",
                        className: "text-right",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 3,
                        render: function (value, type, row) {
                            return '<button data-id="' + value + '" data-name="' + row.mirror_id + '" data-toggle="tooltip" title="Delete" type="button" class="btn btn-danger btn-sm delete"><i class="fas fa-trash-alt"></i></button>';
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [0, 5],
                    },
                    {
                        visible: true,
                        targets: [0, 3, 4],
                        className: "noVis",
                    },
                ],
                order: [[4, "desc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("#tbGDBackupFiles button.delete").click(function () {
                        gdrive_backup_files.delete.single($(this));
                    });
                },
            });
        }
    },
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                gdrive_backup_files.url,
                {
                    id: id,
                    action: "delete",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete backup file '" + $e.data("name") + "'. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        gdrive_backup_files.delete.ajax(
                            $e.data("id"),
                            function (res) {
                                if (res.status !== "fail") {
                                    gdrive_backup_files.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            }
        },
        multi: function () {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllGDBF, #ckAllGDBF1").prop("checked", false);
            $("#tbGDBackupFiles tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            gdrive_backup_files.reload();
                            if (failed.length > 0) {
                                swalInfo(deleted.length + " backup files were successfully deleted and " + failed.length + " other backup files failed to be deleted.");
                            } else {
                                swalSuccess("These " + total + " backup files have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        gdrive_backup_files.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete " + ids.length + " backup files. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the backup files you want to delete first.");
            }
        },
    },
};
var gdrive_backup_queue = {
    url: adminURL + "ajax/gdrive-backup-queue/",
    reload: function () {
        $("#ckAllGDQF, #ckAllGDQF1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbGDBackupQueue").DataTable().ajax.reload(null, false);
    },
    list: function () {
        if ($("#tbGDBackupQueue").length) {
            $("#tbGDBackupQueue").DataTable({
                ajax: adminURL + "ajax/gdrive-backup-queue-list/",
                serverSide: true,
                columns: [
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 2,
                        render: function (value) {
                            return btnCheckbox(value, "gdbf");
                        },
                    },
                    {
                        data: "gdrive_id",
                        responsivePriority: 0,
                        render: function (value) {
                            return gdriveViewLink(value);
                        },
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 1,
                        render: function (value, type, row) {
                            return '<button data-id="' + row.gdrive_id + '" data-toggle="tooltip" title="Copy File" type="button" class="btn btn-primary btn-sm copy-file"><i class="fas fa-copy"></i></button>&nbsp;<button data-id="' + value + '" data-name="' + row.gdrive_id + '" data-toggle="tooltip" title="Delete" type="button" class="btn btn-danger btn-sm delete"><i class="fas fa-trash-alt"></i></button>';
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [0, 2],
                    },
                    {
                        visible: true,
                        targets: [0, 1],
                        className: "noVis",
                    },
                ],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("#tbGDBackupQueue button.delete").click(function () {
                        gdrive_backup_queue.delete.single($(this));
                    });
                    $("#tbGDBackupQueue button.copy-file").click(function () {
                        $(this).prop("disabled", true);
                        gdrive_backup_queue.copy($(this));
                    });
                },
            });
        }
    },
    copy: function ($e) {
        ajaxPOST(
            gdrive_backup_queue.url,
            {
                id: $e.data("id"),
                action: "copy",
            },
            function (res) {
                $e.prop("disabled", false);
                if (res.status !== "fail") {
                    gdrive_backup_queue.reload();
                    swalSuccess(res.message);
                } else {
                    swalError(res.message);
                }
            },
            function (xhr) {
                $e.prop("disabled", false);
                swalError(xhr.responseText);
            }
        );
    },
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                gdrive_backup_queue.url,
                {
                    id: id,
                    action: "delete",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete backup queue '" + $e.data("name") + "'. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        gdrive_backup_queue.delete.ajax(
                            $e.data("id"),
                            function (res) {
                                if (res.status !== "fail") {
                                    gdrive_backup_queue.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            }
        },
        multi: function () {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllGDQF, #ckAllGDQF1").prop("checked", false);
            $("#tbGDBackupQueue tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            gdrive_backup_queue.reload();
                            if (failed.length > 0) {
                                swalInfo(deleted.length + " backup queue were successfully deleted and " + failed.length + " other backup queue failed to be deleted.");
                            } else {
                                swalSuccess("These " + total + " backup queue have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        gdrive_backup_queue.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete " + ids.length + " backup queue. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the backup files you want to delete first.");
            }
        },
    },
};
var load_balancers = {
    url: adminURL + "ajax/load-balancers/",
    reload: function () {
        $("#tbLoadBalancers").DataTable().ajax.reload(null, false);
    },
    delete: function ($e) {
        if (typeof $e !== "undefined") {
            swal(
                {
                    title: "Are you sure?",
                    text: "Delete the '" + $e.data("name") + "' server. " + notRecovered(),
                    type: "warning",
                    showLoaderOnConfirm: true,
                    showCancelButton: true,
                    cancelButtonClass: "btn-secondary",
                    confirmButtonClass: "btn-danger",
                    closeOnConfirm: false,
                },
                function (isConfirm) {
                    if (!isConfirm) return;
                    ajaxPOST(
                        load_balancers.url,
                        {
                            id: $e.data("id"),
                            action: "delete",
                        },
                        function (res) {
                            if (res.status !== "fail") {
                                load_balancers.reload();
                                swalSuccess(res.message);
                            } else {
                                swalError(res.message);
                            }
                        },
                        function (xhr) {
                            swalError(xhr.responseText);
                        }
                    );
                }
            );
        }
    },
    update_status: function ($e) {
        if (typeof $e !== "undefined") {
            ajaxPOST(
                load_balancers.url,
                {
                    id: $e.data("id"),
                    status: $e.data("status"),
                    action: "update_status",
                },
                function (res) {
                    if (res.status !== "fail") {
                        load_balancers.reload();
                        swalSuccess(res.message);
                    } else {
                        swalError(res.message);
                    }
                },
                function (xhr) {
                    swalError(xhr.responseText);
                }
            );
        }
    },
    list: function () {
        if ($("#tbLoadBalancers").length) {
            $("#tbLoadBalancers").DataTable({
                ajax: adminURL + "ajax/load-balancers-list/",
                serverSide: true,
                columns: [
                    {
                        data: "name",
                        responsivePriority: 0,
                    },
                    {
                        data: "link",
                        responsivePriority: 1,
                        render: function (value, type, row, meta) {
                            return '<a href="' + value + '" target="_blank">' + value + "</a>";
                        },
                    },
                    {
                        data: "playbacks",
                        className: "text-right",
                    },
                    {
                        data: "status",
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            var title = "Disable",
                                icon = "fa-check-circle text-success",
                                status = 0;
                            if (Number(value) === 0) {
                                title = "Enable";
                                icon = "fa-times-circle text-danger";
                                status = 1;
                            }
                            return '<a href="javascript:void(0)" class="status" data-id="' + row.id + '" data-status="' + status + '" data-toggle="tooltip" title="' + title + '"><i class="fas fa-lg ' + icon + '"></i></a>';
                        },
                    },
                    {
                        data: "added",
                        className: "text-right",
                    },
                    {
                        data: "updated",
                        className: "text-right",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 2,
                        render: function (value, type, row) {
                            return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + btnEditItem(adminURL + "settings/load-balancers/edit/?id=" + value) + btnDeleteItem(value, row.name) + '<button type="button" class="dropdown-item clear" data-id="' + value + '" data-url="' + row.link + 'admin-api/"><i class="fas fa-refresh mr-2"></i>Clear Cache</button></div></div>';
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [2, 6],
                    },
                    {
                        visible: true,
                        targets: [1, 2, 3],
                        className: "noVis",
                    },
                ],
                order: [[4, "desc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("a.status").click(function () {
                        load_balancers.update_status($(this));
                    });
                    $("#tbLoadBalancers button.clear").click(function () {
                        load_balancers.clear($(this));
                    });
                    $("#tbLoadBalancers button.delete").click(function () {
                        load_balancers.delete($(this));
                    });
                },
            });
        }
    },
    clear: function ($e) {
        if (typeof $e !== "undefined") {
            ajaxPOST(
                $e.data("url"),
                {
                    id: $e.data("id"),
                    action: "clear_load_balancer",
                    token: Cookies.get("adv_token", main.cookieConfig),
                },
                function (res) {
                    if (res.status !== "fail") {
                        swalSuccess(res.message);
                    } else {
                        swalError(res.message);
                    }
                },
                function (xhr) {
                    swalError(xhr.responseText);
                }
            );
        }
    },
    resetHost: function () {
        $("#resetLBHost").prop("disabled", true);
        ajaxPOST(
            settings.url,
            {
                action: "reset_hosts",
            },
            function (data) {
                $("#resetLBHost").prop("disabled", false);
                if (data.status !== "fail") {
                    $("#bypass_hosts").find("option").removeAttr("selected");
                    $("#bypass_hosts").multiSelect("select", data.result);
                    $("#bypass_hosts").multiSelect("refresh");
                    swalSuccess(data.message);
                } else {
                    swalError(data.message);
                }
            },
            function (xhr) {
                swalError(xhr.responseText);
            }
        );
    },
};
var settings = {
    url: adminURL + "ajax/settings/",
    disableBlacklistedVideos: function ($e) {
        swal(
            {
                title: "Are you sure?",
                text: "You will disable videos with titles containing blacklisted words.",
                type: "warning",
                showLoaderOnConfirm: true,
                showCancelButton: true,
                cancelButtonClass: "btn-secondary",
                confirmButtonClass: "btn-danger",
                closeOnConfirm: false,
            },
            function (isConfirm) {
                if (!isConfirm) return;
                $e.prop("disabled", true);
                ajaxPOST(
                    settings.url,
                    {
                        action: "disable_blacklisted_videos",
                    },
                    function (res) {
                        if (res.status !== "fail") {
                            $("#word_blacklisted").val(res.result);
                            swalSuccess(res.message);
                        } else {
                            swalSuccess(res.message);
                        }
                        $e.prop("disabled", false);
                    },
                    function (xhr) {
                        swalError(res.responseText);
                        $e.prop("disabled", false);
                    }
                );
            }
        );
    },
    smtp: function () {
        var pv = $("#smtp_provider").val();
        var $host = $("#smtp_host"),
            $port = $("#smtp_port"),
            $tls = $("#smtp_tls");
        var provider = {
            gmail: {
                host: "smtp.gmail.com",
                port: 465,
                tls: false,
            },
            ymail: {
                host: "smtp.mail.yahoo.com",
                port: 587,
                tls: true,
            },
            outlook: {
                host: "smtp.office365.com",
                port: 587,
                tls: true,
            },
        };
        var selected = {};
        if (pv !== "other") {
            selected = provider[pv];
            $host.val(selected.host);
            $port.val(selected.port);
            $tls.prop("checked", true);
        } else {
            $host.val("");
            $port.val("");
            $tls.prop("checked", false);
        }
    },
    vast: {
        remove: function (index) {
            $("#vastWrapper .form-group[data-index=" + index + "]").remove();
        },
        add: function () {
            var $wrap = $("#vastWrapper");
            var index = $wrap.find(".form-group").length;
            $wrap.append('<div class="form-group" data-index="' + index + '"><div class="input-group"><div class="input-group-prepend" style="max-width:110px"><input type="text" placeholder="Ad Position" name="opt[vast_offset][]" id="vast_offset-' + index + '" class="form-control"></div><input type="url" name="opt[vast_xml][]" id="vast_xml-' + index + '" placeholder="VAST URL (.xml)" class="form-control"><div class="input-group-append"><button type="button" class="btn btn-danger" onclick="settings.vast.remove(' + index + ')" data-toggle="tooltip" title="Remove VAST"><i class="fas fa-minus"></i></button></div></div></div>');
            loadTooltip();
        },
        delete: function ($e) {
            if (typeof $e !== "undefined") {
                ajaxPOST(
                    settings.url,
                    {
                        action: "delete_custom_vast",
                        file_name: $e.data("id"),
                    },
                    function (res) {
                        if (res.status !== "fail") {
                            swalSuccess(res.message);
                        } else {
                            swalError(res.message);
                        }
                        $e.closest("li").remove();
                    },
                    function (xhr) {
                        swalError(xhr.responseText);
                    }
                );
            } else {
                swalWarning("Please select the VAST you want to delete!");
            }
        },
    },
    changeCache: function ($e) {
        var $instance = $e.find('option[value="files"]');
        ajaxPOST(
            settings.url,
            {
                action: "extension_checker",
                extension: $e.val(),
            },
            function (res) {
                if (res.status === "fail") {
                    $instance.prop("selected", true);
                    swalError(res.message);
                }
            },
            function (xhr) {
                swalError(xhr.responseText);
                $instance.prop("selected", true);
            }
        );
    },
    checkProxy: function () {
        var $btn = $("#checkProxy"),
            oText = $btn.html(),
            hosts = ["proxy_docker_com", "free_proxy_cz", "free_proxy_list_net"],
            success = [],
            failed = [],
            completed = function () {
                if (success.length + failed.length >= hosts.length) {
                    $btn.html(oText).prop("disabled", false);
                    swalSuccess("The proxy list has been successfully updated.");
                }
            },
            proxyChecker = function (v) {
                ajaxGET(
                    baseURL + "cron-proxy/?host=" + v,
                    function (data) {
                        if (data.status !== "fail") {
                            success.push(v);
                            $("#proxy_list").val(data.result);
                        } else {
                            failed.push(v);
                        }
                        completed();
                    },
                    function (xhr) {
                        failed.push(v);
                        completed();
                    }
                );
            };

        $btn.html(oText + '<i class="fas fa-spin fa-sync-alt ml-2"></i>').prop("disabled", true);
        if ($("#proxy_list").val() !== "") {
            ajaxGET(
                baseURL + "cron-proxy/",
                function (data) {
                    if (data.status !== "fail") {
                        swalSuccess(data.message);
                    } else {
                        swalError(data.message);
                    }
                    $btn.html(oText).prop("disabled", false);
                },
                function (xhr) {
                    swalError(xhr.responseText);
                    $btn.html(oText).prop("disabled", false);
                }
            );
        } else {
            $.each(hosts, function (i, v) {
                proxyChecker(v);
            });
        }
    },
    clearCache: {
        cleared: 0,
        failed: 0,
        total: 0,
        callback: function (xhr) {
            var cache = settings.clearCache;
            if (typeof xhr.responseJSON === "undefined") {
                cache.failed += 1;
            } else if (xhr.status !== "fail") {
                cache.cleared += 1;
            } else {
                cache.failed += 1;
            }
            if (cache.cleared + cache.failed >= cache.total) {
                if (cache.cleared >= cache.total) {
                    swalSuccess("The cache has been successfully cleared.");
                } else {
                    swalError("The cache failed to clear or the cache does not exist.");
                }
                $("#clearCache").prop("disabled", false);
            }
        },
        all: function () {
            var lbs = localStorage.getItem("lb"),
                lb = lbs !== "null" ? JSON.parse(lbs) : [baseURL],
                callback = settings.clearCache.callback;
            if (lb.length > 0) {
                swal(
                    {
                        title: "Are you sure!",
                        text: "You will clear all cache.",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        $("#clearCache").prop("disabled", true);
                        $.each(lb, function (i, v) {
                            ajaxPOST(
                                v + "admin-api/",
                                {
                                    action: "clear_cache",
                                    token: Cookies.get("adv_token", main.cookieConfig),
                                },
                                callback,
                                callback
                            );
                        });
                    }
                );
            }
        },
        videos: function () {
            var lbs = localStorage.getItem("lb"),
                lb = lbs ? JSON.parse(lbs) : [],
                callback = settings.clearCache.callback;
            if (lb.length > 0) {
                swal(
                    {
                        title: "Are you sure!",
                        text: "You will clear all video cache.",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        $("#clearCache").prop("disabled", true);
                        $.each(lb, function (i, v) {
                            ajaxPOST(
                                v + "admin-api/",
                                {
                                    action: "clear_all_video_cache",
                                    token: Cookies.get("adv_token", main.cookieConfig),
                                },
                                callback,
                                callback
                            );
                        });
                    }
                );
            }
        },
        hlsmpd: function () {
            var lbs = localStorage.getItem("lb"),
                lb = lbs ? JSON.parse(lbs) : [],
                callback = settings.clearCache.callback;
            if (lb.length > 0) {
                swal(
                    {
                        title: "Are you sure!",
                        text: "You will clear the cache of HLS and MPD video files.",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        $("#clearCache").prop("disabled", true);
                        $.each(lb, function (i, v) {
                            ajaxPOST(
                                v + "admin-api/",
                                {
                                    action: "clear_hlsmpd_video_cache",
                                    token: Cookies.get("adv_token", main.cookieConfig),
                                },
                                callback,
                                callback
                            );
                        });
                    }
                );
            }
        },
        settings: function () {
            var lbs = localStorage.getItem("lb"),
                lb = lbs ? JSON.parse(lbs) : [],
                callback = settings.clearCache.callback;
            if (lb.length > 0) {
                swal(
                    {
                        title: "Are you sure!",
                        text: "You will clear all settings cache.",
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        $("#clearCache").prop("disabled", true);
                        $.each(lb, function (i, v) {
                            ajaxPOST(
                                v + "admin-api/",
                                {
                                    action: "clear_settings_cache",
                                    token: Cookies.get("adv_token", main.cookieConfig),
                                },
                                callback,
                                callback
                            );
                        });
                    }
                );
            }
        },
    },
    resetHost: function () {
        var oText = $("#resetHost").html();
        swal(
            {
                title: "Are you sure?",
                text: "Return the hosts to their original position. Then clear the settings cache.",
                type: "warning",
                showLoaderOnConfirm: true,
                showCancelButton: true,
                cancelButtonClass: "btn-secondary",
                confirmButtonClass: "btn-warning",
                closeOnConfirm: false,
            },
            function (isConfirm) {
                if (!isConfirm) return;
                $("#resetHost")
                    .html(oText + '<i class="fas fa-spin fa-sync-alt ml-2"></i>')
                    .prop("disabled", true);
                ajaxPOST(
                    settings.url,
                    {
                        action: "reset_hosts",
                    },
                    function (data) {
                        $("#resetHost").html(oText).prop("disabled", false);
                        if (data.status !== "fail") {
                            $("#bypass_host").find("option").removeAttr("selected");
                            $("#bypass_host").multiSelect("select", data.result);
                            $("#bypass_host").multiSelect("refresh");
                            swalSuccess(data.message);
                        } else {
                            swalError(data.message);
                        }
                    },
                    function (xhr) {
                        swalError(xhr.responseText);
                    }
                );
            }
        );
    },
};
var subtitles = {
    url: adminURL + "ajax/subtitles/",
    loadHosts: function () {
        ajaxPOST(
            subtitles.url,
            {
                action: "get_hosts",
            },
            function (res) {
                if (res.status !== "fail") {
                    var html = "",
                        $old = $("#oldLocation"),
                        i = 0;
                    $old.html("");
                    for (i in res.result) {
                        html += '<option value="' + res.result[i] + '">' + res.result[i] + "</option>";
                    }
                    $old.html(html);
                }
            },
            function (xhr) {
                swalError(xhr.responseText);
            }
        );
    },
    html: function (name) {
        var html = '<select name="' + name + '" class="form-control select2">';
        $.each(languages, function (i, v) {
            html += '<option value="' + v + '">' + v + "</option>";
        });
        return html + "</select>";
    },
    migrate: function () {
        subtitles.loadHosts();
        $("#modalHostSub").modal("show");
        $("#frmMigrateSub").on("submit", function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.checkValidity() === false) {
                $(this).addClass("was-validated");
                return;
            }

            var $btn = $(this).find('button[type="submit"]');
            $.ajax({
                type: "POST",
                url: subtitles.url,
                cache: false,
                data: $(this).serialize(),
                beforeSend: function () {
                    $btn.prop("disabled", true);
                },
                complete: function () {
                    $btn.prop("disabled", false);
                },
                success: function (res) {
                    if (res.status !== "fail") {
                        subtitles.reload();
                        showToast(res.message, "success");
                        $("#frmMigrateSub")[0].reset();
                    } else {
                        showToast(res.message, "error");
                    }
                },
                error: function () {
                    showToast("Server cannot be accessed. Please contact admins!", "error");
                },
            });
        });
    },
    rename: function ($e) {
        if (typeof $e !== "undefined") {
            swal(
                {
                    title: "Rename",
                    type: "input",
                    inputValue: $e.data("name"),
                    showLoaderOnConfirm: true,
                    showCancelButton: true,
                    closeOnConfirm: false,
                    cancelButtonClass: "btn-secondary",
                    confirmButtonClass: "btn-success",
                    inputPlaceholder: "File Name",
                    confirmButtonText: "Save",
                },
                function (value) {
                    if (value === false) return false;
                    if (value.trim() === "") {
                        swal.showInputError("You need to write something!");
                        return false;
                    }
                    ajaxPOST(
                        subtitles.url,
                        {
                            action: "rename",
                            name: value,
                            id: $e.data("id"),
                        },
                        function (res) {
                            if (res.status !== "fail") {
                                subtitles.reload();
                                swalSuccess(res.message);
                            } else {
                                swalError(res.message);
                            }
                        },
                        function (xhr) {
                            swalError(xhr.responseText);
                        }
                    );
                }
            );
        }
    },
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                subtitles.url,
                {
                    action: "delete",
                    id: id,
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete the '" + $e.data("name") + "' subtitle file. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        subtitles.delete.ajax(
                            $e.data("id"),
                            function (res) {
                                if (res.status !== "fail") {
                                    subtitles.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            } else {
                swalWarning("Please select the subtitle you want to delete!");
            }
        },
        multi: function () {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllSubtitles, #ckAllSubtitles1").prop("checked", false);
            $("#tbSubtitles tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            subtitles.reload();
                            if (failed.length > 0) {
                                swalInfo("The " + deleted.length + " subtitle files have been successfully deleted and the other " + failed.length + " subtitle files failed to be deleted.");
                            } else {
                                swalSuccess("The " + total + " subtitle files have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        subtitles.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete " + ids.length + " subtitle files. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the subtitle files you want to delete first.");
            }
        },
    },
    list: function () {
        if ($("#tbSubtitles").length) {
            $("#tbSubtitles").DataTable({
                ajax: adminURL + "ajax/subtitles-list/",
                serverSide: true,
                columns: [
                    {
                        data: "DT_RowId",
                        responsivePriority: 0,
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            return '<div class="custom-control custom-checkbox mx-auto"><input type="checkbox" class="custom-control-input" id="row-' + meta.row + '" value="' + value + '"><label class="custom-control-label" for="row-' + meta.row + '"></label></div>';
                        },
                    },
                    {
                        data: "file_name",
                        responsivePriority: 1,
                        render: function (value, type, row, meta) {
                            return '<a href="' + row.link + '">' + value + "</a>";
                        },
                    },
                    {
                        data: "language",
                        className: "text-center",
                    },
                    {
                        data: "name",
                    },
                    {
                        data: "host",
                    },
                    {
                        data: "added",
                        className: "text-right",
                    },
                    {
                        data: "updated",
                        className: "text-right",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 2,
                        render: function (value, type, row) {
                            return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow"><button type="button" class="dropdown-item rename" data-id="' + value + '" data-name="' + row.file_name + '"><i class="fas fa-edit mr-2"></i>Rename</button><a href="' + row.link + '" class="dropdown-item" download><i class="fas fa-download mr-2"></i>Download</a>' + btnDeleteItem(value, row.file_name) + "</div></div>";
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [0, 7],
                    },
                    {
                        visible: true,
                        targets: [0, 1, 7],
                        className: "noVis",
                    },
                ],
                order: [[6, "desc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("#tbSubtitles button.delete").click(function () {
                        subtitles.delete.single($(this));
                    });
                    $("#tbSubtitles button.rename").click(function () {
                        subtitles.rename($(this));
                    });
                },
            });
        }
    },
    reload: function () {
        $("#ckAllSubtitles, #ckAllSubtitles1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbSubtitles").DataTable().ajax.reload(null, false);
    },
    upload: function () {
        $("#mdUploadSubtitle").modal("show");
        $("#frmUploadSubtitle").on("submit", function (e) {
            e.preventDefault();
            var data = new FormData(this),
                $frm = $("#frmUploadSubtitle"),
                $file = $frm.find('input[type="file"]'),
                $btn = $(this).find('button[type="submit"]');

            if (document.getElementById("uploadSubFile").files.length > 0) {
                $.ajax({
                    type: "POST",
                    url: subtitles.url,
                    contentType: false,
                    processData: false,
                    cache: false,
                    data: data,
                    beforeSend: function () {
                        $btn.prop("disabled", true);
                    },
                    complete: function () {
                        $btn.prop("disabled", false);
                        $file.val("");
                        $file.val(null);
                        $frm.find('label[for="uploadSubFile"]').text($file.attr("placeholder"));
                    },
                    success: function (res) {
                        if (res.status !== "fail") {
                            subtitles.reload();
                            showToast(res.message, "success");
                        } else {
                            showToast(res.message, "error");
                        }
                    },
                    error: function () {
                        showToast("Server cannot be accessed. Please contact admins!", "error");
                    },
                });
            } else {
                showToast("Insert the Subtitle File first!", "error");
            }
        });
    },
};
var sessions = {
    url: adminURL + "ajax/sessions/",
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                sessions.url,
                {
                    id: id,
                    action: "delete",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete '" + $e.data("name") + "' session. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        sessions.delete.ajax(
                            $e.data("id"),
                            function (res) {
                                if (res.status !== "fail") {
                                    sessions.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            }
        },
        multi: function () {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllSessions, #ckAllSessions1").prop("checked", false);
            $("#tbSessions tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            sessions.reload();
                            if (failed.length > 0) {
                                swalInfo(deleted.length + " user sessions were successfully deleted and " + failed.length + " other user sessions failed to be deleted.");
                            } else {
                                swalSuccess("These " + total + " user sessions have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        sessions.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete " + ids.length + " user sessions. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the user sessions you want to delete first.");
            }
        },
    },
    list: function () {
        if ($("#tbSessions").length) {
            $("#tbSessions").DataTable({
                ajax: adminURL + "ajax/sessions-list/",
                serverSide: true,
                columns: [
                    {
                        data: "id",
                        responsivePriority: 0,
                        className: "text-center",
                        render: function (value) {
                            return '<div class="custom-control custom-checkbox mx-auto"><input type="checkbox" class="custom-control-input" id="row-' + value + '" value="' + value + '"><label class="custom-control-label" for="row-' + value + '"></label></div>';
                        },
                    },
                    {
                        data: "username",
                        responsivePriority: 1,
                    },
                    {
                        data: "ip",
                        responsivePriority: 2,
                    },
                    {
                        data: "useragent",
                        render: function (value) {
                            return '<div contentEditable="true" class="title">' + value + "</div>";
                        },
                    },
                    {
                        data: "created",
                        className: "text-right",
                    },
                    {
                        data: "expired",
                        className: "text-right",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 3,
                        render: function (value, type, row) {
                            return '<button data-id="' + value + '" data-name="' + row.username + '" data-toggle="tooltip" title="Delete" type="button" class="btn btn-danger btn-sm delete"><i class="fas fa-trash"></i></button>';
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [0, 6],
                    },
                    {
                        visible: true,
                        targets: [0, 1, 2],
                        className: "noVis",
                    },
                ],
                order: [[5, "desc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("#tbSessions button.delete").click(function () {
                        sessions.delete.single($(this));
                    });
                },
            });
        }
    },
    reload: function () {
        $("#ckAllSessions, #ckAllSessions1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbSessions").DataTable().ajax.reload(null, false);
    },
};
var users = {
    url: adminURL + "ajax/users/",
    profileURL: adminURL + "ajax/profile/",
    delete: function ($e) {
        if (typeof $e !== "undefined") {
            swal(
                {
                    title: "Are you sure?",
                    text: "Delete the user with the username '" + $e.data("name") + "'. " + notRecovered(),
                    type: "warning",
                    showLoaderOnConfirm: true,
                    showCancelButton: true,
                    cancelButtonClass: "btn-secondary",
                    confirmButtonClass: "btn-danger",
                    closeOnConfirm: false,
                },
                function (isConfirm) {
                    if (!isConfirm) return;
                    ajaxPOST(
                        users.url,
                        {
                            id: $e.data("id"),
                            action: "delete",
                        },
                        function (res) {
                            if (res.status !== "fail") {
                                $("#tbUsers").DataTable().ajax.reload(null, false);
                                swalSuccess(res.message);
                            } else {
                                swalError(res.message);
                            }
                        },
                        function (xhr) {
                            swalError(xhr.responseText);
                        }
                    );
                }
            );
        }
    },
    list: function () {
        if ($("#tbUsers").length) {
            $("#tbUsers").DataTable({
                ajax: adminURL + "ajax/users-list/",
                serverSide: true,
                columns: [
                    {
                        data: "name",
                        responsivePriority: 0,
                    },
                    {
                        data: "user",
                    },
                    {
                        data: "email",
                    },
                    {
                        data: "status",
                        className: "text-center",
                        render: function (value, type, row) {
                            var title = "Inactive",
                                icon = "fa-times-circle text-danger";
                            if (value === 1) {
                                title = "Active";
                                icon = "fa-check-circle text-success";
                            } else if (value === 2) {
                                title = "Need Approval";
                                icon = "fa-question-circle text-info";
                            }
                            return '<i class="fas fa-lg ' + icon + '" data-toggle="tooltip" title="' + title + '"></i>';
                        },
                    },
                    {
                        data: "added",
                        className: "text-right",
                    },
                    {
                        data: "updated",
                        className: "text-right",
                    },
                    {
                        data: "role",
                    },
                    {
                        data: "videos",
                        className: "text-right",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 1,
                        render: function (value, type, row) {
                            return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + btnEditItem(adminURL + "users/edit/?id=" + value) + btnDeleteItem(row.id, row.name) + "</div></div>";
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [7, 8],
                    },
                    {
                        visible: true,
                        targets: [0, 8],
                        className: "noVis",
                    },
                ],
                order: [[4, "desc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    $("#tbUsers button.delete").click(function () {
                        users.delete($(this));
                    });
                },
            });
        }
    },
    changeEmail: function (email) {
        if (typeof email !== "undefined" && email !== "") {
            ajaxPOST(
                users.profileURL,
                {
                    action: "editEmail",
                    email: email,
                },
                function (res) {
                    if (res.status !== "fail") {
                        swalSuccess(res.message);
                        location.href = adminURL + "login/";
                    } else {
                        swalError(res.message);
                    }
                },
                function (xhr) {
                    swalError(xhr.responseText);
                }
            );
        }
    },
    changeUsername: function (user) {
        if (typeof user !== "undefined" && user !== "") {
            ajaxPOST(
                users.profileURL,
                {
                    action: "editUsername",
                    user: user,
                },
                function (res) {
                    if (res.status !== "fail") {
                        swalSuccess(res.message);
                        location.href = adminURL + "login/";
                    } else {
                        swalError(res.message);
                    }
                },
                function (xhr) {
                    swalError(xhr.responseText);
                }
            );
        }
    },
};
var videos = {
    url: adminURL + "ajax/videos/",
    alternatives: {
        add: function (val) {
            var $wrap = $("#altWrapper");
            var index = $wrap.find(".input-group").length;
            var html = '<div class="form-group" data-index="' + index + '"><div class="input-group"><input type="url" id="altLink-' + index + '" name="altLinks[]" class="form-control" placeholder="Insert alternative video url here" value="' + (typeof val !== "undefined" ? val : "") + '"><div class="input-group-append"><button type="button" data-toggle="tooltip" title="Remove Alternative Video URL" class="btn btn-danger" onclick="videos.alternatives.remove(' + index + ')"><i class="fas fa-minus"></i></button><a href="javascript:void(0)" data-toggle="tooltip" title="Move" class="btn btn-outline-secondary move"><i class="fas fa-expand-arrows-alt"></i></a></div></div></div>';
            $wrap.prepend(html);
            loadTooltip();
        },
        remove: function (i) {
            $('#altWrapper .form-group[data-index="' + i + '"]').remove();
            $('body > [role="tooltip"]').remove();
        },
        get: function (e) {
            var d = e.next(".dropdown-menu");
            if (!d.hasClass("show")) {
                ajaxPOST(
                    videos.url,
                    {
                        action: "get_alternatives",
                        id: e.data("id"),
                    },
                    function (res) {
                        if (res.status !== "fail") {
                            var hostName = "Direct Link",
                                icon = "direct";
                            d.html("");
                            $.each(res.result, function (i, v) {
                                if (v.host !== "" && typeof vidHosts[v.host] !== "undefined") {
                                    if (v.host === "direct") {
                                        if (v.url.indexOf(".m3u") > -1 || v.url.indexOf("hls") > -1) {
                                            icon = "m3u";
                                            hostName = "HLS Link";
                                        } else if (v.url.indexOf(".mpd") > -1 || v.url.indexOf("mpd") > -1) {
                                            icon = "mpd";
                                            hostName = "MPEG-DASH Link";
                                        } else {
                                            icon = v.host;
                                            hostName = vidHosts[v.host];
                                        }
                                    } else {
                                        icon = v.host;
                                        hostName = vidHosts[v.host];
                                    }
                                    e.next(".dropdown-menu.show").append('<a class="dropdown-item" href="' + v.url + '" target="_blank"><img src="' + imgCDNURL + "assets/img/logo/" + icon + '.png" width="16" height="16" class="mr-2">' + hostName.replace("|Additional Host", "").replace("|New", "") + "</a>");
                                }
                            });
                        } else {
                            swalError(res.message);
                        }
                    },
                    function (xhr) {
                        swalError("Failed to fetch data from server! Please contact the admin.");
                    }
                );
            }
        },
    },
    cache: {
        clear: {
            ajax: function (id, sCallback, eCallback) {
                ajaxPOST(
                    baseURL + "admin-api/",
                    {
                        id: id,
                        action: "clear_video_cache",
                        token: Cookies.get("adv_token", main.cookieConfig),
                    },
                    sCallback,
                    eCallback
                );
            },
            single: function ($e) {
                if (typeof $e !== "undefined") {
                    videos.cache.clear.ajax(
                        $e.data("id"),
                        function (res) {
                            if (res.status !== "fail") {
                                swalSuccess(res.message);
                            } else {
                                swalError(res.message);
                            }
                        },
                        function (xhr) {
                            swalError(xhr.responseText);
                        }
                    );
                }
            },
            multi: function (e) {
                var ids = [],
                    cleared = [],
                    failed = [];
                $("#ckAllVideos, #ckAllVideos1").prop("checked", false);
                $("#tbVideos tbody input[type=checkbox]:checked").each(function () {
                    ids.push($(this).val());
                });
                if (ids.length > 0) {
                    var callback = function (res, currentIndex) {
                            var nextIndex = currentIndex + 1,
                                total = 0;
                            if (res.status !== "fail") {
                                cleared.push(ids[currentIndex]);
                            } else {
                                failed.push(ids[currentIndex]);
                            }
                            total = cleared.length + failed.length;
                            if (total >= ids.length) {
                                if (failed.length > 0) {
                                    swalInfo("Cache of " + cleared.length + " videos was successfully cleared and cache of " + failed.length + " other videos failed to clear.");
                                } else {
                                    swalSuccess("These " + total + " videos have been successfully deleted.");
                                }
                            } else {
                                clearCacheNow(ids[nextIndex], nextIndex);
                            }
                        },
                        clearCacheNow = function (id, currentIndex) {
                            videos.cache.clear.ajax(
                                id,
                                function (res) {
                                    callback(res, currentIndex);
                                },
                                function (xhr) {
                                    callback({status: "fail"}, currentIndex);
                                }
                            );
                        };
                    swal(
                        {
                            title: "Are you sure?",
                            text: "You will clear the stored cache of " + ids.length + " videos.",
                            type: "warning",
                            showLoaderOnConfirm: true,
                            showCancelButton: true,
                            cancelButtonClass: "btn-secondary",
                            confirmButtonClass: "btn-danger",
                            closeOnConfirm: false,
                        },
                        function (isConfirm) {
                            if (!isConfirm) return;
                            clearCacheNow(ids[0], 0);
                        }
                    );
                } else {
                    swalWarning("Please check the videos you want to clear cache stored first.");
                }
            },
        },
    },
    checker: {
        multi: function (e) {
            var $table = $("#tbVideos tbody"),
                $ckItems = $table.find("input[type=checkbox]:checked"),
                updateStatus = function (id, sources, next) {
                    ajaxPOST(
                        videos.url,
                        {
                            action: "update_status",
                            id: id,
                            sources: sources,
                        },
                        function (res) {
                            checkNow($($ckItems[next]).val(), next);
                        },
                        function (xhr) {
                            checkNow($($ckItems[next]).val(), next);
                        }
                    );
                },
                getSources = function (serverLink, id, next) {
                    ajaxGET(
                        serverLink,
                        function (res) {
                            if (res.status !== "fail") {
                                updateStatus(id, res.sources, next);
                            } else {
                                updateStatus(id, [], next);
                            }
                        },
                        function (xhr) {
                            checkNow($($ckItems[next]).val(), next);
                        }
                    );
                },
                checkNow = function (id, index) {
                    var next = index + 1;
                    if (index <= $ckItems.length) {
                        ajaxPOST(
                            videos.url,
                            {
                                action: "get_server",
                                id: id,
                                source: "db",
                            },
                            function (res) {
                                if (res.status !== "fail") {
                                    getSources(res.result, id, next);
                                } else {
                                    checkNow($($ckItems[next]).val(), next);
                                }
                            },
                            function (xhr) {
                                checkNow($($ckItems[next]).val(), next);
                            }
                        );
                    } else {
                        videos.reload();
                        e.prop("disabled", false);
                    }
                };
            if ($ckItems.length > 0) {
                e.prop("disabled", true);
                $ckItems.each(function (i, v) {
                    $table.find("#status-" + $(this).val()).attr("class", "fas fa-spin fa-lg fa-sync-alt text-info");
                });
                checkNow($($ckItems[0]).val(), 0);
            } else {
                swalWarning("Please select the video you want to check!");
            }
        },
    },
    delete: {
        ajax: function (id, sCallback, eCallback) {
            ajaxPOST(
                videos.url,
                {
                    id: id,
                    action: "delete",
                },
                sCallback,
                eCallback
            );
        },
        single: function ($e) {
            if (typeof $e !== "undefined") {
                var id = $e.data("id"),
                    name = $e.data("name");
                swal(
                    {
                        title: "Are you sure?",
                        text: "Delete the '" + name + "' video. " + notRecovered(),
                        type: "warning",
                        showCancelButton: true,
                        showLoaderOnConfirm: true,
                        closeOnConfirm: false,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        videos.delete.ajax(
                            id,
                            function (res) {
                                if (res.status !== "fail") {
                                    videos.reload();
                                    swalSuccess(res.message);
                                } else {
                                    swalError(res.message);
                                }
                            },
                            function (xhr) {
                                swalError(xhr.responseText);
                            }
                        );
                    }
                );
            }
        },
        multi: function (e) {
            var ids = [],
                deleted = [],
                failed = [];
            $("#ckAllVideos, #ckAllVideos1").prop("checked", false);
            $("#tbVideos tbody input[type=checkbox]:checked").each(function () {
                ids.push($(this).val());
            });
            if (ids.length > 0) {
                var callback = function (res, currentIndex) {
                        var nextIndex = currentIndex + 1,
                            total = 0;
                        if (res.status !== "fail") {
                            deleted.push(ids[currentIndex]);
                        } else {
                            failed.push(ids[currentIndex]);
                        }
                        total = deleted.length + failed.length;
                        if (total >= ids.length) {
                            videos.reload();
                            if (failed.length > 0) {
                                swalInfo(deleted.length + " videos were successfully deleted and " + failed.length + " other videos failed to be deleted.");
                            } else {
                                swalSuccess("These " + total + " videos have been successfully deleted.");
                            }
                        } else {
                            deleteNow(ids[nextIndex], nextIndex);
                        }
                    },
                    deleteNow = function (id, currentIndex) {
                        videos.delete.ajax(
                            id,
                            function (res) {
                                callback(res, currentIndex);
                            },
                            function (xhr) {
                                callback({status: "fail"}, currentIndex);
                            }
                        );
                    };
                swal(
                    {
                        title: "Are you sure?",
                        text: "You will delete " + ids.length + " videos. " + notRecovered(),
                        type: "warning",
                        showLoaderOnConfirm: true,
                        showCancelButton: true,
                        cancelButtonClass: "btn-secondary",
                        confirmButtonClass: "btn-danger",
                        closeOnConfirm: false,
                    },
                    function (isConfirm) {
                        if (!isConfirm) return;
                        deleteNow(ids[0], 0);
                    }
                );
            } else {
                swalWarning("Please check the videos you want to delete first.");
            }
        },
    },
    subtitles: {
        autocomplete: {
            minLength: 3,
            source: function (req, res) {
                $.ajax({
                    url: videos.url,
                    type: "POST",
                    data: {
                        action: "search_subtitles",
                        q: req.term,
                    },
                    success: function (data) {
                        res(data);
                    },
                });
            },
            select: function (e, ui) {},
        },
        edit: function (id, lang, sub) {
            var $md = $("#mdEditSubtitle");
            $md.find("#editSubId").val(id);
            $md.find("#editSubURL").val(sub);
            $md.find("#editSubLang").val(lang);
            $md.find("#editSubFile").val("");
            $md.find("#editSubFile").val(null);
            $md.find('label[for="editSubFile"]').text($md.find("#editSubFile").attr("placeholder"));
            $md.find("#editSubType").val("url");
            $md.find("#fgEditSubURL").removeClass("d-none");
            $md.find("#fgEditSubFile").addClass("d-none");
            $md.modal("show");
        },
        delete: function (id, lang) {
            swal(
                {
                    title: "Are you sure?",
                    text: "Are you sure you want to delete the " + lang + " subtitle?",
                    type: "warning",
                    showLoaderOnConfirm: true,
                    showCancelButton: true,
                    cancelButtonClass: "btn-secondary",
                    confirmButtonClass: "btn-danger",
                    closeOnConfirm: true,
                },
                function (isConfirm) {
                    if (!isConfirm) return;
                    ajaxPOST(
                        videos.url,
                        {
                            action: "delete_subtitle",
                            id: id,
                        },
                        function (res) {
                            if (res.status !== "fail") {
                                $('[data-sub="' + id + '"]').remove();
                                showToast(res.message, "success");
                            } else {
                                showToast(res.message, "error");
                            }
                        },
                        function (xhr) {
                            showToast(xhr.responseText, "error");
                        }
                    );
                }
            );
        },
        add: function () {
            var $cs = $("#subsWrapper"),
                $ig = $cs.find(".input-group"),
                html = '<div class="form-group" data-index="' + $ig.length + '"><div class="input-group"><div class="input-group-prepend">' + subtitles.html("lang[]") + '<input type="hidden" id="sub-type-' + $ig.length + '" name="sub-type[]" value="url"></div><input type="url" id="sub-url-' + $ig.length + '" name="sub-url[]" class="form-control subtitle" placeholder="Subtitle URL"><div class="input-group-append"><button type="button" class="btn btn-outline-primary" data-toggle="tooltip" aria-label="Upload Subtitle" onclick="videos.subtitles.upload($(this))" data-index="' + $ig.length + '" title="Upload Subtitle"><i class="fas fa-upload"></i></button><button type="button" class="btn btn-outline-danger" data-toggle="tooltip" title="Remove Subtitle" data-index="' + $ig.length + '" aria-label="Remove Subtitle" onclick="videos.subtitles.remove($(this))"><i class="fas fa-minus"></i></button></div></div></div>';
            loadTooltip();
            $cs.append(html);
            var $url = $("#sub-url-" + $ig.length),
                conf = videos.subtitles.autocomplete;
            conf.select = function (e, ui) {
                $url.prev().find("select").val(ui.item.label).trigger("change");
            };
            $url.searchSubtitle(conf);
            $(".select2").select2({
                theme: "bootstrap4",
            });
        },
        remove: function (e) {
            $('#subsWrapper .form-group[data-index="' + e.data("index") + '"]').remove();
        },
        upload: function (e) {
            var $ig = e.closest(".input-group");
            $ig.find("#sub-type-" + e.data("index")).val("file");
            $ig.find("input.subtitle").replaceWith('<div class="custom-file"><input type="file" id="sub-' + e.data("index") + '" name="sub-file[]" class="custom-file-input subtitle" accept=".srt, .vtt, .ass, .sub, .stl, .dfxp, .ttml, .sbv, .txt"><label class="custom-file-label" for="sub-' + e.data("index") + '">Choose file</label></div>');
            e.replaceWith('<button type="button" class="btn btn-outline-primary" data-toggle="tooltip" title="Insert Subtitle URL" aria-label="Upload Subtitle" onclick="videos.subtitles.insertURL($(this))" data-index="' + e.data("index") + '"><i class="fas fa-link"></i></button>');
            loadTooltip();
            bsCustomFileInput.init();
        },
        insertURL: function (e) {
            var $ig = e.closest(".input-group");
            $ig.find("#sub-type-" + e.data("index")).val("url");
            $ig.find(".custom-file").replaceWith('<input type="url" id="sub-url-' + e.data("index") + '" name="sub-url[]" class="form-control subtitle" placeholder="Subtitle URL">');
            e.replaceWith('<button type="button" class="btn btn-outline-primary" data-toggle="tooltip" title="Upload Subtitle" aria-label="Upload Subtitle" onclick="videos.subtitles.upload($(this))" data-index="' + e.data("index") + '"><i class="fas fa-upload"></i></button>');
            loadTooltip();
            var $url = $("#sub-url-" + e.data("index")),
                conf = videos.subtitles.autocomplete;
            conf.select = function (e, ui) {
                $url.prev().find("select").val(ui.item.label);
            };
            $url.searchSubtitle(conf);
        },
        get: function (e) {
            var d = e.next(".dropdown-menu");
            if (!d.hasClass("show")) {
                ajaxPOST(
                    videos.url,
                    {
                        action: "get_subtitles",
                        id: e.data("id"),
                    },
                    function (res) {
                        if (res.status !== "fail") {
                            d.html("");
                            $.each(res.result, function (i, v) {
                                e.next(".dropdown-menu.show").append('<a class="dropdown-item" href="' + v.url + '" target="_blank">' + v.name + "</a>");
                            });
                        } else {
                            swalError(res.message);
                        }
                    },
                    function (xhr) {
                        swalError("Failed to fetch data from server! Please contact the admin.");
                    }
                );
            }
        },
    },
    bulk: {
        get_embed: function () {
            var $ckItems = $("#tbBulkVideos tbody input[type=checkbox]:checked"),
                txt = "",
                completed = [];
            if ($ckItems.length > 0) {
                $ckItems.each(function (i, e) {
                    txt += $(this).data("title") + "\t" + $(this).data("embed");
                    txt += "\n\n";
                    completed.push(e);
                    if (completed.length >= $ckItems.length) {
                        copyText(txt.trim(), "Embed URLs");
                    }
                });
            } else {
                showToast("Select the file you want to copy the embed url!", "error");
            }
        },
        save: function ($btn) {
            var $frm = $("#frmBulkVideo"),
                $btnGet = $("#btnGetEmbedURLs"),
                $link = $frm.find("#links"),
                links = $link.val().trim().split("\n"),
                $tbBulkVideo = $("#tbBulkVideos").DataTable({
                    responsive: true,
                    paging: false,
                    info: false,
                    searching: false,
                    columns: [
                        {
                            width: "10%",
                            responsivePriority: 0,
                            className: "text-center",
                        },
                        {
                            responsivePriority: 1,
                            render: function (value) {
                                return '<div class="title" contentEditable="true">' + value + "</div>";
                            },
                        },
                        {
                            responsivePriority: 2,
                            className: "text-center",
                        },
                        {
                            responsivePriority: 3,
                            className: "text-center",
                        },
                    ],
                    columnDefs: [
                        {
                            orderable: false,
                            targets: [0, 3],
                        },
                        {
                            visible: true,
                            targets: [0, 1],
                            className: "noVis",
                        },
                    ],
                    order: [[1, "asc"]],
                    drawCallback: function () {
                        loadTooltip();
                    },
                }),
                createFailRow = function (currentIndex) {
                    var copySourceLink = "copyText('" + links[currentIndex] + "', 'Source Link')",
                        result = [];
                    result.push('<div class="custom-control custom-checkbox mx-auto"><input type="checkbox" class="custom-control-input" id="bulk-' + currentIndex + '" value="' + currentIndex + '"><label class="custom-control-label" for="bulk-' + currentIndex + '"></label></div>');
                    result.push(links[currentIndex]);
                    result.push('<div class="text-center"><i class="fas fa-lg fa-times-circle text-danger" data-toggle="tooltip" title="Failed"></i></div>');
                    result.push('<div class="btn-group"><button type="button" class="btn btn-sm btn-custom dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-cog"></i></button><div class="dropdown-menu dropdown-menu-right border-0 shadow"><a class="dropdown-item" href="javascript:void(0)" onclick="' + copySourceLink + '">Copy Source Link</a></div></div>');
                    return result;
                },
                createSuccessRow = function (currentIndex, res) {
                    var copyEmbedLink = "",
                        copySourceLink = "",
                        result = [];
                    copyEmbedLink = "copyText('" + res.embed_link + "', 'Embed Link')";
                    copySourceLink = "copyText('" + links[currentIndex] + "', 'Source Link')";
                    result.push('<div class="custom-control custom-checkbox mx-auto"><input type="checkbox" class="custom-control-input" id="bulk-' + currentIndex + '" value="' + currentIndex + '" data-title="' + res.title + '" data-embed="' + res.embed_link + '"><label class="custom-control-label" for="bulk-' + currentIndex + '"></label></div>');
                    result.push(res.title);
                    result.push('<div class="text-center"><i class="fas fa-lg fa-check-circle text-success" data-toggle="tooltip" title="Success"></i></div>');
                    result.push('<div class="btn-group"><button type="button" class="btn btn-sm btn-custom dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-cog"></i></button><div class="dropdown-menu dropdown-menu-right border-0 shadow"><a class="dropdown-item" href="javascript:void(0)" onclick="' + copyEmbedLink + '">Copy Embed Link</a><a class="dropdown-item" href="javascript:void(0)" onclick="' + copySourceLink + '">Copy Source Link</a></div></div>');
                    return result;
                },
                getSources = function (apiURL, nextIndex) {
                    var currentIndex = nextIndex - 1,
                        nextId = links[nextIndex],
                        failCallback = function () {
                            $tbBulkVideo.row.add(createFailRow(currentIndex)).columns.adjust().draw();
                            checkNow(nextId, nextIndex);
                        };
                    if (apiURL) {
                        ajaxGET(
                            apiURL,
                            function (res) {
                                if (res.status !== "fail") {
                                    $tbBulkVideo.row.add(createSuccessRow(currentIndex, res)).columns.adjust().draw();
                                    checkNow(nextId, nextIndex);
                                } else {
                                    failCallback();
                                }
                            },
                            function (xhr) {
                                failCallback();
                            }
                        );
                    } else {
                        $tbBulkVideo.row.add(createFailRow(currentIndex)).columns.adjust().draw();
                        checkNow(nextId, nextIndex);
                    }
                },
                checkNow = function (id, currentIndex) {
                    var nextIndex = currentIndex + 1;
                    if (nextIndex <= links.length) {
                        ajaxPOST(
                            videos.url,
                            {
                                action: "get_server",
                                id: id,
                                useTitleAsSlug: $("#useTitleAsSlug").prop("checked"),
                            },
                            function (res) {
                                getSources(res.result, nextIndex);
                            },
                            function (xhr) {
                                getSources(null, nextIndex);
                            }
                        );
                    } else {
                        $link.val("");
                        $link.prop("disabled", false);
                        $btn.find("i").attr("class", "fas fa-save mr-2");
                        $btn.prop("disabled", false);
                        $btnGet.prop("disabled", false);
                        videos.reload();
                    }
                };

            if (links.length > 0) {
                $btnGet.prop("disabled", true);
                $tbBulkVideo.clear().draw();

                $btn.find("i").attr("class", "fas fa-spin fa-sync-alt mr-2");
                $btn.prop("disabled", true);
                $link.prop("disabled", true);

                checkNow(links[0], 0);
            } else {
                swalWarning("Video URL is required!");
            }
        },
    },
    removePoster: function (id, $e) {
        if (typeof id !== "undefined" && id !== "") {
            $e.prop("disabled", true);
            ajaxPOST(
                videos.url,
                {
                    action: "remove_poster",
                    id: id,
                },
                function (res) {
                    if (res.status !== "fail") {
                        $e.closest(".form-group").remove();
                        showToast(res.message, "success");
                    } else {
                        showToast(res.message, "error");
                    }
                    $e.prop("disabled", false);
                },
                function (xhr) {
                    showToast("Poster failed to delete. Insert a new poster if you want to replace it!", "error");
                }
            );
        }
    },
    scrollToHosts: function () {
        $("#collapseSites").collapse("show");
        $("html,body").animate(
            {
                scrollTop: $("#collapseSites").offset().top,
            },
            "slow"
        );
    },
    list: function () {
        if ($("#tbVideos").length) {
            $("#tbVideos").DataTable({
                ajax: adminURL + "ajax/videos-list/?status=" + $_GET("status") + "&dmca=" + $_GET("dmca"),
                serverSide: true,
                columns: [
                    {
                        data: "id",
                        responsivePriority: 0,
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            return btnCheckbox(value, "videos");
                        },
                    },
                    {
                        data: "title",
                        responsivePriority: 1,
                        render: function (value, type, row, meta) {
                            var img = "",
                                html = "";
                            if (value === "") value = "(No Title)";
                            img = '<div class="d-block"><img data-src="' + row.poster_url + '" class="img-thumbnail d-none" style="max-width:200px" alt="' + value + '"></div>';
                            html = '<div class="title" contentEditable="true" data-toggle="tooltip" title="' + value + '">' + value + "</div>";
                            if (row.poster !== "" && row.poster !== null) {
                                html = img + html;
                            }
                            return html;
                        },
                    },
                    {
                        data: "host",
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            if (row.alt_count > 0) {
                                return '<div class="dropdown"><button class="btn btn-outline-default btn-sm dropdown-toggle alt" type="button" data-toggle="dropdown" aria-expanded="false" data-id="' + row.id + '"><img src="' + imgCDNURL + "assets/img/logo/" + value + '.png" width="16" height="16"></button><div class="dropdown-menu shadow border-0" style="max-height:240px"></div></div>';
                            } else {
                                return '<a href="' + row.link + '" target="_blank" title="' + (typeof vidHosts[value] !== "undefined" ? vidHosts[value] : value).replace("|Additional Host", "").replace("|New", "") + '" data-toggle="tooltip"><img src="' + imgCDNURL + "assets/img/logo/" + value + '.png" width="16" height="16"></a>';
                            }
                        },
                    },
                    {
                        data: "status",
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            var icon = "check",
                                color = "success",
                                text = "Good",
                                html = "";
                            if (value == 2) {
                                icon = "minus";
                                color = "warning";
                                text = "Warning";
                            } else if (value == 1) {
                                icon = "times";
                                color = "danger";
                                text = "Broken";
                            }
                            html = '<i class="fas fa-lg fa-' + icon + "-circle text-" + color + ' status" data-toggle="tooltip" id="status-' + row.id + '" title="' + text + '"></i>';
                            return html;
                        },
                    },
                    {
                        data: "dmca",
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            return value == 1 ? '<i class="fas fa-lg fa-ban text-danger dmca" data-toggle="tooltip" title="Takedown"></i>' : "";
                        },
                    },
                    {
                        data: "sub_count",
                        className: "text-center",
                        render: function (value, type, row, meta) {
                            if (parseInt(value) > 0) {
                                return '<div class="dropdown"><a class="btn btn-outline-primary btn-sm dropdown-toggle" href="#" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" onclick="videos.subtitles.get($(this))" data-id="' + row.id + '"><i class="fas fa-lg fa-language"></i></a><div class="dropdown-menu shadow border-0" style="max-height:240px"></div></div>';
                            } else {
                                return "";
                            }
                        },
                    },
                    {
                        data: "views",
                        className: "text-right",
                    },
                    {
                        data: "name",
                    },
                    {
                        data: "added",
                        className: "text-right",
                    },
                    {
                        data: "updated",
                        className: "text-right",
                    },
                    {
                        data: "id",
                        className: "text-center",
                        responsivePriority: 2,
                        render: function (value, type, row) {
                            var takedown = row.dmca == 0 ? "Takedown" : "Cancel Takedown";
                            return '<div class="btn-group">' + btnCog() + '<div class="dropdown-menu dropdown-menu-right border-0 shadow">' + btnCopyEmbed(row.actions.embed_code) + btnEmbed(row.actions.embed) + btnDownload(row.actions.download) + '<div class="dropdown-divider"></div>' + btnEditItem(adminURL + "videos/edit/?id=" + value) + btnDeleteItem(value, row.title) + '<button data-id="' + value + '" class="dropdown-item clear" type="button"><i class="fas fa-eraser mr-2"></i>Clear Cache</button>' + (uRole === 0 ? '<div class="dropdown-divider"></div><button onclick="videos.dmca($(this))" data-id="' + value + '" class="dropdown-item" type="button"><i class="fas fa-ban mr-2"></i>' + takedown + "</button>" : "") + "</div></div>";
                        },
                    },
                ],
                columnDefs: [
                    {
                        orderable: false,
                        targets: [0, 5, 10],
                    },
                    {
                        visible: true,
                        targets: [0, 1, 10],
                        className: "noVis",
                    },
                ],
                order: [[8, "desc"]],
                drawCallback: function (settings) {
                    loadTooltip();
                    videos.showHideThumbnail($("#shThumbnail").prop("checked"));
                    $("#tbVideos button.alt").click(function () {
                        videos.alternatives.get($(this));
                    });
                    $("#tbVideos button.clear").click(function () {
                        videos.cache.clear.single($(this));
                    });
                    $("#tbVideos button.delete").click(function () {
                        videos.delete.single($(this));
                    });
                    $("#tbVideos button.copy-embed").click(function () {
                        copyText($(this).data("text"), "Embed");
                    });
                },
            });
        }
    },
    reload: function () {
        $("#ckAllVideos, #ckAllVideos1").prop("checked", false);
        $("#toolbar .btn-hidden").addClass("d-none");
        $("#tbVideos").DataTable().ajax.reload(null, false);
    },
    dmca: function (e) {
        e.prop("disabled", true);
        ajaxPOST(
            videos.url,
            {
                action: "dmca_takedown",
                id: e.data("id"),
            },
            function (res) {
                if (res.status !== "fail") {
                    videos.reload();
                    swalSuccess(res.message);
                } else {
                    swalError(res.message);
                }
                e.prop("disabled", false);
            },
            function (xhr) {
                swalError("Failed to fetch data from server! Please contact the admin.");
                e.prop("disabled", false);
            }
        );
    },
    init: function () {
        videos.list();

        if (typeof $.ui !== "undefined") {
            $.widget("custom.searchSubtitle", $.ui.autocomplete, {
                _renderItem: function (ul, item) {
                    return $("<li>")
                        .append('<strong>File Name: <span class="text-success">' + item.id + '</span><br>Language: <span class="text-primary">' + item.label + "</span></strong>")
                        .appendTo(ul);
                },
            });
        }

        if (typeof $.fn.searchSubtitle !== "undefined") {
            var conf = videos.subtitles.autocomplete;
            conf.select = function (e, ui) {
                $("#sub-lang-0").val(ui.item.label);
            };
            $("#sub-url-0").searchSubtitle(conf);
        }

        $("#mdEditSubtitle").detach().appendTo("body");
        $("#frmEditSubtitle").on("submit", function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.checkValidity() === false) {
                $(this).addClass("was-validated");
                return;
            }

            var $md = $("#mdEditSubtitle"),
                data = new FormData(this),
                $btn = $(this).find('button[type="submit"]'),
                type = $("#editSubType").val();

            if ((document.getElementById("editSubFile").files.length > 0 && type === "file") || type === "url") {
                $.ajax({
                    type: "POST",
                    url: videos.url,
                    contentType: false,
                    processData: false,
                    cache: false,
                    data: data,
                    beforeSend: function () {
                        $btn.prop("disabled", true);
                    },
                    complete: function () {
                        $btn.prop("disabled", false);
                    },
                    success: function (res) {
                        if (res.status !== "fail") {
                            var $item = $('.ui-sortable-handle[data-sub="' + res.result.id + '"]'),
                                editSubtitle = "videos.subtitles.edit(" + res.result.id + ", '" + res.result.lang + "', '" + res.result.sub + "')";
                            $item.find(".float-left a").attr("href", res.result.sub).text(res.result.lang);
                            $item.find(".float-right a:first-child").attr("onclick", editSubtitle);
                            $md.modal("hide");
                            showToast(res.message, "success");
                        } else {
                            showToast(res.message, "error");
                        }
                    },
                    error: function () {
                        showToast("Server cannot be accessed. Please contact admins!", "error");
                    },
                });
            } else {
                showToast("Insert the Subtitle URL/File first!", "error");
            }
        });
        $("#mdEditSubtitle").on("hidden.bs.modal", function () {
            $("#frmEditSubtitle")[0].reset();
        });

        $("#frmBulkVideo #links").blur(function () {
            if ($(this).val() !== "") {
                $("#btnBulkSave").prop("disabled", false);
            } else {
                $("#btnBulkSave").prop("disabled", true);
            }
        });
        $("#mdVideosBulkLink").detach().appendTo("body");
        $("#mdVideosBulkLink").on("hidden.bs.modal", function () {
            var $frm = $("#frmBulkVideo");
            $frm.find("#links").val("");
            $frm.find("#useTitleAsSlug").prop("checked", false);
            $("#tbBulkVideos").DataTable().clear().draw();
        });

        $("#ckAllBulkVideos, #ckAllBulkVideos1").change(function () {
            var $ckItem = $("#tbBulkVideos tbody input.custom-control-input");
            if ($(this).prop("checked")) {
                $ckItem.prop("checked", true);
            } else {
                $ckItem.prop("checked", false);
            }
        });

        if (typeof $.fn.sortable !== "undefined") {
            $("#subtitles").sortable();
            $("#altWrapper").sortable({
                handle: ".move",
            });
        }

        $(".btn-upload-poster").click(function () {
            $("#posterUpload").toggleClass("d-none");
            $("#posterURL").toggleClass("d-none");
        });
    },
    showHideThumbnail: function (checked) {
        var $thumbs = $("#tbVideos img.img-thumbnail");
        if (checked) {
            $thumbs.each(function (i) {
                $(this).attr("src", $(this).data("src"));
            });
            $thumbs.removeClass("d-none");
        } else {
            $thumbs.addClass("d-none");
        }
    },
    gdrive_files: {
        delete: function ($e) {
            swal(
                {
                    title: "Are you sure?",
                    text: "Delete the '" + $e.data("name") + "' mirror file.",
                    type: "warning",
                    showLoaderOnConfirm: true,
                    showCancelButton: true,
                    cancelButtonClass: "btn-secondary",
                    confirmButtonClass: "btn-danger",
                    closeOnConfirm: false,
                },
                function (isConfirm) {
                    if (!isConfirm) return;
                    ajaxPOST(
                        gdrive_files.url,
                        {
                            id: $e.data("id"),
                            action: "delete_mirror",
                        },
                        function (res) {
                            if (res.status !== "fail") {
                                $e.closest("li").remove();
                                swalSuccess(res.message);
                            } else {
                                swalError(res.message);
                            }
                        },
                        function (xhr) {
                            swalError(xhr.responseText);
                        }
                    );
                }
            );
        },
    },
};
var player = {
    alternative: {
        add: function () {
            swal(
                {
                    title: "Info",
                    text: "You can add some alternative video urls from the user page!",
                    type: "info",
                    showCancelButton: true,
                    confirmButtonClass: "btn-primary",
                    confirmButtonText: "OK",
                    cancelButtonClass: "btn-danger",
                    cancelButtonText: "Cancel",
                    closeOnConfirm: true,
                    closeOnCancel: true,
                },
                function (isConfirm) {
                    if (isConfirm) {
                        location.href = "videos/new/";
                    }
                }
            );
        },
    },
    subtitle: {
        upload: function ($e) {
            var $ig = $e.closest(".input-group"),
                index = $e.data("index");
            $ig.find("#sub-type-" + index).val("file");
            $ig.find("input.subtitle").replaceWith('<div class="custom-file"><input type="file" id="sub-' + index + '" name="sub-file[]" class="custom-file-input subtitle" accept=".srt, .vtt, .ass, .sub, .stl, .dfxp, .ttml, .sbv, .txt"><label class="custom-file-label" for="sub-' + index + '">Choose file (.srt, .vtt, .ass, .sub, .stl, .dfxp, .ttml, .sbv, .txt)</label></div>');
            $e.replaceWith('<button type="button" class="btn btn-outline-primary" data-toggle="tooltip" title="Insert Subtitle URL" aria-label="Upload Subtitle" onclick="player.subtitle.insert($(this))" data-index="' + index + '"><i class="fas fa-link"></i></button>');
            loadTooltip();
            bsCustomFileInput.init();
        },
        insert: function ($e) {
            var $ig = $e.closest(".input-group"),
                index = $e.data("index");
            $ig.find("#sub-type-" + index).val("url");
            $ig.find(".custom-file").replaceWith('<input type="text" name="sub-url[]" class="form-control subtitle" placeholder="Subtitle URL (.srt, .vtt, .ass, .sub, .stl, .dfxp, .ttml, .sbv, .txt)">');
            e.replaceWith('<button type="button" class="btn btn-outline-primary" data-toggle="tooltip" title="Upload Subtitle" aria-label="Upload Subtitle" onclick="player.subtitle.upload($(this))" data-index="' + index + '"><i class="fas fa-upload"></i></button>');
            loadTooltip();
        },
        add: function () {
            var $cs = $("#subsWrapper"),
                $fg = $cs.find(".form-group"),
                html = '<div class="form-group" data-index="' + $fg.length + '"><div class="input-group"><div class="input-group-prepend">' + subtitles.html("lang[]") + '<input type="hidden" id="sub-type-' + $fg.length + '" name="sub-type[]" value="url"></div><input type="text" name="sub-url[]" class="form-control subtitle" placeholder="Subtitle URL (.srt, .vtt, .ass, .sub, .stl, .dfxp, .ttml, .sbv, .txt)"><div class="input-group-append"><button type="button" class="btn btn-outline-primary" data-toggle="tooltip" aria-label="Upload Subtitle" onclick="player.subtitle.upload($(this))" data-index="' + $fg.length + '" title="Upload Subtitle"><i class="fas fa-upload"></i></button><button type="button" class="btn btn-outline-danger" data-toggle="tooltip" title="Remove Subtitle" data-index="' + $fg.length + '" aria-label="Remove Subtitle" onclick="player.subtitle.remove($(this))"><i class="fas fa-minus"></i></button></div></div></div>';
            if ($cs.find(".form-group").length < 10) {
                $cs.append(html);
            } else {
                swalWarning("Only 10 subtitles are allowed.");
            }
            loadTooltip();
        },
        remove: function ($e) {
            $('#subsWrapper .form-group[data-index="' + $e.data("index") + '"]').remove();
        },
    },
};

$(document).ready(function ($) {
    /**
     * main start
     */
    main.init();
    /**
     * main end
     */

    /**
     * dashboard start
     */
    $("#modalExtApps").detach().appendTo("body");
    dashboard.supportChecker();
    dashboard.popularVideos.list();
    dashboard.recentVideos.list();
    dashboard.chart.videoStatus(".video-status");
    dashboard.chart.serverStatus(".server-status");

    var views = dashboard.chart.views,
        $viewsEl = document.querySelector("#views > .chart");
    if (typeof views.apex === "undefined" && $viewsEl !== null) {
        views.apex = new ApexCharts($viewsEl, views.options);
        views.apex.render();
        views.load("seven_days");
    }
    $('#views input[name="options"]').click(function () {
        views.load($(this).val());
    });
    /**
     * dashboard end
     */

    /**
     * gdrive_accounts start
     */
    gdrive_accounts.list();
    /**
     * gdrive_accounts end
     */

    /**
     * gdrive_files start
     */
    gdrive_files.list();
    /**
     * gdrive_files end
     */

    /**
     * gdrive_backup_files start
     */
    gdrive_backup_files.list();
    /**
     * gdrive_backup_files end
     */

    /**
     * gdrive_backup_queue start
     */
    gdrive_backup_queue.list();
    /**
     * gdrive_backup_files end
     */

    /**
     * load_balancers start
     */
    load_balancers.list();

    if (typeof $.fn.multiSelect !== "undefined") {
        var disallowHostOptions = Object.assign(multiSelectOptions(), {
            selectableHeader: "<div class='header'>Enabled Hosts</div>" + main.multiSelectSearch,
            selectionHeader: "<div class='header'>Disabled Hosts</div>" + main.multiSelectSearch,
        });
        $("#disallow_hosts").multiSelect(disallowHostOptions);
    }
    /**
     * load_balancers end
     */

    /**
     * settings start
     */
    if (typeof $.fn.multiSelect !== "undefined") {
        var bypassHostOptions = Object.assign(multiSelectOptions(), {
                selectableHeader: "<div class='header'>Direct Hosts</div>" + main.multiSelectSearch,
                selectionHeader: "<div class='header'>Bypassed Hosts</div>" + main.multiSelectSearch,
            }),
            disabledHostOptions = Object.assign(multiSelectOptions(), {
                selectableHeader: "<div class='header'>Enabled Hosts</div>" + main.multiSelectSearch,
                selectionHeader: "<div class='header'>Disabled Hosts</div>" + main.multiSelectSearch,
            }),
            disabledResOptions = Object.assign(multiSelectOptions(), {
                selectableHeader: "<div class='header'>Enabled Resolutions</div>" + main.multiSelectSearch,
                selectionHeader: "<div class='header'>Disabled Resolutions</div>" + main.multiSelectSearch,
            });
        $("#bypass_hosts, #bypass_host").multiSelect(bypassHostOptions);
        $("#disable_host").multiSelect(disabledHostOptions);
        $("#disable_resolution").multiSelect(disabledResOptions);
    }

    $("#modalCustomVAST").detach().appendTo("body");

    $("#frmCreateCustomVast").submit(function (e) {
        e.preventDefault();
        ajaxPOST(
            settings.url,
            $(this).serialize(),
            function (res) {
                if (res.status !== "fail") {
                    $("#txtCustomVastResult").val(res.result);
                    swalSuccess(res.message);
                } else {
                    swalError(res.message);
                }
                $("#customVastResult").toggleClass("d-none");
            },
            function (xhr) {
                swalError(xhr.responseText);
            }
        );
    });

    $("#frmLicense").submit(function (e) {
        e.preventDefault();
        ajaxPOST(
            settings.url,
            $(this).serialize(),
            function (res) {
                if (res.status !== "fail") {
                    swalSuccess(res.message);
                    $("#frmLicense").remove();
                } else {
                    swalError(res.message);
                }
            },
            function (xhr) {
                swalError(xhr.responseText);
            }
        );
    });

    $("#player").change(function () {
        if ($(this).val() === "jwplayer_latest") {
            $("#p2p").prop("checked", false);
        }
    });
    /**
     * settings end
     */

    /**
     * subtitles start
     */
    $("#modalHostSub").detach().appendTo("body");
    $("#mdUploadSubtitle").detach().appendTo("body");
    subtitles.list();
    /**
     * subtitles end
     */

    /**
     * sessions start
     */
    sessions.list();
    /**
     * sessions end
     */

    /**
     * users start
     */
    users.list();
    var $userRetypePwd = $("#frmUser #retype_password"),
        $userPwd = $("#frmUser #password");
    $userPwd.change(function () {
        if ($(this).val() !== "") {
            $(this).prop("required", true);
            $userRetypePwd.prop("required", true);
        } else {
            $(this).prop("required", false);
            $userRetypePwd.prop("required", false);
        }
    });
    $userRetypePwd.change(function () {
        var el = "#frmUser #retype_password";
        if ($(this).val() !== $userPwd.val()) {
            matchValidation(el, "The confirm new password must be the same as the new password");
        } else {
            matchValidation(el, "");
        }
    });
    /**
     * users end
     */

    /**
     * videos start
     */
    videos.init();
    /**
     * videos end
     */

    /**
     * frontpage start
     */
    $("#frmCreatePlayer").on("submit", function (e) {
        e.preventDefault();

        var $frm = $("#frmCreatePlayer"),
            data = new FormData($frm[0]),
            $btn = $(this).find("#submit"),
            btnText = $btn.html(),
            spinner = '<span class="spinner-border spinner-border-sm" role="status"></span> Loading...',
            $result = $("#createPlayerResult"),
            $captcha = $("#captcha-response");

        $btn.html(spinner).prop("disabled", true);
        $result.addClass("d-none");
        $("#embedIframe").attr("src", "");

        if ($captcha.length && $captcha.val() === "") {
            swal(
                {
                    title: "Error!",
                    text: "Invalid Captcha! Load a new captcha.",
                    type: "warning",
                    showCancelButton: true,
                    showLoaderOnConfirm: true,
                    cancelButtonClass: "btn-secondary",
                    confirmButtonClass: "btn-primary",
                    closeOnConfirm: false,
                },
                function (isConfirm) {
                    if (!isConfirm) {
                        $btn.html(btnText).prop("disabled", false);
                    } else {
                        grecaptcha.reset();
                        grecaptcha.execute().then(function () {
                            $frm.trigger("submit");
                            swalSuccess("The form has been resubmitted.");
                        });
                    }
                }
            );
        } else {
            data.append("action", "createPlayer");
            $.ajax({
                type: "POST",
                url: "ajax/",
                contentType: false,
                processData: false,
                cache: false,
                data: data,
                complete: function () {
                    $btn.html(btnText).prop("disabled", false);
                },
                success: function (res) {
                    if (res.status !== "fail") {
                        $("#txtEmbed").val(res.result.embed_link);
                        $("#txtEmbedCode").val(res.result.embed_code);
                        $("#txtDl").val(res.result.download_link);
                        $("#txtReq").val(res.result.embed2_link);
                        $("#txtJson").val(res.result.api_link);
                        $("#embedIframe").attr("src", res.result.embed_link);
                        $result.removeClass("d-none");
                        $frm[0].reset();
                    } else {
                        swalError(res.message);
                        if ($captcha.length) {
                            grecaptcha.reset();
                            grecaptcha.execute();
                        }
                    }
                },
                error: function (xhr) {
                    swalError(xhr.responseText);
                },
            });
        }
    });
    $("#frmBypassLimit").on("submit", function (e) {
        e.preventDefault();

        var btnText = $("#submit").html(),
            $captcha = $("#captcha");
        $.ajax({
            url: "ajax/",
            method: "POST",
            dataType: "json",
            cache: false,
            xhrFields: {
                withCredentials: true,
            },
            data: $(this).serialize(),
            beforeSend: function () {
                $("#submit").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Please wait...').prop("disabled", true);
            },
            complete: function () {
                $("#submit").html(btnText).prop("disabled", false);
                if ($captcha.length) {
                    grecaptcha.reset();
                    grecaptcha.execute();
                }
            },
            success: function (res) {
                if (res.status !== "fail") {
                    $("#bypassedLink").val(res.result.link);
                    $("#bypassedLink").attr("data-id", res.result.id);
                    $("#bypassedLinkDL").prop("disabled", false);
                    swalSuccess(res.message);
                } else {
                    swalError(res.message);
                }
            },
        });
    });
    $("#frmDownloadGDrive").on("submit", function (e) {
        e.preventDefault();

        var callback = function () {
            var btnText = $("#bypassedLinkDL").html(),
                fileID = $("#bypassedLink").data("id"),
                accessToken = "";
            var downloadCompleted = function () {
                $("#bypassedLinkDL").html(btnText).prop("disabled", false);
                $("#bypassedLinkProgress").addClass("d-none");
            };
            $.ajax({
                url: "ajax/",
                method: "POST",
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
                data: $("#frmDownloadGDrive").serialize(),
                beforeSend: function () {
                    $("#bypassedLinkDL").html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Please wait...').prop("disabled", true);
                },
                success: function (res) {
                    if (res.status !== "fail") {
                        accessToken = res.result.access_token;
                        $.ajax({
                            type: "GET",
                            url: "https://www.googleapis.com/drive/v3/files/" + fileID + "?alt=json",
                            headers: {
                                authorization: "Bearer " + accessToken,
                            },
                            success: function (res) {
                                var fileName = res.name;
                                $.ajax({
                                    url: "https://www.googleapis.com/drive/v3/files/" + fileID + "?alt=media&source=downloadUrl",
                                    method: "GET",
                                    headers: {
                                        authorization: "Bearer " + accessToken,
                                    },
                                    beforeSend: function () {
                                        $("#bypassedLinkProgress").removeClass("d-none");
                                    },
                                    xhr: function () {
                                        var xhr = new XMLHttpRequest();
                                        xhr.onreadystatechange = function () {
                                            if (xhr.readyState === 2) {
                                                if (xhr.status === 200) {
                                                    xhr.responseType = "blob";
                                                } else {
                                                    xhr.responseType = "text";
                                                }
                                            }
                                        };
                                        xhr.addEventListener(
                                            "progress",
                                            function (e) {
                                                if (e.lengthComputable) {
                                                    var percent = parseInt((e.loaded / e.total) * 100);
                                                    $("#bypassedLinkProgress .progress-bar")
                                                        .attr("style", "width:" + percent + "%")
                                                        .attr("aria-valuenow", percent)
                                                        .text(percent + "%");
                                                    if (percent >= 100) {
                                                        var completed = setTimeout(function () {
                                                            downloadCompleted();
                                                            clearTimeout(completed);
                                                        }, 3000);
                                                    }
                                                }
                                            },
                                            false
                                        );
                                        return xhr;
                                    },
                                    success: function (data) {
                                        var blob = new Blob([data], {
                                            type: "application/octet-stream",
                                        });
                                        var isIE = false || !!document.documentMode;
                                        if (isIE) {
                                            window.navigator.msSaveBlob(blob, fileName);
                                        } else {
                                            var url = window.URL || window.webkitURL,
                                                a = $("<a />"),
                                                link;
                                            link = url.createObjectURL(blob);
                                            a.attr("download", fileName);
                                            a.attr("href", link);
                                            $("body").append(a);
                                            a[0].click();
                                            $("body").remove(a);
                                        }
                                    },
                                    error: function (xhr) {
                                        downloadCompleted();
                                        swalError("Cannot download the file!");
                                    },
                                });
                            },
                            error: function (xhr) {
                                downloadCompleted();
                                swalError(xhr.responseText);
                            },
                        });
                    } else {
                        downloadCompleted();
                        swalError(res.message);
                    }
                },
                error: function (xhr) {
                    downloadCompleted();
                    swalError("Cannot create access token!");
                },
            });
        };
        if ($("#captcha-response").length) {
            grecaptcha.reset();
            grecaptcha.execute().then(callback);
        } else {
            callback();
        }
    });
    if (typeof oldDBVersion !== "undefined" && typeof newDBVersion !== "undefined" && oldDBVersion !== newDBVersion) {
        var updateChecker = setInterval(function () {
            $.ajax({
                url: "ajax/?action=updateChecker",
                success: function (res) {
                    var percent = 0;
                    if (res.status !== "fail") {
                        percent = parseInt((res.result.number / res.result.total) * 100);
                        if (res.result.number === 0) {
                            updateNow();
                        }
                        if ($("body #updateModal").length === 0) {
                            $("body").append('<div class="modal" id="updateModal" data-backdrop="static" data-keyboard="false" tabindex="-1" aria-labelledby="updateModalLabel" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5 class="modal-title" id="updateModalLabel">Update Progress</h5></div><div class="modal-body"><p>Progressed Number: <span id="updateNumber">0</span> of <span id="updateTotal">0</span></p></p><div class="progress" style="height:20px"><div id="updateProgress" class="progress-bar" role="progressbar" style="width:0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="' + res.result.total + '">0%</div></div></div></div></div></div>');
                            $("body #updateModal").modal("show");
                        }
                        percent += "%";
                        $("body #updateModal #updateNumber").text(res.result.number);
                        $("body #updateModal #updateTotal").text(res.result.total);
                        $("body #updateModal #updateProgress").attr("aria-valuenow", res.result.number).css("width", percent).text(percent);
                        if (res.result.number > 0 && res.result.number >= res.result.total) {
                            $("body #updateModal").modal("hide");
                            clearInterval(updateChecker);
                        }
                    } else {
                        clearInterval(updateChecker);
                    }
                },
            });
        }, 2000);
    }
    /**
     * frontpage end
     */
});

function gdriveViewLink(gdrive_id) {
    return '<a href="https://drive.google.com/file/d/' + gdrive_id + '/view?usp=drivesdk" target="_blank">' + gdrive_id + "</a>";
}

function updateNow() {
    $.ajax({
        url: "ajax/?action=updateNow",
        timeout: 300000,
    });
}

function searchHost(txt) {
    var $list = $("#tbHost tbody tr");
    $list.each(function (i, e) {
        if ($(e).data("host").toLowerCase().indexOf(txt) > -1 || $(e).html().toLowerCase().indexOf(txt) > -1) {
            $(e).removeClass("d-none");
        } else {
            $(e).addClass("d-none");
        }
    });
}

function swalSuccess(msg) {
    swal("Success!", msg, "success");
}

function swalError(msg) {
    swal("Error!", msg, "error");
}

function swalInfo(msg) {
    swal("Info!", msg, "info");
}

function swalWarning(msg) {
    swal("Warning!", msg, "warning");
}

function ajaxValidation(el, msg) {
    var $this = document.querySelector(el);
    if (msg !== "") {
        $this.setAttribute("data-error-ajax", msg);
    } else {
        $this.removeAttribute("data-error-ajax");
    }
    $this.setCustomValidity(msg);
}

function matchValidation(el, msg) {
    var $this = document.querySelector(el);
    if (msg !== "") {
        $this.setAttribute("data-error-match", msg);
    } else {
        $this.removeAttribute("data-error-match");
    }
    $this.setCustomValidity(msg);
}

function multiSelectOptions() {
    var multiSelectSearch = "<input type='search' class='form-control form-control-sm' autocomplete='off' placeholder='Search'>",
        multiSelectOptions = {
            keepOrder: true,
            selectableHeader: multiSelectSearch,
            selectionHeader: multiSelectSearch,
            afterInit: function (ms) {
                var that = this,
                    id = "#" + that.$container.attr("id"),
                    $leftSearch = that.$selectableUl.prev(),
                    $rightSearch = that.$selectionUl.prev(),
                    leftList = id + " .ms-elem-selectable:not(.ms-selected)",
                    rightList = id + " .ms-elem-selection.ms-selected";

                $leftSearch.on("blur keyup", function (e) {
                    var txt = $(this).val().toLowerCase();
                    if (txt !== "") {
                        $(leftList).each(function () {
                            var item = $(this).text().toLowerCase();
                            if (item.indexOf(txt) > -1) {
                                $(this).removeClass("d-none");
                            } else {
                                $(this).addClass("d-none");
                            }
                        });
                    } else {
                        $(leftList).removeClass("d-none");
                    }
                });

                $rightSearch.on("blur keyup", function (e) {
                    var txt = $(this).val().toLowerCase();
                    if (txt !== "") {
                        $(rightList).each(function () {
                            var item = $(this).text().toLowerCase();
                            if (item.indexOf(txt) > -1) {
                                $(this).removeClass("d-none");
                            } else {
                                $(this).addClass("d-none");
                            }
                        });
                    } else {
                        $(rightList).removeClass("d-none");
                    }
                });
            },
        };
    return multiSelectOptions;
}

function copyText(text, name) {
    var textarea = document.createElement("textarea");
    textarea.textContent = text;
    document.body.appendChild(textarea);

    var range = document.createRange();
    range.selectNode(textarea);

    var selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    console.log("copy success", document.execCommand("copy"));
    selection.removeAllRanges();

    document.body.removeChild(textarea);

    name = typeof name !== "undefined" && name !== "" && name !== null ? name : "Embed code";
    showToast(name + " has been copied.", "success");
}

function loadTooltip() {
    $('[data-toggle="tooltip"], [data-tooltip="true"]').tooltip({
        container: "body",
    });
    $('[data-toggle="tooltip"], [data-tooltip="true"]').on("show.bs.tooltip", function () {
        $('body > [role="tooltip"]').remove();
    });
}

function loadStyle(url, onloadCallback) {
    var e = document.createElement("link");
    e.href = url;
    e.type = "text/css";
    e.rel = "stylesheet";
    if (typeof onloadCallback !== "undefined") {
        e.onload = onloadCallback;
    }
    document.getElementsByTagName("head")[0].appendChild(e);
}

function require(url, onloadCallback) {
    var e = document.createElement("script");
    e.src = url;
    e.type = "text/javascript";
    if (typeof onloadCallback !== "undefined") {
        e.onload = onloadCallback;
    }
    document.getElementsByTagName("head")[0].appendChild(e);
}

function $_GET(key) {
    key = key.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + key + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(window.location.href);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function showToast(text, type, opts) {
    var def = {
            text: text.replace(/\+/gi, " "),
            duration: 5000,
            close: true,
            gravity: "top",
            position: "right",
            stopOnFocus: true,
            callback: function () {
                Cookies.remove("adm-type", main.cookieConfig);
                Cookies.remove("adm-message", main.cookieConfig);
            },
        },
        style = {
            info: {
                style: {
                    background: "linear-gradient(to right, #5477f5, #73a5ff)",
                },
            },
            warning: {
                style: {
                    background: "linear-gradient(to right, #ff9800, #ffc107)",
                },
                className: "text-dark",
            },
            danger: {
                style: {
                    background: "linear-gradient(to right, #e91e63, #f44336)",
                },
            },
            success: {
                style: {
                    background: "linear-gradient(to right, #009688, #4caf50)",
                },
            },
            error: {
                style: {
                    background: "linear-gradient(to right, #e91e63, #f44336)",
                },
            },
        };
    $('body div[role="tooltip"]').remove();
    if (typeof Toastify !== "undefined") {
        Toastify(Object.assign(def, style[type], opts)).showToast();
    }
}

function ajaxGET(url, sCallback, eCallback) {
    var c = url.indexOf("/api") > -1 ? false : true;
    $.ajax({
        url: url,
        type: "GET",
        cache: c,
        success: sCallback,
        error: eCallback,
    });
}

function ajaxPOST(url, data, sCallback, eCallback) {
    var c = url.indexOf("/api") > -1 ? false : true;
    $.ajax({
        url: url,
        type: "POST",
        cache: c,
        data: data,
        success: sCallback,
        error: eCallback,
    });
}

function btnCog() {
    return '<button type="button" class="btn btn-sm btn-custom dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-cog"></i></button>';
}

function btnDownload(hrefValue) {
    return '<a class="dropdown-item" href="' + hrefValue + '" target="_blank"><i class="fas fa-download mr-2"></i>Download Link</a>';
}

function btnEmbed(hrefValue) {
    return '<a class="dropdown-item" href="' + hrefValue + '" target="_blank"><i class="fas fa-link mr-2"></i>Embed Link</a>';
}

function btnEditItem(hrefValue) {
    return '<a href="' + hrefValue + '" class="dropdown-item" type="button"><i class="fas fa-edit mr-2"></i>Edit</a>';
}

function btnCopyEmbed(text) {
    return '<button class="dropdown-item copy-embed" data-text="' + text + '"><i class="fas fa-code mr-2"></i>Copy Embed Code</button>';
}

function btnDeleteItem(id, name) {
    return '<button class="dropdown-item delete" data-id="' + id + '" data-name="' + name + '" type="button"><i class="fas fa-trash mr-2"></i>Delete</button>';
}

function notRecovered() {
    return "Deleted data cannot be recovered.";
}

function btnCheckbox(value, name) {
    return '<div class="custom-control custom-checkbox mx-auto"><input type="checkbox" class="custom-control-input" id="' + name + "-" + value + '" value="' + value + '"><label class="custom-control-label" for="' + name + "-" + value + '"></label></div>';
}

(function () {
    "use strict";
    window.addEventListener(
        "load",
        function () {
            var jqValidation = function (elements, index) {
                    var errorHTML = function (type, newText, $e) {
                        var text = $e.html();
                        $e.html("<span id='error-" + index + "-" + type + "'>" + text + (text !== "" ? "<br>" : "") + newText + "</span>");
                    };
                    if (elements.length) {
                        $.each(elements, function (i, e) {
                            var $el = $(this),
                                $err = $el.next(".invalid-feedback"),
                                val = $el.val(),
                                min = $el.attr("min"),
                                max = $el.attr("max"),
                                pattern = new RegExp($el.attr("pattern")),
                                msgId = "span#error-" + index + "-" + i + "-";
                            if ($err.length === 0) {
                                $err = $el.closest(".input-group").find(".invalid-feedback");
                            }
                            if ($el.is(":invalid")) {
                                $err.html("");
                                $.each(e.dataset, function (j, f) {
                                    j = j.replace("error", "");
                                    if (j === "Required") {
                                        if (val === "") errorHTML(j + "-" + i, f, $err);
                                        else $(msgId + j).remove();
                                    }
                                    if (j === "Min") {
                                        if (typeof min !== "number" || parseFloat(val) < parseFloat(min)) errorHTML(j + "-" + i, f, $err);
                                        else $(msgId + j).remove();
                                    }
                                    if (j === "Max") {
                                        if (typeof max !== "number" || parseFloat(val) > parseFloat(max)) errorHTML(j + "-" + i, f, $err);
                                        else $(msgId + j).remove();
                                    }
                                    if (j === "Pattern") {
                                        if (!pattern.test(val)) errorHTML(j + "-" + i, f, $err);
                                        else $(msgId + j).remove();
                                    }
                                    if (j === "Ajax") {
                                        if (f !== "") errorHTML(j + "-" + i, f, $err);
                                        else $(msgId + j).remove();
                                    }
                                    if (j === "Match") {
                                        if (f !== "") errorHTML(j + "-" + i, f, $err);
                                        else $(msgId + j).remove();
                                    }
                                });
                            }
                        });
                    }
                },
                forms = document.getElementsByClassName("needs-validation");
            Array.prototype.filter.call(forms, function (form, index) {
                form.addEventListener(
                    "submit",
                    function (e) {
                        if (form.checkValidity() === false) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                        form.classList.add("was-validated");
                        jqValidation(form.elements, index);
                    },
                    false
                );
            });
        },
        false
    );
})();
