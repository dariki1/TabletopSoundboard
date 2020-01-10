const buttons: { button: HTMLButtonElement, sources: string[] }[] = [];
const ambience: HTMLAudioElement = <HTMLAudioElement>document.getElementById("ambience");
const effect: HTMLAudioElement = <HTMLAudioElement>document.getElementById("effect");

async function loadAudioPath(path: string): Promise<string[]> {
	return new Promise(function(res, rej) {
		makeRequest("GET", path, 'document').then((value: XMLHttpRequest) => {
			let ret: string[] = [];
			let elements = (<Document>(value.responseXML)).children[0].children[1].children[1].children[1].children;
			for (let x = 1; x < elements.length; x++) {
				if (elements[x].children[0].children[0].innerHTML.match(/\.(mp3)$/)) {
					ret.push(path+"/"+elements[x].children[0].children[0].innerHTML);
				}
			}
			res(ret);
		})
	});
}

async function loadAudio(sounds: {ambience: string[], soundEffects: string[]}) {
	let promises = <Promise<string[] | null | void>[]>[];
	promises.push(loadAudioPath("/resources/sounds/ambience").then((value: string[]) => {
		return new Promise((res) => {
			for (let e of value) {
				sounds.ambience.push(e);
			}
			res();
		});		 
	}));
	promises.push(loadAudioPath("/resources/sounds/soundEffects").then((value: string[]) => {
		return new Promise((res) => {
			for (let e of value) {
				sounds.soundEffects.push(e);
			}
			res();
		});
	}));
	await Promise.all(promises);
}

function makeRequest(method: string, url: string, responseType: XMLHttpRequestResponseType): Promise<XMLHttpRequest> {
	return new Promise(function(res, rej) {
		let xhr = new XMLHttpRequest();
		xhr.open(method, url);
		xhr.responseType = responseType;
		xhr.onload = function() {
			if (this.status >= 200 && this.status < 300) {
				res(xhr);
			} else {
				rej({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		}
		xhr.onerror = function() {
			rej({
				status: this.status,
				statusText: xhr.statusText
			});
		}
		xhr.send();
	});
}

function addButtons(buttonParent: HTMLElement, sources: string[], audioParent: HTMLAudioElement) {	
	for (let source of sources) {
		let name = ((source.match(/\/([a-z]| |-)+\d*\.mp3/i)||[])[0].match(/([a-z]| |-)+/i)||[])[0];
		let b = buttons.filter((el) => el.button.innerHTML === name)[0];
		if (b === undefined) {// If the sound has not been registered yet
			let nBut = document.createElement("button");
			nBut.innerHTML = name;
			b = buttons[buttons.push({button: nBut, sources: [source]})-1];
			b.button.onclick = () => {
				if (!audioParent.paused) {
					audioParent.pause();
					return;
				}
				audioParent.pause();
				audioParent.currentTime = 0;
				(<HTMLSourceElement>audioParent.children[0]).src = b.sources[Math.floor(Math.random()*b.sources.length)];
				audioParent.load();
				audioParent.play();
			}			
			buttonParent.appendChild(b.button);
		} else {
			b.sources.push(source);
		}
	}
}

(async function init() {
	const sounds = {
		ambience: <string[]>[],
		soundEffects: <string[]>[]
	};
	await loadAudio(sounds);

	addButtons(document.body, sounds.ambience, ambience);
	addButtons(document.body, sounds.soundEffects, effect);
})();