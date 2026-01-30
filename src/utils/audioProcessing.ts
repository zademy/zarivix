/**
 * Utility functions for audio processing using native Web Audio API.
 * This provides DSP-based audio cleaning without heavy AI models.
 */

export const cleanAudioWithWebAudio = async (inputBlob: Blob): Promise<Blob> => {
    try {
        // 1. Decode Blob to AudioBuffer
        const arrayBuffer = await inputBlob.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioContextClass();

        let audioBuffer: AudioBuffer;
        try {
            audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        } catch (e) {
            console.error("Error decoding audio data", e);
            throw e;
        } finally {
            // Close the context if we just created it for decoding
            if (audioCtx.state !== 'closed') {
                audioCtx.close();
            }
        }

        // 2. Setup OfflineAudioContext for processing
        // We use OfflineAudioContext to process as fast as possible (not real-time)
        const offlineCtx = new OfflineAudioContext(
            audioBuffer.numberOfChannels,
            audioBuffer.length,
            audioBuffer.sampleRate
        );

        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;

        // 3. Create Filter Chain (Standard DSP for Voice)

        // A. Highpass Filter (100Hz) - Removes low-frequency rumble/pops
        const highpass = offlineCtx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 100;

        // B. Lowpass Filter (typically 8kHz is enough for voice, removes high hiss)
        // Adjust dependent on sample rate, but safe for generic voice.
        const lowpass = offlineCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 8000;

        // C. Dynamics Compressor - Evens out the volume (makes quiet parts louder, loud parts softer)
        const compressor = offlineCtx.createDynamicsCompressor();
        compressor.threshold.value = -24; // dB
        compressor.knee.value = 30; // 0-40
        compressor.ratio.value = 12; // Compression ratio
        compressor.attack.value = 0.003; // 3ms
        compressor.release.value = 0.25; // 250ms

        // Connect the graph: Source -> Highpass -> Lowpass -> Compressor -> Destination
        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(compressor);
        compressor.connect(offlineCtx.destination);

        // Start source
        source.start();

        // 4. Render
        const processedBuffer = await offlineCtx.startRendering();

        // 5. Convert back to WAV Blob
        return audioBufferToWav(processedBuffer);

    } catch (err) {
        console.error("Web Audio API cleaning failed:", err);
        // Fallback: Return original audio if processing fails
        return inputBlob;
    }
};

/**
 * Converts an AudioBuffer to a WAV Blob (16-bit PCM).
 */
const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;

    // Interleave channels if stereo (though we usually have mono for voice)
    let result: Float32Array;
    if (numChannels === 2) {
        result = interleave(buffer.getChannelData(0), buffer.getChannelData(1));
    } else {
        result = buffer.getChannelData(0);
    }

    return encodeWAV(result, format, sampleRate, numChannels, bitDepth);
};

const interleave = (inputL: Float32Array, inputR: Float32Array) => {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);

    let index = 0;
    let inputIndex = 0;

    while (index < length) {
        result[index++] = inputL[inputIndex];
        result[index++] = inputR[inputIndex];
        inputIndex++;
    }
    return result;
};

const encodeWAV = (samples: Float32Array, format: number, sampleRate: number, numChannels: number, bitDepth: number) => {
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    const buffer = new ArrayBuffer(44 + samples.length * bytesPerSample);
    const view = new DataView(buffer);

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * bytesPerSample, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, format, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * blockAlign, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, blockAlign, true);
    /* bits per sample */
    view.setUint16(34, bitDepth, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * bytesPerSample, true);

    floatTo16BitPCM(view, 44, samples);

    return new Blob([view], { type: 'audio/wav' });
};

const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
        const s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
};

const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};
