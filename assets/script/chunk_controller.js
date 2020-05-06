// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        icon1:{
            default:null,
            type:cc.SpriteFrame
        },
        icon2:{
            default:null,
            type:cc.SpriteFrame
        },
        icon3:{
            default:null,
            type:cc.SpriteFrame
        },
        icon4:{
            default:null,
            type:cc.SpriteFrame
        },
        icon5:{
            default:null,
            type:cc.SpriteFrame
        },
        icon6:{
            default:null,
            type:cc.SpriteFrame
        }
    },

    flush:function(){
        this._sprite.spriteFrame = this["icon"+this.node.type]
    },

    explode:function(){
        this.node.enable = false ;
        this._animation.play("explosion"+this.node.type)
    },
    callback:function(func, target){
        this._animation.once("finished", func, target)
    },


    onLoad:function(){
        this._sprite = this.node.getComponent(cc.Sprite)
        this._animation = this.node.getComponent(cc.Animation)
    }
});
