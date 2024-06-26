// Fit a line to the measured points.
// This waits for the measured value to pass some threshold, then fits all the recent points
// between two other threholds.
// Each channel is treated independently.
// This fits both +ve and -ve slopes.

import regression from 'regression';

class Fitter {
  constructor(options) {
    // Destructuring assignment with default values for the options parameter.
    const {channel = 0, triggerHigh = 3000, triggerLow = 300, limitHigh = 2800, limitLow = 500, lookingForPositiveSlope = true, addError} = options;

    // Assign each option to a property in this class.
    this.channel = channel;
    this.triggerHigh = triggerHigh;
    this.triggerLow = triggerLow;
    this.limitHigh = limitHigh;
    this.limitLow = limitLow;
    this.lookingForPositiveSlope = lookingForPositiveSlope;
    this.data = [];
    this.addError = addError;
  }

  fitLineIfTrigger(datum) {
    const {time, reading} = datum; // Removed comment of destructuring time

    // Check if the reading is within the limits to be added to data.
    if (reading <= this.limitHigh && reading >= this.limitLow) {
      this.data.push([time, reading]);
    } else {
      this.data.push([time, null]); // null makes smoothie skip plotting.
    }

    // Determine whether to trigger the line fitting process.
    let trigger = false;
    if (this.lookingForPositiveSlope && reading > this.triggerHigh) {
      trigger = true;
    } else if (!this.lookingForPositiveSlope && reading < this.triggerLow) {
      trigger = true;
    }

    // If a trigger condition is met, fit the line and reset for next fitting cycle.
    if (trigger) {
      this.fit(this.data);
      this.data = [];
      this.lookingForPositiveSlope = !this.lookingForPositiveSlope;
      return true;
    }
    return false;
  }

  // Fit a line to the provided data array.
  fit(data) {
    // Check if there is enough data to fit a line.
    if (data.length < 2) {
      throw new Error('Not enough data to fit a line');
    }

    // Bizarrely, the regression library sets the gradient to 0, because it is small.
    // Attempt a workaraound.
    const time0 = data[0][0];
    const data2 = data.map(([time, reading]) => [time - time0, reading]);
    // eslint-disable-next-line no-unused-vars
    const data3 = data2.filter(([time, reading]) => reading !== null); // Remove null readings.
    // Use the linear regression function from the regression library.
    const result = regression.linear(data3, {precision: 10});
    const [a, b] = result.equation;
    console.log(`a=${a}, b=${b}`);
    console.log(`fit:${result.string}`);

    // Calculate and report the error for each data point.
    data2.forEach(([time, reading]) => {
      if (reading === null) {
        this.addError({channel: this.channel, time: time + time0, error: null});
        return;
      }
      const expectedReading = a * time + b;
      const error = reading - expectedReading;
      if (this.addError) {
        console.log(`channel:${this.channel} time:${time + time0}, reading:${reading}, expected:${expectedReading}, error:${error}`);
        this.addError({channel: this.channel, time: time + time0, error});
      } else {
        // Handle the case where addError is not provided or is not a function.
        throw new Error('addError function is not defined or is not a function');
      }
    });

    // Return the result of the regression.
    return result;
  }
}

// Export the Fitter class for use in other modules.
export {Fitter};
