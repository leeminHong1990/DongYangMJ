var HelpUI = UIBase.extend({
    ctor: function () {
        this._super();
        this.resourceFilename = "res/ui/HelpUI.json";
        this.setLocalZOrder(const_val.MAX_LAYER_NUM);
    },

    show_by_info:function (info_dict) {
        this.info_dict = info_dict;
        this.show();
    },

    initUI: function () {
        var self = this;
        var player = h1global.entityManager.player();
        var help_panel = this.rootUINode.getChildByName("help_panel");

        var close_btn = help_panel.getChildByName("close_btn");

        var room_mode_btn = help_panel.getChildByName("room_mode_btn");
        var title_mj_btn = help_panel.getChildByName("title_mj_btn");
        room_mode_btn.setTouchEnabled(false);
        room_mode_btn.setBright(false);
        title_mj_btn.setTouchEnabled(true);
        title_mj_btn.setBright(true);

        var room_mode_panel = help_panel.getChildByName("room_mode_panel");
        var title_mj_panel = help_panel.getChildByName("title_mj_panel");
        room_mode_panel.setVisible(true);
        title_mj_panel.setVisible(false);

        if(player.curGameRoom) {
            this.change_select("round_panel", "round_chx" + String(player.curGameRoom.maxRound/8));
        }else {
            this.gamehall_show();
        }

        close_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                self.hide();
            }
        });

        room_mode_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                room_mode_btn.setTouchEnabled(false);
                room_mode_btn.setBright(false);
                title_mj_btn.setTouchEnabled(true);
                title_mj_btn.setBright(true);
                title_mj_panel.setVisible(false);
                room_mode_panel.setVisible(true);
            }
        });

        title_mj_btn.addTouchEventListener(function (sender, eventType) {
            if (eventType === ccui.Widget.TOUCH_ENDED) {
                title_mj_btn.setTouchEnabled(false);
                title_mj_btn.setBright(false);
                room_mode_btn.setTouchEnabled(true);
                room_mode_btn.setBright(true);
                room_mode_panel.setVisible(false);
                title_mj_panel.setVisible(true);
            }
        });
    },

    change_select:function (parentName, chxName) {
        cc.log(parentName, chxName)
        var room_mode_panel = this.rootUINode.getChildByName("help_panel").getChildByName("room_mode_panel");
        var chx = room_mode_panel.getChildByName(parentName).getChildByName(chxName);
        chx.setBright(true);
    },

    gamehall_show:function () {
        var help_panel = this.rootUINode.getChildByName("help_panel");
        var room_mode_btn = help_panel.getChildByName("room_mode_btn");
        var title_mj_btn = help_panel.getChildByName("title_mj_btn");
        var line_img = help_panel.getChildByName("line_img");
        room_mode_btn.setVisible(false);
        line_img.setVisible(false);
        title_mj_btn.setTouchEnabled(false);
        title_mj_btn.setBright(false);
        title_mj_btn.setPositionY(title_mj_btn.getPositionY() + 100);

        var room_mode_panel = help_panel.getChildByName("room_mode_panel");
        var title_mj_panel = help_panel.getChildByName("title_mj_panel");
        room_mode_panel.setVisible(false);
        title_mj_panel.setVisible(true);
    },
});