/******************************************************************
 * ESP32 IP
 ******************************************************************/
const ESP_IP = "192.168.4.1";

/******************************************************************
 * Send Command
 ******************************************************************/
async function sendCommand(command, value = "") {

  try {

    let url =
    `http://${ESP_IP}/control?cmd=${command}`;

    if(value !== "") {

      url += `&value=${value}`;

    }

    await fetch(url);

    document.getElementById("status")
    .innerHTML =
    "Connected";

  }

  catch(error) {

    document.getElementById("status")
    .innerHTML =
    "Disconnected";

    console.error(error);

  }

}

/******************************************************************
 * Setup Virtual Joystick
 ******************************************************************/
function setupJoystick(baseId, stickId, callback){

  const base =
  document.getElementById(baseId);

  const stick =
  document.getElementById(stickId);

  let dragging = false;

  /****************************************************************
   * Touch Start
   ****************************************************************/
  base.addEventListener("touchstart", () => {

    dragging = true;

  });

  /****************************************************************
   * Touch End
   ****************************************************************/
  base.addEventListener("touchend", () => {

    dragging = false;

    /**************************************************************
     * Return Stick To Center
     **************************************************************/
    stick.style.left = "50%";

    stick.style.top = "50%";

    stick.style.transform =
    "translate(-50%, -50%)";

    callback(0,0);

    sendCommand("stop");

  });

  /****************************************************************
   * Touch Move
   ****************************************************************/
  base.addEventListener("touchmove", (e) => {

    if(!dragging) return;

    e.preventDefault();

    const rect =
    base.getBoundingClientRect();

    const touch =
    e.touches[0];

    let x =
    touch.clientX - rect.left;

    let y =
    touch.clientY - rect.top;

    const centerX =
    rect.width / 2;

    const centerY =
    rect.height / 2;

    let dx = x - centerX;

    let dy = y - centerY;

    /**************************************************************
     * Limit Radius
     **************************************************************/
    const maxDistance = 80;

    const distance =
    Math.sqrt(dx*dx + dy*dy);

    if(distance > maxDistance){

      dx =
      dx / distance * maxDistance;

      dy =
      dy / distance * maxDistance;

    }

    /**************************************************************
     * Move Stick
     **************************************************************/
    stick.style.left =
    `${centerX + dx}px`;

    stick.style.top =
    `${centerY + dy}px`;

    stick.style.transform =
    "translate(-50%, -50%)";

    /**************************************************************
     * Normalize
     **************************************************************/
    let nx =
    Math.round((dx / maxDistance) * 100);

    let ny =
    Math.round((dy / maxDistance) * 100);

    callback(nx, ny);

  });

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
     * Update UI
     **************************************************************/
    document.getElementById("throttleText")
    .innerHTML =
    `${Math.abs(y)}%`;

    document.getElementById("yawText")
    .innerHTML =
    `${x}°`;

    /**************************************************************
     * THROTTLE
     **************************************************************/
    let throttle =
    1200 + (-y * 5);

    sendCommand(
      "throttle",
      throttle
    );

    /**************************************************************
     * YAW
     **************************************************************/
    if(x < -20){

      sendCommand("yaw_left");

    }

    else if(x > 20){

      sendCommand("yaw_right");

    }

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
     * Update UI
     **************************************************************/
    document.getElementById("rollText")
    .innerHTML =
    `${x}°`;

    document.getElementById("pitchText")
    .innerHTML =
    `${-y}°`;

    /**************************************************************
     * PITCH
     **************************************************************/
    if(y < -20){

      sendCommand("forward");

    }

    else if(y > 20){

      sendCommand("backward");

    }

    /**************************************************************
     * ROLL
     **************************************************************/
    if(x < -20){

      sendCommand("left");

    }

    else if(x > 20){

      sendCommand("right");

    }

  }

);