const socket = io();

const clients = {};

function createClientCard(id) {
  const div = document.createElement('div');
  div.className = 'client';
  div.id = 'client-' + id;

  div.innerHTML = `
	<div class="color-box" id="color-${id}"></div>
	<strong>${id}</strong><br>
	X: <span id="x-${id}">-</span> / Y: <span id="y-${id}">-</span><br>
	Orientation: <span id="orient-${id}">-</span>°<br>
	<div>Active: <span id="actif-${id}">-</span></div>
	<div>Enregistré: <span id="enreg-${id}">-</span></div>
	<div>Bonus: <span id="bonus-${id}">-</span></div>
	<div>Actions:</div>
	<ul id="actions-${id}" style="padding-left: 1em; margin: 0;"></ul>
  `;

  document.body.appendChild(div);
  clients[id] = div;
}

socket.on('client_data', ({ id, data }) => {
  if (!clients[id]) createClientCard(id);

  if (typeof data.x === 'number' && typeof data.y === 'number') {
  document.getElementById(`x-${id}`).textContent = data.x.toFixed(1);
  document.getElementById(`y-${id}`).textContent = data.y.toFixed(1);
  }
  
	if (typeof data.orientation === 'number') {
	document.getElementById(`orient-${id}`).textContent = Math.round(data.orientation);
	}

	if (typeof data.actif === 'boolean') document.getElementById(`actif-${id}`).textContent = data.actif ? '✅' : '❌';

	if (typeof data.enregistre === 'boolean') document.getElementById(`enreg-${id}`).textContent = data.enregistre ? '✅' : '❌';

	if (typeof data.bonus === 'boolean') document.getElementById(`bonus-${id}`).textContent = data.bonus ? '✅' : '❌';



	const colorBox = document.getElementById(`color-${id}`);
	if (colorBox) {
		if (data.rgb && typeof data.rgb === 'object') {
			const { r, g, b } = data.rgb;
			colorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
		}
	} else {
		console.log(data);
	}


	const actionsList = document.getElementById(`actions-${id}`);

	function addActionLabel(label) {
		const li = document.createElement('li');
		const now = new Date();
		const timestamp = now.toLocaleTimeString();

		li.textContent = `${label} : ${timestamp}`;
		actionsList.appendChild(li);

		// Supprime après 10 secondes
		setTimeout(() => {
			li.remove();
	}, 10000);
	}

	if (data.press) addActionLabel('Press');

	if (data.action){
		if (data.action === 'action1') {
			console.log('Action 1 detected');
			addActionLabel('Action 1');
		} else if (data.action === 'action2') {
			console.log('Action 2 detected');
			addActionLabel('Action 2');
		} else {
			console.log('Unknown action:', data.action);
						addActionLabel('Unknown Action');

		}
	}


	// supprime la classe inactive si nécessaire
	clients[id].classList.remove('inactive');
});

socket.on('client_status', ({ id, active }) => {
  if (!clients[id]) return;
  clients[id].classList.toggle('inactive', !active);
});
