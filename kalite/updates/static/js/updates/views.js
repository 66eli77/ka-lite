
var UpdateVideosView = Backbone.View.extend({

    updateVideosTemplate: HB.template("videos_update/update-videos-template"),

    events: {
        "click #language_chosen" : "show_language_selector",
        "click #download-videos" : "download_videos_clicked",
        "click #delete-videos" : "delete_videos_clicked",
        "click #cancel-download" : "cancel_download_clicked",
        "click #retry-video-download" : "retry_video_download_clicked",
        "change #download_language_selector" : "download_language_selector_changed"
    },

    show_language_selector: function() {
        $("#download_language_selector").show();
        $("#language_choice_titlebar a").hide();
    },

    download_videos_clicked: function(){
        clear_messages();

        // Prep
        // Get all videos to download
        var youtube_ids = getSelectedIncompleteMetadata("youtube_id");
        numVideos = youtube_ids.length;

        // Do the request
        doRequest(URL_START_VIDEO_DOWNLOADS, {youtube_ids: youtube_ids})
            .success(function() {
                updatesStart("videodownload", 5000, video_callbacks);
            })
            .fail(function(resp) {
                $("#download-videos").removeAttr("disabled");
            });

        // Update the UI
        unselectAllNodes();
        $("#cancel-download").show();
        $("#download-videos").attr("disabled", "disabled");

        // Send event.  NOTE: DO NOT WRAP STRINGS ON THIS CALL!!
        ga_track("send", "event", "update", "click-download-videos", "Download Videos", youtube_ids.length);    
    },

    delete_videos_clicked: function() {
        clear_messages();

        $("#modal_dialog").dialog({
            title: gettext("Are you sure you want to delete?"),
            resizable: true,
            draggable: true,
            height: 200,
            modal: true,
            buttons: [{
                id: "input_yes",
                text: gettext("Yes"),
                click: function() {
                    // This function can only get called when
                    //   no downloads are in progress.
                    // Prep
                    // Get all videos marked for download

                    var youtube_ids = getSelectedStartedMetadata("youtube_id");
                    // Do the request
                    doRequest(URL_DELETE_VIDEOS, {youtube_ids: youtube_ids})
                        .success(function() {
                            $.each(youtube_ids, function(ind, id) {
                                setNodeClass(id, "unstarted");
                            });
                        })
                        .fail(function(resp) {
                            $(".progress-waiting").hide();
                        });
                        // Update the UI
                        unselectAllNodes();

                        // Send event.  NOTE: DO NOT WRAP STRINGS ON THIS CALL!!
                        ga_track("send", "event", "update", "click-delete-videos", "Delete Videos", youtube_ids.length);

                        $(this).dialog("close");
                    }
                },
                {
                    id: "input_cancel",
                    text: gettext("No"),
                    click: function() {
                        $(this).dialog("close");
                }
            }]

        });
        jQuery("button.ui-dialog-titlebar-close").hide();
        $("#modal_dialog").text(gettext("Deleting the downloaded video(s) will lead to permanent loss of data"));
    },

    // Cancel current downloads
    cancel_download_clicked: function(){
        clear_messages();

        // Prep

        // Do the request
        doRequest(URL_CANCEL_VIDEO_DOWNLOADS)
            .success(function() {
                // Reset ALL of the progress tracking
                updatesReset();

                // Update the UI
                $("#download-videos").removeAttr("disabled");
                $("#cancel-download").hide();
            });

        // Update the UI

        // Send event.  NOTE: DO NOT WRAP STRINGS ON THIS CALL!!
        ga_track("send", "event", "update", "click-cancel-downloads", "Cancel Downloads");    
    },

    retry_video_download_clicked: function(){
        // Prep

        // Do the request
        doRequest(URL_START_VIDEO_DOWNLOADS, {});

        // Update the UI
        $(this).attr("disabled", "disabled");

        // Send event.  NOTE: DO NOT WRAP STRINGS ON THIS CALL!!
        ga_track("send", "event", "update", "click-retry-download", "Retry Download");
    },

    download_language_selector_changed: function(){
        var lang_code = $("#download_language_selector option:selected")[0].value;
        window.location.href = setGetParam(window.location.href, "lang", lang_code);
    },

    initialize: function(){
        this.render();
    },

    render: function(){
        this.$el.html(this.updateVideosTemplate());
        return this;
    },
});



var HelpDownloadingVideosView = Backbone.View.extend({

    template: HB.template("videos_update/help-downloading-videos-template"),

    events: {

    },

    initialize: function(){
        this.render();
    },

    render: function(){
        this.$el.html(this.template());
        return this;
    }
});



var ContentTreeView = Backbone.View.extend({


    contenTreeTemplate: HB.template("videos_update/content-tree-template"),

    events: {

    },

    initialize: function(){
        doRequest(URL_GET_ANNOTATED_TOPIC_TREE, {})
        .success(function(treeData) {

            if ($.isEmptyObject(treeData)) {
                $("#content_tree h2").html(gettext("Apologies, but there are no videos available for this language."));
            }

            $("#content_tree").dynatree({
                imagePath:"../images/",
                checkbox: true,
                selectMode: 3,
                children: treeData,
                debugLevel: 0,
                onSelect: function(select, node) {

                    var newVideoMetadata = getSelectedIncompleteMetadata();
                    var oldVideoMetadata = getSelectedStartedMetadata();
                    var newVideoCount    = newVideoMetadata.length;
                    var oldVideoCount    = oldVideoMetadata.length;
                    var newVideoSize     = _(newVideoMetadata).reduce(function(memo, meta) {
                        // Reduce to compute sum
                        return memo + meta.size;
                    }, 0);
                    var oldVideoSize     = _(oldVideoMetadata).reduce(function(memo, meta) {
                        return memo + meta.size;
                    }, 0);

                    $("#download-legend-unselected").toggle((newVideoCount + oldVideoCount) == 0);

                    if (newVideoCount == 0) {
                        $("#download-videos").hide();
                    } else {
                        $("#download-videos-text").text(sprintf(gettext("Download %(vid_count)d new selected video(s)") + " (%(vid_size).1f %(vid_size_units)s)", {
                            vid_count: newVideoCount,
                            vid_size: (newVideoSize < Math.pow(2, 10)) ? newVideoSize : newVideoSize / Math.pow(2, 10),
                            vid_size_units: (newVideoSize < Math.pow(2, 10)) ? "MB" : "GB"
                        }));
                        $("#download-videos").toggle($("#download-videos").attr("disabled") === undefined); // only show if we're not currently downloading
                    }
                    if (oldVideoCount == 0) {
                        $("#delete-videos").hide();
                    } else {
                        $("#delete-videos-text").text(sprintf(gettext("Delete %(vid_count)d selected video(s)") + " (%(vid_size).1f %(vid_size_units)s)", {
                            vid_count: oldVideoCount,
                            vid_size: (oldVideoSize < Math.pow(2, 10)) ? oldVideoSize : oldVideoSize / Math.pow(2, 10),
                            vid_size_units: (oldVideoSize < Math.pow(2, 10)) ? "MB" : "GB"
                        }));
                        $("#delete-videos").show();
                    }
                },
                onDblClick: function(node, event) {
                    node.toggleSelect();
                },
                onKeydown: function(node, event) {
                    if( event.which == 32 ) {
                        node.toggleSelect();
                        return false;
                    }
                },
                onPostInit: function() {
                    toggle_state("server", function(server_is_online) {
                        // We assume the distributed server is offline; if it's online, then we enable buttons that only work with internet.
                        // Best to assume offline, as online check returns much faster than offline check.
                        if(server_is_online){
                            $(".enable-when-server-online").removeAttr("disabled");
                            updatesStart("videodownload", 5000, video_callbacks);
                        } else {
                            show_message("error", gettext("The server does not have internet access; videos cannot be downloaded at this time."));
                        }
                    });
                }
            });
        });

        this.render();
    },

    render: function(){
        this.$el.html(this.contenTreeTemplate());
        return this;
    },
});

