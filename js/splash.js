var values = {
    friction: 1.6,
    timeStep: 0.01,
    amount: 15,
    mass: 8,
    count: 0
};
values.invMass = 1 / values.mass;

var path, springs;
var size = view.size * [1, 1];

var Spring = function(a, b, strength, restLength) {
    this.a = a;
    this.b = b;
    this.restLength = restLength || 80;
    this.strength = strength ? strength : 0.55;
    this.mamb = values.invMass * values.invMass;
};

Spring.prototype.update = function() {
    var delta = this.b - this.a;
    var dist = delta.length;
    var normDistStrength = (dist - this.restLength) /
        (dist * this.mamb) * this.strength;
    delta.y *= normDistStrength * values.invMass * 0.2;
    if (!this.a.fixed)
        this.a.y += delta.y;
    if (!this.b.fixed)
        this.b.y -= delta.y;
};

function createPath(strength) {
    var path = new Path({
        fillColor: '#00a5e5'
    });
    springs = [];
    for (var i = 0; i <= values.amount; i++) {
        var segment = path.add(new Point(i / values.amount, 0.5) * size);
        var point = segment.point;
        if (i == 0 || i == values.amount)
            point.y += size.height;
        point.px = point.x;
        point.py = point.y;
        // The first two and last two points are fixed:
        point.fixed = i < 2 || i > values.amount - 2;
        if (i > 0) {
            var spring = new Spring(segment.previous.point, point, strength);
            springs.push(spring);
        }
    }
    path.position.x -= size.width / 4;
    return path;
}

function onResize() {
    if (path)
        path.remove();
    size = view.bounds.size * [2, 1];
    path = createPath(0.1);
    splash(size.height / 15);
}

function splash(amt) {
    for (var i = 0, l = path.segments.length; i < l; i++) {
        var point = path.segments[i].point;

        if (!point.fixed) {
        	// oldRange should be 2-13 or 6-8
        	// 0 1 || 2 3 4 5 6	(7)	8 9 10 11 12 || 13 14
            // console.log("i: " + i + " dy: " + Math.sin(map(i, 5, 9)));
            point.y -= Math.sin(map(i, 5, 9)) * amt;
        }
    }
}

function map(oldValue, oldMin, oldMax, newMin, newMax) {
    // PI is default newRange
    if (!newMin || !newMax) {
        var newMin = 0;
        var newMax = Math.PI;
    }

    oldRange = (oldMax - oldMin);
    if (oldRange == 0)
        newValue = newMin;
    else {
        newRange = (newMax - newMin);
        newValue = (((oldValue - oldMin) * newRange) / oldRange) + newMin;
    }
    return newValue;
}

function onMouseMove(event) {
    var location = path.getNearestLocation(event.point);
    var segment = location.segment;
    var point = segment.point;

    if (!point.fixed && location.distance < size.height / 4) {
        var y = event.point.y;
        point.y += (y - point.y) / 6;
        if (segment.previous && !segment.previous.fixed) {
            var previous = segment.previous.point;
            previous.y += (y - previous.y) / 24;
        }
        if (segment.next && !segment.next.fixed) {
            var next = segment.next.point;
            next.y += (y - next.y) / 24;
        }
    }
}

function onFrame(event) {
    updateWave(path);
}

function updateWave(path) {
    var force = 1 - values.friction * values.timeStep * values.timeStep;
    for (var i = 0, l = path.segments.length; i < l; i++) {
        var point = path.segments[i].point;
        var dy = (point.y - point.py) * force;
        point.py = point.y;
        point.y = Math.max(point.y + dy, 0);
    }

    for (var j = 0, l = springs.length; j < l; j++) {
        springs[j].update();
    }
    path.smooth();
}

function onKeyDown(event) {
    if (event.key == 'space') {
        path.fullySelected = !path.fullySelected;
        path.fillColor = path.fullySelected ? null : '#00a5e5';
    }
}
