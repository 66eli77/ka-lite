// Views
var SidebarStateModel = Backbone.Model.extend({
    defaults : {
        open    : true
    }
});
var sidebar_state_model = new SidebarStateModel();

var SidebarColumnsModel = Backbone.Model.extend({
    defaults : {
        columns : []
    }
});
var sidebar_columns_model = new SidebarColumnsModel();

var total_columns = 0;
var fetched_sidebars = [];
var tooLong = false;
var sb_offset = -160;

var SidebarView = React.createClass({
    getInitialState: function() {
        return {sidebar_position: 0, is_fade: 'block', tab_position: 400};
    },

    prepareColumnData: function(id) {
        this.model = new TopicNode({"id": id, "title": "Khan"});
        var data = {
            model: this.model,
            entity_key: this.props.entity_key,
            entity_collection: this.props.entity_collection,
            channel: this.props.channel
        };
        return data;
    },

    componentWillMount : function() {
        console.log("componentWillMount");
        // this model store info about how to display the sidebar
        sidebar_state_model.on("change:open", (function() {
            var current_width = total_columns*200 + 200;
            if (sidebar_state_model.get('open')){
                if(tooLong){
                    console.log('mamamam: ', sb_offset);
                    this.setState({sidebar_position: sb_offset, is_fade: 'block', tab_position: current_width+sb_offset});
                }else{
                    console.log('YOYOY: ', sb_offset);
                    this.setState({sidebar_position: 0, is_fade: 'block', tab_position: current_width});
                }
            }else{
                console.log('POPOPO: ', sb_offset);
                current_width = "-" + current_width;
                this.setState({sidebar_position: current_width, is_fade: 'none', tab_position: 0});
            }
        }.bind(this)));

        //this model store info about what to display inside sidebar
        sidebar_columns_model.on("change", (function() {
            this.fetchSidebars();
        }.bind(this)));
    },

    fetchSidebars: function() {
        var columns_data = sidebar_columns_model.get('columns');
     console.log("<1><1><1>: ", columns_data);
        var column_length =  columns_data.length;
        columns_data.map(function (colum, index){
            // console.log('xxxxx: ', colum);
            if( total_columns < index+1){
                total_columns = index+1;
                this.fetchHelper(colum, index, column_length);
            }else{
                if(index  == column_length-1){
                    var dif = total_columns - column_length + 1;
                    for(i = 0; i < dif; i++){
                        fetched_sidebars.pop();
                    }
                    total_columns = column_length;
                    this.fetchHelper(colum, index, column_length);
                }
            }
        }, this);
    },

    fetchHelper: function(colum, index, column_length) {
        var that = this;
        var my_data = this.prepareColumnData(colum);
        var my_collection = new my_data.entity_collection({parent: my_data.model.get("id"), channel: my_data.channel});
        my_collection.fetch({
            success: function(){
                fetched_sidebars.push( <TopicContainerInnerView data={my_collection} key = {index}/> );
                if(index  == column_length-1){
                    var current_width = column_length * 200 + 200;
                    if ($(window).width() - current_width < 100){
                        tooLong = true;
                    }else{
                        tooLong = false;
                    }
                    while($(window).width() - current_width - sb_offset - 160 < 60){
                        sb_offset -= 200;
                    }
                    if (tooLong){
                        that.setState({cur_sidebars: fetched_sidebars, sidebar_position: sb_offset, tab_position: current_width+sb_offset, sb_back_pos: -sb_offset, sb_vis: 'block'});
                    }else{
                        console.log('HEHE: ', sb_offset);
                        that.setState({cur_sidebars: fetched_sidebars, sidebar_position: 0, tab_position: current_width, sb_back_pos: 0, sb_vis: 'none'});
                    }
                }
            }
        },this);
    },

    render: function() {
        console.log('SidebarView Render >>> ');
        var sidebar_position = {left: this.state.sidebar_position, position: "absolute"};
        return (
            <div>
                <SidebarTab position={this.state.tab_position} />
                <nav className="sidebar-panel" role="navigation" aria-label="Topic sidebar menu" style={sidebar_position}>
                    <SidebarBack sb_back_offset={this.state.sb_back_pos} sb_back_vis={this.state.sb_vis}/>
                    <div className="sidebar-content">
                        {this.state.cur_sidebars}
                    </div>
                </nav>
                <SidebarFade display={this.state.is_fade}/>
            </div>
        );
    }
});

var SidebarBack = React.createClass({
    sidebarBackClicked: function() {
        window.channel_router.url_back();
    },

    // shouldComponentUpdate: function(nextProps, nextState) {
    //     console.log('SidebarBack shouldComponentUpdate >>> ', nextProps.sb_back_vis);
    //     if(nextProps.sb_back_vis === 'none'){
    //         return false;
    //     }else{
    //         return true;
    //     }
    // },

    render: function() {
        console.log('SidebarBack Render >>> ', this.props.sb_back_vis);
        var sb_back_style = {left: this.props.sb_back_offset, display: this.props.sb_back_vis};
        return (
            <div className="sidebar-back" style={sb_back_style}>
                <button className="simple-button green icon icon-arrow-left2" onClick={this.sidebarBackClicked}></button>
            </div>
        );
    }
});

var SidebarFade = React.createClass({
    sidebarFadeClicked: function() {
        if(sidebar_state_model.get("open")){
            sidebar_state_model.set("open", false);
        }else{
            sidebar_state_model.set("open", true);
        }
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        return nextProps.display !== this.props.display;
    },

    render: function() {
        // console.log('SidebarFade Render >>> ');
        var sidebar_fade_style = {display: this.props.display};
        return (
            <div onClick={this.sidebarFadeClicked} className="sidebar-fade" style={sidebar_fade_style}></div>
        );
    }
});

var SidebarTab = React.createClass({
    sidebarTabClicked: function() {
 // console.log("@@current columns: ", sidebar_columns_model.get('columns'));
        if(sidebar_state_model.get('open')){
            sidebar_state_model.set("open", false);
        }else{
            sidebar_state_model.set("open", true);
        }
    },

    render: function() {
        console.log('SidebarTab Render >>> ', this.props.position);
        var sidebar_tab_position = {left: this.props.position, position: "absolute"};
        return (
            <div onClick={this.sidebarTabClicked} className="sidebar-tab" style={sidebar_tab_position}>
                <span className="icon-circle-left"></span>
            </div>
        );
    }
});

var TopicContainerInnerView = React.createClass({
    componentDidMount: function() {
        //not sure if this is the right place to attach slimScroll
        $(".sidebar").slimScroll({
            color: "#083505",
            opacity: 0.2,
            size: "6px",
            distance: "1px",
            alwaysVisible: true
        });
        // resize the scrollable part of sidebar to the page height
        $(window).resize(_.throttle(function() {
            var height = $(window).height();
            self.$(".slimScrollDiv, .sidebar").height(height);
        }, 200));
        $(window).resize();
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        // console.log('shouldComponentUpdate ****', nextProps.data.parent, " ***** ", this.props.data.parent);
        if(nextProps.data.parent == this.props.data.parent){
            return false;
        }else{
            return true;
        }
    },

    render: function() {
        console.log('TopicContainerInnerView Render >>> ');
        var entries = this.props.data.models;
        var SidebarNodes = entries.map(function (entry, index) {
            return (
                <SidebarEntryView entry = {entry} collection = {this.props.data} key = {entry.attributes.slug + index}/>
            );
        }, this);
        return (
            <div className="topic-container-inner" id={'sb'+this.props.id}>
                <ul className="sidebar">
                    {SidebarNodes}
                </ul>
            </div>
        );
    }
});

var SidebarEntryView = React.createClass({
    getInitialState: function() {
        this.props.entry.set("active", false);
        this.is_entry_active = "sidebar-entry sidebar-entry-link";
        return null;
    },

    componentWillMount : function() {
        this.props.entry.on("change:active", (function() {
            this.is_entry_active = "sidebar-entry sidebar-entry-link";
            this.forceUpdate();
        }.bind(this)));
    },

    entryClicked: function() {
        if (!this.props.entry.get("active")){
            if(this.props.entry.get("kind")==="Topic"){
                window.channel_router.navigate(this.props.entry.attributes.path, {trigger: true});
            }else{
                console.log("WOW");
                this.entry_requested(this.props.entry);
            }
            this.purgeActiveEntry();
            this.props.entry.set("active", true);
            this.is_entry_active = "sidebar-entry sidebar-entry-link active-entry"; 
            return false;
        }
    },

    purgeActiveEntry: function() {
        this.props.collection.invoke('set', {"active": false});
    },

    entry_requested: function(entry) {
        this.content_view = new ContentAreaView({
            el: "#content-area"
        });
        this.model = new TopicNode({"id": "root", "title": "Khan"});
        var kind = entry.get("kind") || entry.get("entity_kind");
        var id = entry.get("id") || entry.get("entity_id");

        var view;

        switch(kind) {

            case "Exercise":
                view = new ExercisePracticeView({
                    exercise_id: id,
                    context_type: "playlist",
                    context_id: this.model.get("id")
                });
                this.content_view.show_view(view);
                break;

            case "Quiz":
                view = new ExerciseQuizView({
                    quiz_model: new QuizDataModel({entry: entry}),
                    context_id: this.model.get("id") // for now, just use the playlist ID as the quiz context_id
                });
                this.content_view.show_view(view);
                break;

            default:
                view = new ContentWrapperView({
                    id: id,
                    context_id: this.model.get("id")
                });
                this.content_view.show_view(view);
                break;
        }
        this.content_view.model = entry;
        sidebar_state_model.set("open", false);
        // this.inner_views.unshift(this.content_view);
        // this.state_model.set("content_displayed", true);
    },

    render: function() {
        var trimmed_descript = String(this.props.entry.description).substring(0, 100);
        var icon_type = "sidebar-icon icon-" + this.props.entry.attributes.entity_kind;
        return (
            <li onClick={this.entryClicked} id={this.props.entry.attributes.slug}>
                <a className={this.is_entry_active} href="#">
                    <div className="sidebar-entry-header">
                        <span className={icon_type} data-content-id={this.props.entry.attributes.id}></span>
                        <span className="sidebar-title">
                            {this.props.entry.attributes.title}
                        </span>
                    </div>
                    <span className="sidebar-description sidebar-topic-description">
                        {trimmed_descript}
                    </span>
                </a>
            </li>
        );
    }
});

window.ContentAreaView = BaseView.extend({

    template: HB.template("topics/content-area"),

    initialize: function() {
        this.model = new Backbone.Model();
        this.render();
    },

    render: function() {
        this.$el.html(this.template(this.model.attributes));
        return this;
    },

    show_view: function(view) {
        // hide any messages being shown for the old view
        clear_messages();

        this.close();
        // set the new view as the current view
        this.currently_shown_view = view;
        // show the view
        this.$(".content").html("").append(view.$el);
    },

    close: function() {
        // This does not actually close this view. If you *really* want to get rid of this view,
        // you should call .remove()!
        // This is to allow the child view currently_shown_view to act consistently with other
        // inner_views for the sidebar InnerTopicsView.
        if (this.currently_shown_view) {
            // try calling the close method if available, otherwise remove directly
            if (_.isFunction(this.currently_shown_view.close)) {
                this.currently_shown_view.close();
            } else {
                this.currently_shown_view.remove();
            }
        }

        this.model.set("active", false);
    }

});