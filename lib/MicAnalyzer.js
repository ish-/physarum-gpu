import { invlerp } from '/lib/utils';

const MAX8b = 255;

export class MicAnalyzer {
  constructor () {
    return new Promise(r => {
      navigator.getUserMedia(
        { video: false,
          audio: {
            // latency: { ideal: 0.003 },
            latency: 0,
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
          },
        },
        stream => r(this._onReady(stream)),
        console.error,
      );
    })
  }

  _onReady (stream) {
    this.ready = true;
    this.ctx = new AudioContext();
    this.mic = this.ctx.createMediaStreamSource(stream);
    this.analyser = this.ctx.createAnalyser();
    this.mic.connect(this.analyser);

    this.freqData = new Uint8Array(this.analyser.frequencyBinCount);
    this.cacheId = 0;
    this.onReady && this.onReady();
    return this;
  }

  getVol (i = 0) {
    this.updateFreqData(i);

    let max = 0;
    let mean = MAX8b / 2;
    // for (var j = 0; j < this.analyser.frequencyBinCount; j++) {
    for (var j = 30; j < 120; j++) {
      const d = this.freqData[j];
      max = d > max ? d : max;
      mean = (mean + d) / 2;
      // if (max >= MAX8b)
      //   return max;
    }
    // return invlerp(0, MAX8b, max);
    return invlerp(0, MAX8b, mean);
  }

  updateFreqData (i) {
    if (i !== this.cacheId)
      this.analyser.getByteFrequencyData(this.freqData);
    this.cacheId = i;
  }
}
