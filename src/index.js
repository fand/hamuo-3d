const THREE = require('three');
const OrbitControls = require('three-orbit-controls')(THREE)
require('./obj-loader')(THREE);
require('./mtl-loader')(THREE);

let startTime = 0;

const canvas = document.getElementById('canvas')

const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 1.0);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(0, 1, 3);
camera.lookAt(new THREE.Vector3());
const controls = new OrbitControls(camera)
controls.autoRotate = true;

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const scene = new THREE.Scene();

const uniforms = THREE.UniformsUtils.merge([
  {
    time: { type: 'f', value: 0 },
    resolution: { type: 'v2', value: { x: window.innerWidth, y: window.innerHeight } },
    poku: { type: 't', value: new THREE.Texture() },
  },
  THREE.UniformsLib.common,
]);

const tloader = new THREE.TextureLoader();
tloader.load()
tloader.load('./poku.jpg', t => {
  uniforms.poku.value = t;
});

const hamuMaterial = new THREE.ShaderMaterial({
  // vertexShader: require('./vert'),
  vertexShader: `
    varying vec2 vUv;
    uniform mat3 uvTransform;
    uniform float time;

    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      // gl_Position.xz *= ;

      // Rotate
      float t = sin(time + gl_Position.y * 1.5);
      float c = cos(t), s = sin(t);
      gl_Position.xz = mix(
        gl_Position.xy,
        mat2(c, -s, s, -c) * gl_Position.xz * (
          1. + sin(time * 3. + gl_Position.y * 90.) * sin(time + gl_Position.y * 40.) * .2
        ),
        (1. - (cos(time * .3) * .5 + .5))
      );

      vUv = (uvTransform * vec3(uv, 1)).xy;
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform sampler2D map;
    uniform sampler2D poku;
    uniform vec2 resolution;
    varying vec2 vUv;

    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      gl_FragColor = (
        texture2D(map, vUv) *
        (1. - (1. - texture2D(poku, fract(uv * 2. + time * .2))) * (1. - (cos(time * .3) * .5 + .5)))
      );
    }
  `,
  uniforms: uniforms,
});

const mtlLoader = new THREE.MTLLoader();
const objLoader = new THREE.OBJLoader();

if (0) {
  objLoader.load('./hamuo/hamuo.obj', (group) => {
    const obj = group.children[0];
    obj.geometry = fixObj(obj.geometry);

    scene.add(obj);
    canvas.style.display = 'block';
    render();
  });
} else {
  mtlLoader.setPath('./hamuo/');
  mtlLoader.load('./materials.mtl', (matl) => {
    matl.preload();
    objLoader.setMaterials(matl);
    objLoader.load('./hamuo/hamuo.obj', (group) => {
      group.children.forEach(o => {
        o.geometry = fixObj(o.geometry);
        uniforms.map.value = o.material.map;
        o.material = hamuMaterial;
      });
      scene.add(group);
      canvas.style.display = 'block';
      startTime = Date.now() / 1000;
      render();
    });
  });
}

function render() {
  uniforms.time.value = Date.now() / 1000 - startTime;

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}

function fixObj(geo) {
    geo.computeBoundingSphere();
    const offset = geo.boundingSphere.center;
    const scale = 1 / geo.boundingSphere.radius;
    geo.scale(scale, scale, scale);
    geo.translate(-offset.x, -offset.y, -offset.z);
    return geo;
}
