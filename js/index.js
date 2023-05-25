let container, scene, camera, renderer, controls;
let orthoCamera;
let activeCamera;
let keyboard = new THREEx.KeyboardState();
let clock = new THREE.Clock();
let airplane;
let collideMeshList = [];
let toruses = [];
let message = document.getElementById("message");
let crash = false;
let score = 0;
let scoreText = document.getElementById("score");
let id = 0;
let crashId = "";
let lastCrashId = "";
let flashlightOn = false;
let musicPlaying = true;

// Create AudioContext
const audioContext = new AudioContext();
// Create GainNodes
const gainNodeBackground = audioContext.createGain();
const gainNodeAirplane = audioContext.createGain();

init();
animate();
createAirplane();

function createAirplane() {
  const airplane = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.5, 5, 32),
    new THREE.MeshPhongMaterial({ color: 0x00e8ff })
  );
  body.rotation.x = Math.PI / 2;
  body.position.z = 1.5;
  body.name = "body";
  airplane.add(body);

  // Add top wing
  const topWing = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.2, 1),
    new THREE.MeshPhongMaterial({ color: 0xffff00 })
  );
  topWing.position.set(0, 0.6, 1.5);
  airplane.add(topWing);

  // Add bottom wing
  const bottomWing = new THREE.Mesh(
    new THREE.BoxGeometry(4, 0.2, 1),
    new THREE.MeshPhongMaterial({ color: 0xffff00 })
  );
  bottomWing.position.set(0, -0.6, 1.5);
  airplane.add(bottomWing);

  // Add biplane spars
  for (let i = -1; i <= 1; i += 2) {
    const sparGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
    const sparMaterial = new THREE.MeshPhongMaterial({ color: 0x00e8ff });
    const spar = new THREE.Mesh(sparGeometry, sparMaterial);
    spar.rotation.y = 90;
    spar.position.set(i * 1.5, 0, 1.5);
    airplane.add(spar);

    // Add second pair of spars closer to the plane
    const innerSparGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2);
    const innerSparMaterial = new THREE.MeshPhongMaterial({ color: 0x00e8ff });
    const innerSpar = new THREE.Mesh(innerSparGeometry, innerSparMaterial);
    innerSpar.rotation.z = 50;
    innerSpar.position.set(i * 1.5, 0, 1.5);
    airplane.add(innerSpar);
  }

  // Add elevator
  const elevator = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.2, 1),
    new THREE.MeshPhongMaterial({ color: 0xffff00 })
  );
  elevator.position.set(0, 0.1, 4);
  airplane.add(elevator);

  // Add rudder
  const rudder = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.8, 1),
    new THREE.MeshPhongMaterial({ color: 0xffff00 })
  );
  rudder.position.set(0, 0.3, 4);
  airplane.add(rudder);

  // Add propeller
  const propeller = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 2, 0.2),
    new THREE.MeshPhongMaterial({ color: 0xcccccc })
  );
  propeller.position.set(0, -0.3, -2.5);
  propeller.name = "propeller";
  airplane.add(propeller);

  return airplane;
}

function createFlashlight() {
  let flashlight = new THREE.SpotLight(0xffffff, 1);
  flashlight.position.set(0, 0, 0);
  flashlight.castShadow = true;
  flashlight.name = "flashlight";

  // Change the following parameters to customize the flashlight
  flashlight.angle = Math.PI / 4;
  flashlight.penumbra = 0.2;
  flashlight.distance = 200;
  flashlight.decay = 2;

  // Add the flashlight to the child body of the plane
  airplane.getObjectByName("body").add(flashlight);
  console.log(flashlight);
}

function toggleFlashlight() {
  // Get the flashlight object
  const body = airplane.getObjectByName("body");
  const flashlight = body.getObjectByName("flashlight");

  // Toggle the flashlight on or off
  if (flashlightOn) {
    flashlight.intensity = 0; // Turn off the flashlight
    flashlightOn = false;
  } else {
    flashlight.intensity = 10; // Turn on the flashlight
    flashlightOn = true;
  }
  console.log("toggleFlashlight() called");
}


function loadBackgroundMusic() {
  // Load audio file
  fetch("/assets/sound/backgroundMusic.mp3")
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      // Create AudioBufferSourceNode
      source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      gainNodeBackground.gain.value = 0.2;

      // Connect nodes
      source.connect(gainNodeBackground);
      gainNodeBackground.connect(audioContext.destination);

      // Start playback
      source.start();
    });
}

function loadAirplaneSound() {
  // Load audio file
  fetch("/assets/sound/airplanesound.mp3")
    .then((response) => response.arrayBuffer())
    .then((arrayBuffer) => audioContext.decodeAudioData(arrayBuffer))
    .then((audioBuffer) => {
      // Create AudioBufferSourceNode
      source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.loop = true;

      gainNodeAirplane.gain.value = 0.5;

      // Connect nodes
      source.connect(gainNodeAirplane);
      gainNodeAirplane.connect(audioContext.destination);

      // Start playback
      source.start();
    });
}

// Create a new function called toggleMusic that will toggle the music on and off
function toggleMusic() {
  if (musicPlaying) {
    gainNode.gain.value = 0; // Turn off the music
    musicPlaying = false;
  } else {
    gainNode.gain.value = 0.1; // Turn on the music
    musicPlaying = true;
  }
}
function onKeyDown(event) {
  if (event.keyCode === 76) {
    // "L" key
    toggleFlashlight();
  } else if (event.keyCode === 84) {
    // "T" key
    if (activeCamera === camera) {
      activeCamera = orthoCamera;
    } else {
      activeCamera = camera;
    }
  } else if (event.keyCode === 77) {
    // "M" key
    toggleMusic();
  }
}

function updateFlashlightPosition() {
  const body = airplane.getObjectByName("body");
  const flashlight = body.getObjectByName("flashlight");

  if (body) {
    // Update the position of the flashlight based on the body's position
    flashlight.position.copy(body.getWorldPosition());
  }
}



function init() {
  // Scene
  scene = new THREE.Scene();
  backgroundmusic = loadBackgroundMusic();
  airplaneSound = loadAirplaneSound();

  document.addEventListener("keydown", onKeyDown, false);

  // Perspective Camera
  let screenWidth = window.innerWidth;
  let screenHeight = window.innerHeight;
  camera = new THREE.PerspectiveCamera(
    45,
    screenWidth / screenHeight,
    1,
    20000
  );
  camera.position.set(0, 170, 400);

  //Orthographic Camera

  orthoCamera = new THREE.OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    window.innerHeight / 2,
    window.innerHeight / -2,
    1,
    20000
  );
  orthoCamera.position.set(0, 170, 400);

  activeCamera = camera;

  // Renderer
  if (Detector.webgl) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } else {
    renderer = new THREE.CanvasRenderer();
  }
  renderer.setSize(screenWidth, screenHeight);
  container = document.getElementById("ThreeJS");
  container.appendChild(renderer.domElement);

  THREEx.WindowResize(renderer, camera);
  controls = new THREE.OrbitControls(camera, renderer.domElement);



  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 20);
  directionalLight.position.set(1, 1, 1); // Set the position of the light
  scene.add(directionalLight);

  // Ambient Light
  const ambientLight = new THREE.AmbientLight(0xffffff, 1); // Color: white, Intensity: 0.5
  scene.add(ambientLight);

  //Lines
  let geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(-250, -1, -3000));
  geometry.vertices.push(new THREE.Vector3(-300, -1, 200));
  let material = new THREE.LineBasicMaterial({
    color: 0x6699ff,
    linewidth: 5,
    fog: true,
  });
  //line 1
  let line1 = new THREE.Line(geometry, material);
  scene.add(line1);
  geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(250, -1, -3000));
  geometry.vertices.push(new THREE.Vector3(300, -1, 200));
  //line 2
  let line2 = new THREE.Line(geometry, material);
  scene.add(line2);

  airplane = createAirplane();
  airplane.position.set(0, 25, -20);
  airplane.scale.set(45, 45, 45);
  scene.add(airplane);
  createFlashlight();
}

function animate() {
  requestAnimationFrame(animate);
  update();
  updateFlashlightPosition();
  // Render main view
  renderer.render(scene, activeCamera);

  airplane.getObjectByName("propeller").rotation.z += 100;

  // Add rotation and movement to toruses
  toruses.forEach((torus) => {
    torus.rotation.y += 0.006;
    torus.position.x += Math.sin(torus.position.z / 100) * 0.5;
    torus.position.y += Math.sin(torus.position.z / 100) * 0.5;
  });

  // Animate propeller
}

function update() {
  let delta = clock.getDelta();
  let moveDistance = 200 * delta;

  if (keyboard.pressed("left") || keyboard.pressed("A")) {
    if (airplane.position.x > -270) airplane.position.x -= moveDistance;
    if (camera.position.x > -150) {
      camera.position.x -= moveDistance * 0.6;
      if (camera.rotation.z > (-5 * Math.PI) / 180) {
        camera.rotation.z -= (0.2 * Math.PI) / 180;
      }
    }
  }
  if (keyboard.pressed("right") || keyboard.pressed("D")) {
    if (airplane.position.x < 270) airplane.position.x += moveDistance;
    if (camera.position.x < 150) {
      camera.position.x += moveDistance * 0.6;
      if (camera.rotation.z < (5 * Math.PI) / 180) {
        camera.rotation.z += (0.2 * Math.PI) / 180;
      }
    }
  }
  if (keyboard.pressed("up") || keyboard.pressed("W")) {
    airplane.position.z -= moveDistance;
  }
  if (keyboard.pressed("down") || keyboard.pressed("S")) {
    airplane.position.z += moveDistance;
  }

  if (
    !(
      keyboard.pressed("left") ||
      keyboard.pressed("right") ||
      keyboard.pressed("A") ||
      keyboard.pressed("D")
    )
  ) {
    delta = camera.rotation.z;
    camera.rotation.z -= delta / 10;
  }

  let originPoint = airplane.position.clone();

  for (let i = 0; i < airplane.children.length; i++) {
    let child = airplane.children[i];
    for (
      let vertexIndex = 0;
      vertexIndex < child.geometry.vertices.length;
      vertexIndex++
    ) {
      let localVertex = child.geometry.vertices[vertexIndex].clone();
      let globalVertex = localVertex.applyMatrix4(child.matrixWorld);
      let directionVector = globalVertex.sub(airplane.position);

      let ray = new THREE.Raycaster(
        originPoint,
        directionVector.clone().normalize()
      );
      let collisionResults = ray.intersectObjects(collideMeshList);
      if (
        collisionResults.length > 0 &&
        collisionResults[0].distance < directionVector.length()
      ) {
        crashId = collisionResults[0].object.name;
        crash = true;
        break;
      } else {
        crash = false;
      }
    }

    if (crash) {
      console.log("Crash");
      if (crashId !== lastCrashId) {
        score -= 10;
        lastCrashId = crashId;
      }
      // document.getElementById('explode_sound').play()
    }

    if (Math.random() < 0.03 && toruses.length < 1) {
      makeRandomTorus();
    }

    for (let i = 0; i < toruses.length; i++) {
      if (toruses[i].position.z > camera.position.z) {
        scene.remove(toruses[i]);
        toruses.splice(i, 1);
        collideMeshList.splice(i, 1);
      } else {
        toruses[i].position.z += 3;
      }
    }

    score += 0.01;
    scoreText.innerText = "Score: " + Math.floor(score);
  }

  function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  function makeRandomTorus() {
    let a = getRandomInt(150, 200),
      b = getRandomInt(40, 80),
      c = getRandomInt(10, 30),
      d = 20;

    let geometry = new THREE.TorusGeometry(a, b, c, d);

    let material = new THREE.MeshBasicMaterial({
      color: Math.random() * 0xffffff,
    });

    let object = new THREE.Mesh(geometry, material);

    object.position.x = getRandomArbitrary(-250, 250);
    object.position.y = b / 2;
    object.position.z = getRandomArbitrary(-2500, -3500);
    toruses.push(object);
    object.name = "torus_" + id;
    id++;
    collideMeshList.push(object);

    scene.add(object);
  }
}
