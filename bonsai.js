import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const MODEL_URL = new URL('assets/bonsai.glb', document.baseURI).href;
const stage = document.getElementById('bonsai-stage');
if (stage) {
  const host = document.getElementById('bonsai-canvas-host');
  const loading = document.getElementById('bonsai-loading');
  const progressLabel = document.getElementById('bonsai-progress');
  const progressBar = document.getElementById('bonsai-progress-bar');
  const fallback = document.getElementById('bonsai-fallback');
  const toggleButton = document.getElementById('bonsai-toggle');
  const resetButton = document.getElementById('bonsai-reset');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  stage.dataset.started = '1';

  let loadWatchdog = null;

  if (window.location.protocol === 'file:') {
    showFallback('Model 3D wymaga uruchomienia przez serwer HTTP. Otwórz aplikację przez http://localhost, a nie bezpośrednio z pliku.');
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    showFallback('Twoja przeglądarka nie uruchomiła WebGL. Możesz dalej korzystać z aplikacji.');
    throw error;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  const homePosition = new THREE.Vector3(3.2, 1.35, 4.7);
  camera.position.copy(homePosition);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 2.8;
  controls.maxDistance = 7.2;
  controls.minPolarAngle = Math.PI * 0.23;
  controls.maxPolarAngle = Math.PI * 0.64;
  controls.target.set(0, 0.05, 0);
  controls.autoRotate = !prefersReducedMotion;
  controls.autoRotateSpeed = 0.7;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xfff4df, 0x4f4a3d, 2.2));
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffeed2, 3.2);
  keyLight.position.set(4, 6, 3);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x9cb39d, 1.5);
  fillLight.position.set(-4, 2.5, -3);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xe7dec2, 1.2);
  rimLight.position.set(0, 3, -5);
  scene.add(rimLight);

  let model = null;
  let initialRotation = new THREE.Euler(0, 0, 0);
  let isVisible = true;
  let ground = null;
  const clock = new THREE.Clock();

  function setAutoRotate(value) {
    controls.autoRotate = value;
    toggleButton.textContent = value ? 'Zatrzymaj obrót' : 'Obróć model';
    toggleButton.setAttribute('aria-pressed', value ? 'true' : 'false');
  }

  function showFallback(message) {
    if (loadWatchdog) {
      window.clearTimeout(loadWatchdog);
      loadWatchdog = null;
    }
    stage.dataset.error = '1';
    stage.classList.add('is-error');
    if (loading) loading.hidden = true;
    if (fallback) {
      fallback.hidden = false;
      const note = fallback.querySelector('p');
      if (note) note.textContent = message;
    }
    if (toggleButton) toggleButton.disabled = true;
    if (resetButton) resetButton.disabled = true;
  }

  function hideLoading() {
    if (loadWatchdog) {
      window.clearTimeout(loadWatchdog);
      loadWatchdog = null;
    }
    stage.dataset.ready = '1';
    delete stage.dataset.error;
    stage.classList.remove('is-error');
    stage.classList.add('is-ready');
    if (fallback) fallback.hidden = true;
    if (loading) {
      loading.classList.add('is-done');
      window.setTimeout(() => { loading.hidden = true; }, 500);
    }
    if (toggleButton) toggleButton.disabled = false;
    if (resetButton) resetButton.disabled = false;
    setAutoRotate(!prefersReducedMotion);
  }

  function resize() {
    const width = host.clientWidth;
    const height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) resize();
    },
    { threshold: 0.05 }
  );
  visibilityObserver.observe(stage);

  const loader = new GLTFLoader();

  loadWatchdog = window.setTimeout(() => {
    if (!stage.dataset.ready && !stage.dataset.error) {
      showFallback('Model wczytuje się zbyt długo. Sprawdź połączenie i odśwież stronę.');
    }
  }, 45000);

  loader.load(
    MODEL_URL,
    (gltf) => {
      model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;

      model.position.sub(center);
      model.scale.setScalar(2.85 / maxDimension);

      const scaledBox = new THREE.Box3().setFromObject(model);
      model.position.y += -1.18 - scaledBox.min.y;
      model.position.y += 0.02;

      model.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.material) {
          child.material.envMapIntensity = 0.7;
          child.material.needsUpdate = true;
        }
      });

      initialRotation.copy(model.rotation);
      scene.add(model);

      const finalBox = new THREE.Box3().setFromObject(model);
      ground = new THREE.Mesh(
        new THREE.CircleGeometry(1.75, 64),
        new THREE.MeshBasicMaterial({
          color: 0x3d3a2e,
          transparent: true,
          opacity: 0.09,
          depthWrite: false,
        })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = finalBox.min.y - 0.015;
      scene.add(ground);

      controls.target.set(0, 0.05, 0);
      controls.update();
      hideLoading();
      resize();
    },
    (event) => {
      if (!progressLabel || !progressBar) return;
      if (event && event.total > 0) {
        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
        progressLabel.textContent = `Układamy bonsai… ${percent}%`;
        progressBar.style.width = `${percent}%`;
      } else {
        progressLabel.textContent = 'Układamy bonsai…';
      }
    },
    (error) => {
      console.error('[Nawykly 3D] Nie udało się wczytać modelu:', error);
      showFallback('Nie udało się wczytać modelu bonsai. Upewnij się, że plik assets/bonsai.glb jest dostępny, a serwer zwraca go jako model/gltf-binary.');
    }
  );

  toggleButton.addEventListener('click', () => {
    setAutoRotate(!controls.autoRotate);
  });

  resetButton.addEventListener('click', () => {
    camera.position.copy(homePosition);
    controls.target.set(0, 0.05, 0);
    controls.update();
    if (model) model.rotation.copy(initialRotation);
    setAutoRotate(!prefersReducedMotion);
  });

  const hideHint = () => stage.classList.add('has-interacted');
  controls.addEventListener('start', hideHint);
  stage.addEventListener('pointerdown', hideHint, { once: true });

  stage.addEventListener('keydown', (event) => {
    if (!model) return;
    const key = event.key;

    if (key === ' ' || key === 'Spacebar') {
      event.preventDefault();
      setAutoRotate(!controls.autoRotate);
      hideHint();
      return;
    }

    if (key === 'Home' || key === '0') {
      event.preventDefault();
      camera.position.copy(homePosition);
      controls.target.set(0, 0.05, 0);
      controls.update();
      model.rotation.copy(initialRotation);
      hideHint();
      return;
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      setAutoRotate(false);
      const direction = key === 'ArrowLeft' ? 1 : -1;
      const offset = camera.position.clone().sub(controls.target);
      const angle = direction * 0.12;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const x = offset.x * cos - offset.z * sin;
      const z = offset.x * sin + offset.z * cos;
      camera.position.set(controls.target.x + x, camera.position.y, controls.target.z + z);
      controls.update();
      hideHint();
      return;
    }

    if (key === '+' || key === '=' || key === '-' || key === '_') {
      event.preventDefault();
      const distance = camera.position.distanceTo(controls.target);
      const factor = key === '+' || key === '=' ? 0.9 : 1.1;
      const nextDistance = THREE.MathUtils.clamp(distance * factor, controls.minDistance, controls.maxDistance);
      const direction = camera.position.clone().sub(controls.target).normalize();
      camera.position.copy(controls.target).add(direction.multiplyScalar(nextDistance));
      controls.update();
      hideHint();
    }
  });

  window.addEventListener('resize', resize);

  renderer.setAnimationLoop(() => {
    const elapsed = clock.getElapsedTime();

    if (model && !prefersReducedMotion) {
      model.rotation.z = initialRotation.z + Math.sin(elapsed * 0.45) * 0.012;
    }

    controls.update();

    if (isVisible) {
      renderer.render(scene, camera);
    }
  });
}
