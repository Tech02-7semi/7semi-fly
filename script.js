// script.js

/******************************************************************
 * ESP32 IP
 ******************************************************************/
const ESP_IP = "192.168.4.1";

/******************************************************************
 * UI ELEMENTS
 ******************************************************************/
const statusText =
document.getElementById("status");

const throttleText =
document.getElementById("throttleText");

const rollText =
document.getElementById("rollText");

const pitchText =
document.getElementById("pitchText");

const yawText =
document.getElementById("yawText");

const batteryText =
document.getElementById("batteryText");

/******************************************************************
 * CONTROL STATE
 ******************************************************************/
const controlState = {

  throttle:0,
  roll:0,
  pitch:0,
  yaw:0

};

/******************************************************************
 * DEADZONE
 ******************************************************************/
function applyDeadzone(value, zone = 10){

  return Math.abs(value) < zone
  ? 0
  : value;

}

/******************************************************************
 * SEND CONTROLS
 ******************************************************************/
async function sendControls(){

  try{

    const url =
    `http://${ESP_IP}/control?` +
    `thr=${controlState.throttle}` +
    `&roll=${controlState.roll}` +
    `&pitch=${controlState.pitch}` +
    `&yaw=${controlState.yaw}`;

    await fetch(url);

    statusText.innerHTML =
    "Connected";

  }

  catch(error){

    statusText.innerHTML =
    "Disconnected";

    console.error(error);

  }

}

/******************************************************************
 * SEND LOOP
 ******************************************************************/
setInterval(() => {

  sendControls();

}, 50);

/******************************************************************
 * TELEMETRY
 ******************************************************************/
async function updateTelemetry(){

  try{

    const response =
    await fetch(
      `http://${ESP_IP}/telemetry`
    );

    const data =
    await response.json();

    batteryText.innerHTML =
    `${data.battery}V`;

  }

  catch(error){

    console.error(error);

  }

}

setInterval(updateTelemetry, 2000);

/******************************************************************
 * EMERGENCY STOP
 ******************************************************************/
async function emergencyStop(){

  controlState.throttle = 0;
  controlState.roll = 0;
  controlState.pitch = 0;
  controlState.yaw = 0;

  throttleText.innerHTML = "0%";
  rollText.innerHTML = "0°";
  pitchText.innerHTML = "0°";
  yawText.innerHTML = "0°";

  try{

    await fetch(
      `http://${ESP_IP}/stop`
    );

  }

  catch(error){

    console.error(error);

  }

}

document
.getElementById("stopBtn")
.addEventListener(
  "click",
  emergencyStop
);

/******************************************************************
 * JOYSTICK
 ******************************************************************/
function setupJoystick(
  baseId,
  stickId,
  callback
){

  const base =
  document.getElementById(baseId);

  const stick =
  document.getElementById(stickId);

  let dragging = false;

  /****************************************************************
   * POINTER DOWN
   ****************************************************************/
  base.addEventListener(
    "pointerdown",
    () => {

      dragging = true;

    }
  );

  /****************************************************************
   * POINTER UP
   ****************************************************************/
  window.addEventListener(
    "pointerup",
    () => {

      dragging = false;

      stick.style.left = "50%";
      stick.style.top = "50%";

      callback(0,0);

    }
  );

  /****************************************************************
   * POINTER MOVE
   ****************************************************************/
  window.addEventListener(
    "pointermove",
    (e) => {

      if(!dragging) return;

      const rect =
      base.getBoundingClientRect();

      const centerX =
      rect.width / 2;

      const centerY =
      rect.height / 2;

      let dx =
      e.clientX -
      rect.left -
      centerX;

      let dy =
      e.clientY -
      rect.top -
      centerY;

      const maxDistance = 80;

      const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );

      if(distance > maxDistance){

        dx =
        dx / distance *
        maxDistance;

        dy =
        dy / distance *
        maxDistance;

      }

      /************************************************************
       * MOVE STICK
       ************************************************************/
      stick.style.left =
      `${centerX + dx}px`;

      stick.style.top =
      `${centerY + dy}px`;

      /************************************************************
       * NORMALIZE
       ************************************************************/
      let nx =
      Math.round(
        (dx / maxDistance) * 100
      );

      let ny =
      Math.round(
        (dy / maxDistance) * 100
      );

      nx = applyDeadzone(nx);
      ny = applyDeadzone(ny);

      callback(nx, ny);

    }
  );

}

/******************************************************************
 * LEFT JOYSTICK
 * THROTTLE + YAW
 ******************************************************************/
setupJoystick(

  "leftBase",
  "leftStick",

  (x,y) => {

    /**************************************************************
     * THROTTLE
     **************************************************************/
    const throttle =
    Math.max(
      0,
      Math.min(
        100,
        Math.abs(y)
      )
    );

    controlState.throttle =
    throttle;

    /**************************************************************
     * YAW
     **************************************************************/
    controlState.yaw =
    x;

    /**************************************************************
     * UI
     **************************************************************/
    throttleText.innerHTML =
    `${throttle}%`;

    yawText.innerHTML =
    `${x}°`;

  }

);

/******************************************************************
 * RIGHT JOYSTICK
 * ROLL + PITCH
 ******************************************************************/
setupJoystick(

  "rightBase",
  "rightStick",

  (x,y) => {

    /**************************************************************
     * ROLL
     **************************************************************/
    controlState.roll =
    x;

    /**************************************************************
     * PITCH
     **************************************************************/
    controlState.pitch =
    -y;

    /**************************************************************
     * UI
     **************************************************************/
    rollText.innerHTML =
    `${x}°`;

    pitchText.innerHTML =
    `${-y}°`;

  }

);