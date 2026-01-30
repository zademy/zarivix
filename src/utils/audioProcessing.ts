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

        // Apply Silence Removal
        // Threshold 0.01 (-40dB approx for raw float)
        const trimmedBuffer = removeSilence(audioBuffer, 0.01);

        // Re-initialize OfflineCtx with NEW dimensions
        const offlineCtx2 = new OfflineAudioContext(
            trimmedBuffer.numberOfChannels,
            trimmedBuffer.length,
            trimmedBuffer.sampleRate
        );

        const source = offlineCtx2.createBufferSource();
        source.buffer = trimmedBuffer;

        // Re-create nodes on new context
        const highpass = offlineCtx2.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 100;

        const lowpass = offlineCtx2.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 8000;

        const compressor = offlineCtx2.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.knee.value = 40;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;

        const gainNode2 = offlineCtx2.createGain();
        gainNode2.gain.setValueAtTime(0, 0);
        gainNode2.gain.linearRampToValueAtTime(1, 0.05);

        const duration = trimmedBuffer.length / trimmedBuffer.sampleRate;
        gainNode2.gain.setValueAtTime(1, duration - 0.05);
        gainNode2.gain.linearRampToValueAtTime(0, duration);

        // Connect graph
        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(compressor);
        compressor.connect(gainNode2);
        gainNode2.connect(offlineCtx2.destination);

        source.start();

        // 4. Render
        const processedBuffer = await offlineCtx2.startRendering();

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

/**
 * Removes silent parts from an AudioBuffer.
 * @param buffer Input AudioBuffer
 * @param threshold Threshold for silence (0 to 1). Default 0.02 (approx -34dB)
 * @returns New AudioBuffer with silence removed
 */
const removeSilence = (buffer: AudioBuffer, threshold = 0.02): AudioBuffer => {
    const channelData = buffer.getChannelData(0); // Assume mono for voice
    const sampleRate = buffer.sampleRate;

    // Better Window-based Approach for stability
    // Divide into chunks (e.g. 50ms) and classify chunk as voice/silence
    const chunkSize = Math.floor(sampleRate * 0.05); // 50ms
    const numChunks = Math.floor(channelData.length / chunkSize);
    const chunkMap: boolean[] = new Array(numChunks).fill(false); // true = voice, false = silence

    for (let i = 0; i < numChunks; i++) {
        let sum = 0;
        const start = i * chunkSize;
        for (let j = 0; j < chunkSize; j++) {
            sum += Math.abs(channelData[start + j]);
        }
        const avg = sum / chunkSize;
        if (avg > threshold) {
            chunkMap[i] = true;
        }
    }

    // Dilate: Fill in small gaps (e.g. if silence < 200ms, mark as voice)
    // and Add padding (keep 200ms before/after voice)
    // 50ms chunks -> 4 chunks = 200ms
    const paddingChunks = 4;
    const expandedMap = [...chunkMap];

    for (let i = 0; i < numChunks; i++) {
        if (chunkMap[i]) {
            // Expand backwards
            for (let p = 1; p <= paddingChunks; p++) {
                if (i - p >= 0) expandedMap[i - p] = true;
            }
            // Expand forwards
            for (let p = 1; p <= paddingChunks; p++) {
                if (i + p < numChunks) expandedMap[i + p] = true;
            }
        }
    }

    // Reconstruct
    // Calculate total new size
    let newLength = 0;
    for (let i = 0; i < numChunks; i++) {
        if (expandedMap[i]) newLength += chunkSize;
    }

    // If newLength is 0 (all silence), return original (or empty?)
    // Return original to avoid errors if threshold is too high
    if (newLength === 0) return buffer;

    const newBuffer = new AudioContext().createBuffer(
        buffer.numberOfChannels,
        newLength,
        sampleRate
    );
    const newChannelData = newBuffer.getChannelData(0);

    let writeIndex = 0;
    for (let i = 0; i < numChunks; i++) {
        if (expandedMap[i]) {
            const start = i * chunkSize;
            // Copy chunk
            for (let j = 0; j < chunkSize; j++) {
                // Bounds check just in case last chunk partial
                if (start + j < channelData.length) {
                    newChannelData[writeIndex++] = channelData[start + j];
                }
            }
        }
    }

    return newBuffer;
};
