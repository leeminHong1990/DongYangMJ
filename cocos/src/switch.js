"use strict";
var switches = function () {
};

if (targetPlatform === cc.PLATFORM_OS_ANDROID) {

}
else if ((targetPlatform === cc.PLATFORM_OS_IPHONE) || (targetPlatform === cc.PLATFORM_OS_IPAD)) {

}
else {

}
switches.show_version = true;
switches.TEST_OPTION = true;

switches.share_android_url = "http://share_android_url";
switches.share_ios_url = "http://share_ios_url";
switches.h5entrylink = "http://h5entrylink";

switches.PHP_SERVER_URL = "http://10.0.0.4:9981/api/user_info";

switches.package_name = "com/a/b";

switches.kbeServerIP = "192.168.1.11";
switches.kbeServerLoginPort = 20013;

// switches.test_auto = function () {
//     let WindowTimeFun = cc.Class.extend({});
//     cc.director.getScheduler().schedule(function () {
//             if (h1global && h1global.entityManager) {
//                 let player = h1global.entityManager.player();
//                 if (h1global.curUIMgr && player && player.curGameRoom) {
//                     cc.sys.localStorage.setItem("_rid_", player.curGameRoom.roomID.toString());
//                 }
//                 if (h1global.curUIMgr && h1global.curUIMgr.joinroom_ui) {
//                     if (!h1global.curUIMgr.joinroom_ui.oo) {
//                         h1global.curUIMgr.joinroom_ui.oo = h1global.curUIMgr.joinroom_ui.onShow;
//                         h1global.curUIMgr.joinroom_ui.onShow = function () {
//                             h1global.curUIMgr.joinroom_ui.curNum = 99999;
//                             h1global.curUIMgr.joinroom_ui.oo.apply(this);
//                             h1global.curUIMgr.joinroom_ui.update_click_num()
//                         };
//                     }
//                 }

//             }
//             // if (h1global && h1global.curUIMgr && h1global.curUIMgr.login_ui) {
//             //     if (!h1global.curUIMgr.login_ui.oo) {
//             //         if (h1global.curUIMgr.login_ui.is_show) {
//             //             h1global.curUIMgr.login_ui.oo = true;
//             //             let root = h1global.curUIMgr.login_ui.rootUINode;
//             //             var account_panel = root.getChildByName("account_panel");
//             //             var account_input_tf = ccui.helper.seekWidgetByName(account_panel, "account_input_tf");
//             //             account_input_tf.string = "q";
//             //         }
//             //     }
//             // }
//             //
//             // if (!cc.test_head_icon) {
//             //     if (cc.sys.localStorage.getItem("INFO_JSON")) {
//             //         var info_dict = eval('(' + cc.sys.localStorage.getItem("INFO_JSON") + ')');
//             //         if (info_dict["headimgurl"] != "http://192.168.1.66:8081/res/effect/biaoqing.png") {
//             //             info_dict["headimgurl"] = "http://192.168.1.66:8081/res/effect/biaoqing.png";
//             //             cc.test_head_icon = true;
//             //             cc.sys.localStorage.setItem("INFO_JSON", JSON.stringify(info_dict));
//             //         }
//             //     }
//             // }
//         }, new WindowTimeFun(), 1 / 120, cc.REPEAT_FOREVER, 0, false, "ppppaa"
//     );
// };

// switches.test_auto();