
//定义canvas, canvasUI 和canvasSprite 构造函数
var Canvas = function (cfg) {
  var dom,
      ctx,
      dimension = {},
      is_rendered = false,// 是否已经渲染
      origin = {};

  cfg = cfg || {};

  this.addEventListener = function (e, fn) {
    dom.addEventListener(e, fn);
  };

  // 渲染
  this.renderTo = function renderTo(container_id) {

    if(!is_rendered) {
      var container = document.getElementById(container_id);

      //画布起始坐标
      origin.x = container.offsetLeft;
      origin.y = container.offsetTop;// 当前对象到其上级层顶部边的距离。

      dom = document.createElement('canvas'); // 创造canvas画布
      ctx = dom.getContext('2d');
      dom.setAttribute('width', container.clientWidth);
      dom.setAttribute('height', container.clientHeight);

      // 画布尺寸
      dimension = {
          x: container.clientWidth,
          y: container.clientHeight
      };

      container.insertBefore(dom, container.firstChild); // 插入cantainer容器
    }
  };

    // 
    this.drawImageSlice = function drawImage(img_ele, sx, sy, sWidth, sHeight, x, y, rotatation) {
      ctx.save();
      ctx.translate((2*x + sWidth)/2, (2*y + sHeight)/2);// 改变起始点坐标
      ctx.rotate((Math.PI / 180) * rotatation);// 旋转
      x = x || 0;
      y = y || 0;
      ctx.drawImage(img_ele, sx, sy, sWidth, sHeight, -sWidth/2, -sHeight/2, sWidth, sHeight);
      ctx.restore(); // 复原
    };

    this.drawText = function drawText(text, offset_left, offset_top, font) {
      ctx.font = font || '25px Calibri';
      ctx.fillStyle = 'red';
      ctx.fillText(text, offset_left, offset_top);
    };

    this.clear = function clear() {
      ctx.clearRect(0, 0, dimension.x, dimension.y);
    };
};

// UI的配置信息，坐标，尺寸
var CanvasUIObject = function (config) {
  this.x = config.x || 0;
  this.y = config.y || 0;
  this.width = config.width || 0;
  this.height = config.height || 0;
};

// UI的预警机制
CanvasUIObject.prototype.draw = function () {
  throw 'Function not implemented.';
};

// ？？？为什么写在这里
var DIRECTION = {
  UP: 0,
  DOWN: 180,
  LEFT: 270,
  RIGHT: 90,
  NONE: -1
};

var Point = function (x, y) {
    this.x = x;
    this.y = y;
};

// Sprite的配置信息
var CanvasSprite = function (config) {
  CanvasUIObject.apply(this, arguments);
  this.direction = config.direction || DIRECTION.UP;
  this.border_x = config.border_x || 0;
  this.border_y = config.border_y || 0;
  this.out_of_border_die  = config.out_of_border_die || 0; // 判断边界类型
  this.speed = config.speed || 0;
  this.alive = config.alive || 0;
};

// CanvasSprite.prototype = new CanvasUIObject({});
CanvasSprite.prototype.getFrontPoints = function() {
  var front_point;
  switch(this.direction) {
    case DIRECTION.UP:
      front_point = [
        new Point(this.x, this.y),
        new Point((2*this.x+this.width)/2, this.y),
        new Point(this.x+this.width, this.y),
      ];
      break;
    case DIRECTION.DOWN:
      front_point = [
          new Point(this.x, this.y+this.height),
          new Point((2*this.x+this.width)/2, this.y+this.height),
          new Point(this.x+this.width, this.y+this.height)
      ];
      break;
    case DIRECTION.LEFT:
      front_point = [
          new Point(this.x, this.y),
          new Point(this.x, (2*this.y+this.width)/2),
          new Point(this.x, this.y+this.width)
      ];
      break;
    case DIRECTION.RIGHT:
      front_point = [
          new Point(this.x+this.height, this.y),
          new Point(this.x+this.height, (2*this.y+this.width)/2),
          new Point(this.x+this.height, this.y+this.width),
      ];
      break;
  }
  return front_point;
};

CanvasSprite.prototype.getCornerPoints = function () {
  var corner_points;
  switch(this.direction) {
    case DIRECTION.UP:
      corner_points = [
        new Point(this.x, this.y),
        new Point(this.x+this.width, this.y),
        new Point(this.x+this.width, this.y+this.height),
        new Point(this.x, this.y+this.height),
      ];
      break;
    case DIRECTION.DOWN:
      corner_points = [
        new Point(this.x, this.y),
        new Point(this.x+this.width, this.y),
        new Point(this.x+this.width, this.y+this.height),
        new Point(this.x, this.y+this.height),
      ];
      break;
    case DIRECTION.LEFT:
      corner_points = [
        new Point(this.x, this.y),
        new Point(this.x+this.height, this.y),
        new Point(this.x+this.height, this.y+this.width),
        new Point(this.x, this.y+this.width),
      ];
      break;
    case DIRECTION.RIGHT:
      corner_points = [
        new Point(this.x, this.y),
        new Point(this.x+this.height, this.y),
        new Point(this.x+this.height, this.y+this.width),
        new Point(this.x, this.y+this.width),
      ];
      break;
  }
  return corner_points;
};

CanvasSprite.prototype.checkPointOverlap = function (point) {
    var corner_points = this.getCornerPoints();
    return ((point.x >= corner_points[0].x) && (point.x <= corner_points[1].x) && (point.y >= corner_points[0].y) && (point.y <=corner_points[3].y));
};

CanvasSprite.prototype.checkRangeOverlap = function (uiobjs) {

  for(var o in uiobjs) {
    var obstacle_cp = uiobjs[o].getCornerPoints();
    var fp = this.getFrontPoints();

    for(var idx=0; idx<fp.length; idx++) {
      if((fp[idx].x > obstacle_cp[0].x) && (fp[idx].x < obstacle_cp[1].x) && (fp[idx].y > obstacle_cp[0].y) && (fp[idx].y < obstacle_cp[2].y)) {
          return true;
      }
    }
  }
  return false;
};

CanvasSprite.prototype.move = function (d, obstacle_sprites) {
  this.direction = d;

  switch(d) {
  case DIRECTION.UP:
    if((obstacle_sprites && !this.checkRangeOverlap(obstacle_sprites))|| (!obstacle_sprites)) {
      this.y -= this.speed;

      if(this.y <= 5) {
          if(!this.out_of_border_die){
                this.y = 0;
          }
          else {
              // this.alive = 0;
              this.explode();
              document.getElementById("steelhit").play();
          }
      }
    }
    break;
  case DIRECTION.DOWN:
    if((obstacle_sprites && !this.checkRangeOverlap(obstacle_sprites)) || (!obstacle_sprites)) {
      this.y += this.speed;

      if(this.y + this.height >= (this.border_y-10)) {
        if(!this.out_of_border_die){
            this.y = this.border_y - this.height;
        }
        else {
            // this.alive = 0;
            this.explode();
            document.getElementById("steelhit").play();
          }
        }
      }
      break;
  case DIRECTION.LEFT:
    if((obstacle_sprites && !this.checkRangeOverlap(obstacle_sprites)) || (!obstacle_sprites)) {
      this.x -= this.speed;

      if(this.x <= 5) {
        if(!this.out_of_border_die){
          this.x = 0;
        }
        else {
          // this.alive = 0;
          this.explode();
          document.getElementById("steelhit").play();
        }
      }
    }
    break;
  case DIRECTION.RIGHT:
    if((obstacle_sprites && !this.checkRangeOverlap(obstacle_sprites)) || (!obstacle_sprites)) {
      this.x += this.speed;
      if(this.x + this.width >= this.border_x-10) {
        if(!this.out_of_border_die){
          this.x = this.border_x - this.width;
        }
        else {
          // this.alive = 0;
          this.explode();
          document.getElementById("steelhit").play();
        }
      }
    }
    break;
  }
};

// 生成一个唯一编码
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
};
