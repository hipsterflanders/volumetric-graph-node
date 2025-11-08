var svg = null;

var path = null;
var lijntje = null;
var linker_vlak = null;
var rechter_vlak = null;
var boven_vlak = null;

const gx = 250;
const gy = 490;

var hoekwaarde = null;
var hoektan = 0.5;

var tekenbordSVG;
var el;

window.addEventListener('load', (event) => {
    el = document.getElementById('items');
    var sortable = Sortable.create(el,{animation: 150});
    el.addEventListener("update", updateLayers);
    el.addEventListener("input", updateLayers);

    tekenbordSVG = document.getElementById("tekenbord");
    defUnitVectors(0);
    updateAngle(0);
    addLayer();
    updateLayers();

    hoekwaarde = document.getElementById("hoekwaarde");
    hoekwaarde.innerHTML = "0°";

    var slider = document.getElementById("hoekSlider");
    slider.oninput = function() {
        hoekwaarde.innerHTML = -this.value + "°";
        updateAngle(-this.value);
    }
});

var laagjes;
var reepjes;

function updateLayers(){
    laagjes = new Array();
    reepjes = new Array();
    blokjes = new Array();
    tekenbordSVG.innerHTML = null;
    var totalVolume = 0;
    var totalWidth = 0;
    var totalDepth = 0;
    for (let i = el.childElementCount-1; i > -1; i--) {
        let layername = el.children[i].children[0].value;
        let layerVolume = Number.parseInt(el.children[i].children[1].value);
        totalVolume += layerVolume;
        let kleurlaagje = hextoHue(el.children[i].children[2].value);
        laagjes[el.childElementCount-i] = {layername, volume: layerVolume, kleurlaagje};
    }

    var hlaag = 0;
    laagjes.forEach(laag => {
        let dikte = laag.volume/totalVolume*r;
        if(dikte >= r/10){
            hlaag = hlaag - dikte;
            tekenLaag(gx, (gy+hlaag),dikte,laag.kleurlaagje,laag.layername);
        }else{
            totalWidth += laag.volume;
            if(dikte >= r/100){
                reepjes.push(laag);
            } else {
                totalDepth += laag.volume;
                blokjes.push(laag);
            }           
        }        
    });

    let hoogtetop = totalWidth/totalVolume*r;
    hlaag = hlaag - hoogtetop;
    var origin = new Vector(gx,gy+hlaag).add(rx.min());
    reepjes.forEach(reepje =>{
        let breedte = reepje.volume/totalWidth*r;
        origin = origin.add(rux.multiply(breedte));
        tekenReepje(origin[0], origin[1],hoogtetop,breedte,reepje.kleurlaagje,reepje.layername);
    });

    let breedteblokje = totalDepth/totalWidth*r;
    origin = origin.add(rux.multiply(breedteblokje)).add(ruy.multiply(r));
    
    blokjes.forEach(blokje =>{
        let diepte = blokje.volume/totalDepth*r;
        origin = origin.add(ruy.multiply(diepte).min());
        tekenBlokje(origin[0], origin[1],hoogtetop,breedteblokje,diepte,blokje.kleurlaagje,blokje.layername);
    });

}

function addLayer(){
    let laagje = document.createElement('li');
    let tekstvakje = document.createElement('input');
    let jaarvakje = document.createElement('input');
    let kleurvakje = document.createElement('input');
    tekstvakje.setAttribute('type','text');
    tekstvakje.setAttribute('value','layer '+ el.childElementCount);
    jaarvakje.setAttribute('type','number');
    jaarvakje.setAttribute('value',20);
    kleurvakje.setAttribute('type','color');
    kleurvakje.setAttribute('value',hslToHex(el.childElementCount*20,100,50));
    laagje.appendChild(tekstvakje);
    laagje.appendChild(jaarvakje);
    laagje.appendChild(kleurvakje);
    el.appendChild(laagje);
    updateLayers();
}
function removeLayer(){
    el.removeChild(el.lastElementChild);
    updateLayers();
}

var t = 0;

function kleur(heu, saturiation, lightness){
    return "hsl(" + heu + ", " + saturiation + "%, " + lightness +"%)";
}

function hextoHue(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
    }

    h = Math.round(h*360);
    s = Math.round(s*100);
    l = Math.round(l*100);

    return h;
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function tekenVlak(vlak, kleur) {
    const vpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    vpath.setAttribute("fill", kleur);
    vpath.setAttribute("stroke", "grey");

    var d = `M${vlak[0][0]} ${vlak[0][1]}`;

    vlak.forEach(punt => {
        d += " L" + punt[0] + " " + punt[1];
    });

    vpath.setAttribute("d", d);
    return vpath;
}


function tekenLijn(punt1, punt2, kleur){
    const vpath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    vpath.setAttribute("fill", "none");
    vpath.setAttribute("stroke", kleur);

    var d = `M${punt1[0]} ${punt1[1]}`;
    d += " L" + punt2[0] + " " + punt2[1];

    vpath.setAttribute("d", d);
    return vpath;
}

var ux = null;
var uy = null;
var uz = null;

var vx = null;
var vy = null;
var vz = null;
var v0 = null;

const r = 200;

// define unit vectors for othographic directions 
function defUnitVectors(a){
    //ux = new Vector(1, Math.sqrt(3)/2);
    //uy = new Vector(1, -Math.sqrt(3)/2);

    ux = new Vector(1, 0.5);
    uy = new Vector(1, -0.5);
    uz = new Vector(0,1);

    vx = ux.multiply(r);
    vy = uy.multiply(r);
    vz = uz.multiply(r);

    rx = vx;
    ry = vy;
    rz = vz;
}

function tekenLaag(cx, cy, hoogte, hue, name="nameless"){
    const vgroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const vtext = document.createElementNS("http://www.w3.org/2000/svg", "text");

    let lstart = new Vector(cx, cy).add(rx.min());
    lstart[1] += hoogte/2;
    let leind = lstart.add(new Vector(-50,0));

    vtext.setAttribute('x',leind[0] - name.length*10);
    vtext.setAttribute('y',leind[1]+ 5);
    vtext.setAttribute('class','leadertext');
    vtext.innerHTML = name;

    linker_vlak = tekenVlak(linkervlak(cx, cy,hoogte,r),kleur(hue, 100, 40));
    rechter_vlak = tekenVlak(rechtervlak(cx, cy,hoogte,r),kleur(hue, 100, 50));
    boven_vlak = tekenVlak(bovenvlak(cx, cy,r,r),kleur(hue, 100, 60));
    lijntje = tekenLijn(lstart,leind,'white');
    vgroup.appendChild(boven_vlak);
    vgroup.appendChild(linker_vlak);
    vgroup.appendChild(rechter_vlak);
    vgroup.appendChild(lijntje);
    vgroup.appendChild(vtext);

    vgroup.setAttribute("id", name);
    vgroup.setAttribute("onmouseover", "hoverlayer(this)");
    vgroup.setAttribute("onmouseout", "outlayer(this)");
    vgroup.setAttribute("onclick", "clicklayer(this)");

    tekenbordSVG.appendChild(vgroup);
}

function tekenReepje(cx, cy, hoogte, breedte, hue, name="nameless"){
    const vgroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const vtext = document.createElementNS("http://www.w3.org/2000/svg", "text");

    let lstart = new Vector(cx, cy).add(ry).add(rux.multiply(breedte/2).min());
    let leind = lstart.add(ruy.multiply(50));

    vtext.setAttribute('x',leind[0]+10);
    vtext.setAttribute('y',leind[1]+ 5);
    vtext.setAttribute('class','leadertext');
    vtext.innerHTML = name;

    linker_vlak = tekenVlak(linkervlak(cx, cy,hoogte, breedte),kleur(hue, 100, 40));
    rechter_vlak = tekenVlak(rechtervlak(cx, cy,hoogte,r),kleur(hue, 100, 50));
    boven_vlak = tekenVlak(bovenvlak(cx, cy,breedte,r),kleur(hue, 100, 60));
    lijntje = tekenLijn(lstart,leind,'white');
    vgroup.appendChild(boven_vlak);
    vgroup.appendChild(linker_vlak);
    vgroup.appendChild(rechter_vlak);
    vgroup.appendChild(lijntje);
    vgroup.appendChild(vtext);

    vgroup.setAttribute("id", name);
    vgroup.setAttribute("onmouseover", "hoverlayer(this)");
    vgroup.setAttribute("onmouseout", "outlayer(this)");
    vgroup.setAttribute("onclick", "clicklayer(this)");

    tekenbordSVG.appendChild(vgroup);
}

function tekenBlokje(cx, cy, hoogte, breedte, diepte, hue, name="nameless"){
    const vgroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const vtext = document.createElementNS("http://www.w3.org/2000/svg", "text");

    let lstart = new Vector(cx, cy).add(ruy.multiply(diepte/2)); //.add(rux.multiply(breedte).min());
    lstart[1] += hoogte/2;
    let x_naast = r+100+ry[0];
    let a = x_naast  - lstart[0];
    let o = a*hoektan;

    let leind = new Vector(x_naast, lstart[1]+o);
    //lstart.add(rux.multiply(r+50));

    vtext.setAttribute('x',leind[0]+10);
    vtext.setAttribute('y',leind[1]+ 5);
    vtext.setAttribute('class','leadertext');
    vtext.innerHTML = name;

    linker_vlak = tekenVlak(linkervlak(cx, cy,hoogte, breedte),kleur(hue, 100, 40));
    rechter_vlak = tekenVlak(rechtervlak(cx, cy,hoogte,diepte),kleur(hue, 100, 50));
    boven_vlak = tekenVlak(bovenvlak(cx, cy,breedte,diepte),kleur(hue, 100, 60));
    lijntje = tekenLijn(lstart,leind,'grey');
    vgroup.appendChild(boven_vlak);
    vgroup.appendChild(linker_vlak);
    vgroup.appendChild(rechter_vlak);
    vgroup.appendChild(lijntje);
    vgroup.appendChild(vtext);

    vgroup.setAttribute("id", name);
    vgroup.setAttribute("onmouseover", "hoverlayer(this)");
    vgroup.setAttribute("onmouseout", "outlayer(this)");
    vgroup.setAttribute("onclick", "clicklayer(this)");

    tekenbordSVG.appendChild(vgroup);
}

function hoverlayer(layer){
    layer.children[0].setAttribute("class", "hover");
    layer.children[1].setAttribute("class", "hover");
    layer.children[2].setAttribute("class", "hover");
    layer.children[4].setAttribute("class", "leadertexthover");
}

function outlayer(layer){
    layer.children[0].setAttribute("class", "out");
    layer.children[1].setAttribute("class", "out");
    layer.children[2].setAttribute("class", "out");
    layer.children[4].setAttribute("class", "leadertext");
}

function clicklayer(layer){
    console.log(layer.id);
}

function linkervlak(cx, cy, hoogte, xbreedte) {
    v0 = new Vector(cx,cy);

    let hz = uz.multiply(hoogte);
    let bx = rux.multiply(xbreedte);
    let vlak = new Array(4);
    vlak[0] = v0;
    vlak[1] = vlak[0].add(bx.min());
    vlak[2] = vlak[1].add(hz);
    vlak[3] = vlak[0].add(hz);

    return vlak;
}

function rechtervlak(cx, cy, hoogte, ybreedte) {
    v0 = new Vector(cx,cy);

    let hz = uz.multiply(hoogte);
    let by = ruy.multiply(ybreedte);
    let vlak = new Array(4);
    vlak[0] = v0;
    vlak[1] = vlak[0].add(by);
    vlak[2] = vlak[1].add(hz);
    vlak[3] = vlak[0].add(hz);

    return vlak;
}

function bovenvlak(cx, cy, xbreedte, ybreedte) {
    v0 = new Vector(cx,cy);

    let by = ruy.multiply(ybreedte);
    let bx = rux.multiply(xbreedte);

    let vlak = new Array(4);
    vlak[0] = v0;
    vlak[1] = vlak[0].add(bx.min());
    vlak[2] = vlak[1].add(by);
    vlak[3] = vlak[0].add(by);

    return vlak;
}

var rx = null;
var ry = null;

var rux = null;
var ruy = null;

var rot = 2;

function updateAngle(angle) {
    rotateVector(angle);

    updateLayers();
}

function updateNumbers() {
    t+=rot;
    if(t > 35 || t < -35){rot *= -1};

    rotateVector(t);

    //lijntje.setAttribute("d", updateLijntje(v0, v0.add(rx)));
    linker_vlak.setAttribute("d", updateLinkervlak(gx, gy));
    rechter_vlak.setAttribute("d", updateRechtervlak(gx, gy));
    boven_vlak.setAttribute("d", updateBovenvlak(gx, gy));

    setTimeout(updateNumbers, 50);
}

function rotateVector(angle){
    let a = -angle/180*Math.PI;

    let ax = ux.multiply(Math.cos(a));
    let ay = uy.multiply(Math.sin(a));

    rux = ax.add(ay);

    ax = ux.multiply(Math.cos(a + Math.PI/2));
    ay = uy.multiply(Math.sin(a+ Math.PI/2));

    ruy = ax.add(ay);

    rx = rux.multiply(r);
    ry = ruy.multiply(r);

    hoektan = rux[1]/rux[0];
    if(hoektan > 0.5){hoektan = 0.5;}
}

class Vector extends Array {
    // example methods
    add(other) {
      return this.map((e, i) => e + other[i]);
    }
    multiply(factor) {
        return this.map((e, i) => e * factor);
    }

    min() {
        return this.map((e, i) => -e);
    }
  }