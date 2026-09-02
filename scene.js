/* ============================================================
   NESTORA — 3D Scene
   Vanilla Three.js (r128 global build — no bundler required).
   A stylised, procedural architectural composition stands in for
   a full photoreal villa model: a low concrete plinth carrying a
   floating glass volume, a second-storey suite, a reflecting pool
   and a rooftop terrace. Built from primitives on purpose — it is
   the storytelling vehicle for the camera journey, not a literal
   render target.
   ============================================================ */

window.NestoraScene = (function(){
  "use strict";

  let renderer, scene, camera, canvas;
  let ready = false, supported = true;
  let quality = "high"; // 'high' | 'medium' | 'low'
  let W = 1, H = 1;

  // groups
  let villaGroup, treesGroup, poolMesh, cityLightsGroup, particleSystem, edgesGroup;
  let sunLight, ambLight, interiorLights = [], poolLight;

  // state
  let dayNight = 0; // 0 = day, 1 = night (interpolated)
  let dayNightTarget = 0;
  let archMode = 0; // 0..1
  let archModeTarget = 0;
  let ambientOn = false;

  // camera rig
  const camState = { pos: new THREE.Vector3(0, 5.2, 24), target: new THREE.Vector3(0, 2.4, 0) };
  const camGoal  = { pos: new THREE.Vector3(0, 5.2, 24), target: new THREE.Vector3(0, 2.4, 0) };
  let mouseX = 0, mouseY = 0; // normalized -1..1
  let manualOverride = null; // when set, camGoal is driven by a hotspot / manual move instead of scroll
  let journeyProgress = 0;

  const KEYFRAMES = (window.JOURNEY_SCENES || []).map(s => ({
    pos: new THREE.Vector3(...s.camera.pos),
    target: new THREE.Vector3(...s.camera.target),
  }));

  const HOTSPOT_WORLD = {
    "living-room": new THREE.Vector3(0, 2.6, 2.2),
    "master-suite": new THREE.Vector3(6.2, 5.8, 1.4),
    "kitchen": new THREE.Vector3(-2.4, 2.6, 1.6),
    "pool": new THREE.Vector3(-5.5, 0.7, 6.2),
    "rooftop": new THREE.Vector3(0, 9.3, 0),
  };

  function detectSupport(){
    try{
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch(e){ return false; }
  }

  function buildVilla(){
    villaGroup = new THREE.Group();

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8d8064, roughness: 0.85, metalness: 0.05 });
    const concreteMat = new THREE.MeshStandardMaterial({ color: 0x5f5a4d, roughness: 0.9, metalness: 0.02 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x7a5233, roughness: 0.6, metalness: 0.05 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fc4d9, roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.35 });
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0xEFEADF, roughness: 0.7 });

    // ground podium
    const podium = new THREE.Mesh(new THREE.BoxGeometry(30, 0.6, 24), stoneMat);
    podium.position.set(0, -0.3, 0);
    podium.receiveShadow = true;
    villaGroup.add(podium);

    // ground floor volume (concrete)
    const groundVol = new THREE.Mesh(new THREE.BoxGeometry(13, 4, 9), concreteMat);
    groundVol.position.set(1.5, 2, -1.5);
    groundVol.castShadow = groundVol.receiveShadow = true;
    villaGroup.add(groundVol);

    // glass living volume (front)
    const glassVol = new THREE.Mesh(new THREE.BoxGeometry(9, 3.6, 6), glassMat);
    glassVol.position.set(0, 1.9, 3.2);
    villaGroup.add(glassVol);
    edgesFor(glassVol);

    // kitchen wing (west)
    const kitchenVol = new THREE.Mesh(new THREE.BoxGeometry(5, 3.4, 5.5), concreteMat);
    kitchenVol.position.set(-6.5, 1.8, 1.2);
    kitchenVol.castShadow = kitchenVol.receiveShadow = true;
    villaGroup.add(kitchenVol);

    // second storey (master suite) — warm wood tone
    const upperVol = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 6), woodMat);
    upperVol.position.set(5.5, 5.6, 0.5);
    upperVol.castShadow = upperVol.receiveShadow = true;
    villaGroup.add(upperVol);
    const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 5), glassMat);
    upperGlass.position.set(8.9, 5.6, 0.5);
    villaGroup.add(upperGlass);

    // roof slab over ground floor
    const roofSlab = new THREE.Mesh(new THREE.BoxGeometry(20, 0.5, 12), concreteMat);
    roofSlab.position.set(0, 4.05, -0.5);
    roofSlab.castShadow = true;
    villaGroup.add(roofSlab);

    // rooftop terrace (on top of upper volume)
    const terraceSlab = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 6), stoneMat);
    terraceSlab.position.set(5.5, 7.4, 0.5);
    terraceSlab.castShadow = terraceSlab.receiveShadow = true;
    villaGroup.add(terraceSlab);
    // parapet (thin rim boxes)
    [[5.5, 8.05, -2.4, 7, 0.6, 0.15], [5.5, 8.05, 3.4, 7, 0.6, 0.15], [2.1, 8.05, 0.5, 0.15, 0.6, 6], [8.9, 8.05, 0.5, 0.15, 0.6, 6]]
      .forEach(([x,y,z,w,h,d]) => {
        const p = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), parapetMat);
        p.position.set(x,y,z);
        villaGroup.add(p);
      });
    // rooftop loungers
    [[3.5, 7.65, -0.5], [4.6, 7.65, -0.5]].forEach(([x,y,z]) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.35, 0.8), woodMat);
      l.position.set(x,y,z);
      villaGroup.add(l);
    });

    // pool
    const poolPit = new THREE.Mesh(new THREE.BoxGeometry(9, 0.9, 4.5), new THREE.MeshStandardMaterial({ color: 0x0f2b33, roughness: 0.4 }));
    poolPit.position.set(-6, -0.15, 8);
    villaGroup.add(poolPit);
    poolMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(8.6, 4.1),
      new THREE.MeshStandardMaterial({ color: 0x2c8fa8, roughness: 0.08, metalness: 0.3, emissive: 0x0a3540, emissiveIntensity: 0.15 })
    );
    poolMesh.rotation.x = -Math.PI / 2;
    poolMesh.position.set(-6, 0.32, 8);
    villaGroup.add(poolMesh);

    // interior warm point lights
    const l1 = new THREE.PointLight(0xffc98a, 0, 12);
    l1.position.set(0, 2.6, 3);
    villaGroup.add(l1);
    const l2 = new THREE.PointLight(0xffc98a, 0, 10);
    l2.position.set(5.5, 5.8, 1);
    villaGroup.add(l2);
    const l3 = new THREE.PointLight(0xffc98a, 0, 8);
    l3.position.set(-6.5, 2.2, 1.2);
    villaGroup.add(l3);
    interiorLights = [l1, l2, l3];

    poolLight = new THREE.PointLight(0x2ce0ff, 0, 9);
    poolLight.position.set(-6, 0.4, 8);
    villaGroup.add(poolLight);

    scene.add(villaGroup);

    // trees
    treesGroup = new THREE.Group();
    const treePositions = [[-13, 0, -4], [-12, 0, 9], [11, 0, -6], [12.5, 0, 8], [-2, 0, 11]];
    treePositions.forEach(([x, , z]) => {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2, 6), new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 0.9 }));
      trunk.position.set(x, 1, z);
      const foliage = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 8), new THREE.MeshStandardMaterial({ color: 0x4b5a3e, roughness: 0.85 }));
      foliage.position.set(x, 3.2, z);
      trunk.castShadow = foliage.castShadow = true;
      treesGroup.add(trunk, foliage);
    });
    scene.add(treesGroup);

    // ground plane
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 120),
      new THREE.MeshStandardMaterial({ color: 0x2b2a22, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.62;
    ground.receiveShadow = true;
    ground.name = "ground";
    scene.add(ground);

    // distant city light sprites (visible mainly at night)
    cityLightsGroup = new THREE.Group();
    const spriteMat = new THREE.SpriteMaterial({ color: 0xffcf8f, transparent: true, opacity: 0 });
    for (let i = 0; i < 40; i++){
      const s = new THREE.Sprite(spriteMat.clone());
      const angle = Math.random() * Math.PI * 2;
      const r = 40 + Math.random() * 30;
      s.position.set(Math.cos(angle) * r, Math.random() * 6, Math.sin(angle) * r - 10);
      s.scale.setScalar(0.6 + Math.random() * 0.8);
      cityLightsGroup.add(s);
    }
    scene.add(cityLightsGroup);
  }

  function edgesFor(mesh){
    const eg = new THREE.EdgesGeometry(mesh.geometry);
    const line = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: 0xC9A467, transparent: true, opacity: 0 }));
    line.position.copy(mesh.position);
    line.name = "arch-edge";
    scene.add(line);
    if (!edgesGroup) edgesGroup = [];
    edgesGroup.push(line);
  }

  function buildParticles(){
    const count = quality === "high" ? 380 : 180;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++){
      positions[i*3] = (Math.random() - 0.5) * 40;
      positions[i*3+1] = Math.random() * 14;
      positions[i*3+2] = (Math.random() - 0.5) * 40;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xC9A467, size: 0.045, transparent: true, opacity: 0 });
    particleSystem = new THREE.Points(geo, mat);
    scene.add(particleSystem);
  }

  function init(canvasEl, opts){
    canvas = canvasEl;
    opts = opts || {};
    quality = opts.quality || "high";
    supported = detectSupport();
    if (!supported) return false;

    try{
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x15130F);
      scene.fog = new THREE.Fog(0x15130F, 30, 85);

      camera = new THREE.PerspectiveCamera(38, (canvas.clientWidth||1)/(canvas.clientHeight||1), 0.1, 200);
      camera.position.copy(camState.pos);
      camera.lookAt(camState.target);

      renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== "low", alpha: false, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === "high" ? 1.7 : 1.1));
      renderer.shadowMap.enabled = quality === "high";
      if (renderer.shadowMap.enabled) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      canvas.addEventListener("webglcontextlost", (e) => {
        e.preventDefault();
        console.warn("NestoraScene: WebGL context lost — disabling 3D for this session.");
        ready = false;
        supported = false;
      }, false);

      ambLight = new THREE.AmbientLight(0xfff3e0, 0.55);
      scene.add(ambLight);
      sunLight = new THREE.DirectionalLight(0xffdcae, 1.1);
      sunLight.position.set(14, 20, 10);
      sunLight.castShadow = quality === "high";
      if (sunLight.castShadow){
        sunLight.shadow.mapSize.set(1024, 1024);
        sunLight.shadow.camera.left = -25; sunLight.shadow.camera.right = 25;
        sunLight.shadow.camera.top = 25; sunLight.shadow.camera.bottom = -25;
      }
      scene.add(sunLight);

      buildVilla();
      buildParticles();

      resize();
      ready = true;
      return true;
    } catch(e){
      console.warn("NestoraScene init failed, falling back to image sequence.", e);
      supported = false;
      return false;
    }
  }

  function resize(){
    if (!ready && !renderer) return;
    W = canvas.clientWidth || window.innerWidth;
    H = canvas.clientHeight || window.innerHeight;
    if (!W || !H) return;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    renderer.setSize(W, H, false);
  }

  /* ---------- camera journey ---------- */
  function setJourneyProgress(p){
    journeyProgress = Math.max(0, Math.min(1, p));
    if (manualOverride) return; // hotspot navigation temporarily owns the camera goal
    const effective = Math.min(journeyProgress / 0.82, 1);
    const segCount = KEYFRAMES.length - 1;
    const segF = effective * segCount;
    const i = Math.min(Math.floor(segF), segCount - 1);
    const t = segCount === 0 ? 0 : segF - i;
    const a = KEYFRAMES[i] || KEYFRAMES[0];
    const b = KEYFRAMES[i+1] || a;
    if (a && b){
      camGoal.pos.lerpVectors(a.pos, b.pos, smoothstep(t));
      camGoal.target.lerpVectors(a.target, b.target, smoothstep(t));
    }
  }
  function smoothstep(t){ return t*t*(3-2*t); }

  function setMouse(nx, ny){ mouseX = nx; mouseY = ny; }

  function moveCameraTo(pos, target, duration){
    manualOverride = true;
    const from = { px: camGoal.pos.x, py: camGoal.pos.y, pz: camGoal.pos.z, tx: camGoal.target.x, ty: camGoal.target.y, tz: camGoal.target.z };
    const to = { px: pos[0], py: pos[1], pz: pos[2], tx: target[0], ty: target[1], tz: target[2] };
    if (typeof gsap !== "undefined"){
      gsap.to(from, {
        ...to, duration: duration || 1.6, ease: "power3.inOut",
        onUpdate: () => {
          camGoal.pos.set(from.px, from.py, from.pz);
          camGoal.target.set(from.tx, from.ty, from.tz);
        }
      });
    } else {
      camGoal.pos.set(to.px, to.py, to.pz);
      camGoal.target.set(to.tx, to.ty, to.tz);
    }
  }
  function releaseManualOverride(){ manualOverride = null; }

  function setDayNight(isNight){ dayNightTarget = isNight ? 1 : 0; }
  function setArchitectureMode(on){ archModeTarget = on ? 1 : 0; }
  function setAmbient(on){ ambientOn = on; }

  function projectPoint(id){
    const p = HOTSPOT_WORLD[id];
    if (!p || !camera) return null;
    const v = p.clone().project(camera);
    const behind = v.z > 1;
    return {
      x: (v.x * 0.5 + 0.5) * W,
      y: (1 - (v.y * 0.5 + 0.5)) * H,
      visible: !behind && v.x > -1.15 && v.x < 1.15 && v.y > -1.15 && v.y < 1.15,
    };
  }

  /* ---------- render loop ---------- */
  function tick(){
    if (!ready) return;
    try{
      _tickInner();
    } catch(e){
      console.warn("NestoraScene render error — disabling 3D for this session.", e);
      ready = false;
      supported = false;
    }
  }

  function _tickInner(){

    dayNight += (dayNightTarget - dayNight) * 0.045;
    archMode += (archModeTarget - archMode) * 0.06;

    // camera lerp toward goal + subtle mouse parallax
    const parallaxStrength = ambientOn ? 0.35 : 0.6;
    const px = camGoal.pos.x + mouseX * parallaxStrength;
    const py = camGoal.pos.y + mouseY * parallaxStrength * 0.5;
    camState.pos.x += (px - camState.pos.x) * 0.045;
    camState.pos.y += (py - camState.pos.y) * 0.045;
    camState.pos.z += (camGoal.pos.z - camState.pos.z) * 0.045;
    camState.target.lerp(camGoal.target, 0.06);
    camera.position.copy(camState.pos);
    camera.lookAt(camState.target);

    // day/night lighting
    sunLight.intensity = 1.15 - dayNight * 0.85;
    sunLight.color.setHex(dayNight > 0.5 ? 0x88a4ff : 0xffdcae);
    ambLight.intensity = 0.55 - dayNight * 0.32;
    const bgColor = new THREE.Color(0x15130F).lerp(new THREE.Color(0x07080C), dayNight);
    scene.background = bgColor;
    scene.fog.color = bgColor;
    interiorLights.forEach(l => { l.intensity = dayNight * 1.4; });
    if (poolLight) poolLight.intensity = dayNight * 1.1;
    if (poolMesh) poolMesh.material.emissiveIntensity = 0.1 + dayNight * 0.5;
    cityLightsGroup.children.forEach(s => { s.material.opacity = dayNight * 0.7; });

    // architecture mode
    const archVisible = archMode > 0.02;
    villaGroup.traverse(obj => {
      if (obj.isMesh && obj.material && "opacity" in obj.material){
        // subtle desaturation via reduced emissive-less approach: skip heavy per-frame material churn, just dim
      }
    });
    treesGroup.visible = archMode < 0.5;
    scene.fog.near = 30 - archMode * 15;
    scene.fog.far = 85 - archMode * 30;
    if (edgesGroup) edgesGroup.forEach(e => { e.material.opacity = archMode * 0.9; });

    // ambient particles
    if (particleSystem){
      particleSystem.material.opacity += ((ambientOn ? 0.55 : 0) - particleSystem.material.opacity) * 0.05;
      if (ambientOn){
        const pos = particleSystem.geometry.attributes.position;
        for (let i = 0; i < pos.count; i++){
          let y = pos.getY(i) + 0.004;
          if (y > 14) y = 0;
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
        particleSystem.rotation.y += 0.0006;
      }
    }

    renderer.render(scene, camera);
  }

  return {
    init, resize, tick,
    setJourneyProgress, setMouse, moveCameraTo, releaseManualOverride,
    setDayNight, setArchitectureMode, setAmbient,
    projectPoint,
    isReady: () => ready,
    isSupported: () => supported,
  };
})();
