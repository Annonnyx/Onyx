// js/atmosphere.js

class AtmosphereManager {
    constructor() {
        this.canvas = document.getElementById('atmosphere-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.toggleBtn = document.getElementById('atmosphere-toggle');
        
        this.isActive = false;
        this.particles = [];
        this.theme = document.documentElement.getAttribute('data-theme') || 'neon';
        
        // Audio state
        this.audioCtx = null;
        this.masterGain = null;
        this.ambientNodes = { oscillator: null, filter: null, noise: null };
        
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Observer pour changer de particules quand le thème change
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.theme = document.documentElement.getAttribute('data-theme');
                    this.resetParticles();
                    this.updateAudioTheme();
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });

        // Toggle logic
        this.toggleBtn.addEventListener('click', () => this.toggle());

        // Loop
        this.loop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    toggle() {
        this.isActive = !this.isActive;
        this.toggleBtn.classList.toggle('active', this.isActive);
        this.canvas.classList.toggle('active', this.isActive);

        if (this.isActive) {
            this.startAudio();
            this.resetParticles();
        } else {
            this.stopAudio();
        }
    }

    // --- AUDIO ENGINE (Synthesizer) ---

    async startAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.connect(this.audioCtx.destination);
            this.masterGain.gain.value = 0;
        }

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        this.updateAudioTheme();
        
        // Fade in
        this.masterGain.gain.setTargetAtTime(0.1, this.audioCtx.currentTime, 1);
    }

    stopAudio() {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.5);
        }
    }

    updateAudioTheme() {
        if (!this.audioCtx || !this.isActive) return;

        // Stop current nodes
        this.clearAudioNodes();

        if (this.theme === 'neon') {
            // Neon: Deep Pulsing saw
            const osc = this.audioCtx.createOscillator();
            const filter = this.audioCtx.createBiquadFilter();
            osc.className = 'sawtooth';
            osc.frequency.setValueAtTime(55, this.audioCtx.currentTime); // A1
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, this.audioCtx.currentTime);
            
            osc.connect(filter);
            filter.connect(this.masterGain);
            osc.start();
            this.ambientNodes.oscillator = osc;
        } 
        else if (this.theme === 'prairie') {
            // Prairie: Wind noise
            const bufferSize = 2 * this.audioCtx.sampleRate;
            const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = noiseBuffer;
            noise.loop = true;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1000, this.audioCtx.currentTime);
            filter.Q.setValueAtTime(1, this.audioCtx.currentTime);

            noise.connect(filter);
            filter.connect(this.masterGain);
            noise.start();
            
            // Animation du vent
            const lfo = this.audioCtx.createOscillator();
            const lfoGain = this.audioCtx.createGain();
            lfo.frequency.value = 0.2;
            lfoGain.gain.value = 400;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            lfo.start();

            this.ambientNodes.noise = noise;
            this.ambientNodes.oscillator = lfo; // store to stop later
        }
        else if (this.theme === 'medieval') {
            // Medieval: Deep Sine Drone
            const osc = this.audioCtx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(73.42, this.audioCtx.currentTime); // D2
            
            const osc2 = this.audioCtx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(74.0, this.audioCtx.currentTime); // Beating
            
            osc.connect(this.masterGain);
            osc2.connect(this.masterGain);
            osc.start();
            osc2.start();
            
            this.ambientNodes.oscillator = [osc, osc2];
        }
    }

    clearAudioNodes() {
        if (this.ambientNodes.oscillator) {
            if (Array.isArray(this.ambientNodes.oscillator)) {
                this.ambientNodes.oscillator.forEach(o => o.stop());
            } else {
                this.ambientNodes.oscillator.stop();
            }
        }
        if (this.ambientNodes.noise) this.ambientNodes.noise.stop();
        this.ambientNodes = { oscillator: null, filter: null, noise: null };
    }

    playClick() {
        if (!this.isActive || !this.audioCtx) return;
        const click = this.audioCtx.createOscillator();
        const clickGain = this.audioCtx.createGain();
        click.type = 'sine';
        click.frequency.setValueAtTime(800, this.audioCtx.currentTime);
        click.frequency.exponentialRampToValueAtTime(10, this.audioCtx.currentTime + 0.1);
        clickGain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
        clickGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.1);
        click.connect(clickGain);
        clickGain.connect(this.audioCtx.destination);
        click.start();
        click.stop(this.audioCtx.currentTime + 0.1);
    }

    // --- PARTICLE ENGINE ---

    resetParticles() {
        this.particles = [];
        const count = window.innerWidth < 768 ? 20 : 60;
        
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.theme));
        }
    }

    loop() {
        if (this.isActive) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach(p => {
                p.update();
                p.draw(this.ctx);
            });
        }
        requestAnimationFrame(() => this.loop());
    }
}

class Particle {
    constructor(theme) {
        this.theme = theme;
        this.reset();
    }

    reset() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.life = Math.random() * 100 + 100;
        
        if (this.theme === 'neon') {
            this.color = 'rgba(0, 240, 255, ' + this.opacity + ')';
            this.speedY = -Math.random() * 1 - 0.5; // Ascending digital bits
        } else if (this.theme === 'prairie') {
            this.color = 'rgba(100, 150, 80, ' + this.opacity + ')';
            this.speedX = Math.random() * 1 + 1; // Wind blow
        } else {
            this.color = 'rgba(255, 100, 0, ' + this.opacity + ')';
            this.speedY = -Math.random() * 1.5 - 0.5; // Embers
        }
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life--;

        if (this.life <= 0 || this.x < 0 || this.x > window.innerWidth || this.y < 0 || this.y > window.innerHeight) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        if (this.theme === 'neon') {
            ctx.fillRect(this.x, this.y, this.size, this.size * 4); // Digital strips
        } else if (this.theme === 'prairie') {
            ctx.beginPath();
            ctx.ellipse(this.x, this.y, this.size * 2, this.size, Math.PI / 4, 0, Math.PI * 2); // Leaves
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); // Embers
            ctx.fill();
            // Glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 100, 0, 0.5)';
        }
        ctx.shadowBlur = 0;
    }
}

window.atmosphereManager = new AtmosphereManager();
