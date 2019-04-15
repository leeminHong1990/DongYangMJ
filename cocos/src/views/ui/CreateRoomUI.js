// var UIBase = require("src/views/ui/UIBase.js")
// cc.loader.loadJs("src/views/ui/UIBase.js")
"use strict"
var CreateRoomUI = UIBase.extend({
	ctor:function() {
		this._super();
		this.resourceFilename = "res/ui/CreateRoomUI.json";
        var self = this;
        this.containUISnippets = {
            "CreateRoomSnippet" : new CreateRoomSnippet(function(){return self.rootUINode;})
        };
	},
    initUI:function () {
        this.createroom_panel = this.rootUINode.getChildByName("createroom_panel");
        this.gamename_panel = this.createroom_panel.getChildByName("gamename_panel");
        var self = this;
        var return_btn = this.createroom_panel.getChildByName("return_btn");
        function return_btn_event(sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                self.hide();
            }
        }
        return_btn.addTouchEventListener(return_btn_event);
        this.initCreateFunction()
    },

	initCreateFunction:function(){
		var self = this;
		var create_btn = ccui.helper.seekWidgetByName(this.gamename_panel, "create_btn");
		function create_btn_event(sender, eventType){
			if (eventType == ccui.Widget.TOUCH_ENDED) {
				cutil.lock_ui();

                var parameters = self.containUISnippets["CreateRoomSnippet"].getParameters();
                parameters['room_type'] = const_val.NORMAL_ROOM
                h1global.entityManager.player().createRoom(parameters);
                self.hide();
			}
		}
		create_btn.addTouchEventListener(create_btn_event);
	}
});