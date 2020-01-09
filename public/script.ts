const buttons: { button: HTMLButtonElement, sources: HTMLSourceElement[] }[] = [];
const ambience: HTMLAudioElement = <HTMLAudioElement>document.getElementById("ambience");

async function loadAudioPath(path: string): Promise<HTMLSourceElement[]> {
	return new Promise(function(res, rej) {
		makeRequest("GET", path, 'document').then((value: XMLHttpRequest) => {
			let ret: HTMLSourceElement[] = [];
			let elements = (<Document>(value.responseXML)).children[0].children[1].children[1].children[1].children;
			for (let x = 1; x < elements.length; x++) {
				if (elements[x].children[0].children[0].innerHTML.match(/\.(mp3)$/)) {
					let source = document.createElement('source');
					source.src = path+"/"+elements[x].children[0].children[0].innerHTML;
					source.type = "audio/mpeg";
					ret.push(source);
				}
			}
			res(ret);
		})
	});
}

async function loadAudio(sounds: {ambience: HTMLSourceElement[], soundEffects: HTMLSourceElement[]}) {
	let promises = <Promise<HTMLSourceElement[] | null | void>[]>[];
	promises.push(loadAudioPath("/resources/sounds/ambience").then((value: HTMLSourceElement[]) => {
		for (let e of value) {
			sounds.ambience.push(e);
		}
	}));
	promises.push(loadAudioPath("/resources/sounds/soundEffects").then((value: HTMLSourceElement[]) => {
		for (let e of value) {
			sounds.soundEffects.push(e);
		}
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

function addButtons(parent: HTMLElement, sources: HTMLSourceElement[]) {
	for (let source of sources) {
		let name = ((source.src.match(/\/([a-z]|%20|-)+\d*\.mp3/i)||[])[0].match(/([a-z]|%20|-)+/i)||[])[0].replace("%20", " ");
		let b = buttons.filter((el) => el.button.innerHTML === name)[0];
		if (b === undefined) {// If the sound has not been registered yet
			let nBut = document.createElement("button");
			nBut.innerHTML = name;
			b = buttons[buttons.push({button: nBut, sources: [source]})-1];
			b.button.onclick = () => {
				let audio: HTMLAudioElement = <HTMLAudioElement>document.createElement("AUDIO");
				audio.appendChild(b.sources[Math.floor(Math.random()*b.sources.length)]);
				audio.style.display = 'hidden';
				document.body.appendChild(audio);
				audio.play();
				audio.onended = () => {
					audio.remove();
				}
			}			
			parent.appendChild(b.button);
		} else {
			b.sources.push(source);
		}
	}
}

(async function init() {
	const sounds = {
		ambience: <HTMLSourceElement[]>[],
		soundEffects: <HTMLSourceElement[]>[]
	};
	await loadAudio(sounds);

	addButtons(document.body, sounds.ambience);
	addButtons(document.body, sounds.soundEffects);
})();