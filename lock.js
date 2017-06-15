/**
 * Created by Luffy on 2017/3/29.
 */
(function () {
    var Util=(function(){
        //系统前缀，因为localStorage是共享数据的,避免其他程序的同名localStorage干扰
        var prefix="zhoudy_lock_";
        //获取localStorage的方法
        var StorageGetter=function(key){
            return window.localStorage.getItem(prefix+key);
        }
        var StorageSetter=function(key,val){
            return window.localStorage.setItem(prefix+key,val);
        }
        var StorageRemove=function (key) {
            return window.localStorage.removeItem(prefix+key);
        }
        return {
            StorageGetter:StorageGetter,
            StorageSetter:StorageSetter,
            StorageRemove:StorageRemove
        }
    })();
    //定义一个自定义弹窗提示信息
    var hallToast={
        error:function (text){
            var type="error";
            var toastDiv = document.createElement("div");
            toastDiv.setAttribute("class","toast-"+type);
            toastDiv.style.zIndex=1111;
            var textSpan=document.createElement("span");
            textSpan.setAttribute("id","textSpan");
            textSpan.style.padding="10px 20px";
            textSpan.innerHTML=text;
            var parentDiv=document.createElement("div");
            parentDiv.setAttribute("id","hallToast");
            parentDiv.style.position="fixed";
            parentDiv.style.top="50%";
            parentDiv.style.width="100%";
            parentDiv.style.height="auto";
            parentDiv.style.textAlign="center";
            document.body.appendChild(parentDiv);
            parentDiv.appendChild(toastDiv);
            parentDiv.setAttribute("class","flip-bottom");
            toastDiv.appendChild(textSpan);
            toastDiv.style.width=textSpan.getBoundingClientRect().width+"px";
            setTimeout(function(){
                document.body.removeChild(parentDiv);
            },2000);
        },
        success:function (text){
            var type="success";
            var toastDiv = document.createElement("div");
            toastDiv.setAttribute("class","toast-"+type);
            toastDiv.style.zIndex=1111;
            var textSpan=document.createElement("span");
            textSpan.setAttribute("id","textSpan");
            textSpan.style.padding="10px 20px";
            textSpan.innerHTML=text;
            var parentDiv=document.createElement("div");
            parentDiv.setAttribute("id","hallToast");
            parentDiv.style.position="fixed";
            parentDiv.style.top="50%";
            parentDiv.style.width="100%";
            parentDiv.style.height="auto";
            parentDiv.style.textAlign="center";
            document.body.appendChild(parentDiv);
            parentDiv.appendChild(toastDiv);
            parentDiv.setAttribute("class","flip-bottom");
            toastDiv.appendChild(textSpan);
            toastDiv.style.width=textSpan.getBoundingClientRect().width+"px";
            setTimeout(function(){
                document.body.removeChild(parentDiv);
            },2000);
        }
    };
    /*解锁部分算法*/
    var lockNumber = 3;
    var gestureLock=function(obj){
        //计算两点之间的距离
        var getDistance=function(a, b) {
            return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        };
        //获取用户手势路径上的点
        var pickPoints=function(fromPoint, toPoint) {
            var lineLength = this.getDistance(fromPoint, toPoint);
            var dir = toPoint.index > fromPoint.index ? 1 : -1;//判断手势方向
            var i = dir === 1 ? 0 : (this.restPoint.length - 1);
            var limit = dir === 1 ? this.restPoint.length : -1;
            while (i !== limit) {
                var restPoint = this.restPoint[i];
                if (this.getDistance(restPoint, fromPoint) + this.getDistance(restPoint, toPoint) === lineLength) {
                    this.drawPoint(restPoint.x, restPoint.y);
                    this.selectPoint.push(restPoint);
                    this.restPoint.splice(i, 1);
                    if (limit > 0) {
                        i--;
                        limit--;
                    }
                }
                i+=dir;
            }
        }
        //画圆圈
        var drawCirle = function(x, y) {
            this.ctx.strokeStyle = '#f2f2f2';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
            this.ctx.closePath();
            this.ctx.stroke();
        }
        //画点
        var drawPoint = function() {
            for (var i = 0 ; i < this.selectPoint.length ; i++) {
                this.ctx.fillStyle = '#f2f2f2';
                this.ctx.beginPath();
                this.ctx.arc(this.selectPoint[i].x, this.selectPoint[i].y, this.r / 2, 0, Math.PI * 2, true);
                this.ctx.closePath();
                this.ctx.fill();
            }
        }
        //绘制解锁状态
        var drawStatus = function(type) { // 初始化状态线条
            for (var i = 0; i < this.selectPoint.length; i++) {
                this.ctx.strokeStyle = type;
                this.ctx.beginPath();
                this.ctx.arc(this.selectPoint[i].x, this.selectPoint[i].y, this.r, 0, Math.PI * 2, true);
                this.ctx.closePath();
                this.ctx.stroke();
                this.ctx.fillStyle = type;
                this.ctx.beginPath();
                this.ctx.arc(this.selectPoint[i].x, this.selectPoint[i].y, this.r / 2, 0, Math.PI * 2, true);
                this.ctx.closePath();
                this.ctx.fill();
            }
            this.ctx.beginPath();
            this.ctx.strokeStyle = type;
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(this.selectPoint[0].x, this.selectPoint[0].y);
            for (var i = 1 ; i < this.selectPoint.length ; i++) {
                this.ctx.lineTo(this.selectPoint[i].x, this.selectPoint[i].y);
            }
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //画线
        var drawLine = function(position, selectPoint) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 3;
            this.ctx.moveTo(this.selectPoint[0].x, this.selectPoint[0].y);
            for (var i = 1 ; i < this.selectPoint.length ; i++) {
                this.ctx.lineTo(this.selectPoint[i].x, this.selectPoint[i].y);
            }
            this.ctx.lineTo(position.x, position.y);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        //初始化面板上的圆圈
        var createCircle = function() {
            var n = lockNumber;
            var count = 0;
            this.r = this.ctx.canvas.width / (4 * n);// 公式计算
            this.selectPoint = [];
            this.arr = [];
            this.restPoint = [];
            var r = this.r;
            for (var i = 0 ; i < n ; i++) {
                for (var j = 0 ; j < n ; j++) {
                    count++;
                    var obj = {
                        x: j * 4 * r + 2 * r,
                        y: i * 4 * r + 2 * r,
                        index: count
                    };
                    this.arr.push(obj);
                    this.restPoint.push(obj);
                }
            }
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            for (var i = 0 ; i < this.arr.length ; i++) {
                this.drawCirle(this.arr[i].x, this.arr[i].y);
            }
        }
        //获取用户实际的触点
        var getPosition = function(e) {
            var rect = e.currentTarget.getBoundingClientRect();
            var position = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
            return position;
        }
        //核心算法，更新路径信息
        var update = function(position) {
            this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
            for (var i = 0 ; i < this.arr.length ; i++) { // 每帧先把面板画出来
                this.drawCirle(this.arr[i].x, this.arr[i].y);
            }
            this.drawPoint(this.selectPoint);//绘制圆心
            this.drawLine(position , this.selectPoint);// 绘制轨迹
            for (var i = 0 ; i < this.restPoint.length ; i++) {
                var restPoint = this.restPoint[i];
                if (Math.abs(position.x - restPoint.x) < this.r && Math.abs(position.y - restPoint.y) < this.r) {
                    this.drawPoint(restPoint.x, restPoint.y);
                    this.pickPoints(this.selectPoint[this.selectPoint.length - 1], restPoint);
                    break;
                }
            }
        }
        //检测两次密码是否一致
        var checkPassword = function(psw1, psw2) {// 检测密码
            var p1 = '',
                p2 = '';
            for (var i = 0 ; i < psw1.length ; i++) {
                p1 += psw1[i].index + psw1[i].index;
            }
            for (var i = 0 ; i < psw2.length ; i++) {
                p2 += psw2[i].index + psw2[i].index;
            }
            return p1 === p2;
        }
        //检测密码的状态
        var testPassword = function(psw) {// touchend结束之后对密码和状态的处理
            if (this.passwordObj.status == 1) {
                if (this.checkPassword(this.passwordObj.getPassword, psw)) {
                    this.passwordObj.status = 2;
                    document.getElementById('title').innerHTML = '请解锁';
                    this.passwordObj.setPassword = psw;
                    hallToast.success("密码保存成功");
                    this.drawStatus('#2CFF26');
                    Util.StorageSetter('password', JSON.stringify(this.passwordObj.setPassword));
                    this.radioState();
                } else {
                    hallToast.error("两次不一致，请重新输入");
                    this.drawStatus('red');
                    delete this.passwordObj.status;
                    this.radioState();
                }
            } else if (this.passwordObj.status == 2) {
                document.getElementById('title').innerHTML = '请解锁';
                if (this.checkPassword(this.passwordObj.setPassword, psw)) {
                    hallToast.success("解锁成功");
                    this.drawStatus('#2CFF26');
                    this.radioState();
                } else {
                    this.drawStatus('red');
                    hallToast.error("解锁失败,与设定密码不一致");
                    this.radioState();
                }
            } else {
                if(this.selectPoint.length<=4){
                    this.drawStatus('red');
                    hallToast.error("密码过短，请重新输入");
                    this.radioState();
                }else{
                    this.passwordObj.status = 1;
                    this.passwordObj.getPassword = psw;
                    document.getElementById('title').innerHTML = '再次输入';
                }
            }
        }
        //判断单选按钮组的状态
        var selectRadios=document.getElementsByName('lock');
        var radioState = function () {
            if(Util.StorageGetter('password')!=null){
                selectRadios[1].checked=true;
                document.getElementById('title').innerHTML="输入解锁图案";
            }else{
                selectRadios[0].checked=true;
                document.getElementById('title').innerHTML="绘制解锁图案";
            }
        }
        //初始化
        var init = function() {
            this.passwordObj = Util.StorageGetter('password') ? {
                status: 2,
                setPassword: JSON.parse(Util.StorageGetter('password'))
            } : {};
            this.radioState();
            this.selectPoint = [];
            this.restPoint=[];
            this.touchFlag = false;
            this.canvas = document.getElementById('canvas');
            this.ctx = this.canvas.getContext('2d');
            this.createCircle();
            this.bindEvent();
        }
        var reset = function() {
            this.createCircle();
        }
        //绑定事件
       gestureLock.prototype.bindEvent = function() {
            var self=this;//获取到对象的this指针
            this.canvas.addEventListener("touchstart", function (e) {
                e.preventDefault();// 某些android 的 touchmove不宜触发 所以增加此行代码
                var po = self.getPosition(e);
                for (var i = 0 ; i < self.arr.length ; i++) {
                    if (Math.abs(po.x - self.arr[i].x) < self.r && Math.abs(po.y - self.arr[i].y) < self.r) {
                        self.touchFlag = true;
                        self.drawPoint(self.arr[i].x,self.arr[i].y);
                        self.selectPoint.push(self.arr[i]);
                        self.restPoint.splice(i,1);
                        break;
                    }
                }
            }, false);
            this.canvas.addEventListener("touchmove", function (e) {
                if (self.touchFlag) {
                    self.update(self.getPosition(e));
                }
            }, false);
            this.canvas.addEventListener("touchend", function (e) {
                if (self.touchFlag) {
                    self.touchFlag = false;
                    self.testPassword(self.selectPoint);
                    setTimeout(function(){
                        self.reset();
                    }, 300);
                }
            }, false);
            document.addEventListener('touchmove', function(e){
                e.preventDefault();
            },false);
            document.getElementById('set_password').addEventListener('click',function (){
                Util.StorageRemove('password');
                hallToast.success("密码已清空");
                document.getElementById('title').innerHTML="绘制解锁图案";
                delete self.passwordObj.status;
                //重置面板
                var newLock=new gestureLock({});
                newLock.init();
            });
            document.getElementById('test_password').addEventListener('click',function () {
                if(Util.StorageGetter("password")==null){
                    hallToast.error("您未设置过手势密码");
                    self.radioState();
                }
            })
        }
        //对外接口
        this.height = obj.height;
        this.width = obj.width;
        this.drawCirle = drawCirle;
        this.drawPoint = drawPoint;
        this.drawLine = drawLine;
        this.drawStatus = drawStatus;
        this.checkPassword = checkPassword;
        this.testPassword = testPassword;
        this.getDistance = getDistance;
        this.getPosition = getPosition;
        this.createCircle = createCircle;
        this.radioState = radioState;
        this.reset=reset;
        this.update=update;
        this.init=init;
        this.pickPoints=pickPoints;
    };
    //对外提供访问的接口
    this.gestureLock=gestureLock;
    this.hallToast=hallToast;
})();