// Purpose: This file contains the code for the drawer.
// Separated out to a js file so eslint checks it.

import {SmoothieChart, TimeSeries} from 'smoothie';
import {Fitter} from './fitter.js';
const canvas = document.getElementById('myChart');
const smoothie = new SmoothieChart({
  millisPerPixel: 400,
  minValue: -2000, // to allow for error channels, where an error of 0 displays as -1000
  maxValue: 3500,
  grid: {fillStyle: '#f5f7e9', strokeStyle: 'rgba(150,150,150,0.3)', millisPerLine: 60000, verticalSections: 6, lineWidth: 1},
  tooltipLine: {strokeStyle: '#bbbbbb'},
  labels: {fillStyle: '#000000'},
});
let loadBundle = true; // When we first start we want to load all the
// data from the server to get the chart up to date.
const errorOffset = -1000;
const errorScale = 100;

const addError = ({channel, time, error}) => {
  errorLines[channel].append(time, error * errorScale + errorOffset);
};

const fitters = []; // the straigth line fitters for each channel.
const lines = [];
const errorLines = [];
const numberOfLines = 2;
const colors = ['rgba(0, 0, 255, 1)', 'rgba(255, 0, 0, 1)'];
for (let i = 0; i < numberOfLines; i++) {
  lines[i] = new TimeSeries();
  errorLines[i] = new TimeSeries();
  fitters[i] = new Fitter({channel: i, addError});
  smoothie.addTimeSeries(lines[i], {strokeStyle: colors[i], /*fillStyle: 'rgba(0, 255, 0, 0.6)',*/ lineWidth: 1});
  smoothie.addTimeSeries(errorLines[i], {strokeStyle: colors[i], /*fillStyle: 'rgba(0, 255, 0, 0.6)',*/ lineWidth: 1});
}
smoothie.streamTo(canvas, 1000);

const connectWebSocket = () => {
  const ws = new WebSocket('ws://localhost:8080');

  ws.onopen = (event) => {
    console.log(`Connected to WebSocket. event:${JSON.stringify(event)}`);
  };

  ws.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (Array.isArray(data) && loadBundle) {
      // This is a bundle of data to get the chart up to date.
      // We haven't plotted data yet, so we use this bundle to get the chart up to date.
      data.forEach((d) => {
        addReading(d);
      });
      return;
    }
    // Once we start receiving individual data, we don't want to load the bundle again.
    // The bundle will be resent by the server if the connection drops.
    loadBundle = false;
    // It is not an array, so it is a single reading. Print the reading too.
    addReading(data, true);
  };

  ws.onclose = (event) => {
    // If the socket drops - it happens - we just reopen it.
    if (event.wasClean) {
      console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
    } else {
      // Connection was not closed cleanly, maybe server process crashed or network issues.
      // We can try to reconnect here.
      console.log('WebSocket connection closed unexpectedly. Attempting to reconnect...');
    }
    setTimeout(connectWebSocket, 5000); // Try to reconnect after 5 seconds.
  };

  const addReading = (data, print = false) => {
    if (!data?.time) {
      console.log('no time in data', data);
      return;
    }
    const {channel = 0, time, reading} = data;
    if (channel >= numberOfLines) {
      console.log(`channel ${channel} is out of range`);
      return;
    }
    lines[channel].append(time, Number(reading));
    fitters[channel].fitLineIfTrigger(data);
    if (print) {
      console.log(`channel:${channel} time: ${time}, reading: ${reading}`);
    }
  };
};

connectWebSocket();
