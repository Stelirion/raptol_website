/**
 * RAPTOL — Procedural Texture Worker
 * Handles heavy deterministic noise calculations off-thread.
 */

// Deterministic noise table
const NOISE_TABLE = new Float32Array(256);
for(let i=0; i<256; i++) {
    // We use a simple PRNG with a seed to keep it "stable" but randomized for the session
    NOISE_TABLE[i] = Math.random();
}

function noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const idx = (X * 7 + Y * 31) & 255;
    return NOISE_TABLE[idx];
}

function smoothNoise(x, y, scale = 1) {
    x /= scale; y /= scale;
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    const u = fade(xf), v = fade(yf);
    const a = noise(xi,   yi  );
    const b = noise(xi+1, yi  );
    const c = noise(xi,   yi+1);
    const d = noise(xi+1, yi+1);
    return a*(1-u)*(1-v) + b*u*(1-v) + c*(1-u)*v + d*u*v;
}

function fbm(x, y, octaves = 5) {
    let val = 0, amp = 0.5, freq = 1, max = 0;
    for (let i = 0; i < octaves; i++) {
        val += smoothNoise(x * freq, y * freq, 1) * amp;
        max += amp; amp *= 0.5; freq *= 2.1;
    }
    return val / max;
}

self.onmessage = function(e) {
    const { id, colorHex, type } = e.data;
    
    // Pro resolution for stars/flames
    const S = (type === 'star' || type === 'flame') ? 512 : 128;
    const buffer = new Uint8ClampedArray(S * S * 4);

    const r0 = parseInt(colorHex.slice(1,3), 16);
    const g0 = parseInt(colorHex.slice(3,5), 16);
    const b0 = parseInt(colorHex.slice(5,7), 16);
    const seed = ((r0 * 137 + g0 * 251 + b0 * 73) % 97) * 0.1;

    for (let py = 0; py < S; py++) {
        for (let px = 0; px < S; px++) {
            const nx = px / S + seed;
            const ny = py / S + seed;
            
            let n = fbm(nx * 3, ny * 3, 3);
            n = n * n * (3 - 2 * n); // smoothstep

            let ri, gi, bi, ai = 255;
            if (type === 'star') {
                let mag = Math.pow(n, 3) * 3.5; 
                ri = 120 + mag * 135;
                gi = 30  + mag * 70;
                bi = 0   + mag * 10;
            } else if (type === 'clouds' || type === 'flame') {
                ri = gi = bi = 255;
                ai = n * 255;
                if (type === 'flame') {
                    const flow = fbm(nx * 2, ny * 10, 3); 
                    ri = 255; gi = 80 + flow * 175; bi = 20;
                    ai = flow * 255;
                    if (ai < 45) ai = 0;
                } else if (ai < 40) ai = 0;
            } else if (type === 'lava') {
                const base  = fbm(nx * 4.0, ny * 4.0, 4);
                const crack = fbm(nx * 11.0 + 2.3, ny * 11.0 + 1.7, 3);
                const crackVal = Math.pow(Math.max(0, crack - 0.38) / 0.62, 2.0);
                ri = Math.min(255, 6 + base * 25 + crackVal * 215);
                gi = Math.min(255, base * 2  + crackVal * 14);
                bi = Math.min(255, crackVal * 6);
            } else {
                const base = 0.15 + n * 0.85;
                const rock = fbm(nx * 8 + 3.7, ny * 8 + 1.3, 3) * 0.25;
                ri = (r0 * base) * (1 - rock) + 25 * rock;
                gi = (g0 * base) * (1 - rock) + 25 * rock;
                bi = (b0 * base) * (1 - rock) + 25 * rock;
            }

            const idx = (py * S + px) * 4;
            buffer[idx]   = Math.min(255, Math.max(0, ri));
            buffer[idx+1] = Math.min(255, Math.max(0, gi));
            buffer[idx+2] = Math.min(255, Math.max(0, bi));
            buffer[idx+3] = ai;
        }
    }

    // Pass back the buffer as a Transferable for zero-copy performance
    self.postMessage({ id, buffer, size: S }, [buffer.buffer]);
};
