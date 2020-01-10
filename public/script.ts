const buttons: { button: HTMLButtonElement, sources: string[] }[] = [];
const ambience: HTMLAudioElement = <HTMLAudioElement>document.getElementById("ambience");
const effect: HTMLAudioElement = <HTMLAudioElement>document.getElementById("effect");

async function loadAudioPath(path: string): Promise<string[]> {
	return new Promise(function(res, rej) {
		makeRequest("GET", path, 'document').then((value: XMLHttpRequest) => {
			let ret: string[] = [];
			let elements = (<Document>(value.responseXML)).children[0].children[1].children[1].children[1].children;
			for (let x = 1; x < elements.length; x++) {
				if (elements[x].children[0].children[0].innerHTML.match(/\.(mp3|json)$/)) {
					ret.push(path+"/"+elements[x].children[0].children[0].innerHTML);
				}
			}
			res(ret);
		})
	});
}

async function loadAudio(sounds: {ambience: {sounds: string[], definitions: string}, soundEffects: {sounds: string[], definitions: string}}) {
	let promises = <Promise<string[] | null | void>[]>[];
	promises.push(loadAudioPath("/resources/sounds/ambience").then((value: string[]) => {
		return new Promise((res) => {
			for (let e of value) {
				if (e.match(/\.(json)$/)) {
					sounds.ambience.definitions = e;
					continue;
				}
				sounds.ambience.sounds.push(e);
			}
			res();
		});		 
	}));
	promises.push(loadAudioPath("/resources/sounds/soundEffects").then((value: string[]) => {
		return new Promise((res) => {
			for (let e of value) {
				if (e.match(/\.(json)$/)) {
					sounds.soundEffects.definitions = e;
					continue;
				}
				sounds.soundEffects.sounds.push(e);
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

async function addButtons(buttonParent: HTMLElement, sources: string[], audioParent: HTMLAudioElement, definitionsURL: string) {
	let definitions: {fileName:string, displayName:string}[] = [];

	await makeRequest("GET", definitionsURL, "json").then((value: XMLHttpRequest) => {
		definitions=value.response;
	});

	for (let source of sources) {
		let name: string = "";		
		let thisSound: string = (source.match(/\/([a-z]| |-)+\d*\.mp3/i)||[])[0].substr(1);

		for (let definition of definitions) {
			if (thisSound === definition.fileName) {
				name = definition.displayName;
				break;
			}
		}

		if (name === "") {
			console.warn("Loaded file with no definition; " + thisSound);
			name = (thisSound.match(/([a-z]| |-)+/i)||[])[0];
		}
		
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
		ambience: {
			sounds: <string[]>[],
			definitions: <string>""
		},
		soundEffects: {
			sounds: <string[]>[],
			definitions: <string>""
		}
	};
	await loadAudio(sounds);

	addButtons(document.body, sounds.ambience.sounds, ambience, sounds.ambience.definitions);
	addButtons(document.body, sounds.soundEffects.sounds, effect, sounds.soundEffects.definitions);
})();