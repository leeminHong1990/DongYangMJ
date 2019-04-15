"use strict";

var ClubMemberUI = UIBase.extend({
    ctor:function () {
        this._super();
        this.resourceFilename = "res/ui/ClubMemberUI.json";
    },

    show_by_info:function (club_id) {
        if(!h1global.player().club_entity_dict[club_id]){return}
        this.club = h1global.player().club_entity_dict[club_id];
        this.show();
    },

    initUI:function () {
        var self = this;
        var club_player_panel = this.rootUINode.getChildByName("club_player_panel");
        var player_panel = club_player_panel.getChildByName("player_panel");

        player_panel.getChildByName("back_btn").addTouchEventListener(function (sender, eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                self.hide();
            }
        });

        var member_btn = player_panel.getChildByName("member_btn");
        var apply_btn = player_panel.getChildByName("apply_btn");

        var btn_list = [member_btn, apply_btn];

        var member_panel = player_panel.getChildByName("member_panel");
        var apply_panel = player_panel.getChildByName("apply_panel");

        var page_list = [member_panel, apply_panel];
        UICommonWidget.create_tab(btn_list, page_list);

        h1global.player().clubOperation(const_val.CLUB_OP_GET_MEMBERS, this.club.club_id);
        if(this.club.is_owner(h1global.player().userId)){
            h1global.player().clubOperation(const_val.CLUB_OP_GET_APPLICANTS, this.club.club_id);
        }
    },

    update_club_member:function (member_list) {
        if(!this.is_show){return;}
        var self = this;
        var club_player_panel = this.rootUINode.getChildByName("club_player_panel");
        var player_panel = club_player_panel.getChildByName("player_panel");
        var member_panel = player_panel.getChildByName("member_panel");

        var member_scroll = member_panel.getChildByName("member_scroll");
        function update_item_func(itemPanel, itemData, index) {
            if(index%2 === 1){
                itemPanel.getChildByName("light_img").setVisible(false);
            } else {
                itemPanel.getChildByName("light_img").setVisible(true);
            }
            var head_img_frame = itemPanel.getChildByName("head_img_frame");

            itemPanel.reorderChild(itemPanel.getChildByName("light_img"), head_img_frame.getLocalZOrder()-10);

            cutil.loadPortraitTexture(itemData["head_icon"], itemData["sex"], function(img){
                if(self && self.is_show){
                    if(itemPanel.getChildByName("head_icon")){
                        itemPanel.removeChild(itemPanel.getChildByName("head_icon"))
                    }
                    var portrait_sprite  = new cc.Sprite(img);
                    portrait_sprite.setScale(52/portrait_sprite.getContentSize().width);
                    itemPanel.addChild(portrait_sprite);
                    portrait_sprite.setPosition(head_img_frame.getPosition());
                    portrait_sprite.setName("head_icon");
                    itemPanel.reorderChild(portrait_sprite, head_img_frame.getLocalZOrder()-1)
                }
            });

            itemPanel.getChildByName("name_label").setString(itemData["nickname"]);
            itemPanel.getChildByName("id_label").setString(itemData["userId"]);
            itemPanel.getChildByName("time_label").setString(cutil.convert_timestamp_to_ymd(itemData["ts"]));
            itemPanel.getChildByName("mark_label").setString(itemData["notes"]);

            itemPanel.getChildByName("mark_btn").addTouchEventListener(function(sender, eventType){
                if(eventType === ccui.Widget.TOUCH_ENDED){
                    if(h1global.curUIMgr.editor_ui && !h1global.curUIMgr.editor_ui.is_show){
                        h1global.curUIMgr.editor_ui.show_by_info(function (editor_string) {
                            h1global.player().clubOperation(const_val.CLUB_OP_SET_MEMBER_NOTES, self.club.club_id, [itemData["userId"], editor_string]);
                        }, "请输入玩家备注", const_val.CLUB_MAX_MARK_LEN)
                    }
                }
            });

            itemPanel.getChildByName("delete_btn").addTouchEventListener(function (sender, eventType) {
                if(eventType === ccui.Widget.TOUCH_ENDED){
                    h1global.player().clubOperation(const_val.CLUB_OP_KICK_OUT, self.club.club_id, [itemData["userId"]]);
                }
            });
            if(h1global.player().userId === self.club.owner.userId){
                if(self.club.owner.userId === itemData.userId){
                    itemPanel.getChildByName("delete_btn").setVisible(false);
                }else{
                    itemPanel.getChildByName("delete_btn").setVisible(true);
                }
            }else{
                itemPanel.getChildByName("delete_btn").setVisible(false);
                itemPanel.getChildByName("mark_btn").setVisible(false);
            }

        }
        UICommonWidget.update_scroll_items(member_scroll, member_list, update_item_func)
    },

    update_club_apply:function (apply_list) {
        if(!this.is_show){return;}
        var self = this;
        var club_player_panel = this.rootUINode.getChildByName("club_player_panel");
        var player_panel = club_player_panel.getChildByName("player_panel");
        var apply_panel = player_panel.getChildByName("apply_panel");
        var apply_scroll = apply_panel.getChildByName("apply_scroll");
        function update_item_func(itemPanel, itemData, index) {

            if(index%2 === 1){
                itemPanel.getChildByName("light_img").setVisible(false);
            } else {
                itemPanel.getChildByName("light_img").setVisible(true);
            }

            var head_img_frame = itemPanel.getChildByName("head_img_frame");
            itemPanel.reorderChild(itemPanel.getChildByName("light_img"), head_img_frame.getLocalZOrder()-10);

            cutil.loadPortraitTexture(itemData["head_icon"], itemData["sex"], function(img){
                if(self && self.is_show){
                    if(itemPanel.getChildByName("head_icon")){
                        itemPanel.removeChild(itemPanel.getChildByName("head_icon"))
                    }
                    var portrait_sprite  = new cc.Sprite(img);
                    portrait_sprite.setScale(52/portrait_sprite.getContentSize().width);
                    itemPanel.addChild(portrait_sprite);
                    portrait_sprite.setPosition(head_img_frame.getPosition());
                    portrait_sprite.setName("head_icon");
                    itemPanel.reorderChild(portrait_sprite, head_img_frame.getLocalZOrder()-1)
                }
            });
            itemPanel.getChildByName("name_label").setString(cutil.info_sub(itemData["nickname"], 7));
            itemPanel.getChildByName("id_label").setString(itemData["userId"]);
            itemPanel.getChildByName("time_label").setString(cutil.convert_timestamp_to_ymd(itemData["ts"]));

            itemPanel.getChildByName("agree_btn").addTouchEventListener(function(sender, eventType){
                if(eventType === ccui.Widget.TOUCH_ENDED){
                    if(h1global.curUIMgr.editor_ui && !h1global.curUIMgr.editor_ui.is_show){
                        h1global.player().clubOperation(const_val.CLUB_OP_AGREE_IN, self.club.club_id, [itemData["userId"]]);
                    }
                }
            });

            itemPanel.getChildByName("cancel_btn").addTouchEventListener(function (sender, eventType) {
                if(eventType === ccui.Widget.TOUCH_ENDED){
                    h1global.player().clubOperation(const_val.CLUB_OP_REFUSE_IN, self.club.club_id, [itemData["userId"]]);
                }
            });
        }
        UICommonWidget.update_scroll_items(apply_scroll, apply_list, update_item_func)
    }
});