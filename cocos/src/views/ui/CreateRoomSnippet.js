// var UIBase = require("src/views/ui/UIBase.js")
// cc.loader.loadJs("src/views/ui/UIBase.js")
"use strict"
var CreateRoomSnippet = UISnippet.extend({
	initUI:function(){
		var self = this;
        this.room_type = undefined;
		this.initCreateInfo();

        this.createroom_panel = this.rootUINode.getChildByName("createroom_panel");
        this.gamename_panel = this.createroom_panel.getChildByName("gamename_panel");

        this.updateCardDiamond();

        var group_parent_panel_list = [
            this.gamename_panel.getChildByName("round_panel"),
            this.gamename_panel.getChildByName("pay_panel"),
        ];
        var group_chx_list = ["round_chx", "pay_chx"];
        var group_label_list = ["round_num_label_", "pay_mode_label_"];
        var group_chx_num_list = [3, 2];
        var group_chx_func_list = [
            function (i) {self.game_round = 8*(i+1);self.updateCardDiamond();},
            function (i) {
                if (self.room_type === const_val.CLUB_ROOM) {
                    self.pay_mode = i === 0 ? const_val.CLUB_PAY_MODE : const_val.AA_PAY_MODE;
                } else if (self.room_type === const_val.AGENT_ROOM) {
                    self.pay_mode = i === 0 ? const_val.AGENT_PAY_MODE : const_val.AA_PAY_MODE;
                } else {
                    self.pay_mode = i === 0 ? const_val.NORMAL_PAY_MODE : const_val.AA_PAY_MODE;
                }
                self.updateCardDiamond();
            },
        ];

        var group_select_list = [
            self.game_round/8 -1,
            self.pay_mode,
        ];
        this.update_check_box_group_panel(group_parent_panel_list, group_chx_list, group_chx_num_list, group_chx_func_list, group_select_list, group_label_list);

        var single_parent_panel_list = [
            this.gamename_panel.getChildByName("prepare_panel"),
        ];
        var single_chx_list = ["prepare_chx"];
        var single_label_list = ["prepare_label"];
        var single_chx_func_list = [
            function (is_select) {self.hand_prepare = is_select ? 0 : 1;}
        ];
        var single_select_list = [
            self.hand_prepare ? 0 : 1,
        ];
        this.update_check_box_single_panel(single_parent_panel_list, single_chx_list, single_chx_func_list, single_select_list, single_label_list);
	},

    initCreateInfo:function () {
        var default_info_json = '{"game_round":8, "pay_mode":0, "hand_prepare":0}';
        var info_json = cc.sys.localStorage.getItem(const_val.GAME_NAME + "_CREATE_INFO_JSON");
        if (!info_json){
            cc.sys.localStorage.setItem(const_val.GAME_NAME + "_CREATE_INFO_JSON", default_info_json);
            info_json = cc.sys.localStorage.getItem(const_val.GAME_NAME + "_CREATE_INFO_JSON");
        }
        var info_dict = eval("(" + info_json + ")");

        this.game_round         =   info_dict["game_round"]; 				    // 局数 4局、8局
        this.pay_mode           =   info_dict["pay_mode"];					    //付费方式，0代表房主支付，1代表AA支付
        this.hand_prepare       =   info_dict["hand_prepare"];				    // 0代表需要手动准备，1代表不需要手动准备，因为在玩家的state中0代表没有准备,1代表已经准备
        
        switch (this.room_type) {
            case const_val.CLUB_ROOM:
                if (info_dict['pay_mode'] === const_val.AA_PAY_MODE) {
                    this.pay_mode = const_val.AA_PAY_MODE;
                } else {
                    this.pay_mode = const_val.CLUB_PAY_MODE;
                }
                break;
            case const_val.AGENT_ROOM:
                if (info_dict['pay_mode'] === const_val.AA_PAY_MODE) {
                    this.pay_mode = const_val.AA_PAY_MODE;
                } else {
                    this.pay_mode = const_val.AGENT_PAY_MODE;
                }
                break;
            default:
                if (info_dict['pay_mode'] === const_val.AA_PAY_MODE) {
                    this.pay_mode = const_val.AA_PAY_MODE;
                } else {
                    this.pay_mode = const_val.NORMAL_PAY_MODE;
                }
        }
    },

    setCreateInfo:function () {
        var attribute_list = [];
        attribute_list.push('"game_round":'     + this.game_round.toString());
        attribute_list.push('"pay_mode":'       + this.pay_mode.toString());
        attribute_list.push('"hand_prepare":'   + this.hand_prepare.toString());
        var json_str = "{" + attribute_list.join(",") + "}";
        cc.sys.localStorage.setItem(const_val.GAME_NAME + "_CREATE_INFO_JSON", json_str);
    },

    //参数分别是一种游戏的面板、复选框名字的列表、对应复选框的个数列表、对应要执行的语句的列表
    update_check_box_group_panel:function (parent_pane_list, chx_list, chx_num_list, chx_func_list, select_list, label_list) {
        var self = this;
        for(var i = 0 ; i < chx_list.length ; i++) {
            var select_idx = select_list ? select_list[i] : 0;
            UICommonWidget.create_check_box_group(parent_pane_list[i], chx_list[i], chx_num_list[i], chx_func_list[i], select_idx, label_list[i]);
        }
    },

    update_check_box_single_panel:function (parent_pane_list, chx_list, chx_func_list, select_list, label_list) {
        for(var i = 0 ; i < chx_list.length ; i++) {
            var is_select = select_list ? select_list[i] : 0;
            UICommonWidget.create_check_box_single(parent_pane_list[i], chx_list[i], chx_func_list[i], is_select, label_list[i]);
        }
    },

    updateCardDiamond:function(){
        var val = undefined;

        if (this.pay_mode === const_val.AA_PAY_MODE) {
            val = "每人消耗 x " + (this.game_round/8).toString();
        } else {
            if (this.room_type === const_val.CLUB_ROOM) {
                val = "楼主消耗 x " + (this.game_round/8*3).toString();
            } else if (this.room_type === const_val.AGENT_ROOM) {
                val = "代理消耗 x " + (this.game_round/8*3).toString();
            } else {
                val = "房主消耗 x " + (this.game_round/8*3).toString();
            }
        }

        var cost_num_label = this.gamename_panel.getChildByName("cost_panel").getChildByName("cost_num_label");
        cost_num_label.setString(val);
    },

	getParameters: function () {
        this.setCreateInfo();
		return {
			"game_round"	: this.game_round,
			"hand_prepare"	: this.hand_prepare,
			"pay_mode"		: this.pay_mode,
		};
	},

    updateRoomType: function (r_type) {
        this.room_type = r_type;
        var pay_panel = this.gamename_panel.getChildByName("pay_panel");
        var label_1 = pay_panel.getChildByName("pay_mode_label_1");
        if (r_type === const_val.CLUB_ROOM) {
            label_1.setString("楼主支付");
        } else if (r_type === const_val.AGENT_ROOM) {
            label_1.setString("代理支付");
        } else {
            label_1.setString("房主支付");
        }
        this.update_default_pay_mode();
        this.updateCardDiamond();
    },

    update_default_pay_mode: function () {
        switch (this.room_type) {
            case const_val.CLUB_ROOM:
                if (this.pay_mode !== const_val.AA_PAY_MODE) {
                    this.pay_mode = const_val.CLUB_PAY_MODE;
                }
                break;
            case const_val.AGENT_ROOM:
                if (this.pay_mode !== const_val.AA_PAY_MODE) {
                    this.pay_mode = const_val.AGENT_PAY_MODE;
                }
                break;
            default:
                if (this.pay_mode !== const_val.AA_PAY_MODE) {
                    this.pay_mode = const_val.NORMAL_PAY_MODE;
                }
        }
    },
});