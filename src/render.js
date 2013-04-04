
function fadeIn() {
    clearInterval(fadeTimer);
    fadeFactor = 0;
    fadeTimer = setInterval(function () {
        fadeFactor += 0.5 * 0.2; // amount * easing
        if (fadeFactor > 1) {
            clearInterval(fadeTimer);
            fadeFactor = 1;
            // unset 'already present' marker
            for (var i = 0, il = data.length; i < il; i++) {
                data[i][IS_NEW] = 0;
            }
        }
        render();
    }, 33);
}

function renderAll() {
    render();
}

function render() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = 'rgba(0,0,0)';
    context.fillRect(0, 0, width, height);

    // data needed for rendering
    if (!meta || !data ||
        // show on high zoom levels only and avoid rendering during zoom
        zoom < minZoom || isZooming) {
        return;
    }

    var i, il, j, jl,
        item,
        f, h, m, n,
        x, y,
        offX = originX - meta.x,
        offY = originY - meta.y,
        footprint, roof,
        isVisible,
        ax, ay, a, _a,
        p, g
    ;

    for (i = 0, il = data.length; i < il; i++) {
        item = data[i];

        isVisible = false;
        f = item[FOOTPRINT];
        footprint = []; // typed array would be created each pass and is way too slow
        for (j = 0, jl = f.length - 1; j < jl; j += 2) {
            footprint[j]     = x = (f[j]     - offX);
            footprint[j + 1] = y = (f[j + 1] - offY);

            // checking footprint is sufficient for visibility
            if (!isVisible) {
                isVisible = (x > 0 && x < width && y > 0 && y < height);
            }
        }

        if (!isVisible) {
            continue;
        }

        // when fading in, use a dynamic height
        h = item[IS_NEW] ? item[HEIGHT] * fadeFactor : item[HEIGHT];
        // precalculating projection height scale
        m = camZ / (camZ - h);

        // prepare same calculations for min_height if applicable
        if (item[MIN_HEIGHT]) {
            h = item[IS_NEW] ? item[MIN_HEIGHT] * fadeFactor : item[MIN_HEIGHT];
            n = camZ / (camZ - h);
        }

        roof = []; // typed array would be created each pass and is way too slow

        for (j = 0, jl = footprint.length - 3; j < jl; j += 2) {
            ax = footprint[j];
            ay = footprint[j + 1];

            // project 3d to 2d on extruded footprint
            _a = project(ax, ay, m);

            p = project(ax, ay, camZ / (camZ - 40));
            g = context.createLinearGradient(ax, ay, p.x, p.y);
            g.addColorStop(0,   'rgba(64,64,64,0.7)');
            g.addColorStop(0.4, 'rgba(50,70,50,0.8)');
            g.addColorStop(0.6, 'rgba(50,120,100,0.9)');
            g.addColorStop(0.8, 'rgb(170,50,150)');
            g.addColorStop(1,   'rgb(255,0,0)');
            context.strokeStyle = g;

            if (item[MIN_HEIGHT]) {
                a = project(ax, ay, n);
                ax = a.x;
                ay = a.y;
            }

            context.beginPath();

            context.moveTo(ax, ay);
            context.lineTo(_a.x, _a.y);
            context.stroke();

            roof[j]     = _a.x;
            roof[j + 1] = _a.y;
        }

        var v = item[HEIGHT] / 40;
        if (v < 0.2) {
            roofColorAlpha = 'rgba(64,64,64,0.7)';
        } else if (v < 0.4) {
            roofColorAlpha = 'rgba(50,70,50,0.8)';
        } else if (v < 0.6) {
            roofColorAlpha = 'rgba(50,120,100,0.9)';
        } else if (v < 0.8) {
            roofColorAlpha = 'rgb(170,50,150)';
        } else {
            roofColorAlpha = 'rgb(255,0,0)';
        }

        context.strokeStyle = roofColorAlpha;
        drawShape(roof);
    }
}

function drawShape(points) {
    if (!points.length) {
        return;
    }

    context.beginPath();
    context.moveTo(points[0], points[1]);
    for (var i = 2, il = points.length; i < il; i += 2) {
        context.lineTo(points[i], points[i + 1]);
    }
    context.closePath();
    context.stroke();
}

function project(x, y, m) {
    return {
        x: ((x - camX) * m + camX << 0),
        y: ((y - camY) * m + camY << 0)
    };
}

function debugMarker(x, y, color, size) {
    context.fillStyle = color || '#ffcc00';
    context.beginPath();
    context.arc(x, y, size || 3, 0, PI * 2, true);
    context.closePath();
    context.fill();
}

function debugLine(ax, ay, bx, by, color, size) {
    context.strokeStyle = color || '#ff0000';
    context.beginPath();
    context.moveTo(ax, ay);
    context.lineTo(bx, by);
    context.closePath();
    context.stroke();
}
