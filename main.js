// ═══════════════════════════════════════════════════════════
//  PANTERAS 3A — MAIN SCRIPT
//  Lenis + GSAP + Three.js + Custom Effects
//  Colégio Estadual Santa Edwiges — 2026
// ═══════════════════════════════════════════════════════════

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// ═══════════════════════════════════════════════════════════
//  1. TEXT SCRAMBLE ENGINE
// ═══════════════════════════════════════════════════════════
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/{}—=+*^?#◆●▲";

function scrambleText(el, finalText, duration = 1500) {
    return new Promise((resolve) => {
        let iteration = 0;
        const totalIterations = finalText.length * 3;
        const intervalTime = duration / totalIterations;

        const interval = setInterval(() => {
            el.textContent = finalText
                .split("")
                .map((letter, index) => {
                    if (index < iteration) return finalText[index];
                    if (letter === " ") return " ";
                    return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                })
                .join("");

            if (iteration >= finalText.length) {
                clearInterval(interval);
                el.textContent = finalText;
                resolve();
            }
            iteration += 1 / 3;
        }, intervalTime);
    });
}

// ═══════════════════════════════════════════════════════════
//  2. LOADING SCREEN
// ═══════════════════════════════════════════════════════════
async function runLoader() {
    const loader = document.getElementById("loader");
    const bar = document.getElementById("loader-bar");
    const percent = document.getElementById("loader-percent");
    const scrambleEls = loader.querySelectorAll("[data-scramble]");

    // Animate progress bar
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 8 + 2;
        if (progress > 95) progress = 95;
        bar.style.width = progress + "%";
        percent.textContent = Math.floor(progress);
    }, 120);

    // Scramble texts in sequence
    for (const el of scrambleEls) {
        const original = el.textContent;
        await scrambleText(el, original, 800);
        await new Promise(r => setTimeout(r, 200));
    }

    // Wait a bit for assets to load
    await new Promise(r => setTimeout(r, 600));

    // Complete progress
    clearInterval(progressInterval);
    bar.style.width = "100%";
    percent.textContent = "100";

    await new Promise(r => setTimeout(r, 500));

    // Dismiss loader
    loader.classList.add("hidden");

    // Start hero animations after loader fades
    await new Promise(r => setTimeout(r, 800));
    animateHeroEntrance();
}

// ═══════════════════════════════════════════════════════════
//  3. LENIS SMOOTH SCROLL
// ═══════════════════════════════════════════════════════════
const lenis = new Lenis({
    lerp: 0.06,
    wheelMultiplier: 0.8,
    smoothWheel: true,
    syncTouch: true,
});

// Sync Lenis with GSAP ScrollTrigger
lenis.on("scroll", ScrollTrigger.update);

gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ═══════════════════════════════════════════════════════════
//  4. CURSOR TRAIL (Canvas)
// ═══════════════════════════════════════════════════════════
function initCursorTrail() {
    const canvas = document.getElementById("cursor-trail");
    const ctx = canvas.getContext("2d");
    let trail = [];
    const lifespan = 600;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    window.addEventListener("mousemove", (e) => {
        trail.push({ x: e.clientX, y: e.clientY, time: performance.now() });
    });

    function animate(now) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Remove expired points
        trail = trail.filter(p => now - p.time < lifespan);

        if (trail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(trail[0].x, trail[0].y);

            for (let i = 1; i < trail.length; i++) {
                const age = now - trail[i].time;
                const alpha = 1 - age / lifespan;

                // Smooth curve through points
                if (i < trail.length - 1) {
                    const xc = (trail[i].x + trail[i + 1].x) / 2;
                    const yc = (trail[i].y + trail[i + 1].y) / 2;
                    ctx.quadraticCurveTo(trail[i].x, trail[i].y, xc, yc);
                } else {
                    ctx.lineTo(trail[i].x, trail[i].y);
                }
            }

            ctx.strokeStyle = `rgba(123, 47, 190, 0.35)`;
            ctx.lineWidth = 1.5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.shadowColor = "rgba(123, 47, 190, 0.25)";
            ctx.shadowBlur = 15;
            ctx.stroke();
        }

        requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════════
//  5. HERO ENTRANCE ANIMATIONS
// ═══════════════════════════════════════════════════════════
function animateHeroEntrance() {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    tl.to(".hero__tag", {
        opacity: 0.4, duration: 1.2
    })
        .to(".line-mask__inner", {
            yPercent: 0,
            duration: 1.6,
            stagger: 0.15,
        }, "-=0.8")
        .to(".hero__scroll-hint", {
            opacity: 1, duration: 1
        }, "-=0.6");
}

// ═══════════════════════════════════════════════════════════
//  6. MAGNETIC BUTTON PHYSICS
// ═══════════════════════════════════════════════════════════
function initMagneticButtons() {
    document.querySelectorAll(".magnetic-btn").forEach(btn => {
        const wrapper = btn;

        wrapper.addEventListener("mousemove", (e) => {
            const { left, top, width, height } = wrapper.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const x = (e.clientX - centerX) * 0.25;
            const y = (e.clientY - centerY) * 0.25;

            gsap.to(wrapper, {
                x, y,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });

        wrapper.addEventListener("mouseleave", () => {
            gsap.to(wrapper, {
                x: 0, y: 0,
                duration: 1,
                ease: "elastic.out(1, 0.3)"
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════
//  7. THREE.JS — PANTHER + BLOB MASKING
// ═══════════════════════════════════════════════════════════
const gu = {
    time: { value: 0 },
    dTime: { value: 0 },
    aspect: { value: innerWidth / innerHeight }
};

class Blob {
    constructor(renderer) {
        this.renderer = renderer;
        this.fbTexture = { value: new THREE.FramebufferTexture(innerWidth, innerHeight) };
        this.rtOutput = new THREE.WebGLRenderTarget(innerWidth, innerHeight);
        this.uniforms = {
            pointer: { value: new THREE.Vector2().setScalar(10) },
            pointerDown: { value: 1 },
            pointerRadius: { value: 0.375 },
            pointerDuration: { value: 2.5 }
        };

        window.addEventListener("pointermove", event => {
            this.uniforms.pointer.value.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.uniforms.pointer.value.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        renderer.domElement.addEventListener("pointerleave", () => {
            this.uniforms.pointer.value.setScalar(10);
        });

        this.rtScene = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.MeshBasicMaterial({
                color: 0x000000,
                onBeforeCompile: shader => {
                    shader.uniforms.dTime = gu.dTime;
                    shader.uniforms.aspect = gu.aspect;
                    shader.uniforms.pointer = this.uniforms.pointer;
                    shader.uniforms.pointerDown = this.uniforms.pointerDown;
                    shader.uniforms.pointerRadius = this.uniforms.pointerRadius;
                    shader.uniforms.pointerDuration = this.uniforms.pointerDuration;
                    shader.uniforms.fbTexture = this.fbTexture;
                    shader.fragmentShader = `
                        uniform float dTime;
                        uniform float aspect;
                        uniform vec2 pointer;
                        uniform float pointerDown;
                        uniform float pointerRadius;
                        uniform float pointerDuration;
                        uniform sampler2D fbTexture;
                        ${shader.fragmentShader}
                    `.replace(
                        `#include <color_fragment>`,
                        `#include <color_fragment>
                        float duration = pointerDuration;
                        float rVal = texture2D(fbTexture, vUv).r;
                        rVal -= clamp(dTime / duration, 0., 0.1);
                        rVal = clamp(rVal, 0., 1.);
                        float f = 0.;
                        if (pointerDown > 0.5){
                            vec2 uv = (vUv - 0.5) * 2. * vec2(aspect, 1.);
                            vec2 mouse = pointer * vec2(aspect, 1);
                            f = 1. - smoothstep(pointerRadius * 0.1, pointerRadius, distance(uv, mouse));
                        }
                        rVal += f * 0.1;
                        rVal = clamp(rVal, 0., 1.);
                        diffuseColor.rgb = vec3(rVal);
                        `
                    );
                }
            })
        );
        this.rtScene.material.defines = { "USE_UV": "" };
        this.rtCamera = new THREE.Camera();
    }

    render() {
        this.renderer.setRenderTarget(this.rtOutput);
        this.renderer.render(this.rtScene, this.rtCamera);
        this.renderer.copyFramebufferToTexture(this.fbTexture.value);
        this.renderer.setRenderTarget(null);
    }

    setSize(w, h) {
        this.rtOutput.setSize(w, h);
    }
}

// ── Scene Setup ──
const threeCanvas = document.getElementById("three-canvas");
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xF1F0F6);

const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0.5, 5);

const renderer = new THREE.WebGLRenderer({ canvas: threeCanvas, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enableZoom = false;
controls.enablePan = false;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;

// Lights
scene.add(new THREE.AmbientLight(0xffffff, Math.PI * 0.8));
const dirLight = new THREE.DirectionalLight(0xffffff, Math.PI * 0.6);
dirLight.position.set(3, 5, 4);
scene.add(dirLight);
const rimLight = new THREE.DirectionalLight(0x9B59B6, Math.PI * 0.2);
rimLight.position.set(-3, 2, -4);
scene.add(rimLight);

const blob = new Blob(renderer);

// ── Load Panther ──
const gltfLoader = new GLTFLoader();

async function initThreeJS() {
    try {
        const gltf = await gltfLoader.loadAsync("assets/panther.glb");
        const panther = gltf.scene;

        // Center and scale
        const box = new THREE.Box3().setFromObject(panther);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        panther.scale.setScalar(scale);
        panther.position.sub(center.multiplyScalar(scale));
        panther.position.y -= 0.2;

        // Apply blob-masked material
        panther.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone();
                child.material.color = new THREE.Color(0x1a1a2e);
                child.material.metalness = 0.3;
                child.material.roughness = 0.7;

                child.material.onBeforeCompile = shader => {
                    shader.uniforms.texBlob = { value: blob.rtOutput.texture };
                    shader.vertexShader = `
                        varying vec4 vPosProj;
                        ${shader.vertexShader}
                    `.replace(
                        `#include <project_vertex>`,
                        `#include <project_vertex>
                        vPosProj = gl_Position;`
                    );
                    shader.fragmentShader = `
                        uniform sampler2D texBlob;
                        varying vec4 vPosProj;
                        ${shader.fragmentShader}
                    `.replace(
                        `#include <clipping_planes_fragment>`,
                        `vec2 blobUV = ((vPosProj.xy / vPosProj.w) + 1.) * 0.5;
                        vec4 blobData = texture(texBlob, blobUV);
                        if (blobData.r < 0.01) discard;
                        #include <clipping_planes_fragment>`
                    );
                };
            }
        });

        scene.add(panther);

        // Wireframe overlay with scan lines
        panther.traverse(child => {
            if (child.isMesh) {
                const wireGeo = child.geometry.clone();
                const wireMesh = new THREE.Mesh(
                    wireGeo,
                    new THREE.MeshBasicMaterial({
                        color: 0x7B2FBE,
                        wireframe: true,
                        transparent: true,
                        opacity: 0.06,
                        onBeforeCompile: shader => {
                            shader.uniforms.time = gu.time;
                            shader.vertexShader = `
                                varying float vYVal;
                                ${shader.vertexShader}
                            `.replace(
                                `#include <begin_vertex>`,
                                `#include <begin_vertex>
                                vYVal = position.y;`
                            );
                            shader.fragmentShader = `
                                uniform float time;
                                varying float vYVal;
                                ${shader.fragmentShader}
                            `.replace(
                                `#include <color_fragment>`,
                                `#include <color_fragment>
                                float y = fract(vYVal * 0.25 + time * 0.5);
                                float fY = smoothstep(0., 0.01, y) - smoothstep(0.02, 0.1, y);
                                diffuseColor.a *= fY * 0.9 + 0.1;`
                            );
                        }
                    })
                );
                wireMesh.scale.copy(child.scale);
                wireMesh.position.copy(child.position);
                wireMesh.rotation.copy(child.rotation);
                child.parent.add(wireMesh);
            }
        });

    } catch (err) {
        console.warn("Panther model failed to load:", err);
    }
}

// ── Animation Loop ──
const clock = new THREE.Clock();
let threeRunning = false;

function startThreeLoop() {
    if (threeRunning) return;
    threeRunning = true;

    renderer.setAnimationLoop(() => {
        const dt = clock.getDelta();
        gu.time.value += dt;
        gu.dTime.value = dt;
        controls.update();
        blob.render();
        renderer.render(scene, camera);
    });
}

function stopThreeLoop() {
    threeRunning = false;
    renderer.setAnimationLoop(null);
}

// ── Resize ──
window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    gu.aspect.value = camera.aspect;
    blob.setSize(innerWidth, innerHeight);
});

// ═══════════════════════════════════════════════════════════
//  8. GSAP SCROLL ANIMATIONS
// ═══════════════════════════════════════════════════════════
function setupScrollAnimations() {

    // ── SHIRT ZOOM (Pinned Cinematic) ──
    const shirtImg = document.getElementById("shirt-zoom-img");
    const vignette = document.querySelector(".shirt-reveal__vignette");
    const shirtCaption = document.querySelector(".shirt-reveal__text-overlay");

    gsap.timeline({
        scrollTrigger: {
            trigger: "#shirt-reveal",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: (self) => {
                const p = self.progress;
                // Zoom from 1 → 2.8
                const scaleVal = 1 + p * 1.8;
                shirtImg.style.transform = `scale(${scaleVal})`;

                // Vignette fade in
                vignette.style.opacity = Math.min(p * 2, 0.9);

                // Caption fade in at the end
                shirtCaption.style.opacity = p > 0.7 ? (p - 0.7) / 0.3 : 0;
            }
        }
    });

    // ── DETAILS — Clip-path reveal ──
    gsap.to(".details__image .reveal-wrapper", {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1.5,
        ease: "power3.inOut",
        scrollTrigger: {
            trigger: ".details__image",
            start: "top 75%",
        }
    });
    gsap.to(".details__image .reveal-wrapper img", {
        scale: 1,
        duration: 1.5,
        ease: "power3.inOut",
        scrollTrigger: {
            trigger: ".details__image",
            start: "top 75%",
        }
    });

    // Details text
    gsap.from(".details__text .section__tag", {
        opacity: 0, x: -30, duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: "#details", start: "top 65%" }
    });
    gsap.from(".details__text .section__title", {
        opacity: 0, y: 60, duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: "#details", start: "top 60%" }
    });
    gsap.from(".details__text .section__body", {
        opacity: 0, y: 40, duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: "#details", start: "top 50%" }
    });

    // ── PANTERA 3D — Canvas + text ──
    ScrollTrigger.create({
        trigger: "#pantera",
        start: "top 80%",
        end: "bottom 20%",
        onEnter: () => {
            threeCanvas.classList.add("visible");
            threeCanvas.style.pointerEvents = "auto";
            startThreeLoop();
        },
        onLeave: () => {
            threeCanvas.classList.remove("visible");
            threeCanvas.style.pointerEvents = "none";
            stopThreeLoop();
        },
        onEnterBack: () => {
            threeCanvas.classList.add("visible");
            threeCanvas.style.pointerEvents = "auto";
            startThreeLoop();
        },
        onLeaveBack: () => {
            threeCanvas.classList.remove("visible");
            threeCanvas.style.pointerEvents = "none";
            stopThreeLoop();
        }
    });

    gsap.to(".pantera__title", {
        opacity: 1, scrollTrigger: {
            trigger: "#pantera", start: "top 60%", end: "center center", scrub: 1
        }
    });
    gsap.to(".pantera__label", {
        opacity: 0.25, scrollTrigger: {
            trigger: "#pantera", start: "top 55%", scrub: 1
        }
    });
    gsap.to(".pantera__desc", {
        opacity: 0.3, scrollTrigger: {
            trigger: "#pantera", start: "top 50%", scrub: 1
        }
    });

    // ── Background transition into story (dark) ──
    gsap.to("body", {
        backgroundColor: "#08080c",
        scrollTrigger: {
            trigger: "#story",
            start: "top 90%",
            end: "top 40%",
            scrub: 1
        }
    });

    // Match Three.js scene background
    ScrollTrigger.create({
        trigger: "#story",
        start: "top 90%",
        end: "top 40%",
        scrub: true,
        onUpdate: (self) => {
            const p = self.progress;
            const start = new THREE.Color(0xF1F0F6);
            const end = new THREE.Color(0x08080c);
            scene.background.copy(start).lerp(end, p);
        }
    });

    // ── STORYTELLING — Staggered block reveals ──
    document.querySelectorAll(".story__block").forEach((block, i) => {
        gsap.to(block, {
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "power3.out",
            scrollTrigger: {
                trigger: block,
                start: "top 80%"
            },
            delay: i * 0.1
        });
    });

    gsap.from(".story__title", {
        opacity: 0, y: 60, duration: 1.4, ease: "power3.out",
        scrollTrigger: { trigger: "#story", start: "top 65%" }
    });
    gsap.from(".section--story .section__tag", {
        opacity: 0, x: -20, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: "#story", start: "top 70%" }
    });

    // ── EMBLEM ──
    gsap.from(".emblem__wrapper", {
        opacity: 0, scale: 0.8, duration: 1.4,
        ease: "power3.out",
        scrollTrigger: { trigger: "#emblem", start: "top 65%" }
    });
    gsap.from(".section--emblem .section__tag", {
        opacity: 0, y: 20, duration: 1,
        scrollTrigger: { trigger: "#emblem", start: "top 70%" }
    });
    gsap.from(".emblem__hint", {
        opacity: 0, duration: 1, delay: 0.5,
        scrollTrigger: { trigger: "#emblem", start: "top 60%" }
    });

    // ── TURMA PHOTO — Clip-path reveal ──
    gsap.to(".turma__cinema-wrapper", {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: 1.8,
        ease: "power3.inOut",
        scrollTrigger: {
            trigger: "#turma",
            start: "top 70%",
        }
    });
    gsap.to(".turma__cinema-wrapper img", {
        scale: 1,
        duration: 1.8,
        ease: "power3.inOut",
        scrollTrigger: {
            trigger: "#turma",
            start: "top 70%",
        }
    });
    gsap.from(".turma__caption", {
        opacity: 0, y: 20, duration: 1, delay: 0.8,
        scrollTrigger: { trigger: "#turma", start: "top 60%" }
    });

    // ── FOOTER ──
    // SVG line draw
    const footerLine = document.getElementById("footer-line-svg");
    if (footerLine) {
        const pathLength = footerLine.getTotalLength ? footerLine.getTotalLength() : 1200;
        footerLine.style.strokeDasharray = pathLength;
        footerLine.style.strokeDashoffset = pathLength;

        gsap.to(footerLine, {
            strokeDashoffset: 0,
            duration: 2,
            ease: "none",
            scrollTrigger: {
                trigger: "#footer",
                start: "top 80%",
            }
        });
    }

    gsap.from(".footer__title", {
        opacity: 0, y: 80, duration: 1.5, ease: "power3.out",
        scrollTrigger: { trigger: "#footer", start: "top 70%" }
    });
    gsap.from(".footer__sub", {
        opacity: 0, y: 30, duration: 1, delay: 0.3, ease: "power3.out",
        scrollTrigger: { trigger: "#footer", start: "top 60%" }
    });
    gsap.from(".footer__info", {
        opacity: 0, duration: 1, delay: 0.5,
        scrollTrigger: { trigger: "#footer", start: "top 55%" }
    });
    gsap.from(".magnetic-btn", {
        opacity: 0, y: 30, duration: 1, delay: 0.7,
        scrollTrigger: { trigger: "#footer", start: "top 50%" }
    });
}

// ═══════════════════════════════════════════════════════════
//  9. INITIALIZATION
// ═══════════════════════════════════════════════════════════
async function init() {
    // Start all systems
    initCursorTrail();
    initMagneticButtons();

    // Load 3D model in parallel
    initThreeJS();

    // Run loader animation
    await runLoader();

    // Setup scroll animations after loader
    setupScrollAnimations();
}

// Back to top smooth scroll
document.getElementById("back-to-top")?.addEventListener("click", (e) => {
    e.preventDefault();
    lenis.scrollTo("#hero", { duration: 2 });
});

// ── KICK OFF ──
init();
