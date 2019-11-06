let faceMatcher;

function loadJSON(path, success, error) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function()
    {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                if (success)
                    success(JSON.parse(xhr.responseText));
            } else {
                if (error)
                    error(xhr);
            }
        }
    };
    xhr.open("GET", path, true);
    xhr.send();
}

async function loadFaceAPI() {

    await faceapi.loadSsdMobilenetv1Model('./models')
    await faceapi.loadFaceLandmarkTinyModel('./models')
    await faceapi.loadFaceRecognitionModel('./models')

    loadJSON('./models/agents_descriptors.json',
        function(data) {
            let labeledDescriptors = []

            for(agent of data) {
                labeledDescriptors.push(
                    new faceapi.LabeledFaceDescriptors(
                        agent["_label"],
                        [new Float32Array(agent["_descriptors"])]
                    )
                )
            }

            faceMatcher = new faceapi.FaceMatcher(labeledDescriptors)

            document.getElementById('status').innerHTML = "Agents loaded, ready to query image";
        },
        function(xhr) {
            console.error(xhr);
        }
    );
}

async function run() {    
    const results = await faceapi
    .detectAllFaces(document.getElementById('preview'))
    .withFaceLandmarks(true)
    .withFaceDescriptors()

    let haveMatches = false;

    results.forEach(fd => {
        const bestMatch = faceMatcher.findBestMatch(fd.descriptor);

        if(bestMatch["_label"] != "unknown") {
            document.getElementById('status').innerHTML = "We got a match!! This is " + bestMatch["_label"].toString();    
            haveMatches = true;
        }
    })

    if(!haveMatches) {
        document.getElementById('status').innerHTML = "Unfortunately no agent could be found";
    }
}


function previewFile() {
    document.getElementById('status').innerHTML = "Attempting to recognize agent";

    var preview = document.querySelector('img');
    var file    = document.querySelector('input[type=file]').files[0];
    var reader  = new FileReader();

    reader.onloadend = function () {
        preview.src = reader.result;
        run();
    }

    if (file) {
        reader.readAsDataURL(file);
    } else {
        preview.src = "";
    }
}

loadFaceAPI();