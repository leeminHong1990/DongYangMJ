"use strict";

var GameRoomEntity = KBEngine.Entity.extend({
	ctor : function(player_num)
	{
		
		this._super();
		this.roomID = undefined;
		this.curRound = 0;

		this.maxRound = 8;
		this.luckyTileNum = 0;
		this.ownerId = undefined;
		this.dealerIdx = 0;
		this.isAgent = false;
		this.king_num = 1;
		this.player_num = player_num || 4;
		this.pay_mode = 0;
		this.game_mode = 0;
		this.game_max_lose  = 999999;
		this.round_max_lose = 999999;
		this.base_score = 0;
		this.begin_dealer_mul = 1;
		this.bao_tou = 0;
		this.cur_dealer_mul = 1;
		this.king_mode = 0;
		this.pong_useful = 0;
		this.three_job = 0;
		this.hand_prepare = 1;
    this.club_id = 0;

		this.playerInfoList = [null, null, null, null];
		this.playerDistanceList = [[-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1], [-1,-1,-1,-1]];
		this.playerStateList = [0, 0, 0, 0];
		this.handTilesList = [[], [], [], []];
		this.upTilesList = [[], [], [], []];
		this.upTilesOpsList = [[], [], [], []];
		this.discardTilesList = [[], [], [], []];
		this.cutIdxsList = [[], [], [], []];
		this.wreathsList = [[], [], [], []];

		this.prevailing_wind = const_val.WIND_EAST
		this.playerWindList = [const_val.WIND_EAST, const_val.WIND_SOUTH, const_val.WIND_WEST, const_val.WIND_NORTH]
		this.curPlayerSitNum = 0;
		this.room_state = const_val.ROOM_WAITING;
		this.lastDiscardTile = -1;
		this.lastDrawTile = -1;
    	this.last_op = -1;
		this.lastDiscardTileFrom = -1;
		this.discard_king_idx = -1;
		this.leftTileNum = 60;

		this.kingTiles = [];	// 财神(多个)

		this.applyCloseLeftTime = 0;
		this.applyCloseFrom = 0;
		this.applyCloseStateList = [0, 0, 0, 0];

		this.waitAidList = []; // 玩家操作列表，[]表示没有玩家操作

		// 每局不清除的信息
		this.playerScoreList = [0, 0, 0, 0];
		this.msgList = [];		//所有的聊天记录
	    KBEngine.DEBUG_MSG("Create GameRoomEntity")
  	},

  	reconnectRoomData : function(recRoomInfo){
  		cc.log("reconnectRoomData",recRoomInfo)
  		this.curPlayerSitNum = recRoomInfo["curPlayerSitNum"];
  		this.room_state = recRoomInfo["room_state"];
  		this.playerStateList = recRoomInfo["player_state_list"];
  		this.lastDiscardTile = recRoomInfo["lastDiscardTile"];
  		this.lastDrawTile = recRoomInfo["lastDrawTile"]
  		this.lastDiscardTileFrom = recRoomInfo["lastDiscardTileFrom"];
  		this.leftTileNum = recRoomInfo["leftTileNum"];
  		this.kingTiles = recRoomInfo["kingTiles"];
  		this.prevailing_wind = recRoomInfo["prevailing_wind"];
        this.last_op = recRoomInfo["last_op"];
        this.discard_king_idx =recRoomInfo["discard_king_idx"];
  		for(var i = 0; i < recRoomInfo["player_advance_info_list"].length; i++){

  			var curPlayerInfo = recRoomInfo["player_advance_info_list"][i];
  			this.wreathsList[i] = curPlayerInfo["wreaths"];
  			this.playerWindList[i] = curPlayerInfo["wind"];

  			this.handTilesList[i] = curPlayerInfo["tiles"];
  			this.discardTilesList[i] = curPlayerInfo["discard_tiles"];
  			this.cutIdxsList[i] = curPlayerInfo["cut_idxs"];
 
  			for(var j = 0; j < curPlayerInfo["op_list"].length; j++){
  				var op_info = curPlayerInfo["op_list"][j]; //[opId, [tile]]
  				if(op_info["opId"] === const_val.OP_PONG){
  					this.upTilesList[i].push([op_info["tiles"][0], op_info["tiles"][0], op_info["tiles"][0]]);
  					this.upTilesOpsList[i].push([op_info]);
  				} else if(op_info["opId"] === const_val.OP_EXPOSED_KONG){ //明杠
  					this.upTilesList[i].push([op_info["tiles"][0], op_info["tiles"][0], op_info["tiles"][0], op_info["tiles"][0]]);
  					this.upTilesOpsList[i].push([op_info]);
  				} else if(op_info["opId"] === const_val.OP_CONTINUE_KONG){ // 风险杠
  					var kongIdx = h1global.entityManager.player().getContinueKongUpIdx(this.upTilesList[i], op_info["tiles"][0]);
  					this.upTilesList[i][kongIdx].push(op_info["tiles"][0]);
	  				this.upTilesOpsList[i][kongIdx].push(op_info);
  				}else if(op_info["opId"] === const_val.OP_CONCEALED_KONG){ // 暗杠
  					this.upTilesList[i].push([0, 0, 0, op_info["tiles"][0]]);
  					this.upTilesOpsList[i].push([op_info]);
  				} else if(op_info["opId"] === const_val.OP_CHOW){
  					var sortTiles = op_info["tiles"].concat();
  					sortTiles = cutil.sortChowTileList(sortTiles[0], sortTiles);
                    // cutil.tileSort(sortTiles, this.kingTiles);
  					this.upTilesList[i].push(sortTiles);
  					this.upTilesOpsList[i].push([op_info]);
  				}
  			}
  		}

  		this.applyCloseLeftTime = recRoomInfo["applyCloseLeftTime"];
  		this.applyCloseFrom = recRoomInfo["applyCloseFrom"];
		this.applyCloseStateList = recRoomInfo["applyCloseStateList"];
		if(this.applyCloseLeftTime > 0){
			onhookMgr.setApplyCloseLeftTime(this.applyCloseLeftTime);
		}
		this.waitAidList = recRoomInfo["waitAidList"];
		this.updateRoomData(recRoomInfo["init_info"]);
		for(var i = 0; i < recRoomInfo["player_advance_info_list"].length; i++){
			var curPlayerInfo = recRoomInfo["player_advance_info_list"][i];
			this.playerInfoList[i]["score"] = curPlayerInfo["score"]
			this.playerInfoList[i]["total_score"] = curPlayerInfo["total_score"]
		}
        if (const_val.FAKE_COUNTDOWN > 0) {
            onhookMgr.setWaitLeftTime(const_val.FAKE_COUNTDOWN);
        }
  	},

  	updateRoomData : function(roomInfo){
  		cc.log('updateRoomData:',roomInfo)
  		this.roomID = roomInfo["roomID"];
  		this.ownerId = roomInfo["ownerId"];
  		this.dealerIdx = roomInfo["dealerIdx"];
  		this.curRound = roomInfo["curRound"]
  		this.maxRound = roomInfo["maxRound"];
  		this.king_num = roomInfo["king_num"];
  		this.player_num = roomInfo["player_num"];
  		this.pay_mode = roomInfo["pay_mode"];
  		this.game_mode = roomInfo["game_mode"];
  		this.isAgent = roomInfo["isAgent"];
  		this.round_max_lose= roomInfo["round_max_lose"];
  		this.luckyTileNum = roomInfo["lucky_num"];
  		this.hand_prepare = roomInfo["hand_prepare"];
      this.club_id = roomInfo["club_id"];
      
      this.game_max_lose  = roomInfo["game_max_lose"];
      this.round_max_lose = roomInfo["round_max_lose"];
      this.base_score = roomInfo["base_score"];
      this.begin_dealer_mul = roomInfo["begin_dealer_mul"];
      this.bao_tou = roomInfo["bao_tou"];
      this.cur_dealer_mul = roomInfo["cur_dealer_mul"];
      this.king_mode = roomInfo["king_mode"];
      this.pong_useful = roomInfo["pong_useful"];
      this.three_job = roomInfo["three_job"];

  		for(var i = 0; i < roomInfo["player_base_info_list"].length; i++){
  			this.updatePlayerInfo(roomInfo["player_base_info_list"][i]["idx"], roomInfo["player_base_info_list"][i]);
		}
        this.updateDistanceList();
		this.addMenuShareAppMsg()
  	},

  	updatePlayerInfo : function(serverSitNum, playerInfo){
  		this.playerInfoList[serverSitNum] = playerInfo;
  	},

  	updatePlayerState : function(serverSitNum, state){
  		this.playerStateList[serverSitNum] = state;
  	},

  	updatePlayerOnlineState : function(serverSitNum, state){
  		this.playerInfoList[serverSitNum]["online"] = state;
  	},

	updateDistanceList : function () {
        for(var i = 0 ; i < this.playerInfoList.length ; i++) {
            for(var j = 0 ; j < this.playerInfoList.length ; j++) {
                if(i === j){this.playerDistanceList[i][j] = -1;continue;}
                if(this.playerInfoList[i] && this.playerInfoList[j]) {
					var distance = cutil.calc_distance(parseFloat(this.playerInfoList[i]["lat"]), parseFloat(this.playerInfoList[i]["lng"]), parseFloat(this.playerInfoList[j]["lat"]), parseFloat(this.playerInfoList[j]["lng"]));
                    this.playerDistanceList[i][j] = (distance || distance == 0 ? distance : -1);
                }else {
                    this.playerDistanceList[i][j] = -1;
				}
            }
        }
    },

  	startGame : function(kingTiles, wreathsList){
  		this.curRound = this.curRound + 1;
  		this.room_state = const_val.ROOM_PLAYING;
  		this.wreathsList = wreathsList;
  		this.kingTiles = kingTiles;
  		var wreathsNum = 0;
      	this.last_op = -1;
        this.discard_king_idx = -1;
  		for (var i = 0; i < wreathsList.length; i++) {
  			wreathsNum += wreathsList[i].length
  		}
		this.handTilesList = [	[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
							[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]];
  		this.upTilesList = [[], [], [], []];
  		this.upTilesOpsList = [[], [], [], []];
  		this.discardTilesList = [[], [], [], []];
  		this.cutIdxsList = [[], [], [], []];
  		this.waitAidList = [];
  		if (this.king_mode === 1) {
            this.leftTileNum = 82 - wreathsNum;
        } else {
            this.leftTileNum = 83 - wreathsNum;
        }
  	},

	swap_seat : function (swap_list) {
		if(!swap_list){
			return;
		}
		var tempPlayerInfoList = [];
		for (var i = 0; i < swap_list.length; i++) {
			tempPlayerInfoList[i] = this.playerInfoList[swap_list[i]];
			tempPlayerInfoList[i].idx = i;
		}
		cc.log(tempPlayerInfoList);
		this.playerInfoList = tempPlayerInfoList;
		this.updateDistanceList();
	},

  	endGame : function(){
  		// 重新开始准备
  		this.room_state = const_val.ROOM_WAITING;
  		this.playerStateList = [0, 0, 0, 0];
  	},

  	addMenuShareAppMsg : function(){
  		var self = this;
        if(!((cc.sys.os == cc.sys.OS_IOS && cc.sys.isNative) || (cc.sys.os == cc.sys.OS_ANDROID && cc.sys.isNative)) || switches.TEST_OPTION){
            var share_title = ' 房间号【' + self.roomID.toString() + '】,招募群主,1000红包奖励群主!';
            var share_list = [];
            share_list.push('一吊冲');
            share_list.push(self.maxRound + '局');
            share_list.push('白板财神');
            share_list.push('四人');
            cutil.share_func(share_title, share_list.join(","));
		}
  	},
});