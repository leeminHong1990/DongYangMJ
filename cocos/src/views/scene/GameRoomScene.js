// cc.loader.loadJs("src/views/uimanager/LoginSceneUIManager.js")

var GameRoomScene = cc.Scene.extend({
    className:"GameRoomScene",
    onEnter:function () {
        this._super();
        if (cc.sys.localStorage.getItem("GAME_ROOM_UI") == null) {
            cc.sys.localStorage.setItem("GAME_ROOM_UI", const_val.GAME_ROOM_3D_UI)
        }
        if (cc.sys.localStorage.getItem("GAME_ROOM_BG") == null) {
            cc.sys.localStorage.setItem("GAME_ROOM_BG", const_val.GAME_ROOM_BG_CLASSIC);
        }
        this.loadUIManager();
        cutil.unlock_ui();

        if(cc.audioEngine.isMusicPlaying()){
            cc.audioEngine.stopMusic();
        }
        if(!cc.audioEngine.isMusicPlaying()){
            cc.audioEngine.playMusic("res/sound/music/game_bgm.mp3", true);
        }
    },

    loadUIManager:function() {
    	var curUIManager = new GameRoomSceneUIManager();
    	curUIManager.setAnchorPoint(0, 0);
    	curUIManager.setPosition(0, 0);
    	this.addChild(curUIManager, const_val.curUIMgrZOrder);
        h1global.curUIMgr = curUIManager;

        if(h1global.entityManager.player().startActions["GameRoomScene"]){
            h1global.entityManager.player().startActions["GameRoomScene"]();
            h1global.entityManager.player().startActions["GameRoomScene"] = undefined;
        } else if(h1global.entityManager.player().curGameRoom.room_state == const_val.ROOM_PLAYING){
            // curUIManager.gameroomprepare_ui.hide();
            if(h1global.curUIMgr.gameroom3d_ui && h1global.curUIMgr.gameroom2d_ui){
                h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "hide");
                h1global.curUIMgr.showGameRoomUI(function(complete){
                    if(complete){
                        let player = h1global.entityManager.player();
                        if (player && player.startActions["GameRoomUI"]) {
                            player.startActions["GameRoomUI"]();
                            player.startActions["GameRoomUI"] = undefined;
                        }
                        h1global.curUIMgr.setGameRoomUI2Top(cc.sys.localStorage.getItem("GAME_ROOM_UI"))
                    }
                });
            }
        } else {
            h1global.curUIMgr.roomLayoutMgr.notifyObserver(const_val.GAME_ROOM_UI_NAME, "hide")
            curUIManager.gameroomprepare_ui.show_prepare();
        }

        if (!onhookMgr) { 
            onhookMgr = new OnHookManager();
        }

        onhookMgr.init(this);
        this.scheduleUpdateWithPriority(0);

        if(onhookMgr.applyCloseLeftTime > 0){
            curUIManager.applyclose_ui.show_by_sitnum(h1global.entityManager.player().curGameRoom.applyCloseFrom);
        }
    },

    update:function( delta ){
        // if (physicsUpdate) {
        //     physicsUpdate();
        // }
        onhookMgr.update(delta);
    }
});