//距离比例
const UP = 1 
const DOWN = 2
const LEFT = 3
const RIGHT = 4
const RATIO = 0.6
const NUM = 2


cc.Class({
    extends: cc.Component,

    properties: {
        //是否可操作
        enable:{
            default:true,
            visible:false //编辑器属性管理器不可见 
        },

        //当前进行reset的chunk的个数
        _reset:0,

        /**
         * resetChunk操作不一定触发refresh操作, refresh期数不一定+=1
         * 但一次reset(一系列resetChunk)操作只能触发一次refresh操作, 关系
         */
        //记录refresh操作的期数
        _term:0,


        score:{
            default:0,
            visible:false, //编辑器属性管理器不可见
        },
        chunkPrefab:{
            default :null,
            type : cc.Prefab
        }
    },

    //初始化sessionCrl
    init:function(col, row){
        this._col = col
        this._row = row
    },

    //初始化子节点
    initChunk:function(chunk, col, row, type){
        chunk.x = chunk.width * col + chunk.width * 0.5 ;
        chunk.y = chunk.height * row + chunk.height * 0.5 ;
        
        chunk.type = type ;
        chunk.col = col ;
        chunk.row = row ;

        //刷新spirte
        chunk.controller.flush() ;

        //添加特效
        chunk.scaleX = 0 ;
        chunk.scaleY = 0 ;
        chunk.runAction(cc.scaleTo(0.6, 1, 1).easing(cc.easeCubicActionIn())) ;

        chunk.enable = true ; //chunk explode后会被设置为false
    },
    //复位节点
    resetChunk:function(chunk, col, row){
        var down ;
        var left ;
        var right ;

        var x = chunk.width * col + chunk.width * 0.5 ;
        var y = chunk.height * row + chunk.height * 0.5 ;

        //设置正确的位置
        chunk.col = col ;
        chunk.row = row ;

        //如果位置不正确则进行归位
        if(chunk.x != x || chunk.y != y){

            //_reset 计数+1
            this._reset += 1;
            //传入当前reset完成前时的term校验reset最多只触发一次refresh
            chunk.runAction(cc.sequence(cc.moveTo(0.4, x, y).easing(cc.easeCubicActionIn()), cc.callFunc(function(target, term){
                //可能该chunk已经被其他resetChunk流程引爆
                if(chunk.enable){ 
                    //reset结束或再次进行消除判断
                    let result = {col:0, row:0, up:0, down:0, left:0, right:0, success:false};
                    result.col = chunk.col ;
                    result.row = chunk.row ;

                    // chunk result 
                    if((down = this.checkDown(result.col, result.row, chunk.type)) >= NUM){
                        result.down = down ;
                        result.success = true ;
                    }
                    left = this.checkLeft(result.col, result.row, chunk.type) ;
                    right = this.checkRight(result.col, result.row, chunk.type) ;
                    if((left + right) >= NUM){
                        result.left = left ;
                        result.right = right ;
                        result.success = true ;
                    }                
                    if(result.success){
                        //此次reset触发refresh操作
                        //但只能触发一次
                        //如果已经触发过便无法再次触发
                        if(this._term == term){
                            this._term += 1 ;
                            //如果还要简介递归调用则_reset += 1 ;
                            this._reset += 1 ;
                            this._map[result.col][result.row].controller.callback(this.refresh, this) ;
                        }
                        this.clear(result) ;                    
                    }
                }
                //reset完成后计数-1
                this._reset -= 1 ;
                //_reset计数为0,reset流程结束,允许下次操作
                if(this._reset == 0){
                    this.enable = true ;
                }
            },this, this._term))) ;
        }
        
    },

    //创建子节点
    createChild:function(width, height, col, row){
        var chunk = cc.instantiate(this.chunkPrefab)

        //初始化chunk 宽高
        chunk.width = width
        chunk.height = height

        //将节点的动画播组件设置为自身属性方便使用
        chunk.controller = chunk.getComponent("chunk_controller")

        //设置 chunk为触摸事件的最初目标
        chunk.on(cc.Node.EventType.TOUCH_START,function(event){})
        chunk.on(cc.Node.EventType.TOUCH_MOVE,function(event){})
        chunk.on(cc.Node.EventType.TOUCH_END,function(event){})
        chunk.on(cc.Node.EventType.TOUCH_CANCEL,function(event){})
        this.node.addChild(chunk)

        this.initChunk(chunk, col, row, this.randomType(col, row))

        return chunk
    },
    checkUp(col, row, type){
        var result = 0;
        for(let r = row +1; r < this._row ; r++){
            if(this._map[col][r].type == type){
                result += 1;
            }else{
                break ;
            }
        }
        return result ;
    },
    checkDown(col, row, type){
        var result = 0 ;
        for(let r = row-1; r >=  0; r--){
            if(this._map[col][r].type == type){
                result += 1;
            }else{
                break;
            }
        }

        return result ;
    },
    checkLeft(col, row, type){
        var result = 0 ;
        for (let c = col-1; c >= 0;c--){
            if(this._map[c][row].type == type){
                result += 1;
            }else{
                break ;
            }
        }
        return result ;
    },
    checkRight(col, row, type){
        var result = 0 ;
        for (let c = col+1; c < this._col; c++){
            if(this._map[c][row].type == type){
                result += 1;
            }else{
                break ;
            }
        }
        return result ;
    },

    //执行清除
    clear:function(result){
        if(result.success){
            //up
            for(let r = 1; r <= result.up; r++){
                this.score += 1 ;
                this._map[result.col][result.row + r].controller.explode();
            }
            //down
            for(let r = 1; r <= result.down; r++){
                this.score += 1 ;
                this._map[result.col][result.row - r].controller.explode();
            }
            //core
            this.score += 2 ;
            this._map[result.col][result.row].controller.explode() ;

            //left
            for(let c = 1; c <= result.left; c++){
                this.score += 1;
                this._map[result.col - c][result.row].controller.explode();
            }
            //right
            for(let c = 1; c <= result.right; c++){
                this.score += 1;
                this._map[result.col + c][result.row].controller.explode();
            }
        }
    },
    //清除结束后调用该回调
    refresh:function(event){
        for(let col = 0; col < this._col; col++){
            for(let row = 0; row < this._row; row++){
                if(this._map[col][row].enable){
                    this.resetChunk(this._map[col][row], col, row) ;
                }else{
                    this._map[col].push(this._map[col].splice(row, 1)[0])
                    this.initChunk(this._map[col][this._row - 1], col, this._row - 1, this.randomType2(col, this._row - 1)) ;
                    row -= 1;
                }
            }


        }
        //间接递归调用完成后_reset += 1
        this._reset -= 1 ;
        //此次消除后,没有需要复位的chunk,直接允许下次操作
        if(this._reset == 0){
            this.enable = true ;
        }
    },

    //清除逻辑
    exec:function(chunk, direction){
        var other ;
        var up ;
        var down ;
        var left ;
        var right ;

        var cresult = {col:0, row:0, up:0, down:0, left:0, right:0, success:false};
        var oresult = {col:0, row:0, up:0, down:0, left:0, right:0 ,success:false};

        oresult.col = chunk.col ;
        oresult.row = chunk.row ;


        switch(direction){
            case UP:
                other = this._map[chunk.col][chunk.row+1]
                cresult.col = other.col ;
                cresult.row = other.row ;

                // chunk result 
                if (( up = this.checkUp(cresult.col, cresult.row, chunk.type)) >= NUM){
                    cresult.up = up ;
                    cresult.success = true ;
                }
                left = this.checkLeft(cresult.col, cresult.row, chunk.type)
                right = this.checkRight(cresult.col, cresult.row, chunk.type)
                if(left + right >= NUM){
                    cresult.left = left ;
                    cresult.right = right ;
                    cresult.success = true ;
                }

                // other result
                if ((down = this.checkDown(oresult.col, oresult.row, other.type)) >= NUM){
                    oresult.down = down ;
                    oresult.success = true ;
                }
                left = this.checkLeft(oresult.col, oresult.row, other.type)
                right = this.checkRight(oresult.col, oresult.row, other.type)
                if(left + right >= NUM){
                    oresult.left = left ;
                    oresult.right = right ;
                    oresult.success = true ;
                }
                break;

            case DOWN:
                other = this._map[chunk.col][chunk.row-1]
                cresult.col = other.col ;
                cresult.row = other.row ;

                // chunk result 
                if((down = this.checkDown(cresult.col, cresult.row, chunk.type)) >= NUM){
                    cresult.down = down ;
                    cresult.success = true ;
                }
                left = this.checkLeft(cresult.col, cresult.row, chunk.type)
                right = this.checkRight(cresult.col, cresult.row, chunk.type)
                if(left + right >= NUM){
                    cresult.left = left ;
                    cresult.right = right ;
                    cresult.success = true ;
                }
                
                // other result
                if((up = this.checkUp(oresult.col, oresult.row, other.type)) >= NUM){
                    oresult.up = up ;
                    oresult.success = true ;
                }
                left = this.checkLeft(oresult.col, oresult.row, other.type)
                right = this.checkRight(oresult.col, oresult.row, other.type)
                if(left + right >= NUM){
                    oresult.left = left ;
                    oresult.right = right ;
                    oresult.success = true ;
                }
                break;

            case LEFT:
                other = this._map[chunk.col-1][chunk.row]
                cresult.col = other.col ;
                cresult.row = other.row ;

                // chunk result 
                up = this.checkUp(cresult.col, cresult.row, chunk.type)
                down = this.checkDown(cresult.col, cresult.row, chunk.type)
                if(up + down >= NUM){
                    cresult.up = up ;
                    cresult.down = down ;
                    cresult.success = true ;
                }

                if((left = this.checkLeft(cresult.col, cresult.row, chunk.type)) >= NUM){
                    cresult.left = left ;
                    cresult.success = true ;
                }

                // other result
                up = this.checkUp(oresult.col, oresult.row, other.type)
                down = this.checkDown(oresult.col, oresult.row, other.type)
                if(up + down >= NUM){
                    oresult.up = up ;
                    oresult.down = down ;
                    oresult.success = true ;
                }

                if((right = this.checkRight(oresult.col, oresult.row, other.type)) >= NUM){
                    oresult.right = right ;
                    oresult.success = true
                }
                break;

            case RIGHT:
                other = this._map[chunk.col+1][chunk.row]
                cresult.col = other.col ;
                cresult.row = other.row ;

                // chunk result 
                up = this.checkUp(cresult.col, cresult.row, chunk.type)
                down = this.checkDown(cresult.col, cresult.row, chunk.type)
                if(up + down >= NUM){
                    cresult.up = up ;
                    cresult.down = down ;
                    cresult.success = true ;
                }
                if((right = this.checkRight(cresult.col, cresult.row, chunk.type)) >= NUM){
                    cresult.right = right ;
                    cresult.success = true
                }
                // other result
                up = this.checkUp(oresult.col, oresult.row, other.type)
                down = this.checkDown(oresult.col, oresult.row, other.type)
                if(up + down >= NUM){
                    oresult.up = up ;
                    oresult.down = down ;
                    oresult.success = true ;
                }
                if((left = this.checkLeft(oresult.col, oresult.row, other.type)) >= NUM){
                    oresult.left = left ;
                    oresult.success = true ;
                }
                break;
        }
        //进行消除
        if(cresult.success || oresult.success){
            //执行交换逻辑
            this._map[chunk.col][chunk.row] = other;
            this._map[other.col][other.row] = chunk ;

            other.col = oresult.col ;
            other.row = oresult.row ;

            chunk.col = cresult.col ;
            chunk.row = cresult.row ;

            chunk.runAction(cc.moveTo(0.4, other.position));
            other.runAction(cc.sequence(cc.moveTo(0.4, chunk.position), cc.callFunc(function(){

                //调用refresh时先设置_reset += 1 ;
                this._reset += 1 ;
                //先设置清除回调
                if(cresult.success){
                    this._map[cresult.col][cresult.row].controller.callback(this.refresh, this) ;
                }else {
                    this._map[oresult.col][oresult.row].controller.callback(this.refresh,this) ;
                }

                this.clear(cresult)
                this.clear(oresult)
                
            },this)));

        }else{
            //未成功则执行一段来回交换的动画,并在动画结束后结束,允许再次设置选择点
            chunk.runAction(cc.sequence(cc.moveTo(0.4, other.position), cc.delayTime(0.1), cc.moveTo(0.3, chunk.position)));
            other.runAction(cc.sequence(cc.moveTo(0.4, chunk.position), cc.delayTime(0.1), cc.moveTo(0.3, other.position),  cc.callFunc(function(){
                this.enable = true ;
            }, this)));
        }
    },

    onTouchStart:function(event){
        if(this.enable){
            if(event.target != this.node){
                this.enable = false
                this._point.selected = true
                this._point.position = event.getLocation()

                
                //选中chunk特效添加
                event.target.scaleX *= 1.1
                event.target.scaleY *= 1.1

            }
        }
    },
    recover: function(event){
        //被选择chunk特效取消
        event.target.scaleX = 1
        event.target.scaleY = 1

        //选择点归零
        this._point.selected = false
        this._point.position = cc.Vec2(0,0)
    },
    onTouchMove:function(event){
        if(this._point.selected){
            
            var touchPos = event.getLocation()
            var hdistance = (touchPos.x - this._point.position.x) * (touchPos.x - this._point.position.x)
            var vdistance = (touchPos.y - this._point.position.y) * (touchPos.y - this._point.position.y)            
            
            var distance = hdistance + vdistance ;

            var direction ;
            //如果触摸距离超过判定距离，则触发操作
            if(distance > this._max){
                if (hdistance > vdistance){
                    if (touchPos.x > this._point.position.x){
                        direction = RIGHT
                    }else{
                        direction = LEFT
                    }
                }else{
                    if (touchPos.y > this._point.position.y){
                        direction = UP
                    }else{
                        direction = DOWN
                    }
                }
                //终止对此次touch选择点的操作, clear this._point
                this.recover(event)
                if ((event.target.row == 0 && direction == DOWN) || (event.target.row == this._row-1 && direction == UP) || (event.target.col == 0 && direction == LEFT) || (event.target.col == this._col-1 && direction == RIGHT)){
                    //超出边界,不能进行消除,直接再次允许设置选择点
                    this.enable = true
                }else{
                    //开始消除逻辑吧
                    this.exec(event.target, direction)
                }
            }
        }
    },
    
    //触摸结束
    onTouchEnd:function(event){
        if(this._point.selected){
            //终止对此次touch选择点的操作, clear this._point
            this.recover(event)
            //允许再次设置选择点
            this.enable = true
        }
    },

    //触摸被中断取消
    onTouchCancel:function(event){
        if(this._point.selected){
            //终止对此次touch选择点的操作, clear this._point
            this.recover(event)
            //允许再次设置选择点
            this.enable = true
        }
    },

    //随机chunk的类型(load)
    randomType:function(col,row){
        var up ; //上面chunk的类型
        var left ; //左边chunk的类型
        var result ; //最终生成方块的类型

        if (col > 0 ){
            left = this._map[col-1][row].type
        }
        if (row > 0){
            up = this._map[col][row-1].type
        }
        do{
            result = Math.round((Math.random()*5))+1
        }while(result == up || result == left) ;

        return result
    },
    //随机chunk的类型(复用)
    randomType2:function(col,row){
        var up ; //上面chunk的类型
        var down ; //下面chunk的类型
        var left ; //左边chunk的类型
        var right ; //右边chunk的类型
        var result ; //最终生成方块的类型

        if((row < this._row - 1) && this._map[col][row + 1].enable){
            up = this._map[col][row + 1].type ;
        }
        if (row > 0){
            down = this._map[col][row - 1].type ;
        }
        if (col > 0 ){
            left = this._map[col - 1][row].type ;
        }
        if ((col < this._col - 1) && this._map[col+1][row].enable){
            right = this._map[col + 1][row].type ;
        }
    

        do{
            result = Math.round((Math.random()*5))+1
        }while(result == up || result == down || result == left || result == right) ;

        return result ;
    },

    onLoad :function(){
        //计算每个chunk的size
        var width = this.node.width / this._col
        var height = this.node.height / this._row

        //初始化chunk—map
        this._map = new Array(this._col)
        for (let col = 0 ; col < this._col ; col++){
            this._map[col] = new Array(this._row)
            for ( let row = 0 ; row < this._row; row ++){
                this._map[col][row] = this.createChild(width, height,col, row)
            }
        }

        //初始化 touch-move-max-distance
        this._max = (width * width + height * height) * RATIO

        //初始化 touch-point
        this._point = {
            selected:false,
            position:cc.Vec2(0,0)
        }
        //初始化touch事件监听
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this)
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this)
    }
});
