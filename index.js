async function ready(idMap) {
    const inputField = document.getElementById("input");
    inputField.value = null; //unset this
    
    document.getElementById("apploading").style.display = "none";
    Array.from(document.getElementsByClassName("appcontent")).map(el => {
	el.style.display = "block";
    });
    
    const handleObjection = idMap => () => {
	if (inputField.files.length === 0) { return; }
	
	const file = inputField.files[0];
	const reader = new FileReader();
	reader.onload = event => {
	    console.log(inputField.value);
	    const fileName = new String(inputField.value)
		  .substring(inputField.value.lastIndexOf('/') + 1)
		  .substring(inputField.value.lastIndexOf('\\') + 1);
	    console.log(fileName);
	    const basename = fileName.substring(0, fileName.lastIndexOf("."));
	    console.log(basename);
	    loadObjection(idMap, event.target.result, basename);
	};
	reader.readAsText(file);
    };
    
    inputField.addEventListener("change", handleObjection(idMap), false);
}

async function loadObjection(idMap, fileContent, objName) {
    try {
	const objection = JSON.parse(atob(fileContent));
	let characters = [];

	for (s in objection) {
	    const chr = idMap[objection[s].poseId];

	    if (chr === undefined) {
		document.getElementById("mappingerror").style.display = "block";
	    } else if (characters.find(el => el.name === chr.name && el.side === chr.side) === undefined) {
		characters.push(chr);
	    }
	}

	//Show off a little, to prove we're doing something.
	document.getElementById("numscenes").innerHTML = objection.length;
	
	document.getElementById("upload").style.display = "none";
	Array.from(document.getElementsByClassName("uploaded")).map(el => {
	    el.style.display = "block";
	});

	const nickAndExport = (idMap, objection, objName) => async () => {
	    const charNicks = await parseCharacterTable();

	    console.log(charNicks);

	    const newObjection = objection.map(scene => {
		try {
		    let {side, name} = idMap[scene.poseId];
		    console.log(side,name);
		    if (charNicks[side] != undefined && charNicks[side][name] != undefined) {
			return {...scene, username: charNicks[side][name]};
		    } else {
			return scene;
		    }
		} catch {
		    return scene;
		}
	    });

	    const newObjectionFile = new Blob([btoa(JSON.stringify(newObjection))], {
		type: "text/plain;charset=utf-8"
	    });
	    saveAs(newObjectionFile, objName + " (nicknamed).objection");
	};

	document.getElementById("export")
	    .addEventListener("click", nickAndExport(idMap, objection, objName), "false");

	//console.log(characters);
	const table = document.getElementById("chartable")
	characters.map(chr => {
	    let row = table.insertRow();
	    for (key in chr) {
		let cell = row.insertCell();
		cell.appendChild(document.createTextNode(chr[key]));
	    }
	    let inputField = document.createElement("input");
	    inputField.setAttribute("type", "text");
	    row.insertCell().appendChild(inputField);
	});
	const tableDiv = document.getElementById("charactertable");
	tableDiv.scrollTop = 0;
	tableDiv.style.display = "block";
    } catch {
	document.getElementById("input").value = null;
	document.getElementById("failedupload").style.display = "block";
    }
}

async function parseCharacterTable() {
    const table = document.getElementById("chartable");

    const tds = document.getElementById("chartable").querySelectorAll("td");
    let charNicks = {};

    for (i=0;i<tds.length;i+=3) {
	let side = tds[i].textContent;
	let chr = tds[i+1].textContent;
	let nick = tds[i+2].childNodes[0].value;


	if (nick != undefined) {
	    if (charNicks[side] === undefined) {
		charNicks[side] = {};
	    }
	    charNicks[side][chr] = nick;
	}
    }

    return charNicks;
}

fetch("/mapping.json", { headers: { "Content-Type": "application/json; charset=utf-8" }})
    .then(res => res.json())
    .then(mappings => {
	let idMap = [];
	for (c in mappings) {
	    for (i in mappings[c].ids) {
		idMap[mappings[c].ids[i]] = {
		    side: mappings[c].side,
		    name: mappings[c].name
		};
	    }
	}
	ready(idMap)
    })
