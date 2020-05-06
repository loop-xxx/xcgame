// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        sessionPrefab:{
            default:null,
            type:cc.Prefab
        }
    },
    onLoad:function(){
        var session = cc.instantiate(this.sessionPrefab)
        session.getComponent("session_controller").init(8, 10)
        this.node.addChild(session)
    },
});
