"use strict"
var MultipleRoomLayout = cc.Class.extend({

    ctor: function (uiMgr, ui_list) {
        this.curUIMgr = uiMgr;
        this.ui_list = ui_list;
        this.all_show = true;
        this.observerDict = {};
        this.registerGameRoomUIObserver();
    },

    gameRoomUIIsShow: function () {
        if (this.ui_list) {
            for (var ui of this.ui_list) {
                if (!ui.is_show) return false;
            }
            return true;
        }
        return false;
    },

    registerGameRoomUIObserver: function () {
        var regist_func_list = [
            "playEmotionAnim",
            "playMessageAnim",
            "playExpressionAnim",
            "playVoiceAnim",
            "hide",
            "show",
            "startBeginAnim",
            "update_kingtile_panel",
            "playOperationEffect",
            "stopBeginAnim",
            "update_roominfo_panel",
            "update_curplayer_panel",
            "update_player_hand_tiles",
            "hide_operation_panel",
            "show_extra_panel",
            "lock_player_hand_tiles",
            "update_player_discard_tiles",
            "play_discard_anim",
            "unlock_player_hand_tiles",
            "remove_last_discard_tile",
            "update_player_up_tiles",
            "update_wreath_panel",
            "play_luckytiles_anim",
            "update_player_online_state",
            "update_wait_time_left",
            "update_canwin_tile_panel",
            "update_operation_panel",
            "update_wintips_btn",
            "play_result_anim",
            "show_operation_select_panel",
            "hide_operation_select_panel",
            "force_discard",
            "set_kingtile_panel_visible",
            "hide_discard_tips"
        ];

        for (var i = 0; i < regist_func_list.length; i++) {
            this.registerRoomObserver(regist_func_list[i]);
        }
    },

    registerRoomObserver: function (func_name) {
        var func_str_list = [];
        for (var j = 0; j < this.ui_list.length; j++) {
            func_str_list.push('this.ui_list[' + j + '].' + func_name);
        }
        this.registerObserver(const_val.GAME_ROOM_UI_NAME, func_name, func_str_list)
    },

    registerObserver: function (object_name, notification, func_str_list) {
        this.observerDict[object_name] = this.observerDict[object_name] || {};
        if (!this.observerDict[object_name][notification]) {
            for (var i = 0; i < func_str_list.length; i++) {
                var func_string = func_str_list[i]
                var parent_string = func_string.slice(0, func_string.lastIndexOf("."))
                if (typeof eval(parent_string) !== "object" || typeof eval(func_string) !== "function") {
                    cc.error("registerObserver=>" + notification + ":" + parent_string + "is not a object ||" + func_string + " is not a function！")
                    return
                }
            }
            this.observerDict[object_name][notification] = func_str_list
        } else {
            cc.warn("already registerObserver: ", object_name, notification);
        }
    }
    ,

    removeObserver: function (object_name, notification) {
        if (object_name) {
            if (notification === undefined) {
                if (this.observerDict[object_name]) {
                    delete this.observerDict[object_name]
                }
            } else {
                if (this.observerDict[object_name][notification]) {
                    delete this.observerDict[object_name][notification]
                }
            }
        }
    },

    notifyObserver: function (object_name, notification) {
        if (!this.observerDict[object_name]) {
            cc.error("notifyObserver " + object_name + " is not register!")
            return;
        }
        var temp_notification = notification
        var temp_name = object_name;
        if (this.observerDict[object_name][notification] && this.observerDict[object_name][notification].length > 0) {
            var args = undefined;
            if (arguments.length > 2) {
                args = [arguments.length - 2]
                for (var i = 2; i < arguments.length; i++) {
                    args[i - 2] = arguments[i];
                }
            }
            var length = this.observerDict[temp_name][temp_notification].length;
            for (var i = 0; i < length; i++) {
                var func_string = this.observerDict[temp_name][temp_notification][i]
                var parent = func_string.slice(0, func_string.lastIndexOf("."))
                eval(func_string).apply(eval(parent), args)
            }
        } else {
            cc.error("notifyObserver " + notification + " is not regist!")
        }
    }
    ,

    showGameRoomUI: function (callback) {
        var complete = false;
        var count = 0;
        var self = this;
        this.notifyObserver(const_val.GAME_ROOM_UI_NAME, "show", function () {
            count++;
            complete = count === self.ui_list.length;
            // Note: 在多个ui未加载完成时先隐藏ui，不然会出现ui闪现
            // 但是如果有一套资源出现问题加载不完可能会一直不显示
            if (self.all_show) {
                for (var ui in self.ui_list) {
                    if(ui.is_show){
                        ui.setVisible(false);
                        ui.setLocalZOrder(const_val.GameRoomZOrder);
                    }
                }
            }
            if (callback) callback(complete & self.all_show);
        })
    }
    ,

    updateBackground: function (gameroom_type, gameroombg_type) {
        if (this.curGameRoomType == gameroom_type && this.curGameRoomBgType == gameroombg_type) {
            return true;
        }
        this.curGameRoomType = gameroom_type;
        this.curGameRoomBgType = gameroombg_type;

        var bgImgPath = "res/ui/BackGround/gameroom3d_bg" + gameroombg_type + ".png";
        var bgDescImgPath = "res/ui/BackGround/bg_desc3d" + gameroombg_type + ".png";

        if (gameroom_type == const_val.GAME_ROOM_2D_UI) {
            bgImgPath = "res/ui/BackGround/gameroom2d_bg" + gameroombg_type + ".png";
            bgDescImgPath = "res/ui/BackGround/bg_desc2d" + gameroombg_type + ".png";
        }

        var bg_img = this.curUIMgr.getChildByName("bg_img");
        if (!bg_img) {
            bg_img = ccui.ImageView.create();
            bg_img.setName("bg_img");
            bg_img.setAnchorPoint(0.5, 0.5);
            bg_img.setPosition(cc.winSize.width * 0.5, cc.winSize.height * 0.5);
            bg_img.setLocalZOrder(const_val.GameRoomBgZOrder)
            this.curUIMgr.addChild(bg_img);
        }
        bg_img.loadTexture(bgImgPath);
        bg_img.setScale9Enabled(true);
        bg_img.setContentSize(cc.winSize.width , cc.winSize.height);
        // bg_img.setUnifySizeEnabled(false);
        // bg_img.ignoreContentAdaptWithSize(false);
        // bg_img.setCapInsets(cc.rect(422,320,436,246))

        var bg_img_content_size = bg_img.getContentSize();
        var scale = cc.winSize.width / bg_img_content_size.width;
        if (cc.winSize.height / bg_img_content_size.height > scale) {
            scale = cc.winSize.height / bg_img_content_size.height;
        }
        bg_img.setScale(scale);

        var bg_desc_img = this.curUIMgr.getChildByName("bg_desc");
        if (!bg_desc_img) {
            bg_desc_img = ccui.ImageView.create();
            bg_desc_img.setName("bg_desc");
            bg_desc_img.setAnchorPoint(0.5, 0.5);
            bg_desc_img.setLocalZOrder(const_val.GameRoomBgZOrder)
            this.curUIMgr.addChild(bg_desc_img);
        }
        bg_desc_img.loadTexture(bgDescImgPath);

        if (gameroom_type === const_val.GAME_ROOM_2D_UI) {
            bg_desc_img.setPosition(cc.winSize.width * 0.5, cc.winSize.height * 0.5 - 100);
        } else {
            bg_desc_img.setPosition(cc.winSize.width * 0.5, cc.winSize.height * 0.5 - 88);
        }
    },

    setGameRoomUI2Top: function (gameroom_type) {
        for (var ui of this.ui_list) {
            if (ui.is_show) {
                ui.setVisible(gameroom_type == ui.uiType)
            }
        }
        var game_room_bg_type = cc.sys.localStorage.getItem("GAME_ROOM_BG");
        this.updateBackground(gameroom_type, game_room_bg_type);
    },

});
