var target=[[0,1,2,3],
            [4,5,6,7],
            [8,9,10,11],
            [12,13,14,15]];//目标矩阵(模拟拼图)
var steps=[[0,-1],[-1,0],[0,1],[1,0]];//步数
var fact;//记录阶乘
var all_button;//储存所有按钮对象
var image_id;//储存所有图片路径
var target_node;//储存目标矩阵的node
var now_puzzle;//当前矩阵
var is_start;//判断游戏是否开始
var is_help_start;//判断游戏帮助是否开始
var is_win;//判断是否胜利
var white_row;//储存空白图片的当前行
var white_col;//储存空白图片的当前列
var time;//用于计时
var total_isvis;//用于A-star算法的去重

//Node的构造函数
function newNode(pic){
    obj={};
    obj.begin_dis=0;
    obj.end_dis=0;
    obj.total_dis=0;
    obj.now_row=0;
    obj.now_col=0;
    obj.now_pos=new Array(16);
    obj.now_pic=new Array(4);
    obj.pre=null;
    for(var i=0;i<4;++i){
        obj.now_pic[i]=new Array(4);
        for(var j=0;j<4;++j){
            if(pic[i][j]==0){
                obj.now_row=i;
                obj.now_col=j;
            }
            obj.now_pic[i][j]=pic[i][j];
            obj.now_pos[pic[i][j]]=i*4+j;
        }
    }
    return obj;
}

//Node的拷贝构造函数
function copyNode(next){
    obj={};
    obj.begin_dis=next.begin_dis;
    obj.end_dis=next.end_dis;
    obj.total_dis=next.total_dis;
    obj.now_row=next.now_row;
    obj.now_col=next.now_col;
    obj.now_pos=new Array(16);
    obj.now_pic=new Array(4);
    for(var i=0;i<4;++i){
        obj.now_pic[i]=new Array(4);
        for(var j=0;j<4;++j){
            obj.now_pic[i][j]=next.now_pic[i][j];
            obj.now_pos[next.now_pic[i][j]]=i*4+j;
        }
    }
    return obj;
}

//初始化整个游戏
function init(){
    is_start=0;
    is_help_start=0;
    is_win=false;
    white_row=0;
    white_col=0;
    time=0;
    all_button=new Array(16);
    image_id=new Array(16);
    fact=new Array(16);
    now_puzzle=new Array(4);
    total_isvis=new Array(11);
    fact[0]=1;
    var k=0;
    var button_str="button",image_str="url(image/";
    for(var i=0;i<4;++i){
        now_puzzle[i]=new Array(4);
        for(var j=0;j<4;++j){
            now_puzzle[i][j]=i*4+j;
            var nowid=i*4+j;
            var nowid_str=nowid.toString();
            if(k>=1)fact[k]=k*fact[k-1];
            var nowbut=document.getElementById(button_str+nowid_str);
            nowbut.onclick=function(){
                var pos=this.id.toString().indexOf('n')+1,len=this.id.toString().length;
                var nowid=parseInt(this.id.toString().substring(pos,len));
                player_move(nowid);
                is_win=judge();
                reset();
            }
            image_id[k]=image_str+nowid_str+".png)"
            all_button[k]=nowbut;
            all_button[k].style.backgroundImage=image_id[k];
            k+=1;
        }
    }
    target_node=new newNode(target);
}

//改变当前Node的矩阵
function changeImage(obj,brow,bcol,nrow,ncol){
    var temp=obj.now_pos[obj.now_pic[brow][bcol]];
    obj.now_pos[obj.now_pic[brow][bcol]]=obj.now_pos[obj.now_pic[nrow][ncol]];
    obj.now_pos[obj.now_pic[nrow][ncol]]=temp;
    temp=obj.now_pic[brow][bcol];
    obj.now_pic[brow][bcol]=obj.now_pic[nrow][ncol];
    obj.now_pic[nrow][ncol]=temp;
    obj.now_row=nrow;
    obj.now_col=ncol;
}

//left>right
function cmpH(left,right){
    if(left.total_dis==right.total_dis)return left.end_dis>right.end_dis;
    return left.total_dis>right.total_dis;
}

//康托展开
function cantor(obj){
    var pic=new Array(16);
    for(var i=0;i<4;++i){
        for(var j=0;j<4;++j){
            pic[i*4+j]=obj.now_pic[i][j];
        }
    }
    var count=0,res=0;
    for(var i=0;i<16;++i){
        count=0;
        for(var k=i+1;k<16;++k){
            if(pic[i]>pic[k])count+=1;
        }
        res+=fact[i]*count;
    }
    return res;
}

//得到当前Node与目标Node的距离
function getDis(now_node){
    var ans=0;
    for(var i=0;i<16;++i){
        var tarrow=Math.floor(target_node.now_pos[i]/4),nowrow=Math.floor(now_node.now_pos[i]/4);
        var tarcol=target_node.now_pos[i]%4,nowcol=now_node.now_pos[i]%4;
        ans+=Math.abs(tarrow-nowrow)+Math.abs(tarcol-nowcol);
    }
    return ans;
}

//将矩阵转化为屏幕上的拼图
function AI_move(now){
    if(now.pre==null)return now;
    now.pre.next=now;
    return AI_move(now.pre);
}

//一步一步还原拼图
function steps_by_steps(now){
    if(now==null){
        var helpbut=document.getElementById("help");
        helpbut.value="Help";
        helpbut.style.fontWeight="normal";
        helpbut.style.fontSize="30px";
        is_help_start=0;
        return;
    }
    if(is_win)return;
    if(is_help_start==0)return;
    for(var i=0;i<4;++i){
        for(var j=0;j<4;++j){
            now_puzzle[i][j]=now.now_pic[i][j];
            all_button[i*4+j].style.backgroundImage=image_id[now_puzzle[i][j]];
            if(now.now_pic[i][j]==0){
                white_row=i;
                white_col=j;
            }
        }
    }
    if(cantor(now)==0){
        is_win=true;
        reset();
        return;
    }
    else{
        var next=now.next;
        if(is_help_start==1){
            setTimeout(function(){steps_by_steps(next)},500);
        }
    }
}

//用于还原拼图的A*算法
function A_star(begin_node,level){
    var search_queue=[];
    var nowhash=0;
    var isvis={};
    if(level==1){
        nowhash=cantor(begin_node);
        begin_node.end_dis=getDis(begin_node);
        begin_node.total_dis=begin_node.begin_dis+begin_node.end_dis;
        isvis[nowhash]=1;
    }
    search_queue.push(begin_node);
    while(search_queue.length>0){
        var father=search_queue.shift();
        var nextrow=father.now_row,nextcol=father.now_col;
        for(var i=0;i<4;++i){
            nextrow=father.now_row+steps[i][0];
            nextcol=father.now_col+steps[i][1];
            if (nextrow < 0 || nextrow >= 4 || nextcol < 0 || nextcol >= 4)continue;
            var newson=new copyNode(father);
            changeImage(newson,father.now_row,father.now_col,nextrow,nextcol);
            newson.pre=father;
            nowhash=cantor(newson);
            newson.begin_dis+=1;
            newson.end_dis=getDis(newson);
            newson.total_dis=newson.begin_dis+newson.end_dis;
            if(nowhash==0||newson.begin_dis>=128){
                newson.next=null;
                var beg_node=AI_move(newson);
                steps_by_steps(beg_node);
                for(var i=0;i<11;++i)total_isvis[i]={};
                return;
            }
            if(newson.begin_dis>=16*level){
                total_isvis[level]=isvis;
                A_star(father,level+1);
                return;
                //AI_move(father);
            }
            var flag=0;
            for(var k=1;k<level;++k){
                if(total_isvis[k][nowhash]==1){
                    flag=1;
                    break;
                }
            }
            if(flag==1||isvis[nowhash]==1)continue;
            isvis[nowhash]=1;
            var j=0;
            for(;j<search_queue.length;++j){
                if(!cmpH(newson,search_queue[j]))break;
            }
            search_queue.splice(j,0,newson);
        }
    }
    if(search_queue.length==0)alert("Wrong!");
    return null;
}

//随机得到下一个id
function to_next_id(nowid){
    var possible_step=new Array(4);
    var length=0;
    if(nowid%4!=0){
        possible_step[length]=nowid-1;
        length++;
    }
    if(nowid>3){
        possible_step[length]=nowid-4;
        length++;
    }
    if(nowid%4!=3){
        possible_step[length]=nowid+1;
        length++;
    }
    if(nowid<12){
        possible_step[length]=nowid+4;
        length++;
    }
    var pos=Math.round(length*Math.random());
    if(pos==length)pos-=1;
    return possible_step[pos];
}

//用于移动拼图
function changePuzzle(nowid,nextid){
    all_button[nowid].style.backgroundImage=image_id[now_puzzle[Math.floor(nextid/4)][nextid%4]];
    all_button[nextid].style.backgroundImage=image_id[now_puzzle[Math.floor(nowid/4)][nowid%4]];
    var temp=now_puzzle[Math.floor(nowid/4)][nowid%4];
    now_puzzle[Math.floor(nowid/4)][nowid%4]=now_puzzle[Math.floor(nextid/4)][nextid%4];
    now_puzzle[Math.floor(nextid/4)][nextid%4]=temp;
}

//用于游戏一开始将拼图打乱
function autoMove(){
    var nowid=0,nextid=0;
    var totalsteps=Math.round(200*Math.random());
    for(var i=0;i<totalsteps;++i){
        nextid=to_next_id(nowid);
        changePuzzle(nowid,nextid);
        nowid=nextid;
    }
    white_row=Math.floor(nowid/4);
    white_col=nowid%4;
}

//用于判断是否成功复原了拼图
function judge(){
    for(var i=0;i<4;++i){
        for(var j=0;j<4;++j){
            if(now_puzzle[i][j]!=i*4+j)return false;
        }
    }
    return true;
}

//玩家的move
function player_move(nowid){
    var nextid=nowid;
    if(is_start==1){
        var row=Math.floor(nowid/4),col=nowid%4;
        if(row-1==white_row&&col==white_col){
            nextid-=4;
            changePuzzle(nowid,nextid);
            white_row=row;
        }
        else if(row+1==white_row&&col==white_col){
            nextid+=4;
            changePuzzle(nowid,nextid);
            white_row=row;
        }
        else if(col-1==white_col&&row==white_row){
            nextid-=1;
            changePuzzle(nowid,nextid);
            white_col=col;
        }
        else if(col+1==white_col&&row==white_row){
            nextid+=1;
            changePuzzle(nowid,nextid);
            white_col=col;
        }
    }
}

//重置函数
function reset(){
    if(is_win&&is_start==1){
        is_start=0;
        is_help_start=0;
        is_win=false;
        white_row=0;
        white_col=0;
        time=0;
        var helpbut=document.getElementById("help");
        helpbut.value="Help";
        helpbut.style.fontWeight="normal";
        helpbut.style.fontSize="30px";
        for(var i=0;i<4;++i){
            for(var j=0;j<4;++j){
                now_puzzle[i][j]=i*4+j;
                all_button[i*4+j].style.backgroundImage=image_id[now_puzzle[i][j]];
            }
        }
        alert("You Win!");
    }
}

//计时函数
function counttime(){
    if(is_win==false&&is_start==1){
        time++;
        var newtime=document.getElementById("time");
        newtime.value=time;
        setTimeout("counttime()",1000);
    }
}

window.onload=function(){
    init();
    var startbut=document.getElementById("start");
    startbut.onclick=function(){
        if(is_start==0){
            autoMove();
            is_start=1;
            counttime();
        }
    }
    var helpbut=document.getElementById("help");
    helpbut.onclick=function(){
        if(is_help_start==0){
            is_help_start=1;
            helpbut.value="||";
            helpbut.style.fontWeight="bold";
            helpbut.style.fontSize="41px";
        }
        else{
            is_help_start=0;
            helpbut.value="Help";
            helpbut.style.fontWeight="normal";
            helpbut.style.fontSize="30px";
        }
        if(is_start==1&&is_win==false){
            var begin_node=new newNode(now_puzzle);
            A_star(begin_node,1);
        }
    }
}