import { getIframeParams } from './height';
import { setChartCanvasImage } from './canvas-image';
import { setRRSSLinks } from './rrss';
import { simpleheat } from './simpleheat';
import './tabs';
import 'url-search-params-polyfill';

//Desarrollo de la visualización
import * as d3 from 'd3';
import * as topojson from "topojson-client";
let d3_composite = require("d3-composite-projections");

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let chartBlock = d3.select('#chart');

const width = parseInt(chartBlock.style('width'));
const height = parseInt(chartBlock.style('height'));

let mapLayer = chartBlock.append('svg').attr('id', 'map').attr('width', width).attr('height', height);
let canvasLayer = chartBlock.append('canvas').attr('id', 'heatmap').attr('width', width).attr('height', height);

let canvas = canvasLayer.node();
let context = canvas.getContext("2d");



d3.queue()
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/envejecimiento_centenarios_mapa/main/data/provincias_puntos.json')
    .defer(d3.json, 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/envejecimiento_centenarios_mapa/main/data/provincias.json')
    .await(main);

function main(error, centenarios, prov) {
    if (error) throw error;

    console.log(centenarios);

    let provs = topojson.feature(prov, prov.objects.provincias);
    let cents = topojson.feature(centenarios, centenarios.objects.provincias).features;

    console.log(cents);

    //let projection = d3.geoMercator().scale(2200).center([0, 40]).translate([width / 1.7, height / 2]);
    let projection = d3_composite.geoConicConformalSpain().scale(2000).fitSize([width,height], provs);
    let path = d3.geoPath(projection);

    cents.forEach(d => { d.coords = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) });
    
    mapLayer
        .append('g')
        .selectAll(".provincias")
        .data(provs.features)
        .enter()
        .append("path")
        .attr("class", "provincias")
        .style('fill', '#F0F0F0')
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path);
    
    //Heatmap
    let heat = simpleheat(canvas);

    // set data of [[x, y, value], ...] format
    heat.data(cents.map(d => { return [d.coords[0], d.coords[1], d.properties.tasa_total]}));

    // set point radius and blur radius (25 and 15 by default)
    heat.radius(25, 12.5);

    // optionally customize gradient colors, e.g. below
    // (would be nicer if d3 color scale worked here)
    // heat.gradient({0: '#ffeda0', 0.5: '#feb24c', 1: '#f03b20'});

    // set maximum for domain
    heat.max(d3.max(cents, d => d.properties.tasa_total));

    // draw into canvas, with minimum opacity threshold
    heat.draw(0.05);
}

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let pngDownload = document.getElementById('pngImage');

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});