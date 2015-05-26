// Views

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

var SidebarView = React.createClass({
    render: function() {
        return (
            <div>
                <TopicContainerOuterView 
                    channel = {this.props.channel}
                    entity_key = {this.props.entity_key}
                    entity_collection = {this.props.entity_collection}
                    state_model = {this.state_model} />
            </div>
        );
    }
});

var TopicContainerOuterView = React.createClass({
    getInitialState: function() {
        this.model = new TopicNode({"id": "root", "title": "Khan"});
        var data = {
            model: this.model,
            entity_key: this.props.entity_key,
            entity_collection: this.props.entity_collection,
            channel: this.props.channel,
            state_model: this.props.state_model,
        };
        return {data};
    },

    render: function() {
        return (
            <TopicContainerInnerView data={this.state.data}/>
        );
    }
});

var TopicContainerInnerView = React.createClass({
    getInitialState: function() {
        var data = new this.props.data.entity_collection({parent: this.props.data.model.get("id"), channel: this.props.data.channel});
        data.fetch().then(this.update);
        // console.log("fffff: ", data);
        return {data}
    },

    update: function(){
        this.forceUpdate();
    },

    componentDidMount: function() {
        this.state.data.on('change', function() {
            this.forceUpdate();
        }.bind(this));
    },

    render: function() {
        // console.log("llll: ", this.state.data.models);
        var entries = this.state.data.models;
        // setTimeout(function(){
        // console.log("aaaaa: ", entries.length)
        // }, 1000);
        console.log("llll: ", entries.length);
        // for ()

        var SidebarNodes = this.state.data.models.map(function (entry) {
            console.log("ttt: ", entry.attributes.title);
            return (
                <div>
                    {entry.attributes.title}
                </div>
            );
        });
        console.log("ccc: ", SidebarNodes);
        return (
            <div className="EntryList">
                {SidebarNodes}
            </div>
        );
    }
});

var SidebarEntryView = React.createClass({
    render: function() {
        return (
            <li>
                <span>
                    {this.props.data.model.title}
                </span>
            </li>
        );
    }
});