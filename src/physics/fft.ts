export interface FFTSpectrumPoint {
  frequency: number; // Hz
  magnitude: number; // normalized or g
}

export interface FFTResult {
  spectrum: FFTSpectrumPoint[];
  dominantFrequency: number;
  secondaryFrequency: number;
  peakMagnitude: number;
  samplingRate: number; // Hz
  resolution: number;   // Hz per bin
  numSamples: number;
}

/**
 * Radix-2 In-place Cooley-Tukey FFT
 */
function cooleyTukeyRadix2(real: Float64Array, imag: Float64Array): void {
  const n = real.length;
  // Bit-reversal permutation
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      const tempR = real[i];
      real[i] = real[j];
      real[j] = tempR;

      const tempI = imag[i];
      imag[i] = imag[j];
      imag[j] = tempI;
    }
    let k = n >> 1;
    while (k <= j) {
      j -= k;
      k >>= 1;
    }
    j += k;
  }

  // Butterfly updates
  for (let len = 2; len <= n; len <<= 1) {
    const halfLen = len >> 1;
    const angle = (-2 * Math.PI) / len;
    const wStepR = Math.cos(angle);
    const wStepI = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let wR = 1.0;
      let wI = 0.0;
      for (let k = 0; k < halfLen; k++) {
        const uR = real[i + k];
        const uI = imag[i + k];

        const vR = real[i + k + halfLen] * wR - imag[i + k + halfLen] * wI;
        const vI = real[i + k + halfLen] * wI + imag[i + k + halfLen] * wR;

        real[i + k] = uR + vR;
        imag[i + k] = uI + vI;

        real[i + k + halfLen] = uR - vR;
        imag[i + k + halfLen] = uI - vI;

        const nextWR = wR * wStepR - wI * wStepI;
        wI = wR * wStepI + wI * wStepR;
        wR = nextWR;
      }
    }
  }
}

/**
 * Computes FFT spectrum from acceleration time-series buffer
 */
export function computeFFT(
  signal: number[],
  samplingRate: number = 50 // e.g. 50 Hz
): FFTResult {
  // Find nearest power of 2 <= signal.length (e.g. 128, 256, 512)
  let n = 256;
  if (signal.length < 64) {
    return {
      spectrum: [],
      dominantFrequency: 0,
      secondaryFrequency: 0,
      peakMagnitude: 0,
      samplingRate,
      resolution: 0,
      numSamples: signal.length
    };
  }

  while (n * 2 <= signal.length && n < 512) {
    n *= 2;
  }
  if (n > signal.length) n = 128;

  // Extract latest n samples
  const start = Math.max(0, signal.length - n);
  const real = new Float64Array(n);
  const imag = new Float64Array(n);

  // Apply Hanning Window to suppress side lobes: w[i] = 0.5 * (1 - cos(2*pi*i / (N-1)))
  for (let i = 0; i < n; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    real[i] = signal[start + i] * window;
    imag[i] = 0.0;
  }

  cooleyTukeyRadix2(real, imag);

  // Compute magnitude spectrum up to Nyquist frequency
  const halfN = n / 2;
  const resolution = samplingRate / n;
  const spectrum: FFTSpectrumPoint[] = [];

  let peakMag = 0;
  let dominantFreq = 0;

  for (let i = 0; i < halfN; i++) {
    const freq = Number((i * resolution).toFixed(3));
    // Standard normalized magnitude: 2 * |X[i]| / N (except DC)
    const mag = (2 * Math.sqrt(real[i] * real[i] + imag[i] * imag[i])) / n;
    
    // Ignore DC offset at 0 Hz for peak detection
    if (i > 0 && mag > peakMag) {
      peakMag = mag;
      dominantFreq = freq;
    }

    // Limit spectrum up to 10 Hz for structural suspension bridge display
    if (freq <= 10.0) {
      spectrum.push({
        frequency: freq,
        magnitude: Number(mag.toFixed(5))
      });
    }
  }

  // Find secondary peak (excluding bins adjacent to dominant peak)
  let secondaryMag = 0;
  let secondaryFreq = 0;
  for (let i = 1; i < spectrum.length; i++) {
    const pt = spectrum[i];
    if (Math.abs(pt.frequency - dominantFreq) > 0.35 && pt.magnitude > secondaryMag) {
      secondaryMag = pt.magnitude;
      secondaryFreq = pt.frequency;
    }
  }

  return {
    spectrum,
    dominantFrequency: dominantFreq,
    secondaryFrequency: secondaryFreq,
    peakMagnitude: Number(peakMag.toFixed(5)),
    samplingRate,
    resolution: Number(resolution.toFixed(3)),
    numSamples: n
  };
}
