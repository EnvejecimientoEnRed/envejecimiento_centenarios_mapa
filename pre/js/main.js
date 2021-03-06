import { getIframeParams } from './height';
import { setChartCanvas, setChartCanvasImage } from './canvas-image';
import { setRRSSLinks } from './rrss';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { numberWithCommas } from './helpers';
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
let tooltip = d3.select('#tooltip');

const width = parseInt(chartBlock.style('width'));
const height = parseInt(chartBlock.style('height'));

let mapLayer = chartBlock.append('svg').attr('id', 'map').attr('width', width).attr('height', height);


d3.queue()
    .defer(d3.json, 'https://raw.githubusercontent.com/EnvejecimientoEnRed/envejecimiento_centenarios_mapa/main/data/provincias_proporcion.json')
    .await(main);

function main(error, centenarios) {
    if (error) throw error;

    let cents = topojson.feature(centenarios, centenarios.objects.provincias);
    
    let projection = d3_composite.geoConicConformalSpain().scale(2000).fitSize([width,height], cents);
    let path = d3.geoPath(projection);

    //cents.forEach(d => { d.coords = projection([d.geometry.coordinates[0], d.geometry.coordinates[1]]) });
    let colors = d3.scaleLinear()
        .domain([70, 165, 235, 330])
        .range(['#a7e7e7', '#68a7a7', '#2b6b6c', '#003334'])
    
    mapLayer.selectAll(".provincias")
        .data(cents.features)
        .enter()
        .append("path")
        .attr("class", "provincias")
        .style('fill', function(d) {
            return colors(+d.properties.prop_total_65_100.replace(',','.'));
        })
        .style('stroke', '#282828')
        .style('stroke-width', '0.25px')
        .attr("d", path)
        .on('mousemove mouseover', function(d,i,e){
            //Línea diferencial y cambio del polígonos
            let currentProv = this;
            
            document.getElementsByTagName('svg')[0].removeChild(this);
            document.getElementsByTagName('svg')[0].appendChild(currentProv);

            currentProv.style.stroke = '#000';
            currentProv.style.strokeWidth = '1px';

            //Elemento HTML > Tooltip (mostrar nombre de provincia, año y Proporcións para más de 100 años)
            let html = '<p class="chart__tooltip--title">' + d.properties.name + '<p class="chart__tooltip--text">Proporción general (100 años o más): ' + numberWithCommas(d.properties.prop_total_65_100.replace(',','.')) + '</p>' + 
            '<p class="chart__tooltip--text">Proporción en mujeres (100 años o más): ' + numberWithCommas(d.properties.prop_mujeres_65_100.replace(',','.')) + '</p>' + 
            '<p class="chart__tooltip--text">Proporción en hombres (100 años o más): ' + numberWithCommas(d.properties.prop_hombres_65_100.replace(',','.')) + '</p>';

            tooltip.html(html);

            //Tooltip
            getInTooltip(tooltip);                
            positionTooltip(window.event, tooltip);
        })
        .on('mouseout', function(d,i,e) {
            //Línea diferencial
            this.style.stroke = '#282828';
            this.style.strokeWidth = '0.25px';

            //Desaparición del tooltip
            getOutTooltip(tooltip); 
        });

    mapLayer.append('path')
        .style('fill', 'none')
        .style('stroke', '#000')
        .attr('d', projection.getCompositionBorders());

    setChartCanvas();
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