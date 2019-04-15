"use strict"
var SettlementUI = UIBase.extend({
	ctor:function() {
		this._super();
		this.resourceFilename = "res/ui/SettlementUI.json";
		this.setLocalZOrder(const_val.SettlementZOrder)
	},
	initUI:function(){
		var self = this;
		var confirm_btn = this.rootUINode.getChildByName("confirm_btn");
		function confirm_btn_event(sender, eventType){
			if(eventType == ccui.Widget.TOUCH_ENDED){
				// TEST:
				// self.hide();
				// h1global.curUIMgr.gameroomprepare_ui.show_prepare();
				// h1global.curUIMgr.notifyObserver("hide");
				// return;
				self.hide();

				//重新开局
                var player = h1global.entityManager.player();
                if (player) {
                    player.curGameRoom.updatePlayerState(player.serverSitNum, 1);
                    h1global.curUIMgr.gameroomprepare_ui.show_prepare();
                    h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "hide");
                    player.prepare();
                } else {
                    cc.warn('player undefined');
                }
			}
		}
		confirm_btn.addTouchEventListener(confirm_btn_event);
		this.kongTilesList = [[], [], [], []];

        //单局结算分享
        this.rootUINode.getChildByName("share_btn").addTouchEventListener(function(sender, eventType){
            if(eventType == ccui.Widget.TOUCH_ENDED){
                if((cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)){
                    jsb.fileUtils.captureScreen("", "screenShot.png");
                } else if((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative)){
                    jsb.reflection.callStaticMethod("WechatOcBridge","takeScreenShot");
                } else {
                    h1global.curUIMgr.share_ui.show();
                }
            }
        });

        if ((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) && switches.appstore_check == true) {
            this.rootUINode.getChildByName("share_btn").setVisible(false);
        }
	},

	setPlaybackLayout:function (replay_btn_func) {
        let replay_btn = ccui.helper.seekWidgetByName(this.rootUINode, "replay_btn");
        let self = this;
        replay_btn.addTouchEventListener(function (sender,eventType) {
            if(eventType === ccui.Widget.TOUCH_ENDED){
                if (replay_btn_func) replay_btn_func();
                if(self.is_show){
	                self.hide();
				}
            }
        });
        replay_btn.setVisible(true);
        let back_hall_btn = ccui.helper.seekWidgetByName(this.rootUINode, "back_hall_btn");
        back_hall_btn.addTouchEventListener(function (sender,eventType) {
			if(eventType === ccui.Widget.TOUCH_ENDED){
				h1global.runScene(new GameHallScene());
			}
        });
        back_hall_btn.setVisible(true);

        ccui.helper.seekWidgetByName(this.rootUINode, "share_btn").setVisible(false);
        ccui.helper.seekWidgetByName(this.rootUINode, "confirm_btn").setVisible(false);
    },

    show_by_info: function (roundRoomInfo, serverSitNum, curGameRoom, confirm_btn_func, replay_btn_func) {
		cc.log("结算==========>:");
		cc.log("roundRoomInfo :  ",roundRoomInfo);
		var self = this;
		this.show(function(){
			self.player_tiles_panels = [];
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel1"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel2"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel3"));
			self.player_tiles_panels.push(self.rootUINode.getChildByName("settlement_panel").getChildByName("victory_item_panel4"));	
			var playerInfoList = roundRoomInfo["player_info_list"];
			// 需求 将玩家自己放在第一位
			var left = [];
			var right = [];
			for(let i=0; i<playerInfoList.length; i++){
				if (playerInfoList[i]["idx"] < serverSitNum){
                    left.push(playerInfoList[i])
				}else{
					right.push(playerInfoList[i])
				}
			}
            playerInfoList = right.concat(left);
			for(var i = 0; i < 4; i++){
				var roundPlayerInfo = playerInfoList[i];
				var server_seat_num = roundPlayerInfo["idx"];
				if (!roundPlayerInfo) {
					self.player_tiles_panels[i].setVisible(false);
					continue
				}
				self.player_tiles_panels[i].setVisible(true)
				self.update_score(i, roundPlayerInfo["score"]);  //显示分数
				self.update_kong_score(i, roundPlayerInfo["kong_score"]);
                self.update_player_hand_tiles(i, server_seat_num, curGameRoom, roundPlayerInfo["tiles"], roundRoomInfo["win_idx"], roundRoomInfo["finalTile"], roundPlayerInfo["concealed_kong"]);   //显示麻将
                self.update_player_up_tiles(i, server_seat_num, curGameRoom);
                self.update_player_info(i, server_seat_num, curGameRoom);  //idx 表示玩家的座位号
                self.update_player_win(i, server_seat_num, roundRoomInfo["win_idx"], roundRoomInfo["from_idx"], roundRoomInfo["dealer_idx"], roundRoomInfo["cur_dealer_mul"], roundRoomInfo["result_list"], roundRoomInfo["job_relation"], roundRoomInfo["follow_num"]);
			}

			// self.update_win_type(roundRoomInfo, roundRoomInfo["result_list"]);
            self.show_title(roundRoomInfo["win_idx"], serverSitNum);
            var confirm_btn = self.rootUINode.getChildByName("confirm_btn");
            var result_btn = self.rootUINode.getChildByName("result_btn");
			if(confirm_btn_func){
				self.rootUINode.getChildByName("result_btn").addTouchEventListener(function(sender, eventType){
					if(eventType ==ccui.Widget.TOUCH_ENDED){
						self.hide();
						confirm_btn_func();
					}
				});
                confirm_btn.setVisible(false);
                result_btn.setVisible(true);
			} else if (replay_btn_func) {
                self.setPlaybackLayout(replay_btn_func)
			} else {
                confirm_btn.setVisible(true);
                result_btn.setVisible(false);
			}
		});
	},

    show_title: function (win_idx, serverSitNum) {
		cc.log("win_idx ",win_idx);
        var bg_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("bg_img");
        var title_img = this.rootUINode.getChildByName("settlement_panel").getChildByName("title_img");
        title_img.ignoreContentAdaptWithSize(true);
        if(win_idx == -1){
            bg_img.loadTexture("res/ui/BackGround/settlement_fail.png");
        	title_img.loadTexture("res/ui/SettlementUI/dogfull_title.png");
        }else if (serverSitNum == win_idx) {
            //胜利
            bg_img.loadTexture("res/ui/BackGround/settlement_win.png");
            title_img.loadTexture("res/ui/SettlementUI/win_title.png");
        } else {
            bg_img.loadTexture("res/ui/BackGround/settlement_fail.png");
            title_img.loadTexture("res/ui/SettlementUI/fail_title.png");
        }
	},

	update_player_hand_tiles:function(panel_idx, serverSitNum, curGameRoom ,tileList, win_idx, finalTile, concealedKongList){
		if(!this.is_show) {return;}
		var cur_player_tile_panel = this.player_tiles_panels[panel_idx].getChildByName("item_hand_panel");
		if(!cur_player_tile_panel){
			return;
		}
		// tileList = tileList.concat([])
		if(win_idx == serverSitNum) {
            tileList.pop();
            cutil.tileSort(tileList, h1global.entityManager.player().curGameRoom.kingTiles);
            tileList.push(finalTile);
        }else {
            cutil.tileSort(tileList, h1global.entityManager.player().curGameRoom.kingTiles);
		}
		var concealedKongSum = 0;
		for(var i = 0 ; i < curGameRoom.upTilesList[serverSitNum].length ; i++){
			if(curGameRoom.upTilesList[serverSitNum][i].length > 3){
                concealedKongSum ++;
			}
		}
		var mahjong_hand_str = "mahjong_tile_player_hand.png";
        cur_player_tile_panel.setPositionX((curGameRoom.upTilesList[serverSitNum].length * 135) + concealedKongSum * 42 + 236);
		// mahjong_hand_str = "mahjong_tile_player_hand.png";
		for(var i = 0; i < 14; i++){
			var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + i.toString());
			tile_img.stopAllActions();
			if(tileList[i]){
				var mahjong_img = tile_img.getChildByName("mahjong_img");
				tile_img.loadTexture("Mahjong/" + mahjong_hand_str, ccui.Widget.PLIST_TEXTURE);
				tile_img.setVisible(true);
				mahjong_img.ignoreContentAdaptWithSize(true);
				mahjong_img.loadTexture("Mahjong/mahjong_big_" + tileList[i].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
				mahjong_img.setVisible(true);
                if(win_idx == serverSitNum && i == tileList.length - 1){
                    tile_img.setPositionX(tile_img.getPositionX() + 4);
                }
                if(const_val.SHOW_KING_TILE_TITLE !== 0 &&  curGameRoom.kingTiles.indexOf(tileList[i]) >= 0){
                    var kingtilemark_img = ccui.ImageView.create("res/ui/GameRoomUI/kingtilemark.png");
                    // this.handTileMarksList[serverSitNum].push(kingtilemark_img);
                    kingtilemark_img.setAnchorPoint(0.0, 1.0);
                    kingtilemark_img.setPosition(cc.p(0, 90));
                    kingtilemark_img.setScale(0.7);
                    tile_img.addChild(kingtilemark_img);
                }
			} else {
				tile_img.setVisible(false);
			}
		}
	},

    update_player_up_tiles: function (panel_idx, serverSitNum, curGameRoom) {
		if(!this.is_show) {return;}
        var cur_player_tile_panel = this.player_tiles_panels[panel_idx].getChildByName("item_up_panel");
		if(!cur_player_tile_panel){
			return;
		}
		var mahjong_hand_str = "mahjong_tile_player_hand.png";
		var mahjong_down_str = "mahjong_tile_top_hand.png";
        var upTilesList = curGameRoom.upTilesList[serverSitNum];
		var idx = 0;
		// for(var i = player.curGameRoom.upTilesList[serverSitNum].length * 3; i < 12; i++){
		// 	var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + i.toString());
		// 	tile_img.setVisible(false);
		// }
		for(var i = 0; i < this.kongTilesList[serverSitNum].length; i++){
			this.kongTilesList[serverSitNum][i].removeFromParent();
		}
		this.kongTilesList[serverSitNum] = [];
		// mahjong_hand_str = "mahjong_tile_player_hand.png";
		// mahjong_down_str = "mahjong_tile_player_down.png";
		for(var i = 0; i < 16; i++){
            var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + i.toString());
            tile_img.setVisible(false);
		}
		for(var i = 0; i < upTilesList.length; i++){
            idx += i == 0 ? i : upTilesList[i - 1].length;
			for(var j = 0; j < upTilesList[i].length; j++){
				var tile_img = ccui.helper.seekWidgetByName(cur_player_tile_panel, "mahjong_bg_img" + (idx + j).toString());
                tile_img.setPositionX(tile_img.getPositionX() + i * 4);
				// tile_img.setPositionY(0);
				tile_img.setTouchEnabled(false);
				var mahjong_img = tile_img.getChildByName("mahjong_img");
				if(upTilesList[i][j]){
					tile_img.loadTexture("Mahjong/" + mahjong_hand_str, ccui.Widget.PLIST_TEXTURE);
					mahjong_img.ignoreContentAdaptWithSize(true);
					mahjong_img.loadTexture("Mahjong/mahjong_big_" + upTilesList[i][j].toString() + ".png", ccui.Widget.PLIST_TEXTURE);
					mahjong_img.setVisible(true);
				} else {
					tile_img.loadTexture("Mahjong/" + mahjong_down_str, ccui.Widget.PLIST_TEXTURE);
					mahjong_img.setVisible(false);
				}
				tile_img.setVisible(true);
                if(curGameRoom.kingTiles.indexOf(upTilesList[i][j]) >= 0){
                    var kingtilemark_img = ccui.ImageView.create("res/ui/GameRoomUI/kingtilemark.png");
                    // this.handTileMarksList[serverSitNum].push(kingtilemark_img);
                    kingtilemark_img.setAnchorPoint(0.0, 1.0);
                    kingtilemark_img.setPosition(cc.p(0, 59));
                    kingtilemark_img.setScale(0.40);
                    tile_img.addChild(kingtilemark_img);
                }
			}
		}
	},

    update_player_info: function (panel_idx, serverSitNum, curGameRoom) {
		if(!this.is_show) {return;}
		var cur_player_info_panel = this.player_tiles_panels[panel_idx];
		if(!cur_player_info_panel){
			return;
		}
        var playerInfo = curGameRoom.playerInfoList[serverSitNum];
        cur_player_info_panel.getChildByName("owner_img").setVisible(playerInfo["is_creator"])
		cur_player_info_panel.getChildByName("item_name_label").setString(playerInfo["nickname"]);
		cur_player_info_panel.getChildByName("item_id_label").setString("ID:" + playerInfo["userId"].toString());
		cutil.loadPortraitTexture(playerInfo["head_icon"], playerInfo["sex"], function(img){
			if (cur_player_info_panel.getChildByName("item_avatar_img")) {
				cur_player_info_panel.getChildByName("item_avatar_img").removeFromParent();
			}
			var portrait_sprite  = new cc.Sprite(img);
			portrait_sprite.setName("portrait_sprite");
			portrait_sprite.setScale(78 / portrait_sprite.getContentSize().width);
            portrait_sprite.x = 70;
            portrait_sprite.y = 45;
			cur_player_info_panel.addChild(portrait_sprite);
			portrait_sprite.setLocalZOrder(-1);
		});
	},

	update_player_win:function(panel_idx, serverSitNum, win_idx, from_idx, dealer_idx, cur_dealer_mul, result, job_relation, follow_num){
		var cur_player_info_panel = this.player_tiles_panels[panel_idx];
		var item_win_img = cur_player_info_panel.getChildByName("item_win_img");
		if(win_idx < 0 || win_idx > 3){
            item_win_img.setVisible(false);
			return;
		}

        var item_win_type_label = cur_player_info_panel.getChildByName("item_win_type_label");
        item_win_type_label.string = "";
        item_win_type_label.setVisible(true);

        if(serverSitNum === win_idx) {
            var king_desc = ['', '\t\t一财神', '\t\t二财神', '\t\t三财神', '\t\t四财神'];
			var thirteen_not_match = ['\t\t不正规十三不搭', '\t\t七字不正规十三不搭', '\t\t正规十三不搭', '\t\t七字正规十三不搭'];

        	if(result[0] > 0){item_win_type_label.string += "\t\t平胡";}
            item_win_type_label.string += king_desc[result[1]];
        	if(result.length === 12 && result[2] > 0){item_win_type_label.string += '\t\t爆头';}
            if(result[3] > 0){item_win_type_label.string += "\t\t七对";}
            if(result[4] > 0){item_win_type_label.string += "\t\t碰碰胡";}
            if(result[5] > 0){item_win_type_label.string += result[5] === 1 ? "\t\t门前清" : "\t\t清一色";}
            if(result[6] > 0){item_win_type_label.string += "\t\t乱风";}
            if(result[7] > 0){item_win_type_label.string += "\t\t清风";}
            if(result[8] > 0){item_win_type_label.string += "\t\t天胡";}
            if(result[9] > 0){item_win_type_label.string += "\t\t地胡";}
            if(result[10] > 0){item_win_type_label.string += thirteen_not_match[result[10]-1];}
            if(result[11] > 0){item_win_type_label.string += "\t\t海底捞月";}

			if(result.length > 12){
                item_win_type_label.string += "\t\t";
                for (var i = 12; i < result.length; i++) {
                    if(result[i] > 0){
                        item_win_type_label.string += "飘";
                    } else {
                        item_win_type_label.string += "杠";
                    }
                }
                if(result[result.length -1] > 0){
                    item_win_type_label.string += "-[财飘]";
                }else {
                    if(result[2] > 0){
                        item_win_type_label.string += "-[杠爆]";
                    }else{
                        item_win_type_label.string += "-[杠开]";
                    }
                }
			}
			if(follow_num>0){item_win_type_label.string += "\t\t跟风" + follow_num.toString() + "次";}
        } else {
            // 承包关系
            if(h1global.entityManager.player().curGameRoom.three_job){
				// 承包
				for(var i=0; i< job_relation.length; i++){
					if(job_relation[i][0] === win_idx && job_relation[i][1] === serverSitNum){
                        item_win_type_label.string += "\t\t承包";
						break
					}
				}
				// 反承包
                for(var i=0; i< job_relation.length; i++){
                    if(job_relation[i][0] === serverSitNum && job_relation[i][1] === win_idx){
                        item_win_type_label.string += "\t\t反承包";
                        break
                    }
                }
			}
		}

        var item_dealer_img = cur_player_info_panel.getChildByName("item_dealer_img");
        item_dealer_img.setVisible(dealer_idx == serverSitNum);
        item_dealer_img.loadTexture("res/ui/Default/common_dealer_img" + String(cur_dealer_mul) + ".png");
        if (win_idx == from_idx && win_idx == serverSitNum) { // 自摸
            item_win_img.loadTexture("res/ui/SettlementUI/draw_win.png");
            item_win_img.runAction(cc.RepeatForever.create(cc.Sequence.create(
            	cc.Repeat.create(cc.Sequence.create(cc.RotateTo.create(0.08,16,0),cc.RotateTo.create(0.08,0,0)), 4),
				cc.DelayTime.create(2)
            )));
            item_win_img.setVisible(true);
        }else if (win_idx == serverSitNum) { // 胡牌玩家
            item_win_img.loadTexture("res/ui/SettlementUI/give_win.png");
            item_win_img.runAction(cc.RepeatForever.create(cc.Sequence.create(
                cc.Repeat.create(cc.Sequence.create(cc.RotateTo.create(0.08,16,0),cc.RotateTo.create(0.08,0,0)), 4),
                cc.DelayTime.create(2)
            )));

            item_win_img.setVisible(true);
		}else if (from_idx == serverSitNum) { // 放炮玩家
            item_win_img.loadTexture("res/ui/SettlementUI/give_lose.png");
            item_win_img.setVisible(true);
		}else {
            item_win_img.setVisible(false);
		}
	},

    update_kong_score:function(panel_idx, score){
		cc.log(panel_idx, score)
        var score_label = this.player_tiles_panels[panel_idx].getChildByName("item_kong_score_label");
        if(score >= 0){
            score_label.setTextColor(cc.color(235, 235, 13));
            score_label.setString("+" + score.toString());
        } else {
            score_label.setTextColor(cc.color(225, 225, 214));
            score_label.setString(score.toString());
        }
    },

	update_score:function(panel_idx, score){
		var score_label = this.player_tiles_panels[panel_idx].getChildByName("item_score_label");
		if(score >= 0){
			score_label.setTextColor(cc.color(235, 235, 13));
			score_label.setString("+" + score.toString());
		} else {
			score_label.setTextColor(cc.color(225, 225, 214));
			score_label.setString(score.toString());
		}
	},
});