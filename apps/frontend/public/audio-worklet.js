class Pcm16Downsampler extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.outSampleRate = (options && options.processorOptions && options.processorOptions.outSampleRate) || 16000;
    this._acc = 0;
    this._accCount = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    const inSR = sampleRate; // AudioWorklet global
    const outSR = this.outSampleRate;
    const ratio = inSR / outSR;

    // Simple low-pass decimation by averaging windows of size 'ratio'
    let pos = 0;
    const outLen = Math.floor(channel.length / ratio);
    const out = new Int16Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(Math.floor((i + 1) * ratio), channel.length);
      let sum = 0;
      let cnt = 0;
      for (let j = start; j < end; j++) {
        const s = channel[j] || 0;
        sum += s;
        cnt++;
      }
      let avg = cnt ? sum / cnt : 0;
      // clamp
      if (avg > 1) avg = 1; else if (avg < -1) avg = -1;
      out[i] = avg < 0 ? avg * 0x8000 : avg * 0x7FFF;
    }

    this.port.postMessage(out.buffer, [out.buffer]);
    return true;
  }
}

registerProcessor('pcm16-downsampler', Pcm16Downsampler);
