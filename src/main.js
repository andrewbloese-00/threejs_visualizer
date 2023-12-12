/**
 * Author: Andrew Bloese , November 2023
 */

import '../style.css'
import { 
  PerspectiveCamera, Scene, WebGLRenderer,
  Mesh,CylinderGeometry, MeshBasicMaterial,
  DoubleSide, Vector3 
} from "three"
import { 
  BASS_LOW_HZ, BASS_HIGH_HZ, TREBLE_HIGH_HZ , TREBLE_LOW_HZ ,
   SPIN_SPEED, FFT_SIZE, PERSPECTIVES, CONTROLS,
   CENTRAL_RADIUS as r, COLORS as colors
} from './constants';


//need global access to camera for use in toggle perspective
const camera = new PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000)

//state
let isFullscreen = false;
let frequencyData = new Uint8Array(FFT_SIZE/2);
let perspective = 0;
let frame = 0;
let needsRecolor = Array(colors.length).fill(false), coloring;
let columns = []


//messy af need to come back and clean this shit up sometime
async function init(){

  //initialize audio context and analyser
  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;

  //threejs scene setup 
  const scene = new Scene();
  const renderer = new WebGLRenderer();
  document.body.appendChild(renderer.domElement);
  /**
   * @about a helper function to correct camera and renderer on window resize
   */
  function onResize(){
    renderer.setSize(window.innerWidth,window.innerHeight,true)
    camera.updateProjectionMatrix();
  }

  camera.position.set(...PERSPECTIVES[perspective].cameraConfig.position)
  camera.lookAt(new Vector3(0,30,0))
  window.addEventListener("resize",onResize)
  onResize() //set the size initially
  const { stream , error } = await getMicrophoneStream()
  //stop if there was an error getting microphone
  if(error) return 
  const audioSource = audioContext.createMediaStreamSource(stream)
  audioSource.connect(analyser);

  buildColumns();
  animate();



  function hzToFrequencyBin(lowHz, highHz){
    const div = audioContext.sampleRate/analyser.fftSize
    return { 
      start: Math.floor(lowHz/div),
      end: Math.ceil(highHz/div)
    }
  }

  /**
   * @about calculates the average bass/treble volume, as well as the bin and volume of the loudest bass and treble frequencies
   * @returns {{avgs: {bass:number, treble:number}, maxBass:{idx:number,val:number}, maxTreble:{idx:number,val:number}}}
   */
  function getBassAndTrebleStats() {
    const bassBounds = hzToFrequencyBin(BASS_LOW_HZ,BASS_HIGH_HZ)
    const trebleBounds = hzToFrequencyBin(TREBLE_LOW_HZ,TREBLE_HIGH_HZ);
    let sumTreble = 0,     sumBass = 0, maxBass = {idx:0,val:0}, maxTreble = {idx:0,val:0};
    for(let b = bassBounds.start; b <= bassBounds.end; b++){
        sumBass += frequencyData[b]
        if(frequencyData[b] > maxBass.val) {
            maxBass.val = frequencyData[b]
            maxBass.idx = b
        }
    }
    for(let t = trebleBounds.start; t <= trebleBounds.end; t++){
        sumTreble += frequencyData[t]
        if(frequencyData[t] > maxTreble.val) {
            maxTreble.val = frequencyData[t]
            maxTreble.idx = t; 
        }
    }

    const avgBass = sumBass / (bassBounds.end -bassBounds.start);
    const avgTreble = sumTreble / (trebleBounds.end - trebleBounds.start);
    return { 
      avgs: { bass: avgBass , treble: avgTreble},
      maxBass,
      maxTreble,
    }
  }


  //build the columns each at a distance of  "r" from the origin
  function buildColumns(){
    //iterate through each of the frequency bins
    for(let i = 0; i <= frequencyData.length; i++){
      //calculate the appropriate color based on the bin we are currently building
      let binColor = Math.floor(i / frequencyData.length * (colors.length-1))
      if(binColor === colors.length-1){
        continue
      }
      let column = new Mesh(
        new CylinderGeometry(1,5,1),
        new MeshBasicMaterial({
          color: colors[binColor],
          wireframe: true,
          side: DoubleSide
        })
      )
      //position the column
      let theta = i/frequencyData.length * 2*Math.PI 
      let rad = binColor / colors.length * 50
      let z = rad * Math.sin(theta)
      let x = rad * Math.cos(theta)

      column.position.set(x,0,z)
      //store column for easy access in "animate" function
      columns[i] = {column,c:binColor};
      //add the column to the scene
      scene.add(columns[i].column)
      //initial render
      renderer.render(scene,camera)

    }

  }

  //animation loop
  function animate(){
    frame+=SPIN_SPEED;
    analyser.getByteFrequencyData(frequencyData);
    //TODO  add another shape that changes based on average bass / treb using 'stats'

    //reposition and scale according to volume at current frequency bin
    for(let i = 0; i < columns.length; i++){
      let theta = i+frame/frequencyData.length * 2*Math.PI
      let c = (Math.floor(i / frequencyData.length * (colors.length)))
      let z = (r-2*c) * Math.sin(theta)
      let x = (r-2*c) * Math.cos(theta)
      columns[i].column.position.set(x,0,z)
      columns[i].column.position.y += frequencyData[i]/255*100/2
      columns[i].column.scale.y = frequencyData[i]/255*80
    }
    renderer.render(scene,camera)
    //60 frames per second 
    setTimeout(()=>{
      requestAnimationFrame(animate)
    },60/1000)
    colors.reverse()
  }

}

/**
 * @about attempts to grab microphone stream from user, requests permission. returns the stream or an error object
 * @returns {Promise<{error?:any, stream?:MediaStream}>}
 */
async function getMicrophoneStream(){
  try {
    const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:false})
    return { stream }
  } catch (error) {
    console.error(error)
    return { error }
  }
}


window.addEventListener("DOMContentLoaded",()=>{
  const title = document.querySelector("#title")
  const disclaimer = document.querySelector("#disclaimer")
  const activator = document.querySelector("#startBtn")
  // const detector = document.querySelector("#shazamBtn")
  const perspectiveButton = document.querySelector("#perspectiveButton")
  window.addEventListener("keypress",e=>{
    let key = e.key.toLowerCase();
    //toggle perspective
    if(key === CONTROLS.toggle_view){
      perspectiveButton.click()
    }
    //toggle fullscreen
    else if(key === CONTROLS.toggle_fullscreen){
      if(!isFullscreen){
        document.body.requestFullscreen()  
        isFullscreen = true
      } else { 
        document.exitFullscreen && document.exitFullscreen()
        isFullscreen = false
      }
    }
  })
  activator.addEventListener("click",async ()=>{
    disclaimer.remove()
    activator.remove();
    title.remove();
    await init(); 
    
    //toggle perspective with a button click
    perspectiveButton.addEventListener("click",()=>{
      perspective++;
      if(perspective > PERSPECTIVES.length-1){
        perspective = 0;
      }
      const position = PERSPECTIVES[perspective].cameraConfig.position;
      camera.position.set(...position);
      camera.lookAt(PERSPECTIVES[perspective].cameraConfig.look);
      perspectiveButton.textContent = PERSPECTIVES[perspective].icon;
    })


  })
  const savedThemesWrapper = document.querySelector("#saved_colors");
  //retrieve saved themes from localstorage
  const storedThemes = localStorage.getItem("savedThemes");



  if(!storedThemes){
    savedThemesWrapper.innerHTML = `<p id="empty_msg">Saved Themes will show up here!</p>`
  } else { 
    const themes = JSON.parse(storedThemes)
    for(let t = 0; t < themes.length; t++) {
      const toggler = document.createElement("button")
      const deletor = document.createElement("button")
      const parent = document.createElement('div')
      parent.className="theme-option"
     
      deletor.textContent = "❌"
      deletor.addEventListener("click", () => {
        themes.splice(t,1);
        localStorage.setItem("savedThemes", JSON.stringify(themes));
        parent.remove()

      })

      toggler.textContent = themes[t].name
      toggler.addEventListener("click", () => {
        for(let c = 0; c < colors.length; c++) {
          colors[c] = themes[t].colors[c];
        }
        for(let i = 0; i < columns.length; i++ ){
          let c = (Math.floor(i / frequencyData.length * (colors.length)))
          columns[i].column.material.color.set(colors[c])
        }
      })

      parent.appendChild(toggler);
      parent.appendChild(deletor);
      savedThemesWrapper.appendChild(parent)
    } 
  }


  const titleModal = document.querySelector("#theme_save_modal")
  titleModal.style.display = "none"
  document.querySelector("#save_theme").addEventListener("click", ()=>{
    titleModal.style.display = "flex"
  })
  document.querySelector("#save_theme_btn").addEventListener("click",()=>{
    /**
     * @type {HTMLInputElement}
     */
    const titleInput = document.querySelector("#theme_name");
    const theme = {
      name: titleInput.value,
      colors
    } 

    let hasThemes = localStorage.getItem("savedThemes")
    if(!hasThemes){
      localStorage.setItem("savedThemes",JSON.stringify([theme]))
      document.querySelector("#empty_msg").remove()
    } else { 
      let current = JSON.parse(hasThemes)
      localStorage.setItem("savedThemes", JSON.stringify(current));
      
    }

    //add to the theme list
    RenderThemeOption(theme)
    titleModal.style.display = "none"

  })

  function RenderThemeOption(props){
    const parent = document.createElement('div')
    parent.className="theme-option"
    const toggler = document.createElement('button')
    const deletor = document.createElement('button')
    toggler.textContent = props.name || "unknown";
    deletor.textContent = "❌"

    toggler.addEventListener("click",()=>{
      for(let c = 0; c < colors.length; c++) {
        colors[c] = themes[t].colors[c];
      }
      for(let i = 0; i < columns.length; i++ ){
        let c = (Math.floor(i / frequencyData.length * (colors.length)))
        columns[i].column.material.color.set(colors[c])
      }

    })


    deletor.addEventListener('click',()=>{
      let savedThemes = localStorage.getItem("savedThemes")
      if(!savedThemes) return; 
      const current = JSON.parse(savedThemes).filter(theme=>theme.name !== props.name)
      localStorage.setItem("savedThemes", JSON.stringify(current));
      parent.remove();
    })

    parent.appendChild(toggler)
    parent.appendChild(deletor)
    savedThemesWrapper.appendChild(parent);



  }




  const colorOptionsWrapper = document.querySelector("#colorOptions");
  let hidden = true;

  //toggle the visibility of color menu
  document.querySelector("#toggleColorMenu").addEventListener("click",()=>{
    colorOptionsWrapper.style.height = hidden ? "fit-content" : "0px"
    hidden = !hidden;
  })

  //change color of columns as user changes the color input field values
  document.querySelectorAll(".coloroption").forEach(optionInput=>{
    const c = parseInt(optionInput.id.split("_").pop());

    optionInput.addEventListener("change",()=>{
      colors[c] = optionInput.value;
      for(let i = 0; i < columns.length; i++){
        if(columns[i].c === c){
          columns[i].column.material.color.set(colors[c])
        }
      }    
          
          
      
    }) 
  })




})





