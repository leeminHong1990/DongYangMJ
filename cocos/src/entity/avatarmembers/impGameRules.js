"use strict";
/*-----------------------------------------------------------------------------------------
 interface
 -----------------------------------------------------------------------------------------*/
var impGameRules = impGameOperation.extend({
    __init__: function () {
        this._super();
        KBEngine.DEBUG_MSG("Create impGameRules");
    },

    getCanWinTiles: function (select_tile, serverSitNum, aid) {
        select_tile = select_tile || 0;
        serverSitNum = serverSitNum || this.serverSitNum;
        aid = aid || const_val.OP_DRAW_WIN;
        // var time1 = (new Date()).getTime();

        //听牌提示
        var canWinTiles = [];
        var handTiles = this.curGameRoom.handTilesList[serverSitNum].concat([]);
        var allTiles = [const_val.CHARACTER, const_val.BAMBOO, const_val.DOT, const_val.WINDS, const_val.DRAGONS]
        var select_tile_pos = handTiles.indexOf(select_tile);
        if(select_tile_pos >= 0){
            handTiles.splice(select_tile_pos, 1);
        }
        if(handTiles.length%3 != 1){
            return canWinTiles
        }
        for (var i = 0; i < allTiles.length; i++) {
            for (var j = 0; j < allTiles[i].length; j++) {
                var t = allTiles[i][j]
                var temp_handTiles = handTiles.concat([t]);
                if (this.canWin(temp_handTiles, t, serverSitNum, aid)) {
                    canWinTiles.push(t);
                }
            }
        }
        // var time2 = (new Date()).getTime();
        // cc.log("getCanWinTiles222 cost = ", time2 - time1);
        return canWinTiles;
    },

    canDiscardIdx:function (idx) {
        // Note: 回放时不可能用到这个方法，不考虑serverSitNum
        return true
    },

    // canConcealedKong: function (tiles) {
    //     //暗杠
    //     return this.getOneConcealedKongNum(tiles) > 0;
    // },
    //
    // getOneConcealedKongNum: function (tiles) {
    //     var hashDict = {};
    //     for (var i = 0; i < tiles.length; i++) {
    //         if (this.curGameRoom.kingTiles.indexOf(tiles[i]) >= 0) {
    //             continue;
    //         }
    //         if (hashDict[tiles[i]]) {
    //             hashDict[tiles[i]]++;
    //             if (hashDict[tiles[i]] >= 4) {
    //                 return tiles[i];
    //             }
    //         } else {
    //             hashDict[tiles[i]] = 1;
    //         }
    //     }
    //     return 0;
    // },
    //
    // canExposedKong: function (tiles, keyTile) {
    //     if (this.curGameRoom.kingTiles.indexOf(keyTile) >= 0) {
    //         return false;
    //     }
    //     var tile = 0;
    //     for (var i = 0; i < tiles.length; i++) {
    //         if (tiles[i] === keyTile) {
    //             tile++;
    //         }
    //     }
    //     return tile >= 3;
    //
    // },
    //
    // canContinueKongTile: function (upTilesList, tile) {
    //     return this.getContinueKongUpIdx(upTilesList, tile) >= 0 ? true : false;
    // },
    //
    // canContinueKongHandTiles:function(upTilesList, handTiles){
    //     return this.getContinueKongTileList(upTilesList, handTiles).length > 0 ? true : false;
    // },
    //
    // getContinueKongTileList:function(upTilesList, handTiles){
    //     var tilelist = []
    //     for (var i = 0; i < handTiles.length; i++) {
    //         if (this.curGameRoom.kingTiles.indexOf(handTiles[i]) >= 0) {continue;}
    //         for (var j = 0; j < upTilesList.length; j++) {
    //             if (upTilesList[j].length === 3 && upTilesList[j][0] === upTilesList[j][1] && upTilesList[j][1] === upTilesList[j][2] && handTiles[i] === upTilesList[j][0]) {
    //                 tilelist.push(handTiles[i])
    //             }
    //         }
    //     }
    //     return tilelist
    // },
    //
    // getContinueKongHandIdxList: function (upTilesList, handTiles) {
    //     var idxList = []
    //     for (var i = 0; i < handTiles.length; i++) {
    //         if (this.curGameRoom.kingTiles.indexOf(handTiles[i]) >= 0) {continue;}
    //         for (var j = 0; j < upTilesList.length; j++) {
    //             if (upTilesList[j].length === 3 && upTilesList[j][0] === upTilesList[j][1] && upTilesList[j][1] === upTilesList[j][2] && handTiles[i] === upTilesList[j][0]) {
    //                 idxList.push(i)
    //             }
    //         }
    //     }
    //     return idxList
    // },

    getContinueKongUpIdx: function (upTilesList, tile) {
        if (this.curGameRoom.kingTiles.indexOf(tile) >= 0) {
            return -1;
        }
        for (var i = 0; i < upTilesList.length; i++) {
            if (upTilesList[i].length === 3 && tile === upTilesList[i][0] &&
                upTilesList[i][0] === upTilesList[i][1] && upTilesList[i][1] === upTilesList[i][2]) {
                return i;
            }
        }
        return -1;
    },

    getCanChowTilesList: function (keyTile, serverSitNum) {
        var chowTilesList = [];
        if (this.curGameRoom.kingTiles.indexOf(keyTile) >= 0){
            return chowTilesList
        }
        var intead = keyTile
        if(keyTile === const_val.DRAGON_WHITE && this.curGameRoom.kingTiles.length > 0){
            intead = this.curGameRoom.kingTiles[0]
        }
        if(intead >= const_val.BOUNDARY){
            return chowTilesList
        }
        var tiles = this.curGameRoom.handTilesList[serverSitNum];
        // 预处理
        tiles = cutil.deepCopy(tiles);
        for (let i = 0; i < this.curGameRoom.kingTiles.length; i++){
            cutil.batch_delete(tiles, this.curGameRoom.kingTiles[i]);
        }
        if (this.curGameRoom.kingTiles.length > 0) {
            cutil.batch_replace(tiles, const_val.DRAGON_WHITE, this.curGameRoom.kingTiles[0]);
        }

        var match = [[-2,-1], [-1, 1], [1, 2]];
        for (var i = 0; i < match.length; i++){
            var match_0 = match[i][0] + intead;
            var match_1 = match[i][1] + intead;
            if (tiles.indexOf(match_0) >= 0 && tiles.indexOf(match_1) >= 0){
                if (this.curGameRoom.kingTiles.indexOf(match_0) >= 0) {
                    match_0 = const_val.DRAGON_WHITE;
                }
                if (this.curGameRoom.kingTiles.indexOf(match_1) >= 0) {
                    match_1 = const_val.DRAGON_WHITE;
                }
                chowTilesList.push([keyTile, match_0, match_1]);
            }
        }
        return chowTilesList;
    },

    getDrawOpDict: function (drawTile, serverSitNum) {
        drawTile = drawTile || 0;
        serverSitNum = serverSitNum || this.serverSitNum;
        var op_dict = {}
        var handTiles = this.curGameRoom.handTilesList[serverSitNum];
        var uptiles = this.curGameRoom.upTilesList[serverSitNum];
        //杠
        //接杠
        cc.log(handTiles, uptiles)
        for (var i = 0; i < handTiles.length; i++) {
            for (var j = 0; j < uptiles.length; j++) {
                var upMeld = uptiles[j]
                if (upMeld.length === 3 && upMeld[0] === upMeld[1] && upMeld[1] === upMeld[2] && upMeld[0] === handTiles[i]) {
                    if (!op_dict[const_val.OP_CONTINUE_KONG]) {
                        op_dict[const_val.OP_CONTINUE_KONG] = []
                    }
                    op_dict[const_val.OP_CONTINUE_KONG].push([handTiles[i]])
                }
            }
        }
        //暗杠
        var tile2NumDict = cutil.getTileNumDict(handTiles)
        for (var key in tile2NumDict) {
            if (this.curGameRoom.kingTiles.indexOf(eval(key)) >= 0){
                continue;
            }
            if (tile2NumDict[key] === 4) {
                if (!op_dict[const_val.OP_CONCEALED_KONG]) {
                    op_dict[const_val.OP_CONCEALED_KONG] = []
                }
                op_dict[const_val.OP_CONCEALED_KONG].push([eval(key)])
            }
        }
        //胡
        if (handTiles.length % 3 === 2 && this.canWin(handTiles, drawTile, serverSitNum, const_val.OP_DRAW_WIN)) {
            op_dict[const_val.OP_DRAW_WIN] = [[drawTile]]
        }
        //过
        if (Object.keys(op_dict).length > 0) {
            op_dict[const_val.OP_PASS] = [[drawTile]]
        }
        cc.log("getDrawOpDict==>:", op_dict, drawTile, serverSitNum)
        return op_dict
    },

    getPongKongOpDict: function (serverSitNum) {
        serverSitNum = serverSitNum || this.serverSitNum;
        var op_dict = {};
        var handTiles = this.curGameRoom.handTilesList[serverSitNum];
        var uptiles = this.curGameRoom.upTilesList[serverSitNum];
        //杠
        //接杠
        cc.log(handTiles, uptiles)
        for (var i = 0; i < handTiles.length; i++) {
            for (var j = 0; j < uptiles.length; j++) {
                var upMeld = uptiles[j]
                if (upMeld.length === 3 && upMeld[0] === upMeld[1] && upMeld[1] === upMeld[2] && upMeld[0] === handTiles[i]) {
                    if (!op_dict[const_val.OP_CONTINUE_KONG]) {
                        op_dict[const_val.OP_CONTINUE_KONG] = []
                    }
                    op_dict[const_val.OP_CONTINUE_KONG].push([handTiles[i]])
                }
            }
        }
        //暗杠
        var tile2NumDict = cutil.getTileNumDict(handTiles)
        for (var key in tile2NumDict) {
            if (this.curGameRoom.kingTiles.indexOf(eval(key)) >= 0){
                continue;
            }
            if (tile2NumDict[key] === 4) {
                if (!op_dict[const_val.OP_CONCEALED_KONG]) {
                    op_dict[const_val.OP_CONCEALED_KONG] = []
                }
                op_dict[const_val.OP_CONCEALED_KONG].push([eval(key)])
            }
        }
        //过
        if (Object.keys(op_dict).length > 0) {
            op_dict[const_val.OP_PASS] = [[0]]
        }
        cc.log("getPongKongOpDict==>:", op_dict, serverSitNum);
        return op_dict
    },

    getWaitOpDict: function (wait_aid_list, tileList, serverSitNum) {
        serverSitNum = serverSitNum || this.serverSitNum;
        var op_dict = {}
        // 吃碰杠 胡
        for (var i = 0; i < wait_aid_list.length; i++) {
            if (wait_aid_list[i] === const_val.OP_CHOW) { // 吃要特殊处理，告诉服务端吃哪一组
                cc.log("====>:", tileList)
                var canChowTileList = this.getCanChowTilesList(tileList[0], serverSitNum);
                cc.log("====", canChowTileList)
                if (canChowTileList.length > 0) {
                    op_dict[wait_aid_list[i]] = canChowTileList
                }
            } else {
                op_dict[wait_aid_list[i]] = [[tileList[0]]]
            }
        }
         if (Object.keys(op_dict).length > 0) {
            op_dict[const_val.OP_PASS] = [[tileList[0]]]
        }
        cc.log("getWaitOpDict==>", wait_aid_list, tileList, op_dict, serverSitNum);
        return op_dict
    },

    canWin: function (handTiles, finalTile, serverSitNum, aid) {
        //7对 3x+2
        if (handTiles.length % 3 !== 2) {
            return false;
        }
        var handCopyTile = handTiles.concat([]);
        handCopyTile.sort(function(a,b){return a-b;});

        var kingClassified = cutil.classifyKingTiles(handCopyTile, this.curGameRoom.kingTiles);
        var kings   = kingClassified[0];
        var handTilesButKing  = kingClassified[1];

        var upTiles = this.curGameRoom.upTilesList[this.serverSitNum]

        var kingTilesNum = kings.length;
        if (kingTilesNum === 4) {                                                       // 4 财神
            return true;
        } else if (cutil.checkIs7Pairs(handTilesButKing, kingTilesNum)) {               // 7对
            return true;
        } else if (cutil.isAllWindsDragons(handTilesButKing, upTiles)) {                         // 全是字 管他乱风还是清风
            return true;
        }   else if (cutil.isThirteenNotMatch(handTilesButKing, kingTilesNum)) {        // 十三不搭 管他正规不正规 七风不七风
            return true;
        }  else if(kingTilesNum > 0){                                                   // 有癞子
            return cutil.canNormalWinWithKing3N2(handTilesButKing, kingTilesNum);
        } else {                                                                        // 没癞子
            return cutil.canNormalWinWithoutKing3N2(handTilesButKing);
        }
    },

});
