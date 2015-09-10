var Mi = Mi || {};

Mi.pieChart = function(canvasID, config) {
    
    this.canvas = null;
    
    this.ctx = null;
    
    /* Determines size of pie chart */
    
    this.radius = null;
    
    /* Data for chart */
    
    this.data = null;
    
    this.analysedData = {};
    
    this.shapes = [];
    
    this.centerX = null;
    
    this.centerY = null;
    
    this.maxRadius = this.radius + 25;
    
    this.list = [];
    
    this.colors = ['#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99',
                   '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a',
                   '#ffff99', '#b15928'];
    
    this.showPercents = true;
    
    this.showList = true;

    
    if (typeof canvasID === 'string' && canvasID.length)
    {
        var exists = document.getElementById(canvasID);
        if (exists === null)
        {
            this.canvas = document.createElement('canvas');
            this.canvas.id = canvasID;
            document.body.appendChild(this.canvas);
        }
        else
        {
            this.canvas = document.getElementById(canvasID);
        }
    }
    else
    {
        throw new Error('ID should be string with at least 1 symbol.');
    }
    
    this.ctx = this.canvas.getContext('2d');
    
    if (typeof config === 'object') {
        this.parseConfig(config);
    }
    
    this.analyseData();
    this.setArc();
    this.onMouseMove();
    this.drawList();
    return this;
};

Mi.pieChart.prototype = {
    
    parseConfig: function(options) {
        
        this.radius = options.size;
        this.canvas.width = options.size * 2  + 300 || options.width;
        this.canvas.height = options.size * 2 + 100 || options.height;
        this.data = options.data;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        
        this.showPercents = options.showPercents || true;
        this.showList = options.showList || true;
    },
    
    analyseData: function() {
        var sum = 0;
        var sortable = [];
        for(var i in this.data) {
            sum += this.data[i];
            sortable.push([i, this.data[i]]);
        }
        sortable.sort(function(a, b) {return b[1] - a[1]});
        
        
        
        this.analysedData = {
            sum: sum,
            sortable: sortable
        };
    },
    
    setArc: function() {
        var sorted = this.analysedData.sortable;
        var sum = this.analysedData.sum;
        
        var startPoint = 270;
        var endPoint = 0;
        
        for (var i = 0; i < sorted.length; i++) {
            endPoint = (sorted[i][1] * 360) / sum;
            var randColor = this.colors[i];
            var name = sorted[i][0];
            
            this.shapes.push({
                centerX: this.centerX,
                centerY: this.centerY,
                radius: this.radius,
                startPoint: this.toRadians(startPoint),
                endPoint: this.toRadians(startPoint) + this.toRadians(endPoint),
                fill: randColor,
                name: name,
                percent: Math.round(sorted[i][1] * 100 / sum),
                mouseover: false
            });
            
            this.list.push({
                name: name,
                color: randColor
            })

            startPoint += endPoint;
            
        }
        
        this.drawAll();
        console.log(this.shapes);
        
    },
    
    drawArc: function(shape, coords) {
        var r = shape.radius;
        var stroke = false;
        
        if (shape.mouseover) {
            r += 25;
        }
        
        var arc = new Path2D();
        this.ctx.lineWidth = 4;
        arc.moveTo(shape.centerX, shape.centerY);
        arc.arc(shape.centerX, shape.centerY, r,
                shape.startPoint, shape.endPoint, false);
        arc.lineTo(shape.centerX, shape.centerY);
        this.ctx.fillStyle = shape.fill;
        this.ctx.fill(arc);
        
        if (stroke) {
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 3;
            this.ctx.stroke(arc);
        }
        shape.path = arc;
        
        if (this.showPercents) {
            this.percent(shape, shape.centerX, shape.centerY, (shape.startPoint + shape.endPoint) / 2);
        }
    },
    
    percent: function(shape, x, y, z) {
        if (shape.percent > 5) {
            this.ctx.font = "18px Arial";
            this.ctx.fillStyle = '#000000';
            this.ctx.textAlign = "center"; 
            this.ctx.fillText(shape.percent + '%', x + Math.cos(z) * this.radius / 1.7, y + Math.sin(z) * this.radius / 1.7);
        }
    },
    
    roundRect: function(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.ctx.beginPath();
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        this.ctx.moveTo(x+r, y);
        this.ctx.arcTo(x+w, y,   x+w, y+h, r);
        this.ctx.arcTo(x+w, y+h, x,   y+h, r);
        this.ctx.arcTo(x,   y+h, x,   y,   r);
        this.ctx.arcTo(x,   y,   x+w, y,   r);
        this.ctx.closePath();
        this.ctx.fill();
        
        y += 50;
        x += w / 3;
        
        var path = new Path2D();
        path.moveTo(x + 25,y + 15);
        path.lineTo(x , y);
        path.lineTo(x + 45,y);
        this.ctx.fill(path);
    
    },
    
    toRadians: function(deg) {
        return deg * Math.PI / 180;
    },
    
    randomColor: function() {
        var r = (Math.round(Math.random()* 127) + 127).toString(16);
        var g = (Math.round(Math.random()* 127) + 127).toString(16);
        var b = (Math.round(Math.random()* 127) + 127).toString(16);
        return '#' + r + g + b;
    },
    
    onMouseMove: function() {
        var _this = this;
        
        this.canvas.addEventListener('mousemove', function(e) {
            var coords = Mi.getMouseCoords(e, _this.canvas);
            var canvasX = coords.x;
            var canvasY = coords.y;
            
            for (var i = 0; i < _this.shapes.length; i++)
            {
                var shape = _this.shapes[i];
                if (_this.isInPath(shape.path, canvasX, canvasY))
                {
                     if (!(shape.mouseover))
                    {
                        shape.mouseover = true;
                    }
                    
                    _this.clearAll();
                    _this.drawAll(true, coords, shape);

                }
                else if (!(_this.isInPath(shape.path, canvasX, canvasY)) && shape.mouseover)
                {
                    shape.mouseover = false;
                    _this.clearAll();
                    _this.drawAll(false, coords, shape);
                }
                
                
            }
            
            console.log(_this.shapes);
        }, false);
        
    },
    
    isInPath: function(path, canvasX, canvasY) {
        return this.ctx.isPointInPath(path, canvasX, canvasY);    
    },
    
    drawAll: function(inShape, coords, shape) {
        this.clearAll();
        
        for (var i = 0; i < this.shapes.length; i++) {
            this.drawArc(this.shapes[i], coords);
        }
        
        this.drawList();
        
        if (inShape && shape.mouseover) {
            this.drawBox(coords, shape);
        }
        
    },
    
    clearAll: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    
    drawList: function() {
        var y = this.radius / 2;
        this.ctx.globalAlpha = 1;
        for (var i = 0; i < this.list.length; i++) {
            this.ctx.fillStyle = this.list[i].color;
            this.ctx.fillRect(5, y, 25, 15);
            this.ctx.font = "22px Arial";
            this.ctx.fillStyle = '#000000';
            this.ctx.textAlign = "start"; 
            this.ctx.fillText(this.list[i].name, 35, y + 15);
            y += 35;
        }
    },
    
    drawBox: function(coords, shape) {
        this.roundRect(coords.x - 65, coords.y - 75, 130, 50, 10);
        this.ctx.font = "18px Arial";
        this.ctx.fillStyle = '#ffffff'
        this.ctx.textAlign = "left"; 
        this.ctx.fillText(shape.name, coords.x - 30, coords.y - 40); 
        
    },
    
    requestAnimationFrame: function() {
        return window.requestAnimationFrame ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame ||
               window.msRequestAnimationFrame ||
               window.oRequestAnimationFrame ||
               function(callback) {
                 return setTimeout(callback, 1);
               }
    }
};
                                     
Mi.getMouseCoords = function(e, canvas) {
    
    var rect = canvas.getBoundingClientRect();
    
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}